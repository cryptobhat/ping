'use client';

export default function ApiDeveloperTermsPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">API &amp; Developer Terms</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Introduction</h2>
          <p>
            These API &amp; Developer Terms (&quot;Developer Terms&quot;) govern the use of any application programming interfaces (APIs), software development kits (SDKs), widgets, or developer tools that Kalaloka (&quot;Platform&quot;), a product of <strong>DigiYogi</strong>, Bangalore, Karnataka, India, may make available in the future.
          </p>
          <p>
            <strong>Current Status:</strong> As of the date of this document, the Platform does not provide a public API. This document is published as a forward-looking framework. When a public API is launched, these terms will govern its use. Unauthorized access to internal Platform APIs is strictly prohibited under our <a href="/acceptable-use" className="text-primary underline">Acceptable Use Policy</a> and may constitute an offense under Section 66 of the Information Technology Act, 2000.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. API Access Terms (When Available)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Registration:</strong> API access will require registration for API credentials (API key and secret). You must provide accurate information during registration.</li>
            <li><strong>Authentication:</strong> All API requests must be authenticated using the credentials issued to you. API keys must not be shared, published, or embedded in client-side code.</li>
            <li><strong>Approval:</strong> Certain API endpoints or higher access tiers may require application approval. The Platform reserves the right to approve or deny API access at its discretion.</li>
            <li><strong>Cost:</strong> Initial API access tiers may be free. Premium tiers with higher rate limits or additional endpoints may be offered at a cost. Pricing will be communicated at the time of API launch.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Rate Limits</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>API usage will be subject to rate limits that vary by endpoint and access tier.</li>
            <li>Rate limits will be communicated in the API documentation and in response headers.</li>
            <li>Exceeding rate limits will result in HTTP 429 (Too Many Requests) responses.</li>
            <li>Persistent rate limit violations may result in temporary or permanent suspension of API access.</li>
            <li>If your use case requires higher rate limits, you may apply for an increased allocation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. Data Usage Restrictions</h2>
          <p>When using the API, you must comply with the following data usage restrictions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Purpose Limitation:</strong> You may only use data obtained through the API for the purposes disclosed in your API access application and approved by the Platform.</li>
            <li><strong>No Data Hoarding:</strong> You must not cache, store, or index Platform data beyond what is necessary for your application&apos;s immediate functionality, unless explicitly permitted.</li>
            <li><strong>No Data Resale:</strong> Data obtained through the API must not be sold, sublicensed, or provided to third parties for purposes unrelated to your approved application.</li>
            <li><strong>No AI Training:</strong> You must not use API data to train machine learning models, language models, or AI systems without explicit written permission from DigiYogi.</li>
            <li><strong>User Privacy:</strong> You must comply with our <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a> and the <a href="/data-protection" className="text-primary underline">Data Protection Policy</a> (DPDPA) when handling any personal data obtained through the API. You must obtain appropriate consent from users before processing their data.</li>
            <li><strong>Data Deletion:</strong> If a user revokes access to your application, you must delete all data obtained about that user through the API within 30 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Attribution Requirements</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Applications using the Kalaloka API must display the &quot;Powered by Kalaloka&quot; attribution in a visible location.</li>
            <li>Content displayed from the Platform must include proper author attribution as provided in the API response.</li>
            <li>You must not modify, obscure, or remove attribution information from Platform content.</li>
            <li>Specific branding guidelines and attribution formats will be provided in the API documentation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Prohibited Uses</h2>
          <p>You must NOT use the API for any of the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Building a competing content platform or service that replicates core Platform functionality.</li>
            <li>Scraping, harvesting, or systematically downloading content for offline distribution.</li>
            <li>Circumventing Platform access controls, paywalls, or content restrictions.</li>
            <li>Sending spam, unsolicited messages, or bulk communications through the API.</li>
            <li>Manipulating engagement metrics (views, likes, comments, follows) through automated means.</li>
            <li>Any activity that violates our <a href="/acceptable-use" className="text-primary underline">Acceptable Use Policy</a>, <a href="/terms" className="text-primary underline">Terms of Service</a>, or applicable laws.</li>
            <li>Applications that may bring the Platform into disrepute or harm its users.</li>
            <li>Accessing, modifying, or deleting data belonging to users who have not authorized your application.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Termination of API Access</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>The Platform may suspend or terminate your API access at any time, with or without cause, upon reasonable notice.</li>
            <li>Immediate termination (without notice) may occur if: (a) you violate these Developer Terms; (b) your application poses a security risk; (c) your application negatively impacts Platform performance; or (d) you violate applicable laws.</li>
            <li>Upon termination, you must immediately cease all API usage, delete all API credentials, and delete all cached Platform data within 30 days.</li>
            <li>You may terminate your API access at any time by deleting your API credentials and ceasing usage.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Warranties and Liability</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>The API is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied.</li>
            <li>The Platform does not guarantee API uptime, response times, or data accuracy.</li>
            <li>The Platform may modify, deprecate, or discontinue API endpoints at any time with reasonable notice.</li>
            <li>The Platform&apos;s total liability for API-related claims shall not exceed the fees paid by you for API access in the 12 months preceding the claim, or Rs. 10,000, whichever is greater.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Changes to These Terms</h2>
          <p>
            The Platform may update these Developer Terms as the API evolves. Material changes will be communicated via email to registered API developers at least 30 days before taking effect. Continued use of the API after changes constitute acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Governing Law</h2>
          <p>
            These Developer Terms are governed by the laws of India, including the Information Technology Act, 2000 and the Indian Contract Act, 1872. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">11. Contact</h2>
          <p>For API-related inquiries or developer partnerships:</p>
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
