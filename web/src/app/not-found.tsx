import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-warm-400 dark:text-warm-500" />
        </div>
        <h1 className="text-6xl font-black text-warm-200 dark:text-warm-700 mb-2">404</h1>
        <h2 className="text-xl font-bold text-warm-900 dark:text-warm-100 mb-2">Page not found</h2>
        <p className="text-warm-500 mb-8 text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/discover"
            className="px-5 py-2.5 bg-warm-100 dark:bg-warm-800 text-warm-700 dark:text-warm-300 rounded-xl text-sm font-semibold hover:bg-warm-200 dark:hover:bg-warm-700 transition-colors"
          >
            Discover stories
          </Link>
        </div>
      </div>
    </div>
  );
}
