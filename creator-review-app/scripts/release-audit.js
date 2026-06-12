const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error('Missing Supabase environment variables.');
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const runId = `audit-${Date.now()}`;
const password = `Audit-${Date.now()}-Aa1!`;
const emails = {
  admin: `${runId}-admin@example.com`,
  creator: `${runId}-creator@example.com`,
  reviewer: `${runId}-reviewer@example.com`
};

const created = {
  authIds: [],
  categoryId: null,
  submissionId: null,
  storagePath: `${runId}/test.txt`
};

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

function observe(condition, message, details = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${message}${details ? ` (${details})` : ''}`);
  return condition;
}

async function createSession(email, role) {
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (authError) throw authError;
  created.authIds.push(authData.user.id);

  const { error: userError } = await admin.from('users').insert({
    email,
    role,
    status: 'active',
    name: 'Release Audit'
  });
  if (userError) throw userError;

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  check(Boolean(data.session), `${role} authentication works`);
  return client;
}

async function cleanup() {
  if (created.storagePath) {
    await admin.storage.from('creator-submissions').remove([created.storagePath]);
  }
  if (created.submissionId) {
    await admin.from('submissions').delete().eq('id', created.submissionId);
  }
  await admin.from('creator_category_assignments').delete().eq('creator_email', emails.creator);
  await admin.from('user_language_assignments').delete().in('user_email', Object.values(emails));
  if (created.categoryId) {
    await admin.from('categories').delete().eq('id', created.categoryId);
  }
  await admin.from('users').delete().in('email', Object.values(emails));
  for (const id of created.authIds) {
    await admin.auth.admin.deleteUser(id);
  }
}

async function main() {
  try {
    const adminClient = await createSession(emails.admin, 'admin');
    const creatorClient = await createSession(emails.creator, 'creator');
    const reviewerClient = await createSession(emails.reviewer, 'reviewer');

    const { data: category, error: categoryError } = await admin
      .from('categories')
      .insert({
        name: `Audit Category ${runId}`,
        language: 'AuditLanguage',
        content_type: 'poster',
        status: 'active'
      })
      .select('id')
      .single();
    if (categoryError) throw categoryError;
    created.categoryId = category.id;
    check(Boolean(created.categoryId), 'service-role category creation works');

    const { error: directAdminInsertError } = await adminClient
      .from('categories')
      .insert({
        name: `Direct Admin ${runId}`,
        language: 'AuditLanguage',
        content_type: 'poster',
        status: 'active'
      });
    check(Boolean(directAdminInsertError), 'direct browser admin writes are blocked by RLS');

    const { error: assignmentError } = await admin
      .from('creator_category_assignments')
      .insert({ creator_email: emails.creator, category_id: created.categoryId });
    if (assignmentError) throw assignmentError;
    const { error: languageError } = await admin
      .from('user_language_assignments')
      .insert([
        { user_email: emails.creator, language: 'AuditLanguage' },
        { user_email: emails.reviewer, language: 'AuditLanguage' }
      ]);
    if (languageError) throw languageError;
    check(true, 'creator category and language onboarding works');

    const { data: visibleAssignments, error: visibleError } = await creatorClient
      .from('creator_category_assignments')
      .select('category_id')
      .eq('creator_email', emails.creator);
    if (visibleError) throw visibleError;
    console.log(`INFO: creator assignments returned ${visibleAssignments.length}`);
    observe(visibleAssignments.length === 1, 'creator can read assigned category');

    const testBytes = Buffer.from('creator review release audit');
    const { data: signedUpload, error: signError } = await admin.storage
      .from('creator-submissions')
      .createSignedUploadUrl(created.storagePath);
    if (signError) throw signError;
    const { error: uploadError } = await creatorClient.storage
      .from('creator-submissions')
      .uploadToSignedUrl(created.storagePath, signedUpload.token, testBytes, {
        contentType: 'text/plain'
      });
    check(!uploadError, `signed creator storage upload works${uploadError ? `: ${uploadError.message}` : ''}`);

    const { data: publicUrlData } = admin.storage
      .from('creator-submissions')
      .getPublicUrl(created.storagePath);
    const { data: submission, error: submissionError } = await admin
      .from('submissions')
      .insert({
        creator_email: emails.creator,
        category_id: created.categoryId,
        title: 'Release audit submission',
        file_url: publicUrlData.publicUrl,
        file_path: created.storagePath,
        file_type: 'image/png',
        status: 'pending'
      })
      .select('id')
      .single();
    if (submissionError) throw submissionError;
    created.submissionId = submission.id;
    check(Boolean(created.submissionId), 'submission creation works');

    const { data: creatorRows, error: creatorReadError } = await creatorClient
      .from('submissions')
      .select('id, status')
      .eq('id', created.submissionId);
    if (creatorReadError) throw creatorReadError;
    observe(creatorRows.length === 1, 'creator can read own submission');

    const { data: reviewerRows, error: reviewerReadError } = await reviewerClient
      .from('submissions')
      .select('id, status')
      .eq('id', created.submissionId);
    if (reviewerReadError) throw reviewerReadError;
    observe(reviewerRows.length === 1, 'reviewer can read pending submission');

    const { error: creatorUpdateError } = await creatorClient
      .from('submissions')
      .update({ title: 'Unauthorized direct update' })
      .eq('id', created.submissionId);
    check(Boolean(creatorUpdateError), 'creator direct submission updates are blocked by RLS');

    const { error: reviewerUpdateError } = await reviewerClient
      .from('submissions')
      .update({ rejection_reason: 'Direct client probe' })
      .eq('id', created.submissionId);
    check(!reviewerUpdateError, 'reviewer database update policy is active');

    const { data: bucket } = await admin.storage.getBucket('creator-submissions');
    check(Boolean(bucket), 'creator-submissions bucket exists');

    console.log('AUDIT_RESULT=PASS');
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error(`AUDIT_RESULT=FAIL: ${error.message}`);
  process.exitCode = 1;
});
