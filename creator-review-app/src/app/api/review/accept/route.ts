import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildDriveFolderPath, uploadFileToDrive } from '@/lib/google-drive';

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

    const { submissionId } = await request.json();
    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    // Fetch submission with category
    const { data: submission, error: fetchError } = await admin
      .from('submissions')
      .select('*, category:categories(*)')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (!['pending', 'drive_failed'].includes(submission.status)) {
      return NextResponse.json({ error: 'Submission cannot be processed' }, { status: 400 });
    }

    const { data: languageAssignments } = await admin
      .from('user_language_assignments')
      .select('language')
      .eq('user_email', user.email!);

    if (
      languageAssignments?.length &&
      !languageAssignments.some((item) => item.language === submission.category?.language)
    ) {
      return NextResponse.json({ error: 'Not authorized for this language' }, { status: 403 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await admin.storage
      .from('creator-submissions')
      .download(submission.file_path);

    if (downloadError || !fileData) {
      // Mark as drive_failed if we can't download
      await admin
        .from('submissions')
        .update({
          status: 'drive_failed',
          reviewer_email: user.email!,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);
      return NextResponse.json(
        { error: 'Failed to download file from storage' },
        { status: 500 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Build Drive folder path
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const language = submission.category?.language || 'Uncategorized';
    const categoryName = submission.category?.name || 'Uncategorized';
    const contentType = submission.category?.content_type || 'other';

    try {
      const folderId = await buildDriveFolderPath(
        language,
        submission.creator_email,
        categoryName,
        contentType,
        date
      );

      // Extract filename from file_path
      const fileName = submission.file_path.split('/').pop() || 'file';
      const mimeType = submission.file_type || 'application/octet-stream';

      // Upload to Google Drive
      const driveFileId = await uploadFileToDrive(
        fileBuffer,
        fileName,
        mimeType,
        folderId
      );

      // Update submission record
      const now = new Date().toISOString();
      const { error: updateError } = await admin
        .from('submissions')
        .update({
          status: 'accepted',
          reviewer_email: user.email!,
          google_drive_file_id: driveFileId,
          google_drive_folder_id: folderId,
          reviewed_at: now,
          drive_synced_at: now,
        })
        .eq('id', submissionId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update submission record' },
          { status: 500 }
        );
      }

      await admin.storage
        .from('creator-submissions')
        .remove([submission.file_path]);

      return NextResponse.json({ success: true, driveFileId, folderId });
    } catch (driveError: any) {
      // Mark as drive_failed
      await admin
        .from('submissions')
        .update({
          status: 'drive_failed',
          reviewer_email: user.email!,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      return NextResponse.json(
        { error: `Google Drive upload failed: ${driveError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
