import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userEmail, language } = await request.json();
  if (!userEmail || !language) {
    return NextResponse.json({ error: 'User and language are required' }, { status: 400 });
  }

  const { data: targetUser } = await auth.admin
    .from('users')
    .select('email')
    .eq('email', userEmail)
    .in('role', ['creator', 'reviewer'])
    .eq('status', 'active')
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: 'User is not an active creator or reviewer' }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from('user_language_assignments')
    .insert({ user_email: userEmail, language })
    .select('*')
    .single();

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: error.code === '23505' ? 'Language is already assigned' : 'Failed to assign language' },
      { status }
    );
  }

  return NextResponse.json({ assignment: data });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { assignmentId } = await request.json();
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment is required' }, { status: 400 });
  }

  const { error } = await auth.admin
    .from('user_language_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove language' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
