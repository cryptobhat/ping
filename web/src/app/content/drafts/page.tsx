'use client';

import { redirect } from 'next/navigation';

export default function DraftsPage() {
  redirect('/library?tab=drafts');
}
