'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Upload, ArrowLeft, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function UploadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedTitle, setUploadedTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/creator/categories');
      const result = await response.json();
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Failed to load categories');
      setCategories(result.categories || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError('');

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Invalid file type. Allowed: JPG, PNG, GIF, WebP, MP4, MOV, AVI, WebM');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 100MB');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCategory) { setError('Please select a category'); return; }
    if (!file) { setError('Please select a file'); return; }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const signResponse = await fetch('/api/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          categoryId: selectedCategory
        })
      });
      const signedUpload = await signResponse.json();
      if (!signResponse.ok) {
        throw new Error(signedUpload.error || 'Failed to prepare upload');
      }

      const { error: uploadError } = await supabase.storage
        .from('creator-submissions')
        .uploadToSignedUrl(signedUpload.filePath, signedUpload.token, file, {
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory,
          title,
          fileUrl: signedUpload.publicUrl,
          filePath: signedUpload.filePath,
          fileType: file.type
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create submission');
      }

      setUploadedTitle(title || 'Untitled');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upload Content</h1>
        </div>
        <div className="bg-white rounded-lg border p-8 text-center max-w-lg">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Successful!</h2>
          <p className="text-gray-500 mb-1">Your content &quot;{uploadedTitle}&quot; has been submitted for review.</p>
          <p className="text-sm text-gray-400 mb-6">Reviewers will check your content soon.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/creator/submissions"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              View Submissions
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setTitle('');
                setFile(null);
                setPreviewUrl(null);
                setShowPreview(false);
                setSelectedCategory('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/creator" className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload Content</h1>
        <p className="text-gray-500 mt-1">Submit content for review</p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed p-8 text-center max-w-lg">
          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No Categories Assigned</p>
          <p className="text-gray-400 text-sm">You don&apos;t have any active categories assigned. Contact your administrator.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-lg">
          <div className="bg-white rounded-lg border p-6 space-y-5">
            {/* Category Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">Select a category...</option>
                {categories.map((a: any) => (
                  <option key={a.category_id} value={a.category_id}>
                    {a.category?.name} ({a.category?.language} • {a.category?.content_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your submission"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">File *</label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-indigo-400'
              }`}>
                {file ? (
                  <div>
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(file.size / 1024 / 1024).toFixed(1)} MB • {file.type}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                        setFile(null);
                        setPreviewUrl(null);
                        setShowPreview(false);
                      }}
                      className="mt-3 text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">Images (JPG, PNG, GIF, WebP) • Videos (MP4, MOV, AVI, WebM)</p>
                    <p className="text-xs text-gray-400">Max 100MB</p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept={ALLOWED_TYPES.join(',')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {file && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              )}

              {showPreview && file && previewUrl && (
                <div className="rounded-lg overflow-hidden bg-gray-900 mt-2">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-64 object-contain mx-auto"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      src={previewUrl}
                      controls
                      className="max-w-full max-h-64 mx-auto"
                      preload="metadata"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit for Review
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
