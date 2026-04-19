'use client';

export default function SafetyTrustPolicyPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Safety &amp; Trust Policy</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Our Commitment to Safety</h2>
          <p>
            Kalaloka (&quot;Platform&quot;), a product of <strong>DigiYogi</strong>, Bangalore, Karnataka, India, is committed to providing a safe, welcoming, and trustworthy environment for all users. We believe that creative expression thrives in spaces where people feel safe. This Safety &amp; Trust Policy outlines the measures we take to protect our community.
          </p>
          <p>
            This policy operates in conjunction with our <a href="/community-guidelines" className="text-primary underline">Community Guidelines</a>, <a href="/acceptable-use" className="text-primary underline">Acceptable Use Policy</a>, and <a href="/terms" className="text-primary underline">Terms of Service</a>, and is informed by the Information Technology Act, 2000 and the IT (Intermediary Guidelines) Rules, 2021.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Platform Safety Measures</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Security:</strong> OTP-based authentication, encrypted JWT tokens with version-based revocation, and secure session management.</li>
            <li><strong>Encryption:</strong> All data transmitted between your device and our servers is encrypted using HTTPS/TLS. Data at rest is encrypted where applicable.</li>
            <li><strong>Access Controls:</strong> Role-based access controls for administrative functions (Super Admin, Moderator, Content Manager, Support).</li>
            <li><strong>Rate Limiting:</strong> Automated rate limiting on all interactive features to prevent abuse, spam, and automated attacks.</li>
            <li><strong>Report System:</strong> In-app reporting on all content and user profiles, enabling community-driven safety.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Content Moderation</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.1 Moderation Team</h3>
          <p>
            Our content moderation team reviews reported content and proactively monitors the Platform for policy violations. Moderators are trained in our Community Guidelines, Indian legal requirements for intermediaries, and sensitivity around cultural and linguistic diversity (particularly Kannada literature).
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.2 AI-Powered Content Screening</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Our AI content analysis system scans published content for quality scoring, sentiment analysis, and potential policy violations.</li>
            <li>Content flagged by AI is queued for human review before action is taken (except for clear-cut cases like CSAM, which trigger immediate removal).</li>
            <li>AI screening covers text content, profile information, and user-uploaded images.</li>
            <li>We continuously improve our AI moderation capabilities, including for Kannada and Hindi language content.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.3 Moderation Actions</h3>
          <p>Based on the severity of the violation, we may take the following actions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Content warning label or age restriction.</li>
            <li>Content removal.</li>
            <li>Content visibility restriction (changing from public to private).</li>
            <li>Account warning.</li>
            <li>Feature restriction (commenting, messaging, publishing).</li>
            <li>Temporary account suspension (7-30 days).</li>
            <li>Permanent account ban.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. User Safety Tools</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.1 Blocking</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can block any user from your profile. Blocked users cannot view your content, send you messages, send you gifts, or interact with your content.</li>
            <li>Blocking is mutual and immediate.</li>
            <li>You can manage your blocked list through your profile settings.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.2 Muting</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can mute users to hide their content from your feed and notifications without blocking them.</li>
            <li>Muted users will not be notified that they have been muted.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.3 Comment Controls</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Authors can disable comments on individual pieces of content.</li>
            <li>Authors can delete inappropriate comments on their own content.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.4 Visibility Controls</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can set your content visibility to Public, Followers Only, or Private.</li>
            <li>You can control your profile visibility settings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Emergency Reporting</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.1 Self-Harm and Suicide</h3>
          <p>
            If you encounter content that describes or promotes self-harm or suicide, please report it immediately using the in-app report feature and selecting &quot;Self-harm or suicide.&quot; We take these reports with the highest priority.
          </p>
          <p>
            If you or someone you know is in immediate danger, please contact emergency services:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Emergency:</strong> 112 (India unified emergency number)</li>
            <li><strong>iCall:</strong> 9152987821 (mental health helpline)</li>
            <li><strong>Vandrevala Foundation:</strong> 1860-2662-345 (24/7 mental health support)</li>
            <li><strong>AASRA:</strong> 9820466726 (crisis intervention)</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.2 Threats and Violence</h3>
          <p>
            Content containing credible threats of violence, incitement to violence, or planning of violent acts will be removed immediately upon verification and reported to law enforcement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Law Enforcement Cooperation</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>The Platform cooperates with law enforcement agencies and the Indian judiciary in accordance with applicable laws.</li>
            <li>We comply with valid court orders, search warrants, and information requests from authorized agencies under the Information Technology Act, 2000 and the Code of Criminal Procedure, 1973.</li>
            <li>We may proactively report illegal activity to law enforcement when we become aware of it, particularly in cases involving imminent threats to life, CSAM, or terrorism-related content.</li>
            <li>We retain data necessary for investigations as required by law, including the 180-day data retention requirement under IT Rules 2021 for user registration information.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Child Sexual Abuse Material (CSAM)</h2>
          <p>
            The Platform has an <strong>absolute zero tolerance policy</strong> for Child Sexual Abuse Material (CSAM) or any content that sexually exploits or endangers children.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Immediate Removal:</strong> Any CSAM or child exploitation content is removed immediately upon detection, without prior notice to the uploader.</li>
            <li><strong>Account Termination:</strong> The uploading account is permanently banned immediately.</li>
            <li><strong>Law Enforcement Reporting:</strong> All instances are reported to:
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>The <strong>National Cyber Crime Reporting Portal</strong> (<a href="https://cybercrime.gov.in" className="text-primary underline" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a>)</li>
                <li>The <strong>National Commission for Protection of Child Rights (NCPCR)</strong></li>
                <li>The <strong>Indian Computer Emergency Response Team (CERT-In)</strong></li>
                <li><strong>NCMEC (National Center for Missing and Exploited Children)</strong> CyberTipline, as applicable</li>
              </ul>
            </li>
            <li><strong>Evidence Preservation:</strong> Relevant data is preserved for law enforcement investigation as required under Section 67B of the IT Act, 2000 and the POCSO Act, 2012.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Terrorism and Extremist Content</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Content promoting terrorism, extremism, or radicalization is strictly prohibited and will be removed immediately.</li>
            <li>Such content is reported to relevant Indian authorities including the National Investigation Agency (NIA) and local cyber crime cells.</li>
            <li>The Platform complies with all takedown orders from the Ministry of Home Affairs and other authorized agencies under Section 69A of the IT Act, 2000.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Contact for Safety Concerns</h2>
          <p>For urgent safety concerns or to report harmful content:</p>
          <ul className="list-none space-y-1">
            <li><strong>Email:</strong> <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a> (use subject &quot;URGENT: Safety Report&quot; for priority handling)</li>
            <li><strong>In-App:</strong> Use the report button on any content or user profile.</li>
            <li><strong>Grievance Officer:</strong> Nagaraj (Founder)</li>
            <li><strong>Platform:</strong> Kalaloka (a product of DigiYogi)</li>
            <li><strong>Address:</strong> Bangalore, Karnataka, India</li>
          </ul>
          <p>
            For immediate emergencies, please contact local law enforcement (112) before reporting to us.
          </p>
        </section>

      </div>
    </div>
  );
}
