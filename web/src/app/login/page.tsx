'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Sparkles, Phone, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getReadingLang,
  stashPostAuthRedirect,
  takePostAuthRedirect,
  clearPostAuthRedirect,
} from '@/lib/reading-lang';

function toIndiaE164(digits10: string): string {
  const d = digits10.replace(/\D/g, '');
  if (d.length !== 10) return '';
  return `+91${d}`;
}

/* ───── Google SVG icon ───── */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [langGate, setLangGate] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [srStatus, setSrStatus] = useState('');
  const googleInitRef = useRef(false);
  const [googleBtnRendered, setGoogleBtnRendered] = useState(false);

  // OTP resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const urlNext = searchParams.get('next');

  useEffect(() => {
    if (!getReadingLang()) {
      if (urlNext && urlNext.startsWith('/') && !urlNext.startsWith('//')) stashPostAuthRedirect(urlNext);
      router.replace('/welcome?next=/login');
      return;
    }
    setLangGate(true);
  }, [router, urlNext]);

  const safeNext = () => {
    const n = searchParams.get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) {
      clearPostAuthRedirect();
      return n;
    }
    return takePostAuthRedirect() || '/';
  };

  /* ───── Google redirect fallback handler (id_token in URL hash) ───── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    const idTokenMatch = hash.match(/id_token=([^&]+)/);
    if (!idTokenMatch) return;

    const idToken = idTokenMatch[1];
    // Clear hash to avoid re-trigger
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    handleGoogleCredential({ credential: idToken });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ───── Facebook OAuth callback handler ───── */
  useEffect(() => {
    const isFbCallback = searchParams.get('fb_callback') === '1';
    if (!isFbCallback || typeof window === 'undefined') return;

    const hash = window.location.hash;
    const match = hash.match(/access_token=([^&]+)/);
    if (!match) return;

    const accessToken = match[1];
    if (!accessToken) return;

    // Clear the hash from URL to avoid re-triggering
    window.history.replaceState(null, '', window.location.pathname + window.location.search.replace(/[?&]fb_callback=1/, ''));

    (async () => {
      setFacebookLoading(true);
      try {
        const { data } = await authApi.facebookAuth(accessToken);
        const result = data.data || data;
        const token = result.token || result.accessToken;

        if (token) {
          localStorage.setItem('token', token);
          if (result.user) setUser(result.user);

          if (result.isNewUser || !result.user?.name || result.user?.name === 'User') {
            toast.success("Let's set up your profile!");
            router.push('/register');
          } else {
            toast.success('Welcome back!');
            router.push(safeNext());
          }
        } else {
          toast.error('Login failed — please try again');
        }
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Facebook sign-in failed');
      } finally {
        setFacebookLoading(false);
      }
    })();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ───── Google Sign-In handler ───── */
  const handleGoogleCredential = useCallback(async (response: any) => {
    const idToken = response.credential;
    if (!idToken) {
      toast.error('Google sign-in failed — no token received');
      return;
    }

    setGoogleLoading(true);
    try {
      const { data } = await authApi.googleAuth(idToken);
      const result = data.data || data;
      const token = result.token || result.accessToken;

      if (token) {
        localStorage.setItem('token', token);
        if (result.user) setUser(result.user);

        if (result.isNewUser || !result.user?.name || result.user?.name === 'User') {
          toast.success("Let's set up your profile!");
          router.push('/register');
        } else {
          toast.success('Welcome back!');
          router.push(safeNext());
        }
      } else {
        toast.error('Login failed — please try again');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }, [router, setUser, searchParams]);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleInitRef.current) return;

    const initGoogle = () => {
      if (!(window as any).google?.accounts) return;
      googleInitRef.current = true;
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // Render the button into our container
      const container = document.getElementById('google-signin-btn');
      if (container) {
        (window as any).google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
        // Check if the iframe rendered after a short delay (fails in some browsers like Opera)
        setTimeout(() => {
          const iframe = container.querySelector('iframe, div[role="button"]');
          if (iframe) {
            setGoogleBtnRendered(true);
          }
        }, 1500);
      }
    };

    if ((window as any).google?.accounts) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [handleGoogleCredential, langGate]);

  // Fallback: trigger Google OAuth popup manually (for browsers where GIS button doesn't render)
  const handleGoogleFallback = () => {
    if (!GOOGLE_CLIENT_ID) return;
    setGoogleLoading(true);

    // Try using the GIS code client (popup mode) as fallback
    const google = (window as any).google;
    if (google?.accounts?.oauth2) {
      const client = google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response: any) => {
          if (response.error) {
            setGoogleLoading(false);
            toast.error('Google sign-in was cancelled');
            return;
          }
          // We get an auth code — but our backend expects an id_token.
          // So instead, use the id token flow via prompt()
          setGoogleLoading(false);
          toast.error('Please try again');
        },
      });
      client.requestCode();
      return;
    }

    // Ultimate fallback: redirect-based OAuth
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const scope = encodeURIComponent('openid email profile');
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${Date.now()}`;
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setSrStatus('Enter a valid 10-digit phone number');
      return toast.error('Enter a valid 10-digit phone number');
    }
    const e164 = toIndiaE164(phone);
    setLoading(true);
    setSrStatus('Sending OTP');
    try {
      await authApi.sendOtp(e164);
      setStep('otp');
      setResendTimer(30);
      setSrStatus('OTP sent');
      toast.success('OTP sent!');
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to send OTP';
      setSrStatus(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setSrStatus('Enter a valid 6-digit OTP');
      return toast.error('Enter a valid 6-digit OTP');
    }
    const e164 = toIndiaE164(phone);
    setLoading(true);
    setSrStatus('Verifying OTP');
    try {
      const { data } = await authApi.verifyOtp(e164, otp);
      const result = data.data || data;

      if (result.isNewUser && !result.token && !result.accessToken) {
        const { data: data2 } = await authApi.verifyOtp(e164, otp, { name: 'User' });
        const result2 = data2.data || data2;
        const token = result2.token || result2.accessToken;
        if (token) {
          localStorage.setItem('token', token);
          if (result2.user) setUser(result2.user);
          toast.success("Let's set up your profile!");
          router.push('/register');
        } else {
          toast.error('Registration failed. Please try again.');
        }
      } else {
        localStorage.setItem('token', result.token || result.accessToken);
        if (result.user) setUser(result.user);
        if (!result.user?.name || result.user?.name === 'User') {
          toast.success("Let's set up your profile!");
          router.push('/register');
        } else {
          toast.success('Welcome back!');
          router.push(safeNext());
        }
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Invalid OTP';
      setSrStatus(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!langGate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-warm-950 text-warm-500 text-sm px-6 text-center">
        Setting up your experience...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Decorative (desktop only) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-primary-dark to-accent relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/[0.03] rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">Kalaloka</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">Your words<br />have power.</h2>
          <p className="text-lg text-white/70 max-w-md">Join thousands of writers sharing stories, poems, and articles in 11+ Indian languages.</p>
          <div className="flex gap-6 mt-10">
            <div className="text-center">
              <p className="text-2xl font-bold">11+</p>
              <p className="text-xs text-white/60">Languages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">50K+</p>
              <p className="text-xs text-white/60">Writers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">1M+</p>
              <p className="text-xs text-white/60">Stories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 bg-white dark:bg-warm-950">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Kalaloka</h1>
          </div>

          <h2 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-1">
            {step === 'phone' ? 'Welcome back' : 'Enter OTP'}
          </h2>
          <p className="text-sm text-warm-500 mb-8">
            {step === 'phone' ? 'Sign in with your phone number' : `We sent a 6-digit code to +91 ${phone}`}
          </p>

          {/* Screen-reader-only live region. Visible toasts handle sighted users;
              this announces OTP send/verify state to assistive tech. */}
          <div role="status" aria-live="polite" className="sr-only">{srStatus}</div>

          {step === 'phone' ? (
            <div className="space-y-4">
              {/* TODO: migrate to <Field><Input /></Field>. The +91 country-code
                  prefix is rendered inside the same border-box as the input, so
                  this requires a custom prefix slot on Input (or wrap with a
                  composed control) before swapping. */}
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">Phone Number</label>
                <div className="flex items-center gap-2 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-warm-50 dark:bg-warm-900">
                  <span className="text-sm text-warm-500 font-medium">+91</span>
                  <div className="w-px h-5 bg-warm-200 dark:bg-warm-700" />
                  <input
                    type="tel"
                    inputMode="tel"
                    pattern="[0-9]{10}"
                    autoComplete="tel-national"
                    aria-label="Phone number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter phone number"
                    className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 text-sm outline-none placeholder:text-warm-400 min-w-0"
                    autoFocus
                  />
                  <Phone className="w-4 h-4 text-warm-400 flex-shrink-0" />
                </div>
              </div>
              <Button onClick={handleSendOtp} loading={loading} className="w-full !py-3" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>

              {/* ─── Divider ─── */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-warm-200 dark:bg-warm-700" />
                <span className="text-xs text-warm-400 font-medium uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-warm-200 dark:bg-warm-700" />
              </div>

              {/* ─── Google Sign-In ─── */}
              {GOOGLE_CLIENT_ID ? (
                <div className="w-full">
                  {/* GIS rendered button (may not appear in Opera/some browsers) */}
                  <div id="google-signin-btn" className="flex justify-center [&>div]:!w-full" />
                  {/* Fallback button shown when GIS button fails to render */}
                  {!googleBtnRendered && (
                    <button
                      onClick={handleGoogleFallback}
                      disabled={googleLoading}
                      className={cn(
                        'w-full flex items-center justify-center gap-3 px-4 py-3 border border-warm-200 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-900 text-warm-700 dark:text-warm-300 text-sm font-medium hover:bg-warm-50 dark:hover:bg-warm-800 transition-all mt-2',
                        googleLoading && 'opacity-70 cursor-wait'
                      )}
                    >
                      <GoogleIcon className="w-5 h-5" />
                      {googleLoading ? 'Signing in...' : 'Continue with Google'}
                    </button>
                  )}
                  {googleLoading && (
                    <p className="text-xs text-warm-400 text-center mt-2 animate-pulse">Signing in with Google...</p>
                  )}
                </div>
              ) : (
                /* Fallback styled button when client ID is not configured */
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-warm-200 dark:border-warm-700 rounded-xl bg-white dark:bg-warm-900 text-warm-500 text-sm font-medium opacity-50 cursor-not-allowed transition-all"
                  title="Google Sign-In will be available soon"
                >
                  <GoogleIcon className="w-5 h-5" />
                  Continue with Google
                </button>
              )}

              {/* ─── Facebook Sign-In ─── */}
              <button
                disabled={facebookLoading}
                onClick={() => {
                  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
                  if (!fbAppId) { toast.error('Facebook login coming soon'); return; }
                  const redirect = encodeURIComponent(`${window.location.origin}/login?fb_callback=1`);
                  window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${fbAppId}&redirect_uri=${redirect}&scope=email,public_profile&response_type=token`;
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-3 px-4 py-3 border border-warm-200 dark:border-warm-700 rounded-xl bg-[var(--brand-facebook)] text-white text-sm font-medium hover:bg-[var(--brand-facebook-hover)] transition-all',
                  facebookLoading && 'opacity-70 cursor-wait'
                )}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                {facebookLoading ? 'Signing in...' : 'Continue with Facebook'}
              </button>
              {facebookLoading && (
                <p className="text-xs text-warm-400 text-center mt-2 animate-pulse">Signing in with Facebook...</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">Verification Code</label>
                <fieldset className="flex gap-2" role="group" aria-label="6-digit verification code">
                  <legend className="sr-only">Enter 6-digit verification code</legend>
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      maxLength={1}
                      value={otp[i] || ''}
                      aria-label={`OTP digit ${i + 1}`}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                        if (pasted) {
                          setOtp(pasted.padEnd(6, '').slice(0, 6));
                          const inputs = e.currentTarget.parentElement?.querySelectorAll('input');
                          const focusIdx = Math.min(pasted.length, 5);
                          (inputs?.[focusIdx] as HTMLInputElement)?.focus();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const arr = Array.from({ length: 6 }, (_, idx) => otp[idx] || '');
                        arr[i] = val.slice(0, 1);
                        setOtp(arr.join(''));
                        if (val && e.target.nextElementSibling) {
                          (e.target.nextElementSibling as HTMLInputElement).focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (otp[i]) {
                            const arr = Array.from({ length: 6 }, (_, idx) => otp[idx] || '');
                            arr[i] = '';
                            setOtp(arr.join(''));
                          } else if (e.currentTarget.previousElementSibling) {
                            const prev = e.currentTarget.previousElementSibling as HTMLInputElement;
                            prev.focus();
                            const arr = Array.from({ length: 6 }, (_, idx) => otp[idx] || '');
                            arr[i - 1] = '';
                            setOtp(arr.join(''));
                          }
                          e.preventDefault();
                        }
                      }}
                      className="w-full aspect-square max-w-[52px] text-center text-lg font-bold border border-warm-200 dark:border-warm-700 rounded-xl bg-warm-50 dark:bg-warm-900 text-warm-900 dark:text-warm-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      autoFocus={i === 0}
                    />
                  ))}
                </fieldset>
              </div>
              <Button onClick={handleVerifyOtp} loading={loading} className="w-full !py-3" size="lg">
                Verify & Sign In
              </Button>

              <div className="flex items-center justify-between mt-3">
                <button onClick={() => { setStep('phone'); setOtp(''); setResendTimer(0); }} className="text-sm text-primary hover:underline min-h-[44px] flex items-center">
                  Change number
                </button>
                {resendTimer > 0 ? (
                  <span className="text-sm text-warm-400 min-h-[44px] flex items-center">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    onClick={async () => {
                      const e164 = toIndiaE164(phone);
                      setSrStatus('Resending OTP');
                      try {
                        await authApi.sendOtp(e164);
                        setResendTimer(30);
                        setSrStatus('OTP resent');
                        toast.success('OTP resent!');
                      } catch {
                        setSrStatus('Failed to resend OTP');
                        toast.error('Failed to resend OTP');
                      }
                    }}
                    className="text-sm text-primary font-medium hover:underline min-h-[44px] flex items-center"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-8 text-xs text-warm-400">
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Your data is secure. We never share your phone number.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-warm-950 text-warm-500 text-sm">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
