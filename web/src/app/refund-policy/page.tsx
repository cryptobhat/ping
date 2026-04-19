'use client';

export default function RefundPolicyPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Refund Policy</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <p>
            This Refund Policy applies to all purchases made on Kalaloka (&quot;Platform&quot;), operated by DigiYogi. Because Kalaloka primarily offers digital content and virtual goods, most purchases are non-refundable. Please read this policy carefully before making a purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Virtual Currency (Points)</h2>
          <div className="bg-warm-50 dark:bg-warm-800/50 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
            <p className="font-medium text-warm-900 dark:text-warm-100">Non-refundable.</p>
            <p>
              Points purchased on Kalaloka are non-refundable once the transaction is complete. Points are virtual currency with no real-world monetary value and cannot be exchanged for cash.
            </p>
          </div>
          <p><strong>Exception:</strong> If you were charged multiple times for the same purchase due to a technical error, we will refund the duplicate charges. Contact us with your transaction details.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Platform Subscription (Kalaloka Premium)</h2>
          <div className="bg-warm-50 dark:bg-warm-800/50 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
            <p className="font-medium text-warm-900 dark:text-warm-100">Refundable within 7 days of purchase (prorated). No refund after 7 days.</p>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Within 7 days of purchase:</strong> If you are unsatisfied with the premium subscription, you may request a refund within 7 days of the initial purchase or renewal. The refund will be prorated based on the unused portion of the subscription period.</li>
            <li><strong>After 7 days:</strong> No refund is available. You can cancel the subscription to prevent future renewals, but the current billing period will not be refunded.</li>
            <li><strong>Free trials:</strong> If a free trial converts to a paid subscription, the 7-day refund window starts from the date you were first charged (not the trial start date).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Creator Subscriptions</h2>
          <div className="bg-warm-50 dark:bg-warm-800/50 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
            <p className="font-medium text-warm-900 dark:text-warm-100">Non-refundable.</p>
            <p>
              Creator subscriptions give you immediate access to exclusive content. Because the digital content is delivered at the time of purchase, creator subscriptions are not eligible for refunds.
            </p>
          </div>
          <p>
            <strong>Exception:</strong> If the creator&apos;s account is terminated for Terms violations within the first 7 days of your subscription, we will provide a full refund or credit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. Episode and Chapter Unlocks</h2>
          <div className="bg-warm-50 dark:bg-warm-800/50 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
            <p className="font-medium text-warm-900 dark:text-warm-100">Non-refundable.</p>
            <p>
              When you use Points to unlock a paid episode or chapter, the digital content is delivered immediately. Unlocked content cannot be &quot;re-locked&quot; and Points spent on unlocks are not refundable.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Gems (Gifts and Tips)</h2>
          <div className="bg-warm-50 dark:bg-warm-800/50 rounded-xl p-4 border border-warm-200 dark:border-warm-700">
            <p className="font-medium text-warm-900 dark:text-warm-100">Non-refundable once sent.</p>
            <p>
              Gems are a way to show appreciation to creators. Once you send Gems to a creator, the transaction is final. Gems cannot be reversed, recalled, or refunded.
            </p>
          </div>
          <p>
            <strong>Unsent Gems:</strong> If you purchased Gems but have not yet sent them, they are treated the same as Points (non-refundable virtual currency).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. When We Will Issue a Refund</h2>
          <p>Regardless of the categories above, we will issue a refund in the following situations:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Duplicate charges:</strong> You were charged more than once for the same purchase due to a payment processing error.</li>
            <li><strong>Unauthorized transactions:</strong> A purchase was made on your account without your authorization (and you report it within 30 days).</li>
            <li><strong>Service not delivered:</strong> You were charged but the virtual currency, subscription access, or content unlock was not delivered due to a technical issue, and we are unable to resolve the delivery issue.</li>
            <li><strong>Legal requirement:</strong> Where a refund is mandated by applicable consumer protection laws.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. How to Request a Refund</h2>
          <p>To request a refund, email us at <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a> with the subject line <strong>&quot;Refund Request&quot;</strong>. Include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your Kalaloka username or registered phone number/email.</li>
            <li>The date and amount of the purchase.</li>
            <li>The transaction ID or payment receipt (if available).</li>
            <li>A description of why you are requesting a refund.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Processing Time</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We will acknowledge your refund request within <strong>48 hours</strong>.</li>
            <li>Approved refunds will be processed within <strong>7&ndash;10 business days</strong>.</li>
            <li>Refunds will be credited to the original payment method used for the purchase. We cannot refund to a different payment method.</li>
            <li>Bank processing times may add an additional 3&ndash;5 business days after we process the refund.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Account Termination and Refunds</h2>
          <p>
            If your account is terminated by us due to a violation of our <a href="/terms" className="text-primary underline">Terms of Service</a>, no refund will be issued for unused Points, Gems, or remaining subscription periods.
          </p>
          <p>
            If you voluntarily delete your account, unused Points and Gems are forfeited. Active subscriptions will not be refunded but will not be renewed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. Changes will be posted on this page with an updated &quot;Last Updated&quot; date. Changes do not apply retroactively to purchases made before the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">11. Contact Us</h2>
          <p>For refund inquiries:</p>
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
