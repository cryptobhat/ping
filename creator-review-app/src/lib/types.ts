export type Role = 'admin' | 'creator' | 'reviewer';
export type UserStatus = 'active' | 'inactive';
export type SubmissionStatus = 'pending' | 'accepted' | 'rejected' | 'drive_failed';
export type ContentType = 'poster' | 'video' | 'both';
export type CategoryStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  status: UserStatus;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  language: string;
  content_type: ContentType;
  status: CategoryStatus;
  created_at: string;
}

export interface CreatorCategoryAssignment {
  id: string;
  creator_email: string;
  category_id: string;
  category?: Category;
  created_at: string;
}

export interface UserLanguageAssignment {
  id: string;
  user_email: string;
  language: string;
  created_at: string;
}

export interface Submission {
  id: string;
  creator_email: string;
  category_id: string;
  title: string | null;
  file_url: string;
  file_path: string;
  file_type: string | null;
  status: SubmissionStatus;
  rejection_reason: string | null;
  reviewer_email: string | null;
  google_drive_file_id: string | null;
  google_drive_folder_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  drive_synced_at: string | null;
}

export interface SubmissionWithCategory extends Submission {
  category: Category | null;
}
