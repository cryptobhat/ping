'use client';

import { create } from 'zustand';
import { userApi } from '@/lib/api';

interface User {
  id: string;
  phone?: string;
  email?: string;
  username: string;
  name: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  isVerified: boolean;
  isPremium: boolean;
  role: string;
  coins: number;
  pens: number;
  walletBalance: number;
  followersCount: number;
  followingCount: number;
  contentCount: number;
  language: string;
  createdAt: string;
  isCreatorEligible?: boolean;
  creatorPriceINR?: number;
}

/** Map API fields so UI always has `pens` / `coins` even when API sends *Balance. */
function normalizeUser(raw: Record<string, unknown> | null | undefined): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const pens =
    typeof raw.pens === 'number'
      ? raw.pens
      : typeof raw.pensBalance === 'number'
        ? raw.pensBalance
        : 0;
  const coins =
    typeof raw.coins === 'number'
      ? raw.coins
      : typeof raw.coinsBalance === 'number'
        ? raw.coinsBalance
        : 0;
  const walletBalance = typeof raw.walletBalance === 'number' ? raw.walletBalance : 0;
  // Map _count to flat fields
  const _count = (raw._count || {}) as Record<string, number>;
  const followersCount = typeof raw.followersCount === 'number' ? raw.followersCount : (_count.followers ?? 0);
  const followingCount = typeof raw.followingCount === 'number' ? raw.followingCount : (_count.following ?? 0);
  const contentCount = typeof raw.contentCount === 'number' ? raw.contentCount : (_count.content ?? 0);
  return { ...(raw as unknown as User), pens, coins, walletBalance, followersCount, followingCount, contentCount };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await userApi.getMe();
      const raw = data.data || data;
      const user = normalizeUser(raw);
      if (!user) {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      set({ user, isAuthenticated: true, isLoading: false });
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        void import('posthog-js').then((ph) => {
          ph.default.identify(user.id, { username: user.username, name: user.name });
        });
      }
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    const normalized = normalizeUser(user as unknown as Record<string, unknown>) || user;
    set({ user: normalized, isAuthenticated: true, isLoading: false });
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      void import('posthog-js').then((ph) => {
        ph.default.identify(normalized.id, { username: normalized.username, name: normalized.name });
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      void import('posthog-js').then((ph) => ph.default.reset());
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await userApi.getMe();
      const raw = data.data || data;
      const user = normalizeUser(raw);
      set({ user });
    } catch {}
  },
}));
