import { Platform } from 'react-native';

// const BASE_URL = 'http://192.168.1.186:4000'; // Local backend
const BASE_URL = 'https://backend-qr-h4th.onrender.com';


export const STORE_ID = 'store-genz-01';
export const DEFAULT_TABLE = 'T12';

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

// Random device ID per session to avoid sharing profile between different testers
const DEVICE_ID = `device-genz-${Platform.OS}-${Math.random().toString(36).substring(2, 10)}`;

const apiCache: Record<string, any> = {};

export const cache = {
  get: (key: string) => apiCache[key],
  set: (key: string, value: any) => { apiCache[key] = value; },
  has: (key: string) => !!apiCache[key],
  clear: () => { Object.keys(apiCache).forEach(k => delete apiCache[k]); }
};

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-id': DEVICE_ID,
    ...(options.headers as Record<string, string>),
  };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);

  const data = (json?.additionalProp1 ?? json) as T;
  if (method === 'GET') {
    apiCache[path] = data;
  }
  return data;
}

export const authApi = {
  login: (phone: string, password: string) =>
    http<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),
  getMe: () => http<any>('/me'),
  getLoyalty: () => http<any>('/me/loyalty'),
  logout: () => http<any>('/me/logout', { method: 'POST' }),
  toggleFavorite: (itemId: string) =>
    http<any>('/me/favorites', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    }),
  sendOtp: (phone: string) =>
    http<any>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose: 'login' }),
    }),
  updateProfile: (displayName: string, phone: string, instagramUsername?: string) =>
    http<any>('/me/profile', {
      method: 'POST',
      body: JSON.stringify({ displayName, phone, instagramUsername }),
    }),
};

export const clientApi = {
  getMenu: (storeId = STORE_ID, tableCode = DEFAULT_TABLE) =>
    http<any>(`/client/menu?storeId=${storeId}&tableCode=${tableCode}`),
  recordScan: (storeId = STORE_ID, tableCode = DEFAULT_TABLE, deviceInfo = Platform.OS) =>
    http<any>('/client/scan', {
      method: 'POST',
      body: JSON.stringify({ storeId, tableCode, deviceInfo })
    }),

  getItemDetail: (itemId: string) =>
    http<any>(`/client/menu/items/${itemId}`),

  getOffers: (storeId = STORE_ID) =>
    http<any>(`/client/offers?storeId=${storeId}`),

  getContent: (storeId = STORE_ID) =>
    http<any>(`/client/content?storeId=${storeId}`),

  getVouchers: (customerPhone?: string) =>
    http<any>(`/client/vouchers${customerPhone ? `?customerPhone=${customerPhone}` : ''}`),

  getQuote: (items: any[], voucherCode?: string, customerPhone?: string) =>
    http<any>('/client/cart/quote', {
      method: 'POST',
      body: JSON.stringify({ storeId: STORE_ID, items, voucherCode, customerPhone }),
    }),

  createOrder: (data: any) =>
    http<any>('/client/orders', {
      method: 'POST',
      body: JSON.stringify({ storeId: STORE_ID, ...data }),
    }),
  getOrders: (phone: string) =>
    http<any>(`/client/orders?customerPhone=${phone}`),
  getOrderDetails: (orderId: string) =>
    http<any>(`/client/orders/${orderId}`),
  getOrderTracking: (orderId: string) =>
    http<any>(`/client/orders/${orderId}/tracking`),
  updateOrderStatus: (orderId: string, status: string) =>
    http<any>(`/client/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  redeemVoucher: (customerPhone: string, voucherCode: string) =>
    http<any>('/client/loyalty/redeem', {
      method: 'POST',
      body: JSON.stringify({ customerPhone, voucherCode }),
    }),
  chat: (senderId: string, message: string) =>
    http<any>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ senderId, message }),
    }),
};
