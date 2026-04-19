'use client';

export default function DataProtectionPolicyPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Data Protection Policy</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026 | Compliant with the Digital Personal Data Protection Act, 2023 (DPDPA)</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Introduction and Scope</h2>
          <p>
            Kalaloka (&quot;Platform&quot;), operated by <strong>DigiYogi</strong> (&quot;we&quot;, &quot;us&quot;, &quot;Data Fiduciary&quot;), is committed to protecting the personal data of all individuals who use our Platform. This Data Protection Policy is drafted in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong> and the rules notified thereunder, along with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
          <p>
            This policy applies to all personal data processed by the Platform, whether collected through the website, mobile application, or any other channel.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Data Fiduciary Obligations</h2>
          <p>
            As a Data Fiduciary under the DPDPA, DigiYogi undertakes the following obligations:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Lawful Processing:</strong> We process personal data only for lawful purposes for which the Data Principal (you) has given consent, or for certain legitimate uses as specified under the DPDPA (Section 4).</li>
            <li><strong>Purpose Limitation:</strong> Personal data is collected and processed only for the specific purposes communicated to you at the time of collection or as described in our <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a>.</li>
            <li><strong>Data Minimization:</strong> We collect only the personal data that is necessary and adequate for the purposes for which it is processed. We do not collect excessive data.</li>
            <li><strong>Accuracy:</strong> We take reasonable steps to ensure the personal data we process is accurate, complete, and up to date. You may update your data through your profile settings at any time.</li>
            <li><strong>Storage Limitation:</strong> We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by law. Upon expiry of the retention period, data is deleted or anonymized.</li>
            <li><strong>Security Safeguards:</strong> We implement reasonable security safeguards to protect personal data from unauthorized access, disclosure, alteration, or destruction (Section 8 of the DPDPA).</li>
            <li><strong>Accountability:</strong> We maintain records of our data processing activities and can demonstrate compliance with the DPDPA upon request by the Data Protection Board of India.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Consent Management</h2>
          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.1 Obtaining Consent</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>We obtain your <strong>free, specific, informed, unconditional, and unambiguous consent</strong> before processing your personal data (Section 6 of the DPDPA).</li>
            <li>Consent is requested through clear, plain-language notices that describe the purpose of data collection and the categories of data being processed.</li>
            <li>Consent is obtained through affirmative action (opt-in), not pre-ticked checkboxes or inaction.</li>
            <li>Consent requests are presented in English and Kannada.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.2 Withdrawal of Consent</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>You have the right to withdraw your consent at any time (Section 6(6) of the DPDPA).</li>
            <li>Withdrawal of consent can be done through your account settings or by contacting us.</li>
            <li>Withdrawal of consent does not affect the lawfulness of processing done before the withdrawal.</li>
            <li>The consequences of withdrawing consent (such as loss of access to certain features) will be communicated to you before the withdrawal is processed.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.3 Certain Legitimate Uses Without Consent</h3>
          <p>Under Section 7 of the DPDPA, we may process personal data without consent for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Performance of functions under any law or for compliance with any legal judgment or order.</li>
            <li>Responding to medical emergencies involving a threat to life.</li>
            <li>Ensuring safety during disasters or breakdown of public order.</li>
            <li>Employment-related purposes (for employees and contractors).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. Purpose Limitation</h2>
          <p>We process personal data only for the following specified purposes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Management:</strong> Creating and maintaining your user account, authentication, and identity verification.</li>
            <li><strong>Service Delivery:</strong> Providing reading, writing, and content discovery features, processing payments, and facilitating creator monetization.</li>
            <li><strong>Personalization:</strong> Customizing your content feed, recommendations, and notifications based on your reading preferences.</li>
            <li><strong>AI Features:</strong> Generating audio narrations, translations, content summaries, and improving content recommendation algorithms.</li>
            <li><strong>Communication:</strong> Sending service-related notifications, responding to support requests, and in-app messaging.</li>
            <li><strong>Analytics:</strong> Understanding usage patterns, improving Platform performance, and conducting market research (using anonymized data where possible).</li>
            <li><strong>Safety and Security:</strong> Fraud detection, content moderation, and preventing abuse.</li>
            <li><strong>Legal Compliance:</strong> Complying with applicable laws, regulations, and legal processes.</li>
          </ul>
          <p>
            We will not process your personal data for purposes beyond those stated above without obtaining fresh consent, unless permitted by law.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Data Minimization</h2>
          <p>We adhere to the principle of collecting only what is necessary:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Registration:</strong> Only phone number (for OTP verification) and display name are required. Email, bio, profile picture, and date of birth are optional.</li>
            <li><strong>Content Creation:</strong> Only the content body is required. Title, cover image, and description are optional.</li>
            <li><strong>Payments:</strong> Only UPI ID is collected for creator payouts. Full bank account details are not stored.</li>
            <li><strong>Usage Data:</strong> We collect only the usage data necessary for service improvement and personalization. We do not collect precise GPS location data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Storage Limitation</h2>
          <table className="w-full text-sm border border-warm-200 dark:border-warm-700">
            <thead>
              <tr className="bg-warm-100 dark:bg-warm-800">
                <th className="p-2 text-left border-b border-warm-200 dark:border-warm-700">Data Category</th>
                <th className="p-2 text-left border-b border-warm-200 dark:border-warm-700">Retention Period</th>
                <th className="p-2 text-left border-b border-warm-200 dark:border-warm-700">Basis</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Account data</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Until account deletion + 90 days</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Service delivery</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Published content</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Until removal request + 30 days</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Content license agreement</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Financial records</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">8 years</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Income Tax Act, GST Act</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Chat messages</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">2 years after last activity</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Service delivery</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">OTP records</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">30 days</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Security audit</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Usage analytics</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">3 years (anonymized after 1 year)</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Service improvement</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">Server logs</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">90 days</td>
                <td className="p-2 border-b border-warm-200 dark:border-warm-700">IT Act compliance, debugging</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Data Principal Rights</h2>
          <p>
            Under the DPDPA, you (as a &quot;Data Principal&quot;) have the following rights:
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">7.1 Right to Access (Section 11)</h3>
          <p>You have the right to obtain a summary of your personal data being processed and the processing activities. You may request this through your profile settings or by emailing us.</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">7.2 Right to Correction (Section 11)</h3>
          <p>You have the right to correct inaccurate or misleading personal data and to complete incomplete data. You may update your profile information directly, or request corrections by contacting us.</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">7.3 Right to Erasure (Section 12)</h3>
          <p>You have the right to request erasure of your personal data when it is no longer necessary for the purpose for which it was collected. Erasure requests will be processed within 30 days, subject to legal retention requirements.</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">7.4 Right to Grievance Redressal (Section 13)</h3>
          <p>You have the right to have your grievances addressed. See our <a href="/grievance-redressal" className="text-primary underline">Grievance Redressal Policy</a> for the detailed process. If you are not satisfied with our response, you may file a complaint with the Data Protection Board of India.</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">7.5 Right to Nominate</h3>
          <p>You have the right to nominate another individual to exercise your rights under the DPDPA in the event of your death or incapacity. Nomination can be made by contacting us with the necessary documentation.</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">7.6 How to Exercise Your Rights</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Self-Service:</strong> Access and correction can be done through your profile settings.</li>
            <li><strong>Email:</strong> Send requests to <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a> with the subject &quot;Data Principal Rights Request.&quot;</li>
            <li><strong>Response Time:</strong> We will acknowledge your request within 48 hours and fulfill it within 30 days.</li>
            <li><strong>Verification:</strong> We may need to verify your identity (via OTP to your registered phone number) before processing your request.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Data Protection Officer</h2>
          <p>We have designated the following person as our point of contact for data protection matters:</p>
          <ul className="list-none space-y-1">
            <li><strong>Name:</strong> Nagaraj</li>
            <li><strong>Role:</strong> Founder &amp; Data Protection Lead</li>
            <li><strong>Email:</strong> <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a></li>
            <li><strong>Address:</strong> DigiYogi, Bangalore, Karnataka, India</li>
          </ul>
          <p>
            The Data Protection Lead is responsible for ensuring compliance with the DPDPA, addressing Data Principal requests, and acting as the point of contact for the Data Protection Board of India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Cross-Border Data Transfer</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Primary Storage:</strong> All personal data is primarily stored on servers located in India (hosted on E2E Networks, an Indian cloud provider).</li>
            <li><strong>Third-Party Services:</strong> Some third-party services we use (such as analytics tools, email delivery services) may process data outside India. We ensure that such transfers comply with Section 16 of the DPDPA and are not made to countries restricted by the Central Government.</li>
            <li><strong>Restricted Countries:</strong> We do not transfer personal data to any country that the Central Government has notified as restricted under the DPDPA.</li>
            <li><strong>Contractual Safeguards:</strong> Where data is transferred to third-party processors outside India, we ensure appropriate contractual safeguards, including data processing agreements that mandate security measures and purpose limitations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Breach Notification</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Detection:</strong> We maintain systems to detect personal data breaches promptly.</li>
            <li><strong>Notification to Data Protection Board of India (DPBI):</strong> In the event of a personal data breach, we will notify the DPBI within <strong>72 hours</strong> of becoming aware of the breach, as required under Section 8(6) of the DPDPA.</li>
            <li><strong>Notification to Data Principals:</strong> We will notify affected Data Principals without undue delay, providing information about the nature of the breach, the data affected, and the remedial measures taken.</li>
            <li><strong>Breach Record:</strong> We maintain a record of all personal data breaches, including the facts, effects, and remedial actions taken.</li>
            <li><strong>Remediation:</strong> Upon detecting a breach, we will take immediate steps to contain the breach, assess the impact, remediate vulnerabilities, and prevent recurrence.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">11. Children&apos;s Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Age Restriction:</strong> The Platform is not intended for children under the age of 18. Under Section 9 of the DPDPA, processing personal data of children (under 18) requires <strong>verifiable parental consent</strong>.</li>
            <li><strong>Parental Consent:</strong> If we become aware that a user is under 18, we will require verifiable consent from a parent or lawful guardian before continuing to process their data.</li>
            <li><strong>No Harmful Processing:</strong> We do not engage in tracking, behavioral monitoring, or targeted advertising directed at children, as prohibited under Section 9(3) of the DPDPA.</li>
            <li><strong>Deletion:</strong> If we discover that we have collected personal data from a child without verifiable parental consent, we will delete that data promptly.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">12. Significant Data Fiduciary Obligations</h2>
          <p>
            If DigiYogi is classified as a <strong>Significant Data Fiduciary</strong> by the Central Government under Section 10 of the DPDPA, we will additionally:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Appoint a Data Protection Officer (DPO) who is based in India.</li>
            <li>Appoint an independent data auditor to evaluate our compliance.</li>
            <li>Conduct periodic Data Protection Impact Assessments (DPIA).</li>
            <li>Undertake periodic audits of our data processing activities.</li>
            <li>Publish the business contact information of the DPO on our website.</li>
          </ul>
          <p>
            As of the date of this policy, DigiYogi has not been classified as a Significant Data Fiduciary. We will update this policy if our classification changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">13. Data Principal Duties</h2>
          <p>
            Under Section 15 of the DPDPA, Data Principals also have certain duties:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must provide accurate and truthful personal data when registering and using the Platform.</li>
            <li>You must not impersonate another person when providing personal data.</li>
            <li>You must not suppress any material information when providing personal data.</li>
            <li>You must not register a false or frivolous grievance or complaint with the Platform or the Data Protection Board.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">14. Updates to This Policy</h2>
          <p>
            We may update this Data Protection Policy to reflect changes in the law, our data processing practices, or regulatory guidance from the Data Protection Board of India. Material changes will be communicated through the Platform and by email. The &quot;Last Updated&quot; date indicates the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">15. Contact</h2>
          <p>For data protection queries, rights requests, or complaints:</p>
          <ul className="list-none space-y-1">
            <li><strong>Data Protection Lead:</strong> Nagaraj</li>
            <li><strong>Email:</strong> <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a></li>
            <li><strong>Platform:</strong> Kalaloka (a product of DigiYogi)</li>
            <li><strong>Address:</strong> Bangalore, Karnataka, India</li>
          </ul>
          <p>
            If you are not satisfied with our response, you may file a complaint with the <strong>Data Protection Board of India</strong> as established under the DPDPA.
          </p>
        </section>

      </div>
    </div>
  );
}
