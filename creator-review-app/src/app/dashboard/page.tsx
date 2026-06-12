import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminClient();

  const { data: userRecord } = await admin
    .from('users')
    .select('role, status')
    .eq('email', user.email)
    .single();

  if (userRecord && userRecord.status !== 'active') {
    redirect('/access-denied');
  }

  if (userRecord) {
    switch (userRecord.role) {
      case 'admin':
        redirect('/admin');
      case 'creator':
        redirect('/creator');
      case 'reviewer':
        redirect('/reviewer');
      default:
        redirect('/access-denied');
    }
  }

  redirect('/access-denied');
}
