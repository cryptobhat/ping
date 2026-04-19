'use client';

export default function PaymentTermsPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50 mb-2">Payment Terms &amp; Conditions</h1>
      <p className="text-sm text-warm-500 mb-8">Last Updated: April 12, 2026</p>

      <div className="prose prose-warm dark:prose-invert prose-sm max-w-none space-y-6 text-warm-700 dark:text-warm-300">

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">1. Introduction</h2>
          <p>
            These Payment Terms &amp; Conditions (&quot;Payment Terms&quot;) govern all financial transactions on Kalaloka (&quot;Platform&quot;), a product of <strong>DigiYogi</strong>, Bangalore, Karnataka, India. By making any purchase or participating in any monetization activity on the Platform, you agree to these Payment Terms in addition to our <a href="/terms" className="text-primary underline">Terms of Service</a>.
          </p>
          <p>
            These terms are governed by the Indian Contract Act, 1872, the Consumer Protection Act, 2019, the Payment and Settlement Systems Act, 2007, and applicable RBI guidelines.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">2. Payment Processor</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All payments on the Platform are processed through <strong>Razorpay Software Private Limited</strong> (&quot;Razorpay&quot;), a RBI-licensed payment aggregator.</li>
            <li>By making a payment, you also agree to Razorpay&apos;s terms of service and privacy policy.</li>
            <li>The Platform does not store your full payment card details, bank account numbers, or UPI PINs. All sensitive payment data is handled directly by Razorpay in compliance with PCI-DSS standards.</li>
            <li>The Platform reserves the right to change its payment processor at any time. Any such change will not affect previously completed transactions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">3. Currency</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All prices, transactions, and payouts are in <strong>Indian Rupees (INR)</strong> only.</li>
            <li>The Platform does not support multi-currency transactions at this time.</li>
            <li>If you are accessing the Platform from outside India, your bank may apply currency conversion fees. Such fees are your responsibility.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">4. Virtual Goods: Points, Coins, Gems, and Pens</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.1 Nature of Virtual Goods</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Points</strong> (earned through reading and engagement), <strong>Coins</strong> (purchased with real money), <strong>Pens</strong> (purchased with real money, used for gifts), and <strong>Gems</strong> (virtual gifts sent to creators) are <strong>virtual goods</strong>. They are not currency, securities, or financial instruments.</li>
            <li>Virtual goods have <strong>no cash value</strong> outside the Platform.</li>
            <li>Virtual goods are <strong>non-transferable</strong> between accounts, except through Platform-approved mechanisms (such as sending gifts).</li>
            <li>Virtual goods are <strong>non-refundable</strong> once purchased, except as required by the Consumer Protection Act, 2019 or our <a href="/refund-policy" className="text-primary underline">Refund Policy</a>.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.2 Point Values and Conversion</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The monetary value assigned to Points is determined by the Platform and may change from time to time.</li>
            <li>The current conversion rate is: <strong>10 Points = Re. 1</strong> (for creator withdrawals). This rate is subject to change with 30 days&apos; notice.</li>
            <li>Coin packages and Pen packages have fixed prices that are displayed at the time of purchase. These prices may be updated by the Platform.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">4.3 Platform&apos;s Right to Modify</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>The Platform reserves the right to modify the value, earning rates, spending rates, availability, and functionality of all virtual goods with <strong>30 days&apos; prior notice</strong>.</li>
            <li>The Platform may introduce new virtual goods, discontinue existing ones, or change the mechanics of how they are earned or spent.</li>
            <li>In the event of discontinuation of a virtual good, the Platform will provide a reasonable conversion or redemption period.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">5. Purchases</h2>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.1 Coin and Pen Packages</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Coin and Pen packages are available at prices displayed in the app and website at the time of purchase.</li>
            <li>Bonus Coins or Pens included in packages are promotional and subject to the same terms as purchased Coins/Pens.</li>
            <li>All purchases are final upon successful payment processing, subject to our Refund Policy.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.2 Platform Subscriptions</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium subscription plans provide access to ad-free reading and other premium features for a fixed duration.</li>
            <li>Subscription prices, features, and durations are as listed at the time of purchase.</li>
            <li>Subscriptions are valid for the purchased duration and do not automatically renew unless explicitly enabled by you.</li>
            <li><strong>Auto-Renewal (if enabled):</strong> If you enable auto-renewal, your subscription will automatically renew at the end of the current period at the then-current price. You will be charged via your original payment method. You may cancel auto-renewal at any time through your account settings before the next renewal date.</li>
          </ul>

          <h3 className="text-lg font-medium text-warm-800 dark:text-warm-200">5.3 Creator Subscriptions</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Creator subscriptions are separate from Platform subscriptions. They provide access to a specific creator&apos;s premium or members-only content.</li>
            <li>The price is set by the creator and displayed at the time of subscription.</li>
            <li>Creator subscriptions are monthly and do not carry over. Upon expiry, access to members-only content is revoked unless you renew.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">6. Failed Transactions</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Payment Failure:</strong> If a payment fails due to network issues, bank decline, insufficient funds, or any other reason, no virtual goods or services will be credited. You will not be charged for failed transactions.</li>
            <li><strong>Amount Debited but Not Credited:</strong> If money is debited from your account but virtual goods are not credited (due to a timeout or processing error), the amount will be automatically refunded by Razorpay within 5-7 business days. If this does not happen, contact us at <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a> with the transaction ID.</li>
            <li><strong>Duplicate Charges:</strong> If you are charged twice for the same transaction, the duplicate amount will be refunded within 7-10 business days upon verification.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">7. Chargeback Policy</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>If you initiate a chargeback (dispute) with your bank or card issuer for a legitimate transaction on the Platform, we reserve the right to suspend your account pending investigation.</li>
            <li>If the chargeback is determined to be fraudulent or unjustified, we may: (a) permanently suspend your account; (b) forfeit any virtual goods or wallet balance; (c) recover the disputed amount; and (d) report the activity to relevant authorities.</li>
            <li>If you have a legitimate concern about a charge, we strongly encourage you to contact us at <a href="mailto:support@kalaloka.buzz" className="text-primary underline">support@kalaloka.buzz</a> first before initiating a bank chargeback. We will work to resolve the issue within 7 business days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">8. Creator Payouts</h2>
          <p>
            Payout terms for creators are governed by the <a href="/creator-agreement" className="text-primary underline">Creator Monetization Agreement</a>. Key points:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Payouts are processed monthly via UPI only.</li>
            <li>Minimum withdrawal: Rs. 40 (400 Points equivalent).</li>
            <li>TDS may be deducted as per applicable Income Tax provisions.</li>
            <li>The Platform is not liable for delays caused by banks, UPI infrastructure, or incorrect payment details provided by the creator.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">9. Taxes</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All prices displayed on the Platform are inclusive of applicable GST unless stated otherwise.</li>
            <li>The Platform collects and remits GST on purchases as required under the Goods and Services Tax Acts.</li>
            <li>Invoices for purchases are available through your transaction history or by request.</li>
            <li>Creator tax obligations are detailed in the <a href="/creator-agreement" className="text-primary underline">Creator Monetization Agreement</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">10. Account Termination and Virtual Goods</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Voluntary Deletion:</strong> If you delete your account, any unused Coins, Pens, Points, and wallet balance are forfeited. Refunds will not be issued for unused virtual goods upon voluntary account deletion.</li>
            <li><strong>Termination for Cause:</strong> If your account is terminated for policy violations, all virtual goods and wallet balances are forfeited.</li>
            <li><strong>Inactivity:</strong> If your account is inactive for more than 12 consecutive months, the Platform may expire any virtual goods balance after sending a 30-day notice to your registered email/phone.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">11. Limitation of Liability</h2>
          <p>
            The Platform&apos;s total liability for any claims arising from payment transactions shall not exceed the amount actually paid by you for the specific transaction in question. The Platform is not liable for: (a) losses arising from bank, UPI, or payment processor outages; (b) unauthorized transactions resulting from your failure to secure your account; or (c) exchange rate fluctuations for users outside India.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-warm-900 dark:text-warm-100">12. Contact</h2>
          <p>For payment-related issues, transaction disputes, or billing queries:</p>
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
