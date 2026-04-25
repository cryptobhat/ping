import axios from 'axios';
import { getReadingLang, stashPostAuthRedirect } from '@/lib/reading-lang';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kavi-api.digiyogi.com';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Map an HTTP status to a user-facing English message.
 * Kept in English for now — once the i18n pipeline catches up, route this
 * through `t()` in `lib/copy.ts` and add per-locale variants.
 */
function userMessageForStatus(status: number | undefined): string {
  if (!status) return 'Network issue. Check your connection and try again.';
  if (status === 401) return 'You need to sign in to continue.';
  if (status === 403) return "You don't have access to this.";
  if (status === 404) return "We couldn't find that.";
  if (status === 429) return 'Too many requests — wait a moment and try again.';
  if (status >= 500) return 'Our servers had an issue. Please try again.';
  return 'Something didn’t work. Please try again.';
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Attach a user-facing message so toast/snackbar callers can prefer
    // `error.userMessage` over the raw axios string.
    const status = error?.response?.status;
    if (error && typeof error === 'object') {
      try {
        (error as any).userMessage = userMessageForStatus(status);
      } catch {
        /* ignore */
      }
    }

    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname + window.location.search;
      const onAuthShell =
        path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/welcome');
      if (onAuthShell) {
        window.location.href = '/login';
      } else if (getReadingLang()) {
        window.location.href = `/login?next=${encodeURIComponent(path)}`;
      } else {
        stashPostAuthRedirect(path);
        window.location.href = '/welcome?next=/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string, extra?: { name?: string; username?: string }) =>
    api.post('/auth/verify-otp', { phone, otp, ...extra }),
  googleAuth: (idToken: string) => api.post('/auth/google', { idToken }),
  facebookAuth: (accessToken: string) => api.post('/auth/facebook', { accessToken }),
  refreshToken: () => api.post('/auth/refresh-token'),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  updateUsername: (username: string) => api.put('/users/me/username', { username }),
  getByUsername: (username: string) => api.get(`/users/${username}`),
  getUserContent: (id: string, params?: any) => api.get(`/users/${id}/content`, { params }),
};

export const dailyTopicApi = {
  get: () => api.get('/content/daily-topic'),
};

export const contentApi = {
  create: (data: any) => api.post('/content', data),
  getFeed: (params?: any) => api.get('/content', { params }),
  getById: (id: string) => api.get(`/content/${id}`),
  update: (id: string, data: any) => api.put(`/content/${id}`, data),
  delete: (id: string) => api.delete(`/content/${id}`),
  getDrafts: (params?: any) => api.get('/content/drafts', { params }),
  toggleLike: (id: string) => api.post(`/content/${id}/like`),
  share: (id: string) => api.post(`/content/${id}/share`),
  unlock: (id: string) => api.post(`/content/${id}/unlock`),
  unlockPay: (id: string) => api.post(`/content/${id}/unlock-pay`),
  verifyUnlockPay: (id: string, data: { orderId: string; paymentId: string; signature: string }) =>
    api.post(`/content/${id}/unlock-pay/verify`, data),
};

export const feedApi = {
  forYou: (params?: any) => api.get('/feed/for-you', { params }),
};

export const aiWritingApi = {
  storyTeaser: (contentId: string) => api.post('/ai/writing/story-teaser', { contentId }),
};

export const seriesApi = {
  list: (params?: any) => api.get('/series', { params }),
  getPopular: (params?: any) => api.get('/series/popular', { params }),
  getById: (id: string) => api.get(`/series/${id}`),
  create: (data: any) => api.post('/series', data),
  update: (id: string, data: any) => api.put(`/series/${id}`, data),
  delete: (id: string) => api.delete(`/series/${id}`),
  addItem: (seriesId: string, contentId: string) =>
    api.post(`/series/${seriesId}/items`, { contentId }),
  removeItem: (seriesId: string, contentId: string) =>
    api.delete(`/series/${seriesId}/items/${contentId}`),
  reorderItems: (seriesId: string, itemIds: string[]) =>
    api.put(`/series/${seriesId}/items/reorder`, { itemIds }),
  follow: (id: string) => api.post(`/series/${id}/follow`),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  getContent: (id: string, params?: any) => api.get(`/categories/${id}/content`, { params }),
};

export const commentApi = {
  getComments: (contentId: string, params?: any) => api.get(`/comments/content/${contentId}`, { params }),
  addComment: (contentId: string, data: { body: string; parentId?: string }) =>
    api.post(`/comments/content/${contentId}`, data),
  likeComment: (id: string) => api.post(`/comments/${id}/like`),
  deleteComment: (id: string) => api.delete(`/comments/${id}`),
};

export const bookmarkApi = {
  getAll: (params?: any) => api.get('/bookmarks', { params }),
  add: (contentId: string, body?: { collectionName?: string }) =>
    api.post(`/bookmarks/content/${contentId}`, body ?? {}),
  remove: (contentId: string) => api.delete(`/bookmarks/content/${contentId}`),
};

export const favoriteApi = {
  getAll: (params?: any) => api.get('/favorites', { params }),
  add: (contentId: string) => api.post(`/favorites/content/${contentId}`),
  remove: (contentId: string) => api.delete(`/favorites/content/${contentId}`),
};

export const followApi = {
  follow: (userId: string) => api.post(`/follow/${userId}`),
  unfollow: (userId: string) => api.delete(`/follow/${userId}`),
  getFollowers: (params?: any) => api.get('/follow/followers', { params }),
  getFollowing: (params?: any) => api.get('/follow/following', { params }),
};

export const chatApi = {
  getConversations: () => api.get('/chat'),
  create: (data: any) => api.post('/chat', data),
  getMessages: (id: string, params?: any) => api.get(`/chat/${id}/messages`, { params }),
  sendMessage: (id: string, data: any) => api.post(`/chat/${id}/messages`, data),
  markRead: (id: string) => api.put(`/chat/${id}/read`),
};

export const walletApi = {
  getBalance: () => api.get('/wallet'),
  getTransactions: (params?: any) => api.get('/wallet/transactions', { params }),
  withdraw: (data: { amount: number; description?: string }) => api.post('/wallet/withdraw', data),
};

export const trendingApi = {
  get: (params?: any) => api.get('/trending', { params }),
};

export const hashtagApi = {
  getTrending: () => api.get('/hashtags/trending'),
  getContent: (tag: string, params?: any) => api.get(`/hashtags/${tag}`, { params }),
};

export const notificationApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const searchApi = {
  search: (params: any) => api.get('/content', { params }),
};

export const ratingApi = {
  rate: (authorId: string, data: { rating: number; review?: string; isAnonymous?: boolean }) =>
    api.post(`/ratings/author/${authorId}`, data),
  getAuthorRatings: (userId: string) => api.get(`/ratings/author/${userId}/stats`),
  getTopAuthors: () => api.get('/ratings/top'),
};

export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  getMe: () => api.get('/subscriptions/me'),
};

