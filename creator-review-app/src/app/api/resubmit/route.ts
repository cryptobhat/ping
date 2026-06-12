import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { submissionId, title, file_path, file_url, file_type } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: userRecord } = await admin
      .from('users')
      .select('role, status')
      .eq('email', user.email!)
      .single();

    if (!userRecord || userRecord.role !== 'creator' || userRecord.status !== 'active') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: submission, error: fetchError } = await admin
      .from('submissions')
      .select('id, creator_email, status, file_path')
      .eq('id', submissionId)
      .eq('creator_email', user.email!)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'rejected') {
      return NextResponse.json({ error: 'Only rejected submissions can be resubmitted' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      status: 'pending',
      rejection_reason: null,
      reviewer_email: null,
      reviewed_at: null,
    };

    if (title !== null && title !== undefined) {
      updates.title = title || null;
    }

    if (file_path && file_url) {
      updates.file_url = file_url;
      updates.file_path = file_path;
      updates.file_type = file_type || null;
    }

    const { error: updateError } = await admin
      .from('submissions')
      .update(updates)
      .eq('id', submissionId);

    if (updateError) {
      if (file_path) {
        await admin.storage.from('creator-submissions').remove([file_path]);
      }
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    if (file_path && submission.file_path !== file_path) {
      await admin.storage
        .from('creator-submissions')
        .remove([submission.file_path]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
