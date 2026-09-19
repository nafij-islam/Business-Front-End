import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Robust helper to safely extract paginated data and metadata from backend API responses
 */
export function extractPaginationData<T>(response: any): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  if (!response) {
    return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
  }

  const rawData = response?.data !== undefined ? response.data : response;

  let items: T[] = [];
  if (Array.isArray(rawData)) {
    items = rawData;
  } else if (Array.isArray(rawData?.data)) {
    items = rawData.data;
  } else if (Array.isArray(rawData?.items)) {
    items = rawData.items;
  }

  const meta = response?.meta?.meta || response?.meta || rawData?.meta || {};
  const total =
    typeof meta?.total === 'number'
      ? meta.total
      : typeof rawData?.total === 'number'
        ? rawData.total
        : items.length;

  const page = meta?.page || rawData?.page || 1;
  const limit = meta?.limit || rawData?.limit || 20;
  const totalPages = meta?.totalPages || Math.ceil(total / (limit || 1)) || 1;

  return { items, total, page, limit, totalPages };
}

/**
 * Authenticated file download helper for CSV exports
 */
export async function downloadExportFile(endpoint: string, filename: string) {
  const response = await api.get(endpoint, {
    responseType: 'blob',
  });
  const blob = new Blob([response as any], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Request interceptor: attach token from sessionStorage / localStorage
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 token refresh
api.interceptors.response.use(
  (response) => {
    // If backend uses standard envelope { success: true, data: ... }, return response.data
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      return Promise.reject(new Error('Network error. Backend API might be unreachable.'));
    }

    const status = error.response.status;

    // Do not attempt refresh on login or refresh endpoint itself
    const isAuthRoute =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken =
          typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

        const refreshRes: any = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true },
        );

        const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;

        if (newAccessToken && typeof window !== 'undefined') {
          localStorage.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }
        }

        processQueue(null);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_profile');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract user friendly error message
    const responseData = error.response.data as any;
    const message = responseData?.message || responseData?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);
