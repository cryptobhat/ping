'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Settings, User, Edit, Globe, Moon, Sun, Bell, Wallet, Star,
  Gift, HelpCircle, Info, MessageSquare, LogOut, ChevronRight, Trash2, Shield,
  Lock, Eye, Palette, Languages, CreditCard, Coins, Award, Mail, Crown, Users, CheckCircle, XCircle,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { languageLabel } from '@/lib/reading-lang';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { creatorApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface SettingsItemProps {
  icon: any;
  label: string;
  description?: string;
  href?: string;
  color?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({ icon: Icon, label, description, href, color = 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400', onClick, right, danger }: SettingsItemProps) {
  const content = (
    <div className={cn(
      'flex items-center gap-3.5 px-4 py-3.5 min-h-[56px] transition-colors',
      danger ? 'hover:bg-red-50 dark:hover:bg-red-950/20' : 'hover:bg-warm-50 dark:hover:bg-warm-800/50'
    )}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <span className={cn('text-sm font-medium block', danger ? 'text-red-600' : 'text-warm-800 dark:text-warm-200')}>
          {label}
        </span>
        {description && (
          <span className="text-[11px] text-warm-400 block mt-0.5">{description}</span>
        )}
      </div>
      {right || <ChevronRight className="w-4 h-4 text-warm-300 flex-shrink-0" />}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return <button onClick={onClick} className="w-full text-left">{content}</button>;
}

// Settings navigation sections for the sidebar
const settingsSections = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'preferences', label: 'Preferences', icon: Palette },
  { key: 'monetization', label: 'Monetization', icon: Wallet },
  { key: 'creator', label: 'Creator', icon: Crown },
  { key: 'privacy', label: 'Privacy & Security', icon: Shield },
  { key: 'support', label: 'Support', icon: HelpCircle },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('account');
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const [eligibility, setEligibility] = useState<any>(null);
  const [creatorPrice, setCreatorPrice] = useState<string>('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    creatorApi.checkEligibility().then(({ data }) => {
      const e = data?.data ?? data;
      setEligibility(e);
      if (e?.currentPriceINR) setCreatorPrice(String(e.currentPriceINR));
    }).catch(() => {});
    creatorApi.getSubscribers({ limit: 1 }).then(({ data }) => {
      setSubscriberCount(data?.pagination?.total ?? 0);
    }).catch(() => {});
  }, [user]);

  const handleSaveCreatorPrice = async () => {
    const price = parseInt(creatorPrice, 10);
    if (!price || price < 10 || price > 500) {
      toast.error('Price must be between 10 and 500 INR');
      return;
    }
    setSavingPrice(true);
    try {
      await creatorApi.setPrice(price);
      toast.success('Creator price updated!');
      setEligibility((e: any) => ({ ...e, currentPriceINR: price }));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update price');
    } finally {
      setSavingPrice(false);
    }
  };

  const joinedDate = user?.createdAt ? `Member since ${formatDate(user.createdAt)}` : 'Sign in to sync your account';
  const phoneLabel = user?.phone || user?.email || 'Not signed in';

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left Sidebar - Navigation */}
        <div className="lg:w-72 flex-shrink-0 space-y-4">
          {/* Profile Card */}
          <Link href={user ? '/profile' : '/login'}>
            <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 hover:border-primary/20 transition-all">
              <Avatar src={user?.profileImage} name={user?.name || 'Guest'} size="lg" border />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-warm-900 dark:text-warm-100 truncate">{user?.name || 'Guest'}</h3>
                <p className="text-xs text-warm-500 truncate">{user?.username ? `@${user.username}` : 'Tap to sign in'}</p>
                <p className="text-[10px] text-warm-400 mt-0.5">{joinedDate}</p>
              </div>
            </div>
          </Link>

          {/* Mobile: horizontal scrollable tabs */}
          <div className="lg:hidden flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {settingsSections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                  activeSection === key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-white dark:bg-warm-900 text-warm-600 dark:text-warm-400 border border-warm-100 dark:border-warm-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Desktop: vertical nav */}
          <div className="hidden lg:block bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden">
            {settingsSections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  activeSection === key
                    ? 'bg-primary/[0.08] text-primary border-l-2 border-primary'
                    : 'text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800/50 border-l-2 border-transparent'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden">
            <SettingsItem
              icon={LogOut}
              label="Log Out"
              description="Sign out of your account"
              onClick={() => {
                logout();
                router.push('/login');
              }}
              danger
              color="bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            />
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {/* Account */}
          {activeSection === 'account' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">Account Settings</h2>
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 divide-y divide-warm-100 dark:divide-warm-800 overflow-hidden">
                <SettingsItem icon={Edit} label="Edit Profile" description="Update your name, bio, and photo" href="/settings/edit-profile" color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
                <SettingsItem icon={User} label="Change Username" description="Update your unique username" href="/settings/username" color="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" />
                <SettingsItem icon={Mail} label="Phone" description={phoneLabel} color="bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" />
                <SettingsItem
                  icon={Globe}
                  label="Language"
                  description={user?.language ? languageLabel(user.language) : 'Set in app welcome'}
                  href="/welcome"
                  color="bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
                />
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeSection === 'preferences' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">Preferences</h2>
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 divide-y divide-warm-100 dark:divide-warm-800 overflow-hidden">
                <SettingsItem
                  icon={isDark ? Moon : Sun}
                  label={isDark ? 'Dark Mode' : 'Light Mode'}
                  description="Toggle between light and dark themes"
                  onClick={toggleTheme}
                  color={isDark ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}
                  right={
                    <div className={cn('w-11 h-6 rounded-full transition-colors flex items-center px-0.5', isDark ? 'bg-primary' : 'bg-warm-300')}>
                      <div className={cn('w-5 h-5 bg-white rounded-full shadow-sm transition-transform', isDark && 'translate-x-5')} />
                    </div>
                  }
                />
                <SettingsItem icon={Bell} label="Notifications" description="Manage push and email notifications" href="/settings/notifications" color="bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400" />
                <SettingsItem icon={Eye} label="Reading Preferences" description="Font size, line height, themes" color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
              </div>

            </div>
          )}

          {/* Monetization */}
          {activeSection === 'monetization' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">Monetization</h2>
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-warm-500 mb-1">Wallet Balance</p>
                    <p className="text-2xl font-bold text-warm-900 dark:text-warm-100">
                      {user?.coins != null ? `${user.coins} Points` : '—'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 divide-y divide-warm-100 dark:divide-warm-800 overflow-hidden">
                <SettingsItem icon={Wallet} label="Wallet" description="Add money, transaction history" href="/wallet" color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
                <SettingsItem icon={Star} label="Subscription" description="Manage your premium plan" href="/subscription" color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" />
                <SettingsItem icon={CreditCard} label="Earnings" description="Track your writing income" href="/earnings" color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
                <SettingsItem icon={Gift} label="Refer & Earn" description="Invite friends, earn rewards" href="/referral" color="bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400" />
              </div>
            </div>
          )}

          {/* Creator */}
          {activeSection === 'creator' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">Creator Subscriptions</h2>
              <p className="text-sm text-warm-500">Offer paid subscriptions so readers can access your members-only content.</p>

              {/* Eligibility Status */}
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-5">
                <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-3">Eligibility</h3>
                {eligibility ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-warm-400" />
                        <span className="text-sm text-warm-600 dark:text-warm-400">Total Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-warm-900 dark:text-warm-100">
                          {(eligibility.totalViews || 0).toLocaleString()} / {(eligibility.requiredViews || 1000000).toLocaleString()}
                        </span>
                        {eligibility.totalViews >= (eligibility.requiredViews || 1000000)
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-warm-300" />
                        }
                      </div>
                    </div>
                    <div className="w-full h-2 bg-warm-100 dark:bg-warm-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((eligibility.totalViews || 0) / (eligibility.requiredViews || 1000000)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-warm-400" />
                        <span className="text-sm text-warm-600 dark:text-warm-400">Followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-warm-900 dark:text-warm-100">
                          {(eligibility.followers || 0).toLocaleString()} / {(eligibility.requiredFollowers || 1000).toLocaleString()}
                        </span>
                        {eligibility.followers >= (eligibility.requiredFollowers || 1000)
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-warm-300" />
                        }
                      </div>
                    </div>
                    <div className="w-full h-2 bg-warm-100 dark:bg-warm-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((eligibility.followers || 0) / (eligibility.requiredFollowers || 1000)) * 100)}%` }}
                      />
                    </div>
                    <div className="pt-2 border-t border-warm-100 dark:border-warm-800">
                      {eligibility.eligible ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-semibold">You are eligible for creator subscriptions!</span>
                        </div>
                      ) : (
                        <p className="text-sm text-warm-500">Keep writing! You need 1M views and 1K followers to unlock creator subscriptions.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="skeleton h-24 rounded-xl" />
                )}
              </div>

              {/* Pricing (only if eligible) */}
              {eligibility?.eligible && (
                <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-5">
                  <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100 mb-3">Monthly Price</h3>
                  <p className="text-xs text-warm-500 mb-4">Set your monthly subscription price. Readers pay this to access your members-only content. You receive 80% (platform keeps 20%).</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 flex-1 bg-warm-50 dark:bg-warm-800 rounded-xl px-4 py-2.5 border border-warm-200 dark:border-warm-700 focus-within:border-primary">
                      <span className="text-sm font-semibold text-warm-500">{'\u20B9'}</span>
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={creatorPrice}
                        onChange={(e) => setCreatorPrice(e.target.value)}
                        placeholder="e.g. 49"
                        className="flex-1 bg-transparent text-sm outline-none text-warm-900 dark:text-warm-100 placeholder:text-warm-400"
                      />
                      <span className="text-xs text-warm-400">/month</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveCreatorPrice}
                      disabled={savingPrice}
                    >
                      {savingPrice ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  <p className="text-[11px] text-warm-400 mt-2">Allowed range: {'\u20B9'}10 to {'\u20B9'}500</p>
                </div>
              )}

              {/* Stats */}
              {eligibility?.eligible && (
                <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-semibold text-warm-900 dark:text-warm-100">Your Subscribers</h3>
                  </div>
                  <p className="text-3xl font-bold text-warm-900 dark:text-warm-50">{subscriberCount}</p>
                  <p className="text-xs text-warm-500 mt-1">
                    {eligibility.currentPriceINR
                      ? `Current price: \u20B9${eligibility.currentPriceINR}/month`
                      : 'Set a price above to start accepting subscribers'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Privacy */}
          {activeSection === 'privacy' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">Account</h2>
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 divide-y divide-warm-100 dark:divide-warm-800 overflow-hidden">
                <SettingsItem icon={Shield} label="Login via OTP" description="Your account is secured with phone OTP — no password needed" color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
                <SettingsItem icon={Eye} label="Blocked Content" description="Content types you've hidden from your feed" href="/settings/blocked" color="bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" />
                <SettingsItem icon={Lock} label="Privacy Policy" description="How we handle your data" href="/privacy" color="bg-warm-100 text-warm-600 dark:bg-warm-800 dark:text-warm-400" />
              </div>
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-red-200 dark:border-red-900/30 overflow-hidden">
                <SettingsItem icon={Trash2} label="Delete Account" description="Permanently delete your account and data" onClick={() => alert('To delete your account, please email support@kalaloka.buzz from your registered phone number.')} danger color="bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" />
              </div>
            </div>
          )}

          {/* Support */}
          {activeSection === 'support' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">Support</h2>
              <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 divide-y divide-warm-100 dark:divide-warm-800 overflow-hidden">
                <SettingsItem icon={HelpCircle} label="Help & FAQ" description="Find answers to common questions" href="/help" color="bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" />
                <SettingsItem icon={Info} label="About" description="Learn about Kalaloka" href="/about" color="bg-warm-100 text-warm-600 dark:bg-warm-800 dark:text-warm-400" />
                <SettingsItem icon={MessageSquare} label="Rate Us" description="Share your feedback" href="/rate" color="bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400" />
                <SettingsItem icon={Mail} label="Contact Support" description="support@kalaloka.buzz" color="bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" />
              </div>
              <p className="text-center text-[11px] text-warm-400 pt-2">Kalaloka v1.0.0</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
