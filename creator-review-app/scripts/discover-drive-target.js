const { loadEnvConfig } = require('@next/env');
const { google } = require('googleapis');

loadEnvConfig(process.cwd());

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  const drive = google.drive({ version: 'v3', auth });

  const [{ data: sharedDrives }, { data: folders }] = await Promise.all([
    drive.drives.list({ pageSize: 100, fields: 'drives(id,name)' }),
    drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and sharedWithMe=true and trashed=false",
      spaces: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields: 'files(id,name,driveId,parents,webViewLink)'
    })
  ]);

  console.log(JSON.stringify({
    sharedDrives: sharedDrives.drives || [],
    sharedFolders: folders.files || []
  }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
