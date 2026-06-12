import React from 'react';

export default function Disclaimer() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Legal Disclaimer & Terms of Service</h1>
      <p><strong>Effective Date:</strong> June 12, 2026</p>
      
      <p>Please read this Legal Disclaimer carefully before using the LeaseGuard website (https://leaseguard.ie) and automated report generation service operated by David Bateson ("us", "we", or "our").</p>

      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />

      <h2>1. Not Legal Advice</h2>
      <p>LeaseGuard provides automated, AI-driven analysis of residential lease agreements for educational and informational purposes only. <strong>LeaseGuard is not a law firm, does not employ qualified Irish solicitors or barristers, and does not provide legal advice, legal opinions, or legal representation.</strong> No solicitor-client relationship is created or implied by your use of this service.</p>

      <h2>2. Accuracy and AI Limitations</h2>
      <p>While our automated systems strive to evaluate documents in accordance with common Irish tenancy structures, artificial intelligence tools are susceptible to errors, omissions, hallucinations, or misinterpretations of the law. The legal landscape surrounding the Residential Tenancies Act, Rent Pressure Zones (RPZs), and landlord-tenant regulations changes frequently. You must not rely on LeaseGuard reports to make definitive financial, legal, or housing decisions.</p>

      <h2>3. Requirement for Qualified Counsel</h2>
      <p>The information provided in our reports should serve solely as a preliminary assessment. For binding advice specific to your housing situation, you are strongly urged to consult a qualified solicitor or seek free support from official Irish tenancy advocacy bodies, including:</p>
      <ul>
        <li><strong>The Residential Tenancies Board (RTB):</strong> rtb.ie</li>
        <li><strong>Threshold:</strong> threshold.ie</li>
        <li><strong>Free Legal Advice Centres (FLAC):</strong> flac.ie</li>
      </ul>

      <h2>4. Limitation of Liability</h2>
      <p>By purchasing or utilizing a LeaseGuard report, you explicitly agree that David Bateson and LeaseGuard accept <strong>no liability whatsoever</strong> for any direct or indirect losses, financial damages, tenancy terminations, legal disputes, deposit forfeitures, or adverse outcomes resulting from the use of, or inability to use, our service and generated PDFs.</p>

      <h2>5. Governing Law</h2>
      <p>This disclaimer and your use of the website shall be governed by and construed in accordance with the laws of Ireland. Any disputes arising in connection with this service shall be subject to the exclusive jurisdiction of the Irish courts.</p>

      <h2>6. Contact Us</h2>
      <p>If you have any questions about this disclaimer, please contact us at <strong>leaseguard.ie@gmail.com</strong>.</p>
    </div>
  );
}
