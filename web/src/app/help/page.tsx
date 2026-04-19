'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const faqs = [
  { q: 'How do I create an account?', a: 'Download the Kalaloka app or visit our website. Sign up using your phone number with OTP verification. It takes less than a minute!' },
  { q: 'What languages are supported?', a: 'Kalaloka supports 11+ Indian languages including Kannada, Hindi, English, Tamil, Telugu, Marathi, Bengali, Gujarati, Malayalam, Punjabi, and Urdu.' },
  { q: 'How do Points and Gems work?', a: 'Points are the currency on Kalaloka (10 Points = Rs 1). You earn Points by reading, streaks, and referrals. You spend Points on Gems — beautiful gifts you send to your favorite writers. You can also buy Points from the Wallet section.' },
  { q: 'What is Kalaloka Premium?', a: 'Kalaloka Premium gives you ad-free reading, exclusive content, offline downloads, custom themes, and a premium badge on your profile.' },
  { q: 'How do I earn rewards?', a: 'Read daily to maintain your reading streak! You earn Points based on reading time and streak length. You can also earn through referrals.' },
  { q: 'Can I write in multiple languages?', a: 'Yes! You can write and publish content in any of our 11+ supported languages. Just select the language when creating new content.' },
  { q: 'How do competitions work?', a: 'Writing competitions are hosted periodically. Submit your entry, get scored by judges, and win prizes. Check the Competitions tab for active contests.' },
  { q: 'How do I delete my account?', a: 'Go to Settings > Delete Account. Alternatively, email support@kalaloka.buzz. Please note that account deletion is permanent.' },
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Help & FAQ</h1>
      </div>

      {/* FAQs */}
      <div className="space-y-2">
        {faqs.map(({ q, a }, i) => (
          <div key={i} className="bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex items-center justify-between w-full px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-warm-900 dark:text-warm-100 pr-4">{q}</span>
              <ChevronDown className={cn('w-4 h-4 text-warm-400 transition-transform flex-shrink-0', openIdx === i && 'rotate-180')} />
            </button>
            {openIdx === i && (
              <div className="px-5 pb-4 animate-fade-in">
                <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">{a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 text-center border border-primary/10">
        <h3 className="font-bold text-warm-900 dark:text-warm-100 mb-2">Still need help?</h3>
        <p className="text-sm text-warm-500 mb-4">Our support team is here to help</p>
        <a href="mailto:support@kalaloka.buzz">
          <Button variant="primary" size="sm" icon={<Mail className="w-4 h-4" />}>
            Contact Support
          </Button>
        </a>
      </div>
    </div>
  );
}
