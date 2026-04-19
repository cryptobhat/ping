import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from './client-layout';
import { JsonLd } from '@/components/seo/JsonLd';
import { websiteJsonLd } from '@/lib/seo';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D8B7E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kalaloka" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <JsonLd data={websiteJsonLd()} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased overflow-x-hidden">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
