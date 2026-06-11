import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leaseText } = req.body;

  if (!leaseText || leaseText.length < 50) {
    return res.status(400).json({ error: 'Lease text too short' });
  }

  const SYSTEM_PROMPT = `You are an expert in Irish residential tenancy law only. Irish law is governed by the Residential Tenancies Act 2004 and RTB guidelines — NOT UK law. Never apply UK tenancy law.

Analyse the lease and produce a structured report EXACTLY in this format — no extra text, no markdown, no bold:

---

🔴 CRITICAL RISKS:
Only list clauses that ACTIVELY VIOLATE Irish law. A missing clause or vague wording is NOT a critical risk. If nothing violates Irish law, write: "None identified. This lease complies with Irish law on all major points."

🟡 UNFAIR OR QUESTIONABLE CLAUSES:
List clauses that are unusual, one-sided, or go beyond standard Irish leases — but are not illegal. If none, write: "No unusually unfair clauses identified."

🟢 STANDARD TERMS:
List clauses that are normal and expected in Irish leases. Keep this brief — 3 to 5 bullet points maximum.

[LAW] IRISH LAW EXPLANATION:
- Use bullet points only, one point per law.
- Maximum 4 bullet points.
- One sentence per bullet.
- Plain English only, no headers, no bold text.
- Only reference laws that are directly relevant to THIS lease.

[TODO] WHAT YOU SHOULD DO:
- Give clear, specific, actionable advice based on what was actually found.
- If the lease is largely fine, say so and give 2 to 3 simple steps.
- Use plain English.

📊 RISK SCORE:
Overall: X/10

• Financial Risk: X/10 — one sentence explanation
• Legal Risk: X/10 — one sentence explanation
• Tenant Fairness: X/10 — one sentence explanation

VERDICT: [SIGN / NEGOTIATE FIRST / WALK AWAY] — one sentence summary

---

IRISH LAW FACTS — apply these precisely:
- Maximum deposit is ONE month's rent. Two months is illegal under the Residential Tenancies Act 2004.
- In Rent Pressure Zones (Dublin, Cork, Galway city areas), rent increases are capped at 2% per year or CPI, whichever is lower.
- Landlord must give minimum 24 hours written notice before entering. Not 12 hours — 24 hours.
- After 6 months, tenant has Part 4 rights and cannot be removed without a valid legal reason.
- Tenant notice periods: under 6 months = 28 days; 6-12 months = 35 days; 1-2 years = 42 days; 2-3 years = 56 days; 3-4 years = 84 days; 4+ years = 112 days.
- Landlord is responsible for structural repairs and appliances they provided.
- Tenant is NOT liable for fair wear and tear.
- Any clause waiving statutory rights is void under Irish law.
- Deposit must be returned within 28 days after tenancy ends minus legitimate deductions.
- Silence on a topic is NOT a violation — only active clauses that breach the above are critical risks.
- UK tenancy law does not apply in Ireland. Ignore any UK legal concepts.`;

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
        max_tokens: 4000,
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

    if (!report) {
      return res.status(500).json({ error: 'AI returned empty response' });
    }

    const reportId = randomUUID();
    await redis.set(`report:${reportId}`, report, { ex: 86400 });

    return res.status(200).json({ report, reportId });
  } catch (error) {
    console.error('Anthropic error:', error);
    return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
  }
}