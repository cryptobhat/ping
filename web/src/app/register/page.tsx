'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, uploadApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import {
  Camera, ArrowRight, ArrowLeft, User, AtSign, FileText,
  Globe, Sparkles, Check, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getReadingLang } from '@/lib/reading-lang';

const languages = [
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
];

const interests = [
  '📖 Stories', '🪶 Poetry', '📰 Articles', '💕 Romance', '🔮 Mystery',
  '😂 Humor', '🌍 Travel', '💡 Motivation', '🧘 Spirituality', '📚 Education',
  '🎭 Drama', '🏠 Family', '⚔️ Action', '🌙 Horror', '🎨 Art',
];

export default function RegisterPage() {
  const router = useRouter();
  const { fetchUser, initialize } = useAuthStore();
  const [langGate, setLangGate] = useState(false);
  const [step, setStep] = useState(1); // 1=photo+name, 2=username+bio, 3=phone, 4=language, 5=interests
  const totalSteps = 5;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [language, setLanguage] = useState('kn');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getReadingLang()) {
      router.replace('/welcome?next=/register');
      return;
    }
    setLangGate(true);
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.upload(file);
      setProfileImage(data.url || data.data?.url);
      toast.success('Photo uploaded!');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest].slice(0, 5)
    );
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) return toast.error('Please enter your name');
    if (step === 2 && !username.trim()) return toast.error('Please choose a username');
    if (step === 2 && username.length < 3) return toast.error('Username must be at least 3 characters');
    setStep(step + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Token should already be set from login page
      const hasToken = !!localStorage.getItem('token');
      if (!hasToken) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      // Update profile with name, username, bio, etc.
      await userApi.updateMe({
        name: name.trim(),
        bio: bio.trim() || undefined,
        profileImage: profileImage || undefined,
        language,
        ...(phone.length === 10 ? { phone: `+91${phone}` } : {}),
      });

      // Update username separately (has its own endpoint with uniqueness check)
      if (username.trim()) {
        try {
          await userApi.updateUsername(username.trim());
        } catch (e: any) {
          toast.error(e.response?.data?.message || 'Username may already be taken');
        }
      }

      await initialize();
      toast.success('Welcome to Kalaloka!');
      router.push('/');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || '';
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired')) {
        toast.error('OTP expired. Please login again.');
        sessionStorage.removeItem('signup_phone');
        sessionStorage.removeItem('signup_otp');
        router.push('/login');
        return;
      }
      toast.error(msg || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!langGate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-950 text-warm-500 text-sm px-6 text-center">
        Setting up your experience…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${step} of ${totalSteps}`}>
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              role="img"
              aria-label={`Step ${i + 1}${i + 1 === step ? ' (current)' : i + 1 < step ? ' (completed)' : ''}`}
              aria-current={i + 1 === step ? 'step' : undefined}
              className={cn(
                'h-1 rounded-full flex-1 transition-all duration-500',
                i < step ? 'gradient-primary' : 'bg-warm-200 dark:bg-warm-800'
              )}
            />
          ))}
        </div>

        {/* Step 1: Photo & Name */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">Create your profile</h1>
              <p className="text-sm text-warm-500">Let's start with the basics</p>
            </div>

            {/* Photo Upload */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className={cn(
                  'w-28 h-28 rounded-full overflow-hidden flex items-center justify-center',
                  profileImage ? '' : 'bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-dashed border-primary/30'
                )}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary/40" />
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                What should we call you?
              </label>
              <div className="flex items-center gap-3 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3.5 bg-white dark:bg-warm-900 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <User className="w-5 h-5 text-warm-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 outline-none text-sm placeholder:text-warm-400"
                  autoFocus
                  maxLength={50}
                />
              </div>
            </div>

            <Button onClick={handleNext} className="w-full" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Username & Bio */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">Choose your identity</h1>
              <p className="text-sm text-warm-500">Pick a unique username and tell readers about yourself</p>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">Username</label>
              <div className="flex items-center gap-3 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3.5 bg-white dark:bg-warm-900 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <AtSign className="w-5 h-5 text-warm-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_username"
                  className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 outline-none text-sm placeholder:text-warm-400"
                  autoFocus
                  maxLength={30}
                />
              </div>
              <p className="text-[10px] text-warm-400 mt-1">Letters, numbers, underscores only. This will be your public URL.</p>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                Bio <span className="text-warm-400 font-normal">(optional)</span>
              </label>
              <div className="border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3 bg-white dark:bg-warm-900 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short intro about yourself..."
                  rows={3}
                  maxLength={200}
                  className="w-full bg-transparent text-warm-900 dark:text-warm-100 outline-none text-sm placeholder:text-warm-400 resize-none"
                />
              </div>
              <p className="text-[10px] text-warm-400 text-right mt-1">{bio.length}/200</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
              <Button onClick={handleNext} className="flex-1" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Phone Number */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">Your phone number</h1>
              <p className="text-sm text-warm-500">For account recovery and notifications</p>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <div className="flex items-center gap-2 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3 bg-white dark:bg-warm-900 focus-within:border-primary">
                <span className="text-sm font-medium text-warm-500">+91</span>
                <div className="w-px h-5 bg-warm-200 dark:bg-warm-700" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter phone number"
                  className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 text-sm outline-none placeholder:text-warm-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
              <Button onClick={handleNext} className="flex-1" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                {phone.length === 10 ? 'Send code' : 'Skip for now'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Language */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">Choose your language</h1>
              <p className="text-sm text-warm-500">We'll show content in this language first</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left',
                    language === lang.code
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 bg-white dark:bg-warm-900'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    language === lang.code ? 'border-primary' : 'border-warm-300'
                  )}>
                    {language === lang.code && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-900 dark:text-warm-100">{lang.native}</p>
                    <p className="text-[10px] text-warm-400">{lang.name}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
              <Button onClick={handleNext} className="flex-1" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Interests */}
        {step === 5 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">What do you enjoy?</h1>
              <p className="text-sm text-warm-500">Pick up to 5 interests to personalize your feed</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                    selectedInterests.includes(interest)
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 bg-white dark:bg-warm-900 hover:border-warm-300'
                  )}
                >
                  {selectedInterests.includes(interest) && <Check className="w-3.5 h-3.5 inline mr-1" />}
                  {interest}
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-warm-400 mb-4">{selectedInterests.length}/5 selected</p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(4)} icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
              <Button onClick={handleFinish} loading={saving} className="flex-1" size="lg" icon={<Sparkles className="w-4 h-4" />}>
                Start Exploring
              </Button>
            </div>

            <button onClick={handleFinish} className="w-full text-center text-sm text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 mt-3">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
