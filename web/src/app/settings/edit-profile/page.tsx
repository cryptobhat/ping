'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Camera, Save, User, BookOpen, Link2, MapPin, Globe, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { userApi, uploadApi } from '@/lib/api';
import { FallbackImage } from '@/components/ui/FallbackImage';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const allInterests = ['ಕಥೆ', 'ಕವಿತೆ', 'ಪ್ರಬಂಧ', 'ಹಾಸ್ಯ', 'ಪ್ರೇಮ', 'ರಹಸ್ಯ', 'ವಿಜ್ಞಾನ', 'ಇತಿಹಾಸ', 'ಆಧ್ಯಾತ್ಮ', 'ಪ್ರವಾಸ'];

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, fetchUser } = useAuthStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [hasAutoUsername, setHasAutoUsername] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const locTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const profileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?next=/settings/edit-profile');
    }
  }, [authLoading, isAuthenticated, router]);

  // Initialize form from user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setLocation((user as any).location || '');
      setWebsite((user as any).website || '');
      setProfileImage(user.profileImage || '');
      setCoverImage(user.coverImage || '');
      setInterests((user as any).interests || []);
      // Detect auto-generated usernames (patterns: name_NNNN, kavi_NNNN, kavi_xxxxx)
      const uname = user.username || '';
      setHasAutoUsername(
        /^.+_\d{2,4}$/.test(uname) || /^kavi_\w+$/.test(uname) || /^user_\w+$/.test(uname)
      );
    }
  }, [user]);

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    const setter = type === 'profile' ? setProfileImage : setCoverImage;
    const loadingSetter = type === 'profile' ? setUploadingProfile : setUploadingCover;
    loadingSetter(true);
    try {
      const { data } = await uploadApi.upload(file);
      const url = data?.data?.url || data?.url || '';
      if (url) {
        setter(url);
        toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} image uploaded`);
      } else {
        toast.error('Upload failed - no URL returned');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      loadingSetter(false);
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, 'profile');
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, 'cover');
  };

  const validateUsername = (value: string): string => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    if (trimmed.length > 30) return 'Username must be 30 characters or less';
    if (!/^[a-z0-9_]+$/.test(trimmed)) return 'Only lowercase letters, numbers, and underscores';
    if (/^_|_$/.test(trimmed)) return 'Cannot start or end with underscore';
    return '';
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    setUsernameError(validateUsername(sanitized));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Display name is required');
      return;
    }
    if (username !== user?.username) {
      const error = validateUsername(username);
      if (error) {
        toast.error(error);
        return;
      }
    }
    setSaving(true);
    try {
      await userApi.updateMe({
        name: name.trim(),
        ...(username !== user?.username ? { username: username.trim().toLowerCase() } : {}),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        profileImage: profileImage || undefined,
        coverImage: coverImage || undefined,
      });
      toast.success('Profile updated successfully');
      // Refresh user data in store
      await fetchUser();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!authLoading && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-warm-600 dark:text-warm-400" />
          </Link>
          <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Edit Profile</h1>
        </div>
        <Button onClick={handleSave} loading={saving} size="md" icon={<Save className="w-4 h-4" />}>
          Save Changes
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Avatar & Cover */}
        <div className="lg:w-80 flex-shrink-0 space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">Cover Image</label>
            <div className="relative rounded-2xl overflow-hidden border border-warm-200 dark:border-warm-800">
              {coverImage ? (
                <FallbackImage
                  src={coverImage}
                  alt="Cover"
                  className="w-full aspect-[2/1] object-cover"
                  fallbackClassName="w-full aspect-[2/1] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-warm-400"
                  fallbackIcon={Camera}
                  fallbackIconClassName="w-8 h-8 text-warm-400"
                  loading="eager"
                />
              ) : (
                <div className="w-full aspect-[2/1] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-warm-400">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => coverRef.current?.click()}
                  disabled={uploadingCover}
                  className="px-4 py-2 bg-white/90 dark:bg-warm-800/90 rounded-xl text-sm font-medium text-warm-900 dark:text-warm-100 flex items-center gap-2"
                >
                  {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {uploadingCover ? 'Uploading...' : 'Change Cover'}
                </button>
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFileChange} />
            </div>
          </div>

          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">Profile Photo</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar src={profileImage} name={name || 'You'} size="xl" border />
                <button
                  onClick={() => profileRef.current?.click()}
                  disabled={uploadingProfile}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white shadow-lg"
                >
                  {uploadingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={profileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileFileChange} />
              </div>
              <div className="text-sm">
                <p className="text-warm-600 dark:text-warm-400">JPG, PNG or GIF</p>
                <p className="text-[11px] text-warm-400">Max 5MB, square recommended</p>
              </div>
            </div>
          </div>

          {/* Preview card */}
          <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-4">
            <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-widest mb-3">Preview</p>
            <div className="flex items-center gap-3 mb-2">
              <Avatar src={profileImage} name={name} size="md" />
              <div>
                <p className="text-sm font-bold text-warm-900 dark:text-warm-100">{name || 'Your Name'}</p>
                <p className="text-[11px] text-warm-400">@{user?.username || 'username'}</p>
              </div>
            </div>
            <p className="text-xs text-warm-500 leading-relaxed">{bio || 'Your bio will appear here'}</p>
            {location && (
              <p className="text-[11px] text-warm-400 flex items-center gap-1 mt-2">
                <MapPin className="w-3 h-3" /> {location}
              </p>
            )}
          </div>
        </div>

        {/* Right: Form Fields */}
        <div className="flex-1 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="Enter your display name"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            {hasAutoUsername && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                You have an auto-generated username. Choose a unique username that represents you!
              </div>
            )}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-warm-400">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={cn(
                  'w-full pl-8 pr-4 py-3 rounded-xl border bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none focus:ring-2 transition-all',
                  usernameError
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-warm-200 dark:border-warm-700 focus:border-primary focus:ring-primary/10'
                )}
                placeholder="choose_a_username"
                maxLength={30}
              />
            </div>
            {usernameError && (
              <p className="text-xs text-red-500 mt-1">{usernameError}</p>
            )}
            {!usernameError && username.length >= 3 && (
              <p className="text-xs text-warm-400 mt-1">kalaloka.buzz/user/{username}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none transition-all"
              placeholder="Tell others about yourself..."
            />
            <p className="text-xs text-warm-400 text-right mt-1">{bio.length}/200</p>
          </div>

          {/* Location with autocomplete (OpenStreetMap Nominatim - free) */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 z-10" />
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (e.target.value.length >= 3) {
                    clearTimeout(locTimerRef.current);
                    locTimerRef.current = setTimeout(async () => {
                      try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e.target.value)}&countrycodes=in&format=json&limit=6&addressdetails=1`);
                        const data = await res.json();
                        setLocationSuggestions(data.map((d: any) => {
                          const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
                          const state = d.address?.state || '';
                          return city && state ? `${city}, ${state}` : d.display_name?.split(',').slice(0, 2).join(',').trim();
                        }).filter(Boolean));
                      } catch {}
                    }, 400);
                  } else {
                    setLocationSuggestions([]);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="Type your city..."
                autoComplete="off"
              />
              {locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-warm-900 border border-warm-200 dark:border-warm-700 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto">
                  {locationSuggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => { setLocation(s); setLocationSuggestions([]); }} className="w-full text-left px-4 py-2.5 text-sm text-warm-700 dark:text-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-warm-400 flex-shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">Website</label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          {/* Writing Interests */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">Writing Interests</label>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-sm font-medium transition-all border',
                    interests.includes(interest)
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-white dark:bg-warm-900 text-warm-600 dark:text-warm-400 border-warm-200 dark:border-warm-800 hover:border-primary/30'
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Save button (mobile) */}
          <div className="lg:hidden pt-2">
            <Button onClick={handleSave} loading={saving} className="w-full" size="lg" icon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
