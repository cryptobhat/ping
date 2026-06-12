const fs = require('fs');
const path = require('path');

const [, , keyFilePath, folderUrlOrId] = process.argv;
const folderOnly = keyFilePath === '--folder-only';

if (!keyFilePath || (folderOnly && !folderUrlOrId)) {
  console.error(
    'Usage: node scripts/configure-google-drive.js <service-account.json> [folder-url-or-id]\n' +
    '   or: node scripts/configure-google-drive.js --folder-only <folder-url-or-id>'
  );
  process.exit(1);
}

const credentials = folderOnly
  ? null
  : JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));

if (credentials && (!credentials.client_email || !credentials.private_key)) {
  throw new Error('The provided file is not a valid Google service-account key.');
}

function extractFolderId(value) {
  if (!value) return null;

  const folderUrlMatch = value.match(/drive\.google\.com\/drive(?:\/u\/\d+)?\/folders\/([A-Za-z0-9_-]+)/);
  if (folderUrlMatch) return folderUrlMatch[1];

  if (/^[A-Za-z0-9_-]{10,}$/.test(value)) return value;

  throw new Error('Invalid Google Drive folder URL or folder ID.');
}

const envPath = path.resolve(process.cwd(), '.env.local');
const envContents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const folderId = extractFolderId(folderUrlOrId);

const updates = {
  ...(credentials ? {
    GOOGLE_CLIENT_EMAIL: credentials.client_email,
    GOOGLE_PRIVATE_KEY: credentials.private_key.replace(/\n/g, '\\n')
  } : {}),
  ...(folderId ? { GOOGLE_DRIVE_ROOT_FOLDER_ID: folderId } : {})
};

let nextEnv = envContents;

for (const [key, value] of Object.entries(updates)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  nextEnv = pattern.test(nextEnv)
    ? nextEnv.replace(pattern, line)
    : `${nextEnv.replace(/\s*$/, '')}\n${line}\n`;
}

fs.writeFileSync(envPath, nextEnv);

console.log(`Configured ${Object.keys(updates).join(', ')} in .env.local`);
