/**
 * LemoGuide Admin API Client
 * Tích hợp kết nối trực tiếp với backend Spring Boot (port 8080)
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const STORAGE_KEY = 'lemoguide_admin_auth';

export const getAuthToken = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token = parsed?.token || null;

    // Nếu phát hiện token mock cũ, tự động dọn sạch để yêu cầu đăng nhập lại lấy JWT thật
    if (token && typeof token === 'string' && token.startsWith('mock-')) {
      clearAuthToken();
      return null;
    }
    return token;
  } catch (e) {
    return null;
  }
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore
  }
};

export const getFullAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Xử lý khi phiên đăng nhập hết hạn hoặc chưa xác thực
      if (response.status === 401) {
        clearAuthToken();
        // Nếu không phải đang ở trang login, chuyển hướng về login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // Trích xuất thông báo lỗi chi tiết từ backend
      let errorMsg = data?.message || `Yêu cầu thất bại với mã lỗi ${response.status}`;
      if (data?.errors && typeof data.errors === 'object') {
        const errorDetails = Object.entries(data.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ');
        if (errorDetails) {
          errorMsg = `${errorMsg} (${errorDetails})`;
        }
      }

      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

