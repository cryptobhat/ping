'use client';

export default function AccessibilityPolicyPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Accessibility Policy</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Our Commitment</h2>
          <p>
            Kalaloka (&quot;Platform&quot;), a product of <strong>DigiYogi</strong>, Bangalore, Karnataka, India, is committed to ensuring that our content reading and writing platform is accessible to all users, including persons with disabilities. We recognize that accessibility is essential for an inclusive digital experience, especially for a platform focused on Kannada-first literature and storytelling.
          </p>
          <p>
            We are working towards conformance with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standards, issued by the World Wide Web Consortium (W3C). We also strive to comply with the <strong>Rights of Persons with Disabilities Act, 2016</strong> (RPwD Act) in providing equal access to digital information and services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Accessibility Features Available</h2>
          <p>The Platform currently provides the following accessibility features:</p>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.1 Visual Accessibility</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dark Mode:</strong> A full dark mode is available that reduces eye strain and improves readability in low-light environments. You can toggle this in your profile settings.</li>
            <li><strong>High Contrast:</strong> Our dark mode provides high contrast ratios between text and backgrounds.</li>
            <li><strong>Font Sizing:</strong> The web platform respects browser-level font size settings. Content text is rendered in readable sizes with sufficient line spacing.</li>
            <li><strong>Color Independence:</strong> We use text labels and icons alongside color to convey information, so color is not the sole means of communicating meaning.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.2 Screen Reader Support</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The web platform uses semantic HTML elements (headings, lists, navigation landmarks, form labels) to support screen reader navigation.</li>
            <li>Images include alternative text descriptions where applicable.</li>
            <li>Interactive elements (buttons, links, form controls) include appropriate ARIA labels.</li>
            <li>Page structure uses proper heading hierarchy (h1 through h6).</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.3 Keyboard Navigation</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Core features of the web platform can be accessed using keyboard-only navigation.</li>
            <li>Focus indicators are visible on interactive elements.</li>
            <li>Tab order follows a logical reading sequence.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.4 Audio Content</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI-generated audio narrations are available for published content, providing an alternative way to consume written stories and articles.</li>
            <li>Audio playback controls are accessible and include play, pause, and seek functionality.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">2.5 Language Support</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The Platform supports Kannada, Hindi, and English, with proper Unicode rendering for all scripts.</li>
            <li>Language attributes are properly set on content elements to assist screen readers with pronunciation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Known Limitations</h2>
          <p>
            While we are actively working to improve accessibility, the following limitations are currently known:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Mobile App:</strong> The mobile application (Android) may have limited screen reader support in some areas. We are progressively improving React Native accessibility props.</li>
            <li><strong>User-Generated Content:</strong> Content created by users (stories, poems, quotes) may not always include accessibility metadata such as image descriptions. We encourage creators to add descriptive text.</li>
            <li><strong>Quote Images:</strong> Quote cards rendered as images may not always have complete text alternatives.</li>
            <li><strong>Complex Interactions:</strong> Some interactive features (such as drag-and-drop series ordering or gift animations) may not be fully accessible to keyboard-only or screen reader users.</li>
            <li><strong>Third-Party Content:</strong> Embedded content from third-party services (such as advertisements) may not meet our accessibility standards.</li>
            <li><strong>PDF Exports:</strong> Downloaded content exports may have limited accessibility tagging.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. How to Request Accommodations</h2>
          <p>
            If you encounter any accessibility barriers or need accommodations to use the Platform, we want to hear from you:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Email:</strong> <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a> with the subject &quot;Accessibility Request.&quot;</li>
            <li>Please describe the issue or accommodation you need, including the device and assistive technology you are using.</li>
            <li>We will acknowledge your request within <strong>48 hours</strong> and provide an estimated timeline for accommodation.</li>
            <li>Where possible, we will provide an alternative means of accessing the content or feature until the issue is resolved.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Feedback Mechanism</h2>
          <p>
            We welcome feedback on the accessibility of the Platform. Your input helps us identify areas for improvement:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Send accessibility feedback to <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a>.</li>
            <li>Include as much detail as possible: the page or feature, the issue encountered, the browser/device you used, and the assistive technology involved.</li>
            <li>Accessibility feedback is prioritized in our development roadmap.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Our Roadmap</h2>
          <p>We are committed to continuous improvement of accessibility across the Platform:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Regular accessibility audits using automated tools and manual testing.</li>
            <li>Progressive enhancement of mobile app accessibility features.</li>
            <li>Training content creators on writing accessible content.</li>
            <li>Improving alt-text generation for quote images using AI.</li>
            <li>Working towards WCAG 2.1 Level AA conformance across all core user journeys.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Contact</h2>
          <p>For accessibility-related questions, requests, or feedback:</p>
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
