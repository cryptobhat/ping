'use client';

export default function CookiePolicyPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Cookie Policy</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <p>
            This Cookie Policy explains how Kalaloka (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;), operated by DigiYogi, uses cookies and similar technologies when you visit or use our Platform at <a href="https://kavi.digiyogi.com" className="text-primary underline">kavi.digiyogi.com</a> and associated services. This policy should be read alongside our <a href="/privacy-policy" className="text-primary underline">Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that websites place on your device (computer, phone, tablet) when you visit them. They are widely used to make websites work efficiently, remember your preferences, and provide information to the website owner. We also use similar technologies such as local storage and session storage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Cookies and Technologies We Use</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.1 Essential / Authentication</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-warm-200 dark:border-warm-700">
              <thead className="bg-warm-50 dark:bg-warm-800">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Technology</th>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Purpose</th>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">JWT Token (localStorage)</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Keeps you logged in. Without this, you would need to log in every time you visit the Platform.</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Until logout or token expiry (30 days)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Session data (sessionStorage)</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Temporary data for your current browsing session (e.g., form state, navigation context).</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Current browser session only</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-warm-500">These are strictly necessary for the Platform to function. They cannot be disabled.</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.2 Preferences</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-warm-200 dark:border-warm-700">
              <thead className="bg-warm-50 dark:bg-warm-800">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Technology</th>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Purpose</th>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Theme preference (localStorage)</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Remembers your choice of light or dark mode.</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Persistent until cleared</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Language preference (localStorage)</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Remembers your preferred reading and interface language.</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Persistent until cleared</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Reader settings (localStorage)</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Remembers your font size, reading theme, and display preferences.</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Persistent until cleared</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.3 Analytics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-warm-200 dark:border-warm-700">
              <thead className="bg-warm-50 dark:bg-warm-800">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Technology</th>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Purpose</th>
                  <th className="px-3 py-2 text-left border-b border-warm-200 dark:border-warm-700">Provider</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">PostHog analytics (cookies + localStorage)</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">Helps us understand how users interact with the Platform &mdash; which pages are popular, where users drop off, and what features are used most. This data helps us improve the experience for everyone.</td>
                  <td className="px-3 py-2 border-b border-warm-200 dark:border-warm-700">PostHog (posthog.com)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-warm-500">
            PostHog may set cookies such as <code className="text-xs">ph_*</code> and store data in localStorage with keys starting with <code className="text-xs">ph_</code>. PostHog collects anonymized usage data including page views, clicks, session duration, and device information. Your personal identity is not shared with PostHog&apos;s other customers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. What We Do Not Use</h2>
          <p>For transparency, we want to clarify that Kalaloka currently does NOT use:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Third-party advertising cookies</strong> &mdash; we do not serve ads or share data with ad networks.</li>
            <li><strong>Social media tracking pixels</strong> &mdash; we do not embed Facebook Pixel, Google Ads tags, or similar trackers.</li>
            <li><strong>Cross-site tracking</strong> &mdash; we do not track your activity on other websites.</li>
          </ul>
          <p>If this changes in the future, we will update this policy and notify users.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. How to Manage Cookies</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.1 Browser Settings</h3>
          <p>
            Most web browsers allow you to control cookies through their settings. You can typically:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>View what cookies are stored on your device.</li>
            <li>Delete individual or all cookies.</li>
            <li>Block cookies from specific or all websites.</li>
            <li>Set your browser to notify you when a cookie is being set.</li>
          </ul>
          <p>
            Check your browser&apos;s help documentation for instructions specific to your browser (Chrome, Firefox, Safari, Edge, etc.).
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.2 Clearing Local Storage</h3>
          <p>
            Since we primarily use localStorage rather than traditional cookies, you can clear this data through your browser&apos;s developer tools or by clearing all site data for kavi.digiyogi.com in your browser settings.
          </p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.3 Impact of Disabling Cookies</h3>
          <p>
            Please note that if you disable or clear cookies and local storage:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You will be logged out and need to log in again.</li>
            <li>Your theme, language, and reader preferences will be reset.</li>
            <li>Some features of the Platform may not work correctly.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.4 Opting Out of Analytics</h3>
          <p>
            If you prefer not to be tracked by PostHog analytics, you can:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use your browser&apos;s &quot;Do Not Track&quot; setting (we respect this signal).</li>
            <li>Use a browser extension that blocks analytics scripts.</li>
            <li>Contact us to opt out of analytics tracking for your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time, particularly if we introduce new technologies or analytics tools. Changes will be reflected with an updated &quot;Last Updated&quot; date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Contact Us</h2>
          <p>Questions about our use of cookies?</p>
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
