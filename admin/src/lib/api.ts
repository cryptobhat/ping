const API_BASE = '/api/proxy';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  // Check via a lightweight flag — actual auth is cookie-based (httpOnly)
  return document.cookie.includes('admin_logged_in=1') || sessionStorage.getItem('admin_logged_in') === '1';
}

function setLoggedIn() {
  sessionStorage.setItem('admin_logged_in', '1');
}

function clearLoggedIn() {
  sessionStorage.removeItem('admin_logged_in');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (res.status === 401) {
    clearLoggedIn();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError('Unauthorized', 401);
  }

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json.message || 'Request failed', res.status);
  }

  return json;
}

// Auth — these go directly to Next.js API routes (not proxy)
export const auth = {
  sendOtp: async (phone: string) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.message || 'Failed to send OTP', res.status);
    return data;
  },

  login: async (phone: string, otp: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.message || 'Login failed', res.status);
    setLoggedIn();
    return data;
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Best effort
    }
    clearLoggedIn();
  },

  checkSession: async () => {
    const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!res.ok) {
      clearLoggedIn();
      return null;
    }
    setLoggedIn();
    const data = await res.json();
    return data.data;
  },
};

// Admin endpoints
export const admin = {
  // Analytics
  getAnalytics: () =>
    request<{ success: boolean; data: any }>('/admin/analytics/overview'),

  // Users
  getUsers: (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return request<{ success: boolean; data: any[]; pagination: any }>(`/admin/users?${params}`);
  },
  createUser: (data: { phone: string; name: string; username: string }) =>
    request<{ success: boolean; data: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
  verifyUser: (id: string, isVerified: boolean) =>
    request<{ success: boolean; data: any }>(`/admin/users/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ isVerified }),
    }),
  setCreatorEligibility: (id: string, isCreatorEligible: boolean) =>
    request<{ success: boolean; data: any }>(`/admin/users/${id}/creator-eligibility`, {
      method: 'PUT',
      body: JSON.stringify({ isCreatorEligible }),
    }),
  getDuplicateIPs: () =>
    request<{ success: boolean; data: any[] }>('/admin/users/duplicate-ips'),

  // Content
  getContent: (page = 1, limit = 20, contentType?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (contentType) params.set('contentType', contentType);
    return request<{ success: boolean; data: any[]; pagination: any }>(`/admin/content?${params}`);
  },
  updateContent: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/admin/content/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteContent: (id: string) =>
    request<{ success: boolean }>(`/admin/content/${id}`, { method: 'DELETE' }),
  featureContent: (id: string, featured: boolean) =>
    request<{ success: boolean; data: any }>(`/admin/content/${id}/feature`, {
      method: 'PUT',
      body: JSON.stringify({ featured }),
    }),
  setPremiumContent: (id: string, isPremium: boolean) =>
    request<{ success: boolean; data: any }>(`/admin/content/${id}/premium`, {
      method: 'PUT',
      body: JSON.stringify({ isPremium }),
    }),

  // Categories
  getCategories: () =>
    request<{ success: boolean; data: any[] }>('/admin/categories'),
  createCategory: (data: { name: string; slug: string; description?: string | null; iconUrl?: string | null; parentId?: string | null; sortOrder?: number; isActive?: boolean }) =>
    request<{ success: boolean; data: any }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Competitions
  getCompetitions: (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return request<{ success: boolean; data: any[]; pagination: any }>(`/v1/competitions?${params}`);
  },
  createCompetition: (data: any) =>
    request<{ success: boolean; data: any }>('/v1/competitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadImage: async (file: File, type: string = 'cover') => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/v1/upload/image?type=${type}`, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json;
  },

  // Pricing / Subscriptions
  getPricing: () =>
    request<{ success: boolean; data: any }>('/admin/pricing'),
  createSubscriptionPlan: (data: { name: string; description?: string; price: number; durationDays: number; isActive?: boolean }) =>
    request<{ success: boolean; data: any }>('/admin/pricing/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePricing: (planId: string, price: number) =>
    request<{ success: boolean; data: any }>('/admin/pricing/subscriptions', {
      method: 'PUT',
      body: JSON.stringify({ planId, price }),
    }),
  updateSubscriptionPlan: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/admin/pricing/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSubscriptionPlan: (id: string) =>
    request<{ success: boolean }>(`/admin/pricing/subscriptions/${id}`, { method: 'DELETE' }),
  toggleSubscriptionPlan: (id: string) =>
    request<{ success: boolean; data: any }>(`/admin/pricing/subscriptions/${id}/toggle`, {
      method: 'PUT',
    }),

  // Notifications
  broadcastNotification: (data: { title: string; body: string; target: string }) =>
    request<{ success: boolean; data: any }>('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Series
  getSeries: (page = 1, limit = 50) =>
    request<{ success: boolean; data: any[]; pagination?: any }>(`/v1/series?page=${page}&limit=${limit}`),
  getSeriesById: (id: string) =>
    request<{ success: boolean; data: any }>(`/v1/series/${id}`),
  toggleSeriesPremium: (id: string, isPremium: boolean) =>
    request<{ success: boolean; data: any }>(`/admin/content/${id}/premium`, {
      method: 'PUT',
      body: JSON.stringify({ isPremium }),
    }),

  // Ads
  getAdConfigs: () =>
    request<{ success: boolean; data: any[] }>('/admin/ads'),
  updateAdConfig: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/admin/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  reports: {
    list: (page = 1, limit = 25, status?: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) params.set('status', status);
      return request<{ success: boolean; data: any[]; pagination: any }>(`/v1/reports?${params}`);
    },
    resolve: (reportId: string, status: string) =>
      request<{ success: boolean; data: any }>(`/v1/reports/${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  siteCopy: {
    get: () =>
      request<{ success: boolean; data: { bundles: any[]; defaultPageKeys: string[] } }>('/admin/site-copy'),
    upsert: (pageKey: string, language: string, strings: Record<string, string>) =>
      request<{ success: boolean; data: any }>('/admin/site-copy', {
        method: 'PUT',
        body: JSON.stringify({ pageKey, language, strings }),
      }),
  },

  // Settings
  getSettings: () =>
    request<{ success: boolean; data: Record<string, string> }>('/admin/settings'),
  updateSettings: (data: Record<string, string>) =>
    request<{ success: boolean; data: Record<string, string>; message: string }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  payouts: {
    list: (page = 1, limit = 20, status = 'pending') => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), status });
      return request<{ success: boolean; data: any[]; pagination: any }>(`/admin/payouts?${params}`);
    },
    stats: () =>
      request<{ success: boolean; data: { pending: number; completed: number; rejected: number; totalPaidINR: number } }>('/admin/payouts/stats'),
    action: (id: string, action: 'approve' | 'reject', rejectionReason?: string) =>
      request<{ success: boolean; data: any; message: string }>(`/admin/payouts/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, rejectionReason }),
      }),
  },

  // Daily Topic
  getDailyTopic: () =>
    request<{ success: boolean; data: { topic: string; topicKn: string; description: string; date: string } }>('/admin/daily-topic'),
  setDailyTopic: (data: { topic: string; topicKn?: string; description?: string; date?: string }) =>
    request<{ success: boolean; data: any; message: string }>('/admin/daily-topic', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Banners
  getBanners: () =>
    request<{ success: boolean; data: any[] }>('/admin/banners'),
  createBanner: (data: any) =>
    request<{ success: boolean; data: any }>('/admin/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBanner: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBanner: (id: string) =>
    request<{ success: boolean }>(`/admin/banners/${id}`, { method: 'DELETE' }),

  // Languages
  getEnabledLanguages: () =>
    request<{ success: boolean; data: string[] }>('/admin/languages'),
  setEnabledLanguages: (languages: string[]) =>
    request<{ success: boolean; data: string[]; message: string }>('/admin/languages', {
      method: 'PUT',
      body: JSON.stringify({ languages }),
    }),

  gifts: {
    list: () => request<{ success: boolean; data: any[] }>('/admin/gifts'),
    create: (body: Record<string, unknown>) =>
      request<{ success: boolean; data: any }>('/admin/gifts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Record<string, unknown>) =>
      request<{ success: boolean; data: any }>(`/admin/gifts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/admin/gifts/${id}`, { method: 'DELETE' }),
  },

  // Rewards / Economy
  getEconomyConfig: () =>
    request<{ success: boolean; data: any }>('/admin/settings'),
  getRewardOverview: () =>
    request<{ success: boolean; data: any }>('/admin/analytics/overview'),

  // Wallet overview
  wallets: {
    list: (page = 1, limit = 20, search?: string) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      return request<{ success: boolean; data: any[]; pagination: any }>(`/admin/users?${params}`);
    },
  },

  // Notifications
  notifications: {
    broadcast: (data: { title: string; body: string; target: string }) =>
      request<{ success: boolean; data: any }>('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
