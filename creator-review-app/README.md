# Creator Content Upload & Review Platform

Internal MVP for creator content upload, review workflow, and Google Drive sync.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth, Database, Storage)
- Google Drive API
- Vercel Deployment

## Setup Instructions

### 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > Database > Connection string and note the URL and keys
3. Run the SQL migration:
   - Go to SQL Editor in Supabase dashboard
   - Copy the contents of `migrations/001_schema.sql`
   - Run the SQL
4. Enable Google Auth:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add Google Cloud OAuth client ID and secret
   - Set redirect URL to: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
5. Create a Storage bucket:
   - Go to Storage
   - Create a new bucket named `creator-submissions`
   - Set to public (or private with policies)

### 2. Google Cloud Setup

#### Google OAuth (for Supabase Auth)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project or select existing
3. Go to APIs & Services > Credentials
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
6. Note the Client ID and Client Secret → add them to Supabase Auth providers

#### Google Drive API (for accepted content sync)
1. In Google Cloud Console, enable the Google Drive API
2. Go to APIs & Services > Credentials
3. Create a Service Account:
   - Give it a name (e.g., "creator-platform-drive")
   - Assign role: Editor
   - Create and download the JSON key
4. Share the target Google Drive folder with the service account email (as Editor)
5. Note the Drive folder ID from the URL:
   - `https://drive.google.com/drive/folders/FOLDER_ID`
6. Extract the private key from the JSON key file

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Google Drive Service Account
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_google_drive_folder_id
```

Note: The `GOOGLE_PRIVATE_KEY` must include `\n` for newlines. Copy the entire key including BEGIN/END lines.

### 4. Create Your First Admin User

After deploying and visiting the app:
1. Sign in with your Google account
2. You'll see "Access Denied" (expected - not in users table yet)
3. Go to Supabase SQL Editor and run:
   ```sql
   INSERT INTO public.users (email, name, role, status)
   VALUES ('your.email@gmail.com', 'Your Name', 'admin', 'active');
   ```
4. Refresh the app - you should now see the Admin Dashboard

### 5. Run Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000

### 6. Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

### Application Flow

#### Creator Flow
1. Login with Google
2. See assigned categories on dashboard
3. Upload content to a category (goes to Supabase Storage)
4. Track submission status

#### Reviewer Flow
1. Login with Google
2. See pending submissions
3. Review each submission
4. Accept → auto-uploads to Google Drive
5. Reject → requires rejection reason

#### Admin Flow
1. Login with Google
2. Manage users (add/update status)
3. Manage categories
4. Assign categories to creators
5. View counts and overview

### Google Drive Folder Structure
Accepted content is organized as:
```
ROOT_FOLDER/
  └── Language (e.g., Hindi)/
      └── Category Name (e.g., Good Morning)/
          └── Content Type (poster/video)/
              └── YYYY-MM-DD/
                  └── uploaded_file.ext
```

### Database Schema
- **users** - Platform users with roles (admin/creator/reviewer)
- **categories** - Content categories (Good Morning, Devotion, etc.)
- **creator_category_assignments** - Which categories each creator can upload to
- **submissions** - Uploaded content with review status and Drive sync info
- **user_language_assignments** - Maps users to languages for content filtering



### Language-Based Access Control

Creators and reviewers can be restricted to specific languages:
- Admins manage language assignments via the **Admin > Language Access** page
- Creators only see and can upload to categories in their assigned languages
- Reviewers only see submissions from their assigned languages
- Users with no language assignments see all languages (backward compatible)

The `user_language_assignments` table maps users (by email) to languages.

### Important Notes
- Only Google/Gmail sign-in is allowed (enforced via Supabase Auth provider)
- Creators can only upload to assigned categories
- Accepted submissions auto-sync to Google Drive
- Failed Drive uploads are marked as `drive_failed`
- This is an MVP - no notifications, batch operations, or advanced analytics
