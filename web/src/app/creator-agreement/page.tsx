'use client';

export default function CreatorMonetizationAgreementPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Creator Monetization Agreement</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Introduction</h2>
          <p>
            This Creator Monetization Agreement (&quot;Agreement&quot;) governs the terms under which eligible creators (&quot;you&quot;, &quot;Creator&quot;) can earn revenue through Kalaloka (&quot;Platform&quot;), a product of <strong>DigiYogi</strong>, Bangalore, Karnataka, India. By participating in any monetization program, you agree to be bound by this Agreement in addition to our <a href="/terms" className="text-primary underline">Terms of Service</a>.
          </p>
          <p>
            This Agreement constitutes a valid contract under the Indian Contract Act, 1872. By opting into the Creator Program, you represent that you are of legal age to enter into contracts in India (18 years or older) and that you have the authority to agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Eligibility for Monetization</h2>
          <p>To be eligible for the Creator Monetization Program, you must meet all of the following criteria:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Standing:</strong> Your account must be in good standing with no active violations of our <a href="/community-guidelines" className="text-primary underline">Community Guidelines</a> or <a href="/terms" className="text-primary underline">Terms of Service</a>.</li>
            <li><strong>Verification:</strong> You must have a verified account with a valid phone number.</li>
            <li><strong>Original Content:</strong> You must have published original content on the Platform that complies with our <a href="/anti-plagiarism" className="text-primary underline">Anti-Plagiarism Policy</a>.</li>
            <li><strong>Creator Status:</strong> You must have been granted Creator status by the Platform, either through application or by meeting platform-defined thresholds (follower count, content published, reading engagement).</li>
            <li><strong>Legal Compliance:</strong> You must comply with all applicable Indian laws, including tax regulations.</li>
          </ul>
          <p>
            The Platform reserves the right to modify eligibility criteria at any time with 15 days&apos; prior notice. Existing Creators who no longer meet updated criteria will be given a 30-day grace period to comply.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Monetization Channels</h2>
          <p>Eligible Creators may earn revenue through the following channels:</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.1 Points Earning (Ad Revenue Share)</h3>
          <p>
            Creators earn Points based on reader engagement with their content. Points are allocated from the Platform&apos;s advertising revenue pool. The allocation formula considers reading time, content quality score, reader engagement (likes, comments, shares), and content completion rate. The specific formula is determined by the Platform and may be updated periodically.
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.2 Gems (Reader Gifts)</h3>
          <p>
            Readers may purchase Gems (virtual gifts) and send them to Creators as a token of appreciation. Gems have a monetary value determined by the Platform. When a reader sends you Gems, the corresponding value (minus the platform commission) is credited to your wallet balance.
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.3 Creator Subscriptions</h3>
          <p>
            Eligible Creators may set a monthly subscription price (in INR) for premium access to their exclusive or members-only content. Readers who subscribe pay the set price, and the Creator receives their share after the platform commission is deducted.
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.4 Content Unlocks</h3>
          <p>
            Creators may set an unlock price (in Coins) for individual pieces of premium content. When a reader unlocks such content, the corresponding revenue share is credited to the Creator&apos;s wallet.
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">3.5 Competition Prizes</h3>
          <p>
            Creators may win monetary prizes through Platform-organized competitions. Prize terms are governed by the specific <a href="/contest-rules" className="text-primary underline">Contest &amp; Competition Rules</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. Revenue Share Terms</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Default Split:</strong> The default revenue share is <strong>70% to the Creator</strong> and <strong>30% to the Platform</strong>. This applies to Gems received, Creator Subscription income, and Content Unlock revenue.</li>
            <li><strong>Ad Revenue Pool:</strong> The ad revenue distribution follows a separate formula where 10% of gross ad revenue is allocated to a platform pool, which is then split between active readers and authors based on engagement metrics.</li>
            <li><strong>Promotional Adjustments:</strong> The Platform may offer promotional revenue share rates (e.g., 80/20 for new Creators) at its discretion. Such promotions will be clearly communicated with their duration and terms.</li>
            <li><strong>Right to Modify:</strong> The Platform reserves the right to modify the revenue share percentage with <strong>30 days&apos; written notice</strong> via email and in-app notification. Earnings accrued before the change take effect will be calculated at the previous rate.</li>
            <li><strong>Admin Configurability:</strong> Revenue share percentages are configurable at the platform level and may be adjusted for specific programs, promotions, or creator tiers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Payment Schedule and Withdrawal</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Payment Cycle:</strong> Creator earnings are calculated and finalized on a monthly basis. The settlement period is the 1st to the last day of each calendar month. Finalized earnings are available for withdrawal by the 10th of the following month.</li>
            <li><strong>Minimum Withdrawal:</strong> The minimum withdrawal amount is <strong>Rs. 40</strong> (or equivalent of 400 Points). Balances below this threshold will carry forward to the next payment cycle.</li>
            <li><strong>Payment Method:</strong> Currently, payouts are processed exclusively via <strong>UPI (Unified Payments Interface)</strong>. You must provide a valid UPI ID linked to your bank account. The Platform is not responsible for failed transfers due to incorrect or inactive UPI IDs.</li>
            <li><strong>Processing Time:</strong> Withdrawal requests are processed within 5-7 business days. Bank processing times may add additional delays.</li>
            <li><strong>Currency:</strong> All earnings and payouts are in <strong>Indian Rupees (INR)</strong> only.</li>
            <li><strong>No Interest:</strong> The Platform does not pay interest on wallet balances or pending earnings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Tax Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Creator&apos;s Responsibility:</strong> You are solely responsible for determining, reporting, and paying all taxes applicable to your earnings from the Platform, including but not limited to Income Tax, GST (if applicable), and any other local, state, or central taxes.</li>
            <li><strong>TDS (Tax Deducted at Source):</strong> Where required under the Income Tax Act, 1961, the Platform will deduct TDS at the applicable rate before disbursing payments. Currently, TDS under Section 194-O may apply to e-commerce participants. TDS certificates (Form 16A) will be made available for the applicable financial year.</li>
            <li><strong>PAN Requirement:</strong> The Platform may require you to provide your Permanent Account Number (PAN) for payouts exceeding thresholds specified under the Income Tax Act. Failure to provide PAN may result in TDS at a higher rate as per Section 206AA.</li>
            <li><strong>GST:</strong> If your aggregate turnover from all sources (including Kalaloka earnings) exceeds the GST registration threshold, you are responsible for obtaining GST registration and complying with GST provisions. The Platform does not provide tax advice.</li>
            <li><strong>No Tax Advice:</strong> The Platform does not provide tax, legal, or financial advice. We recommend you consult a qualified tax professional regarding your obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Fraud Prevention</h2>
          <p>
            The Platform employs automated and manual fraud detection systems. The following activities are strictly prohibited and constitute grounds for immediate disqualification from the monetization program and potential account termination:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Fake Reads:</strong> Artificially inflating read counts, reading time, or engagement metrics through bots, scripts, multiple accounts, or coordinated manipulation.</li>
            <li><strong>Self-Gifting:</strong> Purchasing Gems or Coins and sending them to your own account or to accounts you control.</li>
            <li><strong>Click Farms / Engagement Manipulation:</strong> Using paid services, software, or coordinated groups to artificially boost views, likes, comments, or shares.</li>
            <li><strong>Multi-Accounting for Earnings:</strong> Creating multiple accounts to multiply earnings from the same content or to circumvent monetization limits.</li>
            <li><strong>Incentivized Engagement:</strong> Offering rewards or payments to users in exchange for reading, liking, or engaging with your content for the purpose of inflating metrics.</li>
            <li><strong>Revenue Circumvention:</strong> Directing readers to pay you outside the Platform to avoid revenue sharing.</li>
          </ul>
          <p>
            If fraud is detected, the Platform may: (a) suspend or terminate your monetization privileges; (b) forfeit pending earnings; (c) reverse previously paid earnings by setting your wallet balance to zero or negative; (d) permanently ban your account; and (e) report the activity to law enforcement if applicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Account Termination Impact on Earnings</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Voluntary Termination:</strong> If you voluntarily close your account, any finalized and pending earnings above the minimum withdrawal threshold will be paid out within 30 days to your registered UPI ID, subject to any deductions for platform fees or TDS.</li>
            <li><strong>Termination for Cause:</strong> If your account is terminated for violation of this Agreement, Community Guidelines, or Terms of Service, the Platform reserves the right to forfeit all pending and unfinalized earnings. Earnings already disbursed are not subject to clawback except in cases of confirmed fraud.</li>
            <li><strong>Fraud-Related Termination:</strong> In cases of confirmed fraud, the Platform reserves the right to: (a) forfeit all pending earnings; (b) seek recovery of previously disbursed earnings obtained through fraudulent means; and (c) pursue legal remedies under the Indian Penal Code and Information Technology Act, 2000.</li>
            <li><strong>Earnings Below Threshold:</strong> If your balance at termination is below the minimum withdrawal threshold (Rs. 40), the amount will be forfeited.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Relationship of Parties</h2>
          <p>
            This Agreement does not create an employer-employee, agency, partnership, or joint venture relationship between you and DigiYogi. You are an independent content creator. The Platform is a marketplace that facilitates the connection between creators and readers. You are not entitled to any employee benefits, insurance, or worker protections.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Dispute Resolution</h2>
          <p>
            Any disputes arising from this Agreement shall first be addressed through our <a href="/grievance-redressal" className="text-primary underline">Grievance Redressal Policy</a>. If the dispute remains unresolved, it shall be subject to arbitration under the Arbitration and Conciliation Act, 1996, with a sole arbitrator appointed by mutual consent. The seat of arbitration shall be Bangalore, Karnataka. The language of arbitration shall be English or Kannada, as mutually agreed.
          </p>
          <p>
            This Agreement is governed by the laws of India. Courts in Bangalore, Karnataka shall have exclusive jurisdiction over any matters not subject to arbitration.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">11. Modifications to This Agreement</h2>
          <p>
            The Platform reserves the right to modify this Agreement at any time. Material changes will be communicated with at least 30 days&apos; prior notice via email and in-app notification. Your continued participation in the monetization program after changes take effect constitutes acceptance of the modified terms. If you do not agree to the changes, you may opt out of the monetization program, and any accrued earnings will be settled per Section 8.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">12. Contact</h2>
          <p>For questions about this Agreement or your creator earnings:</p>
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
