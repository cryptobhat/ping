const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');
const { createBrowserClient } = require('@supabase/ssr');
const { google } = require('googleapis');

loadEnvConfig(process.cwd());

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3100';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const runId = `e2e-${Date.now()}`;
const password = `E2E-${Date.now()}-Aa1!`;
const language = `AuditLang-${runId}`;
const extraLanguage = `AuditExtra-${runId}`;
const categoryName = `Audit Category ${runId}`;
const extraCategoryName = `Audit Extra ${runId}`;
const emails = {
  admin: `${runId}-admin@example.com`,
  creator: `${runId}-creator@example.com`,
  reviewer: `${runId}-reviewer@example.com`
};

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const createdAuthIds = [];
let acceptedDriveFileId = null;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  pass(message);
}

async function createAuthUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) throw error;
  createdAuthIds.push(data.user.id);
}

async function createSession(email) {
  const jar = new Map();
  const client = createBrowserClient(supabaseUrl, anonKey, {
    isSingleton: false,
    cookies: {
      getAll() {
        return [...jar.entries()].map(([name, value]) => ({ name, value }));
      },
      setAll(cookies) {
        for (const { name, value } of cookies) {
          if (value) jar.set(name, value);
          else jar.delete(name);
        }
      }
    }
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  assert(Boolean(data.session), `${email} session created`);
  return {
    client,
    cookie: [...jar.entries()]
      .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
      .join('; ')
  };
}

async function request(path, session, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Cookie: session.cookie } : {}),
      ...options.headers
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

async function findCategory(name) {
  const { data, error } = await admin
    .from('categories')
    .select('id, name, language, status')
    .eq('name', name)
    .single();
  if (error) throw error;
  return data;
}

async function cleanupDrive() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  const drive = google.drive({ version: 'v3', auth });
  if (acceptedDriveFileId) {
    await drive.files.delete({ fileId: acceptedDriveFileId, supportsAllDrives: true }).catch(() => {});
  }
  const escaped = language.replace(/'/g, "\\'");
  const { data } = await drive.files.list({
    q: `name='${escaped}' and '${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  for (const folder of data.files || []) {
    await drive.files.delete({ fileId: folder.id, supportsAllDrives: true }).catch(() => {});
  }
}

async function cleanup() {
  await cleanupDrive();
  const { data: submissions } = await admin
    .from('submissions')
    .select('file_path')
    .eq('creator_email', emails.creator);
  if (submissions?.length) {
    await admin.storage
      .from('creator-submissions')
      .remove(submissions.map(item => item.file_path));
  }
  await admin.from('submissions').delete().eq('creator_email', emails.creator);
  await admin.from('creator_category_assignments').delete().eq('creator_email', emails.creator);
  await admin.from('user_language_assignments').delete().in('user_email', Object.values(emails));
  await admin.from('categories').delete().in('name', [categoryName, extraCategoryName]);
  await admin.from('users').delete().in('email', Object.values(emails));
  for (const id of createdAuthIds) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
}

async function main() {
  try {
    await createAuthUser(emails.admin);
    const { error: adminUserError } = await admin.from('users').insert({
      email: emails.admin,
      name: 'E2E Admin',
      role: 'admin',
      status: 'active'
    });
    if (adminUserError) throw adminUserError;
    const adminSession = await createSession(emails.admin);

    const unauthApi = await request('/api/admin/categories', null, {
      method: 'POST',
      body: JSON.stringify({})
    });
    assert(unauthApi.response.status === 401, 'unauthenticated API returns JSON 401');

    for (const payload of [
      { name: categoryName, language, contentType: 'poster' },
      { name: extraCategoryName, language: extraLanguage, contentType: 'video' }
    ]) {
      const result = await request('/api/admin/categories', adminSession, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      assert(result.response.status === 200, `admin creates category ${payload.name}`);
    }
    const category = await findCategory(categoryName);
    const extraCategory = await findCategory(extraCategoryName);

    const creatorCreate = await request('/api/admin/users', adminSession, {
      method: 'POST',
      body: JSON.stringify({
        email: emails.creator,
        role: 'creator',
        status: 'active',
        categoryIds: [category.id],
        languages: []
      })
    });
    assert(creatorCreate.response.status === 200, 'admin creates creator with category and automatic language');

    const reviewerCreate = await request('/api/admin/users', adminSession, {
      method: 'POST',
      body: JSON.stringify({
        email: emails.reviewer,
        role: 'reviewer',
        status: 'active',
        categoryIds: [],
        languages: [language, extraLanguage]
      })
    });
    assert(reviewerCreate.response.status === 200, 'admin creates reviewer with language access');

    await createAuthUser(emails.creator);
    await createAuthUser(emails.reviewer);
    const creatorSession = await createSession(emails.creator);
    const reviewerSession = await createSession(emails.reviewer);

    const creatorAssignments = await admin
      .from('creator_category_assignments')
      .select('id, category_id')
      .eq('creator_email', emails.creator);
    assert(creatorAssignments.data?.length === 1, 'creator category assignment persisted');
    const creatorLanguages = await admin
      .from('user_language_assignments')
      .select('language')
      .eq('user_email', emails.creator);
    assert(
      creatorLanguages.data?.some(item => item.language === language),
      'creator language derived from category'
    );

    const duplicateAssignment = await request('/api/admin/assignments', adminSession, {
      method: 'POST',
      body: JSON.stringify({ creatorEmail: emails.creator, categoryId: category.id })
    });
    assert(duplicateAssignment.response.status === 409, 'duplicate category assignment is rejected');

    const extraAssignment = await request('/api/admin/assignments', adminSession, {
      method: 'POST',
      body: JSON.stringify({ creatorEmail: emails.creator, categoryId: extraCategory.id })
    });
    assert(extraAssignment.response.status === 200, 'admin adds category assignment');
    const { data: extraAssignmentRow } = await admin
      .from('creator_category_assignments')
      .select('id')
      .eq('creator_email', emails.creator)
      .eq('category_id', extraCategory.id)
      .single();
    const deleteAssignment = await request('/api/admin/assignments', adminSession, {
      method: 'DELETE',
      body: JSON.stringify({ assignmentId: extraAssignmentRow.id })
    });
    assert(deleteAssignment.response.status === 200, 'admin removes category assignment');

    const duplicateLanguage = await request('/api/admin/languages', adminSession, {
      method: 'POST',
      body: JSON.stringify({ userEmail: emails.reviewer, language })
    });
    assert(duplicateLanguage.response.status === 409, 'duplicate language assignment is rejected');

    const categoryInactive = await request('/api/admin/categories', adminSession, {
      method: 'PATCH',
      body: JSON.stringify({ categoryId: category.id, status: 'inactive' })
    });
    assert(categoryInactive.response.status === 200, 'admin deactivates category');
    const categoryActive = await request('/api/admin/categories', adminSession, {
      method: 'PATCH',
      body: JSON.stringify({ categoryId: category.id, status: 'active' })
    });
    assert(categoryActive.response.status === 200, 'admin reactivates category');

    const { data: creatorUser } = await admin
      .from('users')
      .select('id')
      .eq('email', emails.creator)
      .single();
    const userInactive = await request('/api/admin/users', adminSession, {
      method: 'PATCH',
      body: JSON.stringify({ userId: creatorUser.id, status: 'inactive' })
    });
    assert(userInactive.response.status === 200, 'admin deactivates user');
    const userActive = await request('/api/admin/users', adminSession, {
      method: 'PATCH',
      body: JSON.stringify({ userId: creatorUser.id, status: 'active' })
    });
    assert(userActive.response.status === 200, 'admin reactivates user');

    const categoriesResponse = await request('/api/creator/categories', creatorSession);
    assert(
      categoriesResponse.response.status === 200 &&
      categoriesResponse.body.categories.some(item => item.category_id === category.id),
      'creator receives assigned active categories'
    );

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==',
      'base64'
    );
    const signUpload = await request('/api/uploads/sign', creatorSession, {
      method: 'POST',
      body: JSON.stringify({
        fileName: 'audit.png',
        fileType: 'image/png',
        fileSize: png.length,
        categoryId: category.id
      })
    });
    assert(signUpload.response.status === 200, 'creator receives signed upload token');
    const uploadResult = await creatorSession.client.storage
      .from('creator-submissions')
      .uploadToSignedUrl(signUpload.body.filePath, signUpload.body.token, png, {
        contentType: 'image/png'
      });
    assert(!uploadResult.error, 'creator uploads file with signed token');

    const createSubmission = await request('/api/submissions', creatorSession, {
      method: 'POST',
      body: JSON.stringify({
        categoryId: category.id,
        title: `Audit Submission ${runId}`,
        fileUrl: signUpload.body.publicUrl,
        filePath: signUpload.body.filePath,
        fileType: 'image/png'
      })
    });
    assert(createSubmission.response.status === 200, 'creator submits uploaded content');
    const { data: submission } = await admin
      .from('submissions')
      .select('id, status')
      .eq('creator_email', emails.creator)
      .single();
    assert(submission.status === 'pending', 'submission starts pending');

    const creatorPage = await request('/creator/submissions', creatorSession);
    assert(
      creatorPage.response.status === 200 && creatorPage.body.includes(`Audit Submission ${runId}`),
      'creator submissions page renders live data'
    );
    const adminPage = await request('/admin/users', adminSession);
    assert(
      adminPage.response.status === 200 && adminPage.body.includes(emails.creator),
      'admin users page renders newly created creator'
    );

    const reject = await request('/api/review/reject', reviewerSession, {
      method: 'POST',
      body: JSON.stringify({ submissionId: submission.id, reason: 'E2E correction required' })
    });
    assert(reject.response.status === 200, 'reviewer rejects submission');
    const { data: rejected } = await admin
      .from('submissions')
      .select('status, rejection_reason')
      .eq('id', submission.id)
      .single();
    assert(rejected.status === 'rejected', 'rejected status persisted');

    const resubmit = await request('/api/resubmit', creatorSession, {
      method: 'POST',
      body: JSON.stringify({
        submissionId: submission.id,
        title: `Corrected Audit Submission ${runId}`,
        file_path: null,
        file_url: null,
        file_type: null
      })
    });
    assert(resubmit.response.status === 200, 'creator resubmits rejected submission');
    const { data: resubmitted } = await admin
      .from('submissions')
      .select('status, title')
      .eq('id', submission.id)
      .single();
    assert(resubmitted.status === 'pending', 'resubmission returns to pending');

    const accept = await request('/api/review/accept', reviewerSession, {
      method: 'POST',
      body: JSON.stringify({ submissionId: submission.id })
    });
    assert(accept.response.status === 200, `reviewer accepts and syncs to Drive: ${accept.body?.error || ''}`);
    acceptedDriveFileId = accept.body.driveFileId;
    const { data: accepted } = await admin
      .from('submissions')
      .select('status, google_drive_file_id, drive_synced_at')
      .eq('id', submission.id)
      .single();
    assert(
      accepted.status === 'accepted' && Boolean(accepted.google_drive_file_id),
      'accepted submission stores Drive metadata'
    );
    const { error: downloadedAfterAccept } = await admin.storage
      .from('creator-submissions')
      .download(signUpload.body.filePath);
    assert(Boolean(downloadedAfterAccept), 'accepted source file is removed from Supabase storage');

    console.log('E2E_RESULT=PASS');
  } finally {
    await cleanup();
  }
}

main().catch(error => {
  console.error(`E2E_RESULT=FAIL: ${error.message}`);
  process.exitCode = 1;
});
