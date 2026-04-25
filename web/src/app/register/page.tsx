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
import { t } from '@/lib/copy';

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

// Interest options keyed for localisation. Emoji + locale-aware labels.
const INTEREST_OPTIONS: Array<{ key: string; emoji: string; label: Record<'kn' | 'hi' | 'en', string> }> = [
  { key: 'stories',     emoji: '📖', label: { kn: 'ಕಥೆಗಳು',     hi: 'कहानियाँ',  en: 'Stories' } },
  { key: 'poetry',      emoji: '🪶', label: { kn: 'ಕವನ',        hi: 'कविता',     en: 'Poetry' } },
  { key: 'articles',    emoji: '📰', label: { kn: 'ಲೇಖನಗಳು',    hi: 'लेख',        en: 'Articles' } },
  { key: 'romance',     emoji: '💕', label: { kn: 'ಪ್ರೇಮ',      hi: 'रोमांस',     en: 'Romance' } },
  { key: 'mystery',     emoji: '🔮', label: { kn: 'ರಹಸ್ಯ',      hi: 'रहस्य',      en: 'Mystery' } },
  { key: 'humor',       emoji: '😂', label: { kn: 'ಹಾಸ್ಯ',      hi: 'हास्य',     en: 'Humor' } },
  { key: 'travel',      emoji: '🌍', label: { kn: 'ಪ್ರವಾಸ',    hi: 'यात्रा',     en: 'Travel' } },
  { key: 'motivation',  emoji: '💡', label: { kn: 'ಪ್ರೇರಣೆ',   hi: 'प्रेरणा',   en: 'Motivation' } },
  { key: 'spirituality',emoji: '🧘', label: { kn: 'ಆಧ್ಯಾತ್ಮ',  hi: 'आध्यात्म',  en: 'Spirituality' } },
  { key: 'education',   emoji: '📚', label: { kn: 'ಶಿಕ್ಷಣ',    hi: 'शिक्षा',     en: 'Education' } },
  { key: 'drama',       emoji: '🎭', label: { kn: 'ನಾಟಕ',     hi: 'नाटक',      en: 'Drama' } },
  { key: 'family',      emoji: '🏠', label: { kn: 'ಕುಟುಂಬ',   hi: 'परिवार',    en: 'Family' } },
  { key: 'action',      emoji: '⚔️', label: { kn: 'ಕ್ರಿಯೆ',    hi: 'एक्शन',     en: 'Action' } },
  { key: 'horror',      emoji: '🌙', label: { kn: 'ಭಯ',       hi: 'हॉरर',     en: 'Horror' } },
  { key: 'art',         emoji: '🎨', label: { kn: 'ಕಲೆ',       hi: 'कला',        en: 'Art' } },
];

