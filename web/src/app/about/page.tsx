'use client';

import { Sparkles, Heart, Globe, Users, BookOpen, Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="px-4 lg:px-6 py-8 max-w-lg mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-warm-900 dark:text-warm-50">Kalaloka</h1>
        <p className="text-warm-500 text-sm">Write. Read. Connect.</p>
        <p className="text-xs text-warm-400 mt-1">Version 1.0.0</p>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-6 mb-6">
        <p className="text-sm text-warm-600 dark:text-warm-400 leading-relaxed">
          Kalaloka is a creative writing platform built for Indian writers and readers. Express yourself through stories, poems, and articles in 11+ Indian languages. Connect with a community of passionate readers and earn rewards for your creativity.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-8">
        {[
          { icon: Globe, label: '11+ Indian Languages', desc: 'Write and read in your mother tongue' },
          { icon: Users, label: 'Growing Community', desc: 'Connect with writers and readers' },
          { icon: BookOpen, label: 'Rich Reading Experience', desc: 'Customizable themes, fonts, and more' },
          { icon: Heart, label: 'Support Creators', desc: 'Send gifts and coins to your favorite writers' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-3 p-3 bg-white dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-warm-900 dark:text-warm-100">{label}</p>
              <p className="text-xs text-warm-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="text-center text-sm text-warm-500">
        <p className="flex items-center justify-center gap-1.5">
          <Mail className="w-4 h-4" />
          support@kalaloka.buzz
        </p>
        <p className="mt-2 text-xs text-warm-400">Made with love in India</p>
      </div>
    </div>
  );
}
