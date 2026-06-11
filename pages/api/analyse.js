export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leaseText } = req.body;

  if (!leaseText || leaseText.length < 50) {
    return res.status(400).json({ error: 'Lease text too short' });
  }

  const SYSTEM_PROMPT = `You are an expert in Irish residential tenancy law.

Analyse the rental lease provided and produce a structured report EXACTLY in this format — no extra text, no markdown code blocks, just the report:

---

🔴 CRITICAL RISKS:
- List serious clauses that could cause financial loss, eviction risk, or unfair liability.
- Quote the exact clause where possible in "quotation marks".
- Reference Irish law where it applies (e.g. Residential Tenancies Act 2004, RTB guidelines).

🟡 UNFAIR OR QUESTIONABLE CLAUSES:
- Clauses that are biased toward the landlord or unusual in Irish leases.
- Explain why each one is unfair.

🟢 STANDARD TERMS:
- Clauses that are normal and expected in Irish leases.
- Keep this brief.

[LAW] IRISH LAW EXPLANATION:
- Maximum 4 bullet points only.
- One sentence per bullet point.
- Plain English, no headers, no bold text.

[TODO] WHAT YOU SHOULD DO:
- Give clear, specific, actionable advice.
- Use phrases like "Ask your landlord to remove clause X", "Clarify in writing that...", "Do not sign until..."

📊 RISK SCORE:
Overall: X/10

• Financial Risk: X/10 — one sentence explanation
• Legal Risk: X/10 — one sentence explanation
• Tenant Fairness: X/10 — one sentence explanation

VERDICT: [SIGN / NEGOTIATE FIRST / WALK AWAY] — one sentence summary

---

CRITICAL IRISH LAW KNOWLEDGE:
- Maximum deposit is ONE month's rent. Two months deposit is ILLEGAL under the Residential Tenancies Act.
- In Rent Pressure Zones (RPZs — most of Dublin, Cork, Galway city), rent can only increase by 2% per year or CPI, whichever is lower.
- Landlord must give minimum 24 hours written notice before entering (not 12 hours).
- After 6 months, tenant has Part 4 rights and cannot be removed without valid legal reason.
- Tenant notice periods: less than 6 months = 28 days; 6-12 months = 35 days; 1-2 years = 42 days; 2-3 years = 56 days; 3-4 years = 84 days; 4+ years = 112 days.
- Landlord is responsible for structural repairs and appliances they provided.
- Tenant cannot be held liable for fair wear and tear.
- Any clause waiving statutory rights is void and unenforceable.
- Deposit must be returned promptly after tenancy ends (typically within 28 days).

Focus entirely on protecting the tenant. Be direct, specific, and use plain English.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Analyse this Irish lease:\n\n${leaseText}` }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic API error:', data.error);
      return res.status(500).json({ error: `AI error: ${data.error.message}` });
    }

    const report = data.content?.[0]?.text || '';
console.log('AI REPORT:', report.substring(0, 500));

    if (!report) {
      return res.status(500).json({ error: 'AI returned empty response' });
    }

    return res.status(200).json({ report });
  } catch (error) {
    console.error('Anthropic error:', error);
    return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
  }
}