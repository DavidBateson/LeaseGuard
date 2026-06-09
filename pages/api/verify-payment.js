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

  try {
    // Search for completed checkout sessions with this reportId
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    const paid = sessions.data.some(
      (session) =>
        session.metadata?.reportId === reportId &&
        session.payment_status === 'paid'
    );

    return res.status(200).json({ paid });
  } catch (error) {
    console.error('Stripe verification error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}
