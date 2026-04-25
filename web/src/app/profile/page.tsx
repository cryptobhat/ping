import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import ProfileClient from './ProfileClient';

/**
 * /profile is the *current user's* profile — a logged-in only view.
 * The public, indexable version of a writer's profile lives at
 * /user/[username]. We deliberately noindex /profile so search engines
 * never surface a private page that would just send users to /login.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Your profile',
  description: 'Manage your stories, series, and drafts on Kalaloka.',
  url: '/profile',
  noindex: true,
});

export default function ProfilePage() {
  return <ProfileClient />;
}
