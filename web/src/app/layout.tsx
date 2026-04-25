import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ClientLayout } from './client-layout';
import { JsonLd } from '@/components/seo/JsonLd';
import { websiteJsonLd } from '@/lib/seo';
import { getServerReadingLang } from '@/lib/reading-lang.server';

// Self-hosted by Next.js — eliminates the third-party Google Fonts CSS request,
// inlines font-face, and uses font-display: swap for fast text paint.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalaloka.buzz';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Kalaloka - Write. Read. Connect. | Stories, Poems & Articles in Indian Languages',
    template: '%s | Kalaloka',
  },
  description: 'Kalaloka is a multi-language creative writing platform for stories, poems, and articles in 11+ Indian languages. Write in your language, connect with readers worldwide.',
  keywords: [
    'writing platform', 'stories', 'poems', 'articles', 'Indian languages',
    'creative writing', 'Kannada stories', 'Hindi poems', 'Tamil writing',
    'Telugu stories', 'Marathi poems', 'reading app', 'writers community',
    'free stories online', 'poetry platform', 'Indian writers',
  ],
  authors: [{ name: 'Kalaloka', url: SITE_URL }],
  creator: 'Kalaloka',
  publisher: 'DigiYogi',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Kalaloka',
    title: 'Kalaloka - Write. Read. Connect.',
    description: 'Write stories, poems, and articles in 11+ Indian languages. Join a community of passionate writers and readers.',
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kalaloka - Write. Read. Connect.',
    description: 'Write stories, poems, and articles in 11+ Indian languages.',
    images: [`${SITE_URL}/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getServerReadingLang();
  return (
    <html lang={lang} suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Favicon + apple-touch-icon are auto-injected by Next.js metadata
            files at app/icon.tsx and app/apple-icon.tsx. No need for static
            favicon.ico / icon-192.png assets, which would 404 in console. */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D8B7E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kalaloka" />
        <JsonLd data={websiteJsonLd()} />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <ClientLayout>{children}</ClientLayout>
        {/* Service-worker registration: afterInteractive so it does not block FCP/LCP. */}
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }`}
        </Script>
      </body>
    </html>
  );
}
