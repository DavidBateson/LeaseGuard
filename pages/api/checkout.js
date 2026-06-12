import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportId } = req.body;

  if (!reportId) {
    return res.status(400).json({ error: 'Report ID required' });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'LeaseGuard Full Report',
              description: 'Complete Irish lease analysis with all risks, Irish law explanations, and negotiation scripts.',
            },
            unit_amount: 799,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true, // <-- This enables your promo codes on checkout
      success_url: `${baseUrl}/?reportId=${reportId}&payment=success`,
      cancel_url: `${baseUrl}/?reportId=${reportId}&payment=cancelled`,
      metadata: {
        reportId,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: 'Payment setup failed. Please try again.' });
  }
}
