import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: 'Not authenticated', status: 401 as const };
  }

  const admin = createAdminClient();
  const { data: adminRecord } = await admin
    .from('users')
    .select('role, status')
    .eq('email', user.email)
    .single();

  if (!adminRecord || adminRecord.role !== 'admin' || adminRecord.status !== 'active') {
    return { error: 'Not authorized', status: 403 as const };
  }

  return { admin, user };
}
