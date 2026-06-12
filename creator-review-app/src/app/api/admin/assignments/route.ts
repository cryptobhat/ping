import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { creatorEmail, categoryId } = await request.json();
  if (!creatorEmail || !categoryId) {
    return NextResponse.json({ error: 'Creator and category are required' }, { status: 400 });
  }

  const [{ data: creator }, { data: category }] = await Promise.all([
    auth.admin
      .from('users')
      .select('email')
      .eq('email', creatorEmail)
      .eq('role', 'creator')
      .eq('status', 'active')
      .single(),
    auth.admin
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('status', 'active')
      .single()
  ]);

  if (!creator || !category) {
    return NextResponse.json({ error: 'Creator or category is not active' }, { status: 400 });
  }

  const { error } = await auth.admin.from('creator_category_assignments').insert({
    creator_email: creatorEmail,
    category_id: categoryId
  });

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    const message = error.code === '23505'
      ? 'This creator is already assigned to this category'
      : 'Failed to create assignment';
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ success: true });
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
    .from('creator_category_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
