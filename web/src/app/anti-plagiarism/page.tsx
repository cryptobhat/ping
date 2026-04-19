'use client';

export default function AntiPlagiarismPolicyPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Anti-Plagiarism Policy</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Zero Tolerance for Plagiarism</h2>
          <p>
            Kalaloka (&quot;Platform&quot;), a product of <strong>DigiYogi</strong>, is built on the foundation of original Kannada-first creative writing. We have a <strong>zero tolerance policy for plagiarism</strong>. Every author on the Platform deserves to have their original work respected and protected.
          </p>
          <p>
            Plagiarism undermines the creative community, violates the intellectual property rights of original authors, and is a violation of the Copyright Act, 1957. This policy applies to all content published on the Platform, including stories, poems, articles, quotes, and series.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. What Constitutes Plagiarism</h2>
          <p>On this Platform, plagiarism includes but is not limited to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Direct Copying:</strong> Reproducing another person&apos;s work (or substantial portions of it) and presenting it as your own, whether from Kalaloka, other platforms, books, or any other source.</li>
            <li><strong>Paraphrasing Without Attribution:</strong> Rewriting someone else&apos;s ideas, arguments, or narrative in your own words without giving credit to the original source.</li>
            <li><strong>Translation Plagiarism:</strong> Translating another author&apos;s work from one language to another and presenting it as your own original work without permission or attribution.</li>
            <li><strong>Self-Plagiarism (in competitive contexts):</strong> Submitting previously published work (your own or otherwise) as a new entry in a Platform competition without disclosure.</li>
            <li><strong>AI-Generated Content Passed as Original:</strong> Publishing content generated entirely by AI tools (ChatGPT, Gemini, etc.) without disclosure, while claiming it as your original creative work.</li>
            <li><strong>Mosaic Plagiarism:</strong> Combining phrases, sentences, or ideas from multiple sources to create content that appears original but is substantially derived from others&apos; work.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. What Is NOT Plagiarism</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Common Knowledge:</strong> Facts, widely known information, or ideas that are in the public domain do not require attribution.</li>
            <li><strong>Your Own Original Work:</strong> Publishing your own original work on Kalaloka, even if you have published it elsewhere, is not plagiarism (it is permitted under our non-exclusive license).</li>
            <li><strong>AI-Assisted Writing:</strong> Using AI tools as a writing aid (for grammar correction, suggestions, or brainstorming) while the core creative content is yours is acceptable.</li>
            <li><strong>Properly Attributed Quotations:</strong> Quoting another work with proper attribution and within fair dealing limits is acceptable (see Section 6).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. How We Detect Plagiarism</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.1 AI-Based Detection</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The Platform employs AI-powered content analysis tools that compare newly published content against existing content in our database.</li>
            <li>Our content quality scoring system includes similarity checks that flag potentially plagiarized content for manual review.</li>
            <li>Content that scores above a certain similarity threshold is held for review before publication or flagged post-publication.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.2 Community Reporting</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Any user can report content they believe is plagiarized using the in-app report feature.</li>
            <li>When reporting plagiarism, please provide the original source (link, book title, author name) to help us investigate.</li>
            <li>All plagiarism reports are reviewed by our content moderation team.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.3 Author Complaints</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>If you are an original author and find your work plagiarized on this Platform, you may file a copyright complaint through our <a href="/copyright" className="text-primary underline">Copyright Policy</a>.</li>
            <li>Copyright takedown requests are handled with priority under Section 52 of the Copyright Act, 1957 and Section 79 of the IT Act, 2000.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Consequences of Plagiarism</h2>
          <p>Consequences are applied progressively based on severity and frequency:</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">First Offense</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The plagiarized content is removed immediately.</li>
            <li>A written warning is issued to the author.</li>
            <li>The author&apos;s content quality score is affected.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">Second Offense</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The content is removed.</li>
            <li>A 30-day suspension from publishing new content.</li>
            <li>Temporary removal from the Creator Monetization Program (if enrolled).</li>
            <li>Any earnings from the plagiarized content are forfeited.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">Third Offense / Severe Cases</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Permanent account ban.</li>
            <li>Permanent removal from the Creator Monetization Program with forfeiture of all pending earnings.</li>
            <li>The original author (or copyright holder) may be informed for potential legal action under the Copyright Act, 1957.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">Severe Cases (Immediate Ban)</h3>
          <p>The following result in immediate permanent ban without prior warning:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Copying entire books, chapters, or published works from external sources.</li>
            <li>Systematic plagiarism across multiple pieces of content.</li>
            <li>Plagiarism of content from other Kalaloka authors.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Fair Use and Quotation Guidelines</h2>
          <p>
            Under Section 52 of the Copyright Act, 1957, certain uses of copyrighted material are considered &quot;fair dealing&quot; and are permitted. On this Platform:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Short Quotations:</strong> You may quote short passages (up to 300 words or 10% of the original work, whichever is less) from published works for the purpose of criticism, review, or commentary, provided you clearly attribute the source.</li>
            <li><strong>Attribution Format:</strong> Quotations should be clearly marked (using quotation marks or block quotes) and include the original author&apos;s name and the source title.</li>
            <li><strong>Poetry:</strong> For poems, you may quote up to 4 lines with proper attribution.</li>
            <li><strong>Classical and Public Domain Works:</strong> Works in the public domain (generally works where the copyright has expired, typically 60 years after the author&apos;s death under Indian law) may be freely quoted or adapted with attribution.</li>
            <li><strong>Religious and Cultural Texts:</strong> Verses from religious texts, folk songs, and traditional literature may be quoted with appropriate source acknowledgment.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Fan Fiction Rules</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Permitted:</strong> Fan fiction based on works in the public domain is permitted and encouraged.</li>
            <li><strong>Copyrighted Works:</strong> Fan fiction based on copyrighted works (movies, TV shows, books still under copyright) is published at the author&apos;s own risk. The Platform does not endorse or guarantee that such works will not be subject to copyright claims from the original rights holders.</li>
            <li><strong>Disclosure:</strong> Fan fiction must be clearly labeled as fan fiction and must identify the original work it is based on.</li>
            <li><strong>No Commercial Claims:</strong> Fan fiction authors cannot claim exclusive commercial rights to their fan fiction or use it for monetization of copyrighted characters/settings belonging to others.</li>
            <li><strong>Takedown Compliance:</strong> If the original rights holder requests removal, the Platform will comply promptly.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Translation Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Platform-Facilitated Translations:</strong> The Platform may create AI-powered translations of published content as part of the <a href="/content-licensing" className="text-primary underline">Content Licensing Agreement</a>.</li>
            <li><strong>User Translations:</strong> If you wish to translate another Kalaloka author&apos;s work, you must obtain written permission from the original author first. Include a clear credit: &quot;Original by [Author Name], translated by [Your Name].&quot;</li>
            <li><strong>External Works:</strong> Translating copyrighted works from outside the Platform requires permission from the original copyright holder. Unauthorized translations will be treated as plagiarism.</li>
            <li><strong>Public Domain Translations:</strong> Translating public domain works is permitted and encouraged, especially for classical Kannada literature. Proper source attribution is required.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Appeal Process</h2>
          <p>
            If you believe your content was incorrectly flagged or removed as plagiarism, you may appeal within 30 days of the action. See our <a href="/grievance-redressal" className="text-primary underline">Grievance Redressal Policy</a> for the appeal process. Please provide evidence of your original authorship (drafts, timestamps, external publications) with your appeal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Contact</h2>
          <p>For plagiarism reports, copyright concerns, or questions about this policy:</p>
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
