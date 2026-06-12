import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Navbar } from '@/components/Navbar';

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: userRecord } = await admin
    .from('users')
    .select('role, status, email')
    .eq('email', user.email)
    .single();

  if (!userRecord || userRecord.status !== 'active' || userRecord.role !== 'creator') {
    redirect('/access-denied');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="creator" userEmail={userRecord.email} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
