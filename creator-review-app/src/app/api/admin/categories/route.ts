import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import type { CategoryStatus, ContentType } from '@/lib/types';

const CONTENT_TYPES: ContentType[] = ['poster', 'video', 'both'];
const STATUSES: CategoryStatus[] = ['active', 'inactive'];

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { name, language, contentType } = await request.json();
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedLanguage = typeof language === 'string' ? language.trim() : '';

  if (!normalizedName || !normalizedLanguage || !CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Invalid category details' }, { status: 400 });
  }

  const { error } = await auth.admin.from('categories').insert({
    name: normalizedName,
    language: normalizedLanguage,
    content_type: contentType,
    status: 'active'
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { categoryId, status } = await request.json();
  if (!categoryId || !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid category update' }, { status: 400 });
  }

  const { error } = await auth.admin
    .from('categories')
    .update({ status })
    .eq('id', categoryId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
