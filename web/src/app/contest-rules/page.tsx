'use client';

export default function ContestRulesPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Contest &amp; Competition Rules</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Introduction</h2>
          <p>
            Kalaloka (&quot;Platform&quot;), a product of <strong>DigiYogi</strong>, Bangalore, Karnataka, India, organizes writing competitions and contests to celebrate creative talent and encourage original writing. These Contest &amp; Competition Rules (&quot;Rules&quot;) apply to all competitions hosted on the Platform unless a specific competition states otherwise.
          </p>
          <p>
            By entering any competition, you agree to these Rules, our <a href="/terms" className="text-primary underline">Terms of Service</a>, <a href="/community-guidelines" className="text-primary underline">Community Guidelines</a>, and <a href="/anti-plagiarism" className="text-primary underline">Anti-Plagiarism Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Eligibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least <strong>18 years of age</strong> or the legal age of majority in your jurisdiction to enter competitions with monetary prizes.</li>
            <li>You must have an active Kalaloka account in good standing with no active policy violations.</li>
            <li>Employees, contractors, and immediate family members of DigiYogi are not eligible to win prizes (they may participate for fun but will be excluded from prize rankings).</li>
            <li>Specific competitions may have additional eligibility criteria (such as language, content type, or region). These will be stated in the competition description.</li>
            <li>The Platform reserves the right to verify eligibility at any time and disqualify participants who do not meet the criteria.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Entry Requirements</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Original Work:</strong> All entries must be original work created by you. Plagiarized entries will be disqualified and subject to the consequences described in our <a href="/anti-plagiarism" className="text-primary underline">Anti-Plagiarism Policy</a>.</li>
            <li><strong>Content Type:</strong> Entries must match the content type specified for the competition (story, poem, article, quote). If no specific type is required, any type is accepted.</li>
            <li><strong>Language:</strong> Entries must be in the language specified for the competition. If no language is specified, any supported language is accepted.</li>
            <li><strong>Word Count:</strong> Entries must meet the minimum and maximum word count specified for the competition, if any.</li>
            <li><strong>Theme:</strong> If a writing theme or prompt is specified, entries must reasonably relate to the theme.</li>
            <li><strong>Submission:</strong> Entries are submitted by publishing content on the Platform and linking it to the competition through the competition entry page. Only content published during the competition period will be accepted.</li>
            <li><strong>Entry Limit:</strong> Each user may submit up to the maximum number of entries specified per competition (default: 1 entry per competition). Submitting multiple entries through multiple accounts is prohibited.</li>
            <li><strong>Content Compliance:</strong> All entries must comply with the Platform&apos;s Community Guidelines and Terms of Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. Judging Criteria</h2>
          <p>Competition entries are evaluated using a combination of the following criteria (weights may vary per competition):</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.1 Engagement Metrics</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Views/Read Count:</strong> The number of unique readers who read the entry.</li>
            <li><strong>Likes:</strong> The number of likes received during the competition period.</li>
            <li><strong>Comments:</strong> The number and quality of comments and reader engagement.</li>
            <li><strong>Completion Rate:</strong> What percentage of readers completed reading the full entry.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.2 Quality Score</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>AI Quality Assessment:</strong> The Platform&apos;s content analysis system evaluates writing quality, grammar, coherence, and originality.</li>
            <li><strong>Human Evaluation:</strong> For top-ranked entries, our editorial team may provide additional quality assessment.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.3 Combined Score</h3>
          <p>
            The final score is a weighted combination of engagement metrics and quality scores. The exact formula and weights will be disclosed in each competition&apos;s rules page. The Platform&apos;s scoring system is designed to reward genuine readership and quality writing over artificially inflated metrics.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Prizes</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.1 Prize Pool</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Each competition specifies a total prize pool and the breakdown for 1st, 2nd, and 3rd place (and any additional prizes).</li>
            <li>Prize amounts are in Indian Rupees (INR).</li>
            <li>Prizes may be monetary (credited to wallet), virtual goods (Coins, Points), badges, or a combination thereof.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.2 Prize Distribution</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Results will be announced on the Platform within 7 days of the competition results date.</li>
            <li>Monetary prizes are credited to the winner&apos;s wallet balance within 15 days of results announcement.</li>
            <li>Wallet balance can be withdrawn per the <a href="/creator-agreement" className="text-primary underline">Creator Monetization Agreement</a> terms.</li>
            <li>If a winner is disqualified (due to plagiarism, fraud, or ineligibility), the prize will be awarded to the next-ranked eligible participant.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.3 Tax on Prizes</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>All taxes on prizes are the <strong>winner&apos;s sole responsibility</strong>.</li>
            <li>Under Section 194B of the Income Tax Act, 1961, prizes exceeding Rs. 10,000 are subject to TDS at the rate of 30% (plus applicable cess and surcharge).</li>
            <li>The Platform will deduct TDS before disbursing the prize amount where legally required.</li>
            <li>Winners may be required to provide PAN details for TDS compliance.</li>
            <li>TDS certificates (Form 16A) will be provided for the relevant financial year.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Disqualification</h2>
          <p>Entries may be disqualified for any of the following reasons:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Plagiarism or copyright infringement.</li>
            <li>Violation of Community Guidelines or Terms of Service.</li>
            <li>Artificial manipulation of engagement metrics (fake views, likes, or comments).</li>
            <li>Use of multiple accounts to submit entries.</li>
            <li>Failure to meet eligibility criteria or entry requirements.</li>
            <li>Failure to comply with the competition-specific rules.</li>
          </ul>
          <p>
            Disqualification decisions may be appealed through our <a href="/grievance-redressal" className="text-primary underline">Grievance Redressal Policy</a> within 15 days of the decision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Platform&apos;s Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cancellation:</strong> The Platform reserves the right to cancel, postpone, or modify any competition at any time if circumstances require it (technical issues, insufficient participation, force majeure). Participants will be notified, and any entry fees (if applicable) will be refunded.</li>
            <li><strong>Modification:</strong> The Platform may extend deadlines, modify prize pools, adjust judging criteria, or change other competition parameters. Material changes will be communicated to all participants.</li>
            <li><strong>Final Decision:</strong> The Platform&apos;s decisions regarding judging, scoring, and prize distribution are final, subject to the appeal process described in Section 6.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Intellectual Property of Winning Entries</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Winning entries remain subject to the same <a href="/content-licensing" className="text-primary underline">Content Licensing Agreement</a> that applies to all Platform content.</li>
            <li>The Platform may feature winning entries prominently on the Platform, in newsletters, on social media, and in press communications with proper attribution.</li>
            <li>Winners retain their copyright and moral rights as described in the Content Licensing Agreement.</li>
            <li>The Platform does not claim exclusive rights to winning entries beyond the standard content license.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Governing Law</h2>
          <p>
            These Rules are governed by the laws of India, including the Indian Contract Act, 1872 and the Consumer Protection Act, 2019. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Contact</h2>
          <p>For competition-related questions, disputes, or feedback:</p>
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
