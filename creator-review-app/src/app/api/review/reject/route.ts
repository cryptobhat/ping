import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify reviewer
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const admin = createAdminClient();

    const { data: userRecord } = await admin
      .from('users')
      .select('role, status')
      .eq('email', user.email)
      .single();

    if (!userRecord || userRecord.role !== 'reviewer' || userRecord.status !== 'active') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { submissionId, reason } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Fetch submission
    const { data: submission, error: fetchError } = await admin
      .from('submissions')
      .select('id, status, category:categories(language)')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'pending') {
      return NextResponse.json({ error: 'Submission is not pending' }, { status: 400 });
    }

    const category = Array.isArray(submission.category)
      ? submission.category[0]
      : submission.category;
    const { data: languageAssignments } = await admin
      .from('user_language_assignments')
      .select('language')
      .eq('user_email', user.email!);

    if (
      languageAssignments?.length &&
      !languageAssignments.some((item) => item.language === category?.language)
    ) {
      return NextResponse.json({ error: 'Not authorized for this language' }, { status: 403 });
    }

    // Update submission
    const { error: updateError } = await admin
      .from('submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        reviewer_email: user.email!,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
