import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { categoryId, title, fileUrl, filePath, fileType } = await request.json();
    if (!categoryId || !fileUrl || !filePath || !fileType) {
      return NextResponse.json({ error: 'Missing required submission fields' }, { status: 400 });
    }

    const admin = createAdminClient();
    const removeUploadedFile = async () => {
      if (typeof filePath === 'string' && filePath.startsWith(`${user.email}/`)) {
        await admin.storage.from('creator-submissions').remove([filePath]);
      }
    };
    const { data: userRecord } = await admin
      .from('users')
      .select('role, status')
      .eq('email', user.email)
      .single();

    if (!userRecord || userRecord.role !== 'creator' || userRecord.status !== 'active') {
      await removeUploadedFile();
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { data: assignment } = await admin
      .from('creator_category_assignments')
      .select('category:categories(id, language, content_type, status)')
      .eq('creator_email', user.email)
      .eq('category_id', categoryId)
      .single();

    const category = Array.isArray(assignment?.category)
      ? assignment.category[0]
      : assignment?.category;

    if (!category || category.status !== 'active') {
      await removeUploadedFile();
      return NextResponse.json({ error: 'Category is not assigned or active' }, { status: 403 });
    }

    const { data: languageAssignments } = await admin
      .from('user_language_assignments')
      .select('language')
      .eq('user_email', user.email);

    if (
      languageAssignments?.length &&
      !languageAssignments.some((item) => item.language === category.language)
    ) {
      await removeUploadedFile();
      return NextResponse.json({ error: 'Category language is not assigned' }, { status: 403 });
    }

    const isImage = IMAGE_TYPES.includes(fileType);
    const isVideo = VIDEO_TYPES.includes(fileType);
    const matchesCategory =
      (category.content_type === 'poster' && isImage) ||
      (category.content_type === 'video' && isVideo) ||
      (category.content_type === 'both' && (isImage || isVideo));

    if (!matchesCategory) {
      await removeUploadedFile();
      return NextResponse.json(
        { error: `File type does not match the ${category.content_type} category` },
        { status: 400 }
      );
    }

    const { error } = await admin.from('submissions').insert({
      creator_email: user.email,
      category_id: categoryId,
      title: typeof title === 'string' && title.trim() ? title.trim() : null,
      file_url: fileUrl,
      file_path: filePath,
      file_type: fileType,
      status: 'pending'
    });

    if (error) {
      await removeUploadedFile();
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
