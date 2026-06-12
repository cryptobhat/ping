import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import type { Role, UserStatus } from '@/lib/types';

const ROLES: Role[] = ['admin', 'creator', 'reviewer'];
const STATUSES: UserStatus[] = ['active', 'inactive'];

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { email, role, status, languages, categoryIds } = await request.json();
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    if (!ROLES.includes(role) || !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid role or status' }, { status: 400 });
    }

    const normalizedLanguages = Array.isArray(languages)
      ? Array.from(new Set(languages.filter((language): language is string =>
          typeof language === 'string' && language.trim().length > 0
        ).map((language) => language.trim())))
      : [];
    const normalizedCategoryIds = Array.isArray(categoryIds)
      ? Array.from(new Set(categoryIds.filter((id): id is string =>
          typeof id === 'string' && id.length > 0
        )))
      : [];

    if (role === 'creator' && normalizedCategoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one category for the creator' },
        { status: 400 }
      );
    }

    let creatorCategories: { id: string; language: string }[] = [];
    if (role === 'creator') {
      const { data, error } = await auth.admin
        .from('categories')
        .select('id, language')
        .in('id', normalizedCategoryIds)
        .eq('status', 'active');

      if (error || !data || data.length !== normalizedCategoryIds.length) {
        return NextResponse.json(
          { error: 'One or more selected categories are invalid or inactive' },
          { status: 400 }
        );
      }
      creatorCategories = data;
    }

    const languagesToAssign = role === 'creator'
      ? Array.from(new Set(creatorCategories.map(category => category.language)))
      : role === 'reviewer'
        ? normalizedLanguages
        : [];

    const { error: insertError } = await auth.admin.from('users').insert({
      email: normalizedEmail,
      role,
      status,
      name: null
    });

    if (insertError) {
      const statusCode = insertError.code === '23505' ? 409 : 500;
      const message = insertError.code === '23505'
        ? 'A user with this email already exists'
        : 'Failed to create user';
      return NextResponse.json({ error: message }, { status: statusCode });
    }

    const rollbackUser = async () => {
      await auth.admin
        .from('creator_category_assignments')
        .delete()
        .eq('creator_email', normalizedEmail);
      await auth.admin
        .from('user_language_assignments')
        .delete()
        .eq('user_email', normalizedEmail);
      await auth.admin.from('users').delete().eq('email', normalizedEmail);
    };

    if (languagesToAssign.length > 0) {
      const { error: languageError } = await auth.admin
        .from('user_language_assignments')
        .insert(languagesToAssign.map((language) => ({
          user_email: normalizedEmail,
          language
        })));

      if (languageError) {
        await rollbackUser();
        return NextResponse.json(
          { error: 'Failed to assign languages; user creation was rolled back' },
          { status: 500 }
        );
      }
    }

    if (role === 'creator') {
      const { error: categoryError } = await auth.admin
        .from('creator_category_assignments')
        .insert(normalizedCategoryIds.map((categoryId) => ({
          creator_email: normalizedEmail,
          category_id: categoryId
        })));

      if (categoryError) {
        await rollbackUser();
        return NextResponse.json(
          { error: 'Failed to assign categories; user creation was rolled back' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId, status } = await request.json();
  if (!userId || !STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid user update' }, { status: 400 });
  }

  const { error } = await auth.admin
    .from('users')
    .update({ status })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
