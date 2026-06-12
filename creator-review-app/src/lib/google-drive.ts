import { google } from 'googleapis';

function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey
    },
    // The service account is restricted to folders explicitly shared with it.
    scopes: ['https://www.googleapis.com/auth/drive']
  });

  return auth;
}

export async function getOrCreateFolder(
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const escapedFolderName = folderName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const response = await drive.files.list({
    q: `name='${escapedFolderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  const folder = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    },
    fields: 'id'
  });

  return folder.data.id!;
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<string> {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      parents: [folderId]
    },
    media: {
      mimeType,
      body: require('stream').Readable.from(fileBuffer)
    },
    fields: 'id'
  });

  return response.data.id!;
}

export async function buildDriveFolderPath(
  language: string,
  creatorEmail: string,
  categoryName: string,
  contentType: string,
  date: string
): Promise<string> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;

  const languageFolderId = await getOrCreateFolder(rootFolderId, language);
  const creatorFolderId = await getOrCreateFolder(languageFolderId, creatorEmail);
  const categoryFolderId = await getOrCreateFolder(creatorFolderId, categoryName);
  const contentTypeFolderId = await getOrCreateFolder(categoryFolderId, contentType);
  const dateFolderId = await getOrCreateFolder(contentTypeFolderId, date);

  return dateFolderId;
}
