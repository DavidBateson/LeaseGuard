import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const redis = Redis.fromEnv();

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

function formatReportAsHtml(reportText) {
  const lines = reportText.split('\n').filter(l => l.trim() && l.trim() !== '---');
  let html = '';

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('🔴')) {
      html += `<h2 style="color:#ef4444;margin-top:24px;">🔴 Critical Risks</h2>`;
    } else if (t.startsWith('🟡')) {
      html += `<h2 style="color:#eab308;margin-top:24px;">🟡 Unfair Clauses</h2>`;
    } else if (t.startsWith('🟢')) {
      html += `<h2 style="color:#22c55e;margin-top:24px;">🟢 Standard Terms</h2>`;
    } else if (t.startsWith('[LAW]')) {
      html += `<h2 style="color:#60a5fa;margin-top:24px;">⚖️ Irish Law</h2>`;
    } else if (t.startsWith('[TODO]')) {
      html += `<h2 style="color:#a78bfa;margin-top:24px;">✅ What To Do</h2>`;
    } else if (t.startsWith('📊')) {
      html += `<h2 style="color:#f5f0e8;margin-top:24px;">📊 Risk Score</h2>`;
    } else if (t.startsWith('VERDICT:')) {
      html += `<p style="background:#1a1d24;border-left:4px solid #eab308;padding:12px 16px;margin-top:16px;border-radius:4px;color:#eab308;font-weight:bold;">${t}</p>`;
    } else if (t.startsWith('•') || t.startsWith('-')) {
      html += `<p style="margin:6px 0;padding-left:16px;color:#d1d5db;">${t}</p>`;
    } else if (t.length > 0) {
      html += `<p style="margin:6px 0;color:#d1d5db;">${t}</p>`;
    }
  }

  return html;
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

    if (customerEmail && reportId) {
      let reportText = null;
      try {
        reportText = await redis.get(`report:${reportId}`);
      } catch (kvError) {
        console.error('Redis retrieval failed:', kvError);
      }

      if (reportText && process.env.RESEND_API_KEY) {
        const reportHtml = formatReportAsHtml(reportText);

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
              subject: 'Your LeaseGuard Report',
              html: `
                <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;background:#0c0e12;color:#f5f0e8;padding:40px;border-radius:12px;">
                  <div style="margin-bottom:32px;">
                    <span style="font-size:24px;">🛡️</span>
                    <span style="font-size:22px;font-weight:bold;margin-left:10px;">LeaseGuard</span>
                  </div>
                  <h1 style="color:#eab308;font-size:20px;margin-bottom:8px;">Your Full Lease Analysis</h1>
                  <p style="color:#9ca3af;margin-bottom:32px;">Here is your complete Irish lease report.</p>
                  <div style="background:#13161e;border-radius:8px;padding:24px;">
                    ${reportHtml}
                  </div>
                  <p style="color:#4b5563;font-size:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
                    LeaseGuard provides general information only, not legal advice. For advice specific to your situation, consult a qualified solicitor.<br><br>
                    RTB: <a href="https://rtb.ie" style="color:#eab308;">rtb.ie</a> · Threshold: <a href="https://threshold.ie" style="color:#eab308;">threshold.ie</a>
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
  }

  return res.status(200).json({ received: true });
}