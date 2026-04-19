'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Privacy Policy</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Who We Are</h2>
          <p>
            Kalaloka (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a content reading and writing platform operated by <strong>DigiYogi</strong>, based in Bangalore, Karnataka, India. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use Kalaloka at <a href="https://kavi.digiyogi.com" className="text-primary underline">kavi.digiyogi.com</a> and any associated mobile applications.
          </p>
          <p>
            By using Kalaloka, you agree to the collection and use of your information as described in this policy. If you do not agree, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Information We Collect</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.1 Information You Provide</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Information:</strong> Phone number (for OTP login), name, display name, profile picture, bio, and language preferences.</li>
            <li><strong>Social Login Data:</strong> If you sign in with Google or Facebook, we receive your name, email address, and profile picture from those services. We do not receive or store your social media passwords.</li>
            <li><strong>Content:</strong> Stories, poems, articles, comments, messages, and any other content you create or share on the Platform.</li>
            <li><strong>Financial Information:</strong> UPI ID or bank details (for creator payouts only). Payment processing for subscriptions and purchases is handled by third-party payment processors &mdash; we do not store your full payment card details.</li>
            <li><strong>Communications:</strong> Messages you send through in-app chat, support requests, and feedback.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.2 Information Collected Automatically</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Device Information:</strong> Device type, operating system, browser type, screen resolution, and unique device identifiers.</li>
            <li><strong>Usage Data:</strong> Pages visited, stories read, reading time, search queries, features used, and interaction patterns.</li>
            <li><strong>Reading History:</strong> What content you read, how long you spend on each piece, and your reading preferences.</li>
            <li><strong>IP Address and Location:</strong> Your IP address and approximate geographic location (city/state level, not precise GPS).</li>
            <li><strong>Log Data:</strong> Access times, error logs, referring URLs, and pages viewed before and after visiting the Platform.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.3 Cookies and Tracking Technologies</h3>
          <p>
            We use cookies, local storage, and similar technologies. See our <a href="/cookie-policy" className="text-primary underline">Cookie Policy</a> for full details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Provide the Service:</strong> Create and manage your account, display content, enable reading and writing features, process payments, and facilitate creator payouts.</li>
            <li><strong>Personalize Your Experience:</strong> Recommend stories, customize your feed, suggest authors to follow, and tailor content to your reading preferences and language.</li>
            <li><strong>AI Features:</strong> Generate audio narrations of published content, provide writing suggestions, and power content discovery. Your reading patterns and content interactions help improve these AI features.</li>
            <li><strong>Analytics and Improvement:</strong> Understand how users interact with the Platform, identify popular content and features, fix bugs, and improve overall performance.</li>
            <li><strong>Communication:</strong> Send service-related notifications (new chapters, followers, gifts received), respond to support requests, and share Platform updates.</li>
            <li><strong>Safety and Security:</strong> Detect fraud, prevent abuse, enforce our Terms of Service and Community Guidelines, and protect users.</li>
            <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. How We Share Your Information</h2>
          <p><strong>We do not sell your personal information to third parties.</strong> We may share your information in the following limited circumstances:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Public Profile and Content:</strong> Your display name, profile picture, bio, and published content are visible to other users. This is the core purpose of the Platform.</li>
            <li><strong>Payment Processors:</strong> We share necessary transaction details with payment processors (e.g., Razorpay) to process subscriptions, purchases, and creator payouts.</li>
            <li><strong>Analytics Providers:</strong> We use PostHog for product analytics. PostHog receives anonymized usage data to help us understand how the Platform is used. PostHog&apos;s privacy practices are governed by their own privacy policy.</li>
            <li><strong>Hosting and Infrastructure:</strong> Our servers and cloud infrastructure providers may process your data as part of providing their services to us.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or government request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
            <li><strong>Business Transfers:</strong> If DigiYogi is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Data:</strong> We retain your account information for as long as your account is active. If you delete your account, we will delete or anonymize your personal information within 90 days, except where we are required to retain it by law.</li>
            <li><strong>Published Content:</strong> Content you publish on the Platform may be retained even after account deletion, as it is licensed to the Platform under our Terms of Service. Author attribution may be anonymized upon request.</li>
            <li><strong>Usage and Analytics Data:</strong> Aggregated and anonymized analytics data may be retained indefinitely for business analysis.</li>
            <li><strong>Financial Records:</strong> Transaction records are retained for a minimum of 8 years as required under Indian tax and financial regulations.</li>
            <li><strong>Chat Messages:</strong> Messages are retained for 2 years after the last activity in a conversation, unless you delete them earlier.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> You can request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> You can update or correct your account information at any time through your profile settings.</li>
            <li><strong>Deletion:</strong> You can request deletion of your account and personal data. Note that some data may be retained as described in Section 5.</li>
            <li><strong>Withdraw Consent:</strong> Where we process data based on your consent, you can withdraw that consent at any time. This will not affect the lawfulness of processing done before withdrawal.</li>
            <li><strong>Communication Preferences:</strong> You can opt out of promotional notifications through your account settings. Service-related notifications (such as payment confirmations) cannot be opted out of.</li>
            <li><strong>Data Portability:</strong> You can request an export of your content and account data in a machine-readable format.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a>. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Data Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect your personal information, including:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Encryption of data in transit (HTTPS/TLS) and at rest where applicable.</li>
            <li>Secure authentication using OTP verification and encrypted tokens (JWT).</li>
            <li>Access controls limiting employee access to personal data on a need-to-know basis.</li>
            <li>Regular security reviews and monitoring.</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Children&apos;s Privacy</h2>
          <p>
            Kalaloka is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete it promptly. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Compliance with Indian Law</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">9.1 Information Technology Act, 2000</h3>
          <p>
            We comply with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. We implement reasonable security practices to protect sensitive personal data as defined under these rules.
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">9.2 Digital Personal Data Protection Act, 2023 (DPDPA)</h3>
          <p>
            We are committed to compliance with the Digital Personal Data Protection Act, 2023 and any rules notified under it. In accordance with the DPDPA:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We process personal data only for lawful purposes with your consent or for legitimate uses permitted by law.</li>
            <li>We collect only the data that is necessary for the purposes stated in this policy.</li>
            <li>We maintain the accuracy of personal data and allow you to correct inaccurate information.</li>
            <li>We retain personal data only for as long as necessary to fulfill the stated purposes.</li>
            <li>We implement reasonable security safeguards to protect personal data.</li>
            <li>You may exercise your rights as a Data Principal, including the right to access, correction, erasure, and grievance redressal, by contacting us.</li>
          </ul>
          <p>
            Our designated Grievance Officer for DPDPA compliance can be reached at <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a>. Grievances will be acknowledged within 48 hours and resolved within 30 days.
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">9.3 Intermediary Guidelines (IT Rules, 2021)</h3>
          <p>
            As an intermediary under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, we maintain a Grievance Officer who can be contacted at the email address above.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Third-Party Links</h2>
          <p>
            The Platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to read their privacy policies before providing any personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make significant changes, we will notify you through the Platform or by email. The &quot;Last Updated&quot; date at the top reflects the most recent revision. Your continued use of Kalaloka after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">12. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or how we handle your data, contact us:</p>
          <ul className="list-none space-y-1">
            <li><strong>Email:</strong> <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a></li>
            <li><strong>Platform:</strong> Kalaloka (a product of DigiYogi)</li>
            <li><strong>Address:</strong> Bangalore, Karnataka, India</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
