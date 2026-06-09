import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const reportId = session.metadata?.reportId;
    const customerEmail = session.customer_details?.email;

    console.log(`Payment successful for report ${reportId}, email: ${customerEmail}`);

    // Send email via Resend if we have an email
    if (customerEmail && process.env.RESEND_API_KEY && reportId) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'LeaseGuard <reports@leaseguard.ie>',
            to: customerEmail,
            subject: 'Your LeaseGuard Report is Ready',
            html: `
              <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0c0e12; color: #f5f0e8; padding: 40px; border-radius: 12px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
                  <span style="font-size: 24px;">🛡️</span>
                  <h1 style="margin: 0; font-size: 22px; color: #f5f0e8;">LeaseGuard</h1>
                </div>
                <h2 style="color: #eab308; margin-bottom: 16px;">Your full report is ready</h2>
                <p style="color: #9ca3af; line-height: 1.7;">Thank you for using LeaseGuard. Your full Irish lease analysis is now unlocked and available.</p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/?reportId=${reportId}&payment=success" 
                   style="display: inline-block; background: #eab308; color: #0c0e12; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; margin: 24px 0;">
                  View Full Report →
                </a>
                <p style="color: #4b5563; font-size: 12px; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
                  LeaseGuard provides general information only, not legal advice. For advice specific to your situation, consult a qualified solicitor.<br><br>
                  RTB: <a href="https://rtb.ie" style="color: #eab308;">rtb.ie</a> · Threshold: <a href="https://threshold.ie" style="color: #eab308;">threshold.ie</a>
                </p>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }
  }

  return res.status(200).json({ received: true });
}