export const paymentApi = {
  createOrder: (data: { amount: number; type: string; planId?: string; packageId?: string }) =>
    api.post('/payments/create-order', data),
  verify: (data: { orderId: string; paymentId: string; signature: string; type: string; planId?: string; packageId?: string }) =>
    api.post('/payments/verify', data),
};

export const competitionApi = {
  getAll: () => api.get('/competitions'),
  getActive: () => api.get('/competitions/active'),
  getById: (id: string) => api.get(`/competitions/${id}`),
  enter: (id: string, data: any) => api.post(`/competitions/${id}/enter`, data),
};

export const referralApi = {
  getCode: () => api.get('/referrals/code'),
  getStats: () => api.get('/referrals/stats'),
  apply: (code: string) => api.post('/referrals/apply', { referralCode: code }),
};

export const rewardsApi = {
  getStats: () => api.get('/rewards/stats'),
  getAdShareHistory: (params?: { limit?: number }) => api.get('/rewards/ad-share/history', { params }),
  getAdShareProgram: () => api.get('/rewards/ad-share/program'),
  redeemPens: (points: number) => api.post('/rewards/redeem', { points }),
  awardReading: (contentId: string, durationMinutes: number, isCompleted: boolean) =>
    api.post('/rewards/reading', { contentId, durationMinutes, isCompleted }),
};

export const leaderboardApi = {
  getTopWriters: (params?: { limit?: number; language?: string; period?: 'today' | 'week' | 'month' }) =>
    api.get('/leaderboard/writers', { params }),
  getTopEarners: (params?: { limit?: number }) =>
    api.get('/leaderboard/earners', { params }),
  getWeeklyStars: (params?: { limit?: number; language?: string }) =>
    api.get('/leaderboard/weekly', { params }),
  getRisingAuthors: (params?: { limit?: number; language?: string }) =>
    api.get('/leaderboard/rising', { params }),
};

export const reportApi = {
  submit: (body: { contentId: string; reason: string; description?: string }) =>
    api.post('/reports', body),
};

export const creatorApi = {
  checkEligibility: () => api.get('/creator/eligibility'),
  checkUserEligibility: (userId: string) => api.get(`/creator/${userId}/eligibility`),
  setPrice: (priceINR: number) => api.put('/creator/price', { priceINR }),
  getCreatorProfile: (userId: string) => api.get(`/creator/${userId}/profile`),
  subscribe: (creatorId: string) => api.post(`/creator/${creatorId}/subscribe`),
  unsubscribe: (creatorId: string) => api.delete(`/creator/${creatorId}/subscribe`),
  isSubscribed: (creatorId: string) => api.get(`/creator/${creatorId}/subscribed`),
  getSubscribers: (params?: any) => api.get('/creator/subscribers', { params }),
  getMySubscriptions: (params?: any) => api.get('/creator/subscriptions', { params }),
};

export const readingApi = {
  startSession: (contentId: string) => api.post('/reading/session/start', { contentId }),
  endSession: (
    sessionId: string,
    body: {
      durationSeconds: number;
      wordsRead: number;
      scrollPercentage: number;
      isCompleted: boolean;
    }
  ) => api.put(`/reading/session/${sessionId}/end`, body),
  getHistory: (params?: { page?: number; limit?: number }) => api.get('/reading/history', { params }),
};

export const giftApi = {
  getAll: () => api.get('/gifts'),
  send: (data: { receiverId: string; giftId: string; message?: string }) =>
    api.post('/gifts/send', data),
  getReceived: (params?: { page?: number; limit?: number }) => api.get('/gifts/received', { params }),
  getSent: (params?: { page?: number; limit?: number }) => api.get('/gifts/sent', { params }),
};

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const aiApi = {
  suggest: (data: { text: string; contentType: string; language: string }) =>
    api.post('/ai/writing/suggest', data),
  generateDescription: (data: { title: string; body: string; contentType: string }) =>
    api.post('/ai/writing/generate-description', data),
};

export const liveApi = {
  createRoom: (data: { title: string; contentId?: string }) =>
    api.post('/live/create', data),
  listRooms: () => api.get('/live/rooms'),
  getRoom: (id: string) => api.get(`/live/rooms/${id}`),
  endRoom: (id: string) => api.post(`/live/rooms/${id}/end`),
};

export const bannerApi = {
  getActive: () => api.get('/v1/banners/active'),
};

export default api;
