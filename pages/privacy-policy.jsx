import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Privacy Policy for LeaseGuard</h1>
      <p><strong>Effective Date:</strong> June 12, 2026</p>
      <p>LeaseGuard ("we," "our," or "us") operates the website <strong>https://leaseguard.ie</strong> (the "Service"). This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data under the General Data Protection Regulation (GDPR) and the Irish Data Protection Act 2018.</p>
      <p>By using the Service, you agree to the collection and use of information in accordance with this policy.</p>

      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #eee' }} />

      <h2>1. Data Controller</h2>
      <p>For the purpose of the GDPR, the Data Controller for this website is <strong>David Bateson</strong>, operating as an Individual / Sole Proprietor in Dublin, Ireland.<br />
      <strong>Contact Email:</strong> leaseguard.ie@gmail.com</p>

      <h2>2. Information We Collect and Receive</h2>
      <p>We collect several different types of information to provide and improve our automated analysis service to you:</p>
      <ul>
        <li><strong>Email Address:</strong> Collected when you initiate a checkout or request a report, used strictly to send you your receipt and final analysis PDF.</li>
        <li><strong>Lease Agreements (Uploaded Files):</strong> When you upload a lease document for analysis, we process the contents of that document. These files may contain personal data such as names, rental addresses, and financial terms.</li>
        <li><strong>Payment & Billing Information:</strong> All payments are processed securely by our third-party payment processor, Stripe. We do not store or collect your payment card details on our servers. That information is provided directly to Stripe, whose use of your personal information is governed by their Privacy Policy.</li>
      </ul>

      <h2>3. How Your Data is Processed (Our Tech Stack)</h2>
      <p>We take data minimization and security seriously. Your data is handled transiently across secure infrastructure:</p>
      <ul>
        <li><strong>Hosting & Infrastructure:</strong> Our application is hosted on <strong>Vercel</strong>, which routes data securely.</li>
        <li><strong>AI Processing:</strong> To generate your lease analysis report, the text of your uploaded lease agreement is securely transmitted via an Application Programming Interface (API) to <strong>Anthropic (Claude)</strong>. This data is processed transiently to generate the report. Under our API agreement, this data is encrypted in transit and <strong>is not used to train underlying artificial intelligence models</strong>.</li>
        <li><strong>Payment Processing:</strong> <strong>Stripe</strong> processes your transaction and handles billing details in compliance with PCI-DSS standards.</li>
      </ul>

      <h2>4. Retention of Data</h2>
      <p>We do not store your uploaded lease documents indefinitely. Uploaded lease agreements are kept only for the duration required to securely generate your analysis report and fulfill your download request. Once the session is closed or the transaction is fully complete, the raw uploaded documents are purged from our active processing cache.</p>
      <p>We retain email addresses and transactional metadata for standard tax compliance, accounting, and customer support purposes.</p>

      <h2>5. Legal Basis for Processing under GDPR</h2>
      <p>We process your personal data under the following legal bases:</p>
      <ol>
        <li><strong>Performance of a Contract:</strong> Processing your email and uploaded document is necessary to deliver the automated lease analysis report you paid for.</li>
        <li><strong>Legitimate Interests:</strong> To prevent fraud, ensure platform security, and maintain accurate financial records.</li>
      </ol>

      <h2>6. Your Data Protection Rights under GDPR</h2>
      <p>If you are a resident of the European Economic Area (EEA), you have the following data protection rights:</p>
      <ul>
        <li>The right to access, update, or delete the information we have on you.</li>
        <li>The right of rectification (to fix inaccurate information).</li>
        <li>The right to object to or restrict our processing of your personal data.</li>
        <li>The right to data portability.</li>
      </ul>
      <p>To exercise any of these rights, please contact us at <strong>leaseguard.ie@gmail.com</strong>. You also have the right to complain to the Data Protection Commission (DPC) in Ireland if you believe our data collection practices violate GDPR guidelines.</p>

      <h2>7. Changes to This Privacy Policy</h2>
      <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top.</p>

      <h2>8. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us:<br />
      <strong>By email:</strong> leaseguard.ie@gmail.com</p>
    </div>
  );
}
