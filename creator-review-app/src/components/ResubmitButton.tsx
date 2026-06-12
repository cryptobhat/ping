'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, Loader2, RefreshCw, Upload, Eye } from 'lucide-react';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface ResubmitButtonProps {
  submissionId: string;
  currentTitle: string | null;
  rejectionReason: string | null;
}

export function ResubmitButton({ submissionId, currentTitle, rejectionReason }: ResubmitButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle || '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setPreviewUrl(URL.createObjectURL(selected));
    setFile(selected);
  };

  const cleanup = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setShowPreview(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let fileUrl: string | null = null;
      let filePath: string | null = null;
      let fileType: string | null = null;

      if (file) {
        const signResponse = await fetch('/api/uploads/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            submissionId
          })
        });
        const signedUpload = await signResponse.json();
        if (!signResponse.ok) {
          throw new Error(signedUpload.error || 'Failed to prepare upload');
        }
        const signedFilePath: string = signedUpload.filePath;
        filePath = signedFilePath;

        const { error: uploadError } = await supabase.storage
          .from('creator-submissions')
          .uploadToSignedUrl(signedFilePath, signedUpload.token, file, {
            contentType: file.type
          });

        if (uploadError) throw uploadError;

        fileUrl = signedUpload.publicUrl;
        fileType = file.type;
      }

      const res = await fetch('/api/resubmit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          title: title || null,
          file_path: filePath,
          file_url: fileUrl,
          file_type: fileType,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Resubmission failed');
      }

      setSuccess(true);
      cleanup();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setError('');
    setTitle(currentTitle || '');
    cleanup();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Correct & Resubmit
      </button>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-lg border border-green-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-700">Resubmitted for review</span>
        </div>
        <p className="text-xs text-gray-400">Refreshing...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-amber-200 p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
        <RefreshCw className="w-4 h-4 text-amber-600" />
        Correct & Resubmit
      </h4>

      {rejectionReason && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
          <span className="font-medium">Rejection reason:</span> {rejectionReason}
        </div>
      )}

      {error && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Replace File (optional - leave empty to keep current file)
          </label>
          <div className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-indigo-400'
          }`}>
            {file ? (
              <div>
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                <button
                  type="button"
                  onClick={cleanup}
                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Click to upload replacement</p>
                <p className="text-xs text-gray-400 mt-0.5">Max 100MB</p>
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
              className="mt-1.5 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
            >
              <Eye className="w-3 h-3" />
              {showPreview ? 'Hide' : 'Preview'}
            </button>
          )}

          {showPreview && file && previewUrl && (
            <div className="mt-1.5 rounded-md overflow-hidden bg-gray-900">
              {file.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-48 object-contain mx-auto" />
              ) : (
                <video src={previewUrl} controls className="max-w-full max-h-48 mx-auto" preload="metadata" />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {loading ? 'Submitting...' : 'Resubmit for Review'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-xs font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