export default function RegisterPage() {
  const router = useRouter();
  const { fetchUser, initialize } = useAuthStore();
  const [langGate, setLangGate] = useState(false);
  const [lang, setLang] = useState('en');
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

  // Inline error state — keyed by step so we can clear when user types.
  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    const code = getReadingLang();
    if (!code) {
      router.replace('/welcome?next=/register');
      return;
    }
    setLang(code || 'en');
    setLangGate(true);
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.upload(file);
      setProfileImage(data.url || data.data?.url);
      toast.success(t('registerPhotoUploaded', lang));
    } catch {
      toast.error(t('registerPhotoFailed', lang));
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
    // Step 1 — name required.
    if (step === 1) {
      if (!name.trim()) {
        const msg = t('registerNameRequired', lang);
        setNameError(msg);
        // Toast as a fallback for users on small screens / with the field scrolled out of view.
        toast.error(msg);
        return;
      }
      setNameError('');
    }
    // Step 2 — username required + min length.
    if (step === 2) {
      if (!username.trim()) {
        const msg = t('registerUsernameRequired', lang);
        setUsernameError(msg);
        toast.error(msg);
        return;
      }
      if (username.length < 3) {
        const msg = t('registerUsernameTooShort', lang);
        setUsernameError(msg);
        toast.error(msg);
        return;
      }
      setUsernameError('');
    }
    setStep(step + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Token should already be set from login page
      const hasToken = !!localStorage.getItem('token');
      if (!hasToken) {
        toast.error(t('registerSessionExpired', lang));
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
      toast.success(t('registerWelcome', lang));
      router.push('/');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || '';
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired')) {
        toast.error(t('registerSessionExpired', lang));
        sessionStorage.removeItem('signup_phone');
        sessionStorage.removeItem('signup_otp');
        router.push('/login');
        return;
      }
      toast.error(msg || t('registerSaveFailed', lang));
    } finally {
      setSaving(false);
    }
  };

  if (!langGate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-950 text-warm-500 text-sm px-6 text-center">
        {t('registerSettingUp', lang)}
      </div>
    );
  }

  const stepLabel = t('registerStepCount', lang)
    .replace('{n}', String(step))
    .replace('{total}', String(totalSteps));

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-1.5 mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={stepLabel}>
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              role="img"
              aria-label={`${t('registerStepCount', lang).replace('{n}', String(i + 1)).replace('{total}', String(totalSteps))}${i + 1 === step ? ' (current)' : i + 1 < step ? ' (completed)' : ''}`}
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
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">{t('registerStep1Title', lang)}</h1>
              <p className="text-sm text-warm-500">{t('registerStep1Sub', lang)}</p>
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
                  aria-label={t('registerPhotoUploaded', lang)}
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
              <label htmlFor="register-name" className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                {t('registerNameLabel', lang)}
              </label>
              <div className={cn(
                'flex items-center gap-3 border rounded-xl px-4 py-3.5 bg-white dark:bg-warm-900 focus-within:ring-2 transition-all',
                nameError
                  ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
                  : 'border-warm-200 dark:border-warm-700 focus-within:border-primary focus-within:ring-primary/10'
              )}>
                <User className="w-5 h-5 text-warm-400" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
                  placeholder={t('registerNamePlaceholder', lang)}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'register-name-error' : undefined}
                  className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 outline-none text-sm placeholder:text-warm-400"
                  autoFocus
                  maxLength={50}
                />
              </div>
              {nameError && (
                <p id="register-name-error" role="alert" className="text-sm text-red-600 mt-1">{nameError}</p>
              )}
            </div>

            <Button onClick={handleNext} className="w-full" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              {t('registerContinue', lang)}
            </Button>
          </div>
        )}

        {/* Step 2: Username & Bio */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">{t('registerChooseIdentity', lang)}</h1>
              <p className="text-sm text-warm-500">{t('registerChooseIdentitySub', lang)}</p>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label htmlFor="register-username" className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">{t('registerUsernameLabel', lang)}</label>
              <div className={cn(
                'flex items-center gap-3 border rounded-xl px-4 py-3.5 bg-white dark:bg-warm-900 focus-within:ring-2 transition-all',
                usernameError
                  ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/10'
                  : 'border-warm-200 dark:border-warm-700 focus-within:border-primary focus-within:ring-primary/10'
              )}>
                <AtSign className="w-5 h-5 text-warm-400" />
                <input
                  id="register-username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); if (usernameError) setUsernameError(''); }}
                  placeholder={t('registerUsernamePlaceholder', lang)}
                  aria-invalid={!!usernameError}
                  aria-describedby={usernameError ? 'register-username-error' : 'register-username-hint'}
                  className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 outline-none text-sm placeholder:text-warm-400"
                  autoFocus
                  maxLength={30}
                />
              </div>
              {usernameError ? (
                <p id="register-username-error" role="alert" className="text-sm text-red-600 mt-1">{usernameError}</p>
              ) : (
                <p id="register-username-hint" className="text-[10px] text-warm-400 mt-1">{t('registerUsernameHint', lang)}</p>
              )}
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label htmlFor="register-bio" className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">
                {t('registerBioLabel', lang)} <span className="text-warm-400 font-normal">{t('registerOptional', lang)}</span>
              </label>
              <div className="border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3 bg-white dark:bg-warm-900 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <textarea
                  id="register-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('registerBioPlaceholder', lang)}
                  rows={3}
                  maxLength={200}
                  className="w-full bg-transparent text-warm-900 dark:text-warm-100 outline-none text-sm placeholder:text-warm-400 resize-none"
                />
              </div>
              <p className="text-[10px] text-warm-400 text-right mt-1">{bio.length}/200</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>{t('registerBack', lang)}</Button>
              <Button onClick={handleNext} className="flex-1" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                {t('registerContinue', lang)}
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
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">{t('registerPhoneTitle', lang)}</h1>
              <p className="text-sm text-warm-500">{t('registerPhoneSub', lang)}</p>
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
                  placeholder={t('registerPhonePlaceholder', lang)}
                  className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 text-sm outline-none placeholder:text-warm-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>{t('registerBack', lang)}</Button>
              <Button onClick={handleNext} className="flex-1" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                {phone.length === 10 ? t('registerSendCode', lang) : t('registerSkip', lang)}
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
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">{t('registerChooseLanguage', lang)}</h1>
              <p className="text-sm text-warm-500">{t('registerLangSub', lang)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {languages.map((langOpt) => (
                <button
                  key={langOpt.code}
                  onClick={() => setLanguage(langOpt.code)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left',
                    language === langOpt.code
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-warm-200 dark:border-warm-700 hover:border-warm-300 bg-white dark:bg-warm-900'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    language === langOpt.code ? 'border-primary' : 'border-warm-300'
                  )}>
                    {language === langOpt.code && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-900 dark:text-warm-100">{langOpt.native}</p>
                    <p className="text-[10px] text-warm-400">{langOpt.name}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>{t('registerBack', lang)}</Button>
              <Button onClick={handleNext} className="flex-1" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                {t('registerContinue', lang)}
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
              <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">{t('registerWhatDoYouEnjoy', lang)}</h1>
              <p className="text-sm text-warm-500">{t('registerInterestsHelp', lang)}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {INTEREST_OPTIONS.map((opt) => {
                const localeKey = (['kn', 'hi', 'en'] as const).includes(lang as any)
                  ? (lang as 'kn' | 'hi' | 'en')
                  : 'en';
                const localised = `${opt.emoji} ${opt.label[localeKey]}`;
                const selected = selectedInterests.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleInterest(opt.key)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                      selected
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 bg-white dark:bg-warm-900 hover:border-warm-300'
                    )}
                  >
                    {selected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                    {localised}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs text-warm-400 mb-4">{selectedInterests.length}{t('registerInterestsCounterMax', lang)}</p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(4)} icon={<ArrowLeft className="w-4 h-4" />}>{t('registerBack', lang)}</Button>
              <Button onClick={handleFinish} loading={saving} className="flex-1" size="lg" icon={<Sparkles className="w-4 h-4" />}>
                {t('registerStartExploring', lang)}
              </Button>
            </div>

            <button onClick={handleFinish} className="w-full text-center text-sm text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 mt-3">
              {t('registerSkip', lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
