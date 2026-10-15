import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, STORAGE_KEY, clearAuthToken } from '@/services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin profile chi tiết từ /api/me
  const fetchProfile = async (token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json().catch(() => null);
      if (data?.success && data?.data) {
        return data.data;
      }
    } catch (e) {
      console.warn('Không lấy được profile từ /api/me:', e);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Dọn dẹp localStorage để tránh tự động đăng nhập khi mở lại hoặc chạy lại ứng dụng
        localStorage.removeItem(STORAGE_KEY);
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);

          // Nếu là mock token cũ, xóa bỏ
          if (parsed?.token && typeof parsed.token === 'string' && parsed.token.startsWith('mock-')) {
            clearAuthToken();
            setUser(null);
          } else if (parsed?.token) {
            // Kiểm tra role: nếu không phải USER thì đăng xuất ngay
            if (parsed?.role !== 'USER') {
              clearAuthToken();
              setUser(null);
              return;
            }

            setUser(parsed);
            // Tải profile thời gian thực từ /api/me để cập nhật avatarUrl và thông tin mới nhất
            const me = await fetchProfile(parsed.token);
            if (me) {
              const updated = {
                ...parsed,
                avatarUrl: me.profile?.avatarUrl || parsed.avatarUrl || null,
                displayName: me.profile?.fullName || parsed.displayName,
                currentTitle: me.profile?.currentTitle || parsed.currentTitle || 'User',
              };
              setUser(updated);
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse auth from storage', e);
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async ({ email, password }) => {
    if (!email || !password) {
      throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      const msg = result?.message || 'Đăng nhập không thành công, vui lòng kiểm tra lại thông tin!';
      throw new Error(msg);
    }

    const authData = result.data;
    const account = authData?.account;

    // KIỂM TRA QUYỀN HẠN: CHỈ NHẬN ACCOUNT CÓ ROLE LÀ USER
    if (account?.role !== 'USER') {
      throw new Error('Tài khoản này không có quyền truy cập giao diện Người dùng (Chỉ chấp nhận tài khoản có vai trò USER)!');
    }

    // Tải profile chi tiết từ /api/me để lấy avatarUrl và tên đầy đủ
    const me = await fetchProfile(authData.accessToken);

    const userData = {
      id: account.id,
      email: account.email,
      role: account.role,
      status: account.status,
      displayName: me?.profile?.fullName || account.email.split('@')[0] || 'Người dùng',
      avatarUrl: me?.profile?.avatarUrl || null,
      currentTitle: me?.profile?.currentTitle || 'User',
      token: authData.accessToken,
    };

    setUser(userData);

    // Luôn dọn dẹp trước để tránh xung đột giữa localStorage và sessionStorage
    clearAuthToken();

    // Lưu phiên vào sessionStorage: giữ đăng nhập khi refresh (F5), nhưng khi chạy lại ứng dụng hoặc đóng tab sẽ yêu cầu đăng nhập lại
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

    return userData;
  };

  const register = async ({ fullName, email, password }) => {
    if (!fullName || !email || !password) {
      throw new Error('Vui lòng điền đầy đủ các trường thông tin');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      let msg = result?.message || 'Đăng ký không thành công, vui lòng kiểm tra lại thông tin!';
      if (result?.errors && typeof result.errors === 'object') {
        const details = Object.entries(result.errors).map(([f, m]) => `${f}: ${m}`).join(', ');
        if (details) msg += ` (${details})`;
      }
      throw new Error(msg);
    }

    const authData = result.data;
    const account = authData?.account;

    const me = await fetchProfile(authData.accessToken);

    const userData = {
      id: account.id,
      email: account.email,
      role: account.role || 'USER',
      status: account.status || 'ACTIVE',
      displayName: me?.profile?.fullName || fullName.trim(),
      avatarUrl: me?.profile?.avatarUrl || null,
      currentTitle: me?.profile?.currentTitle || 'User',
      token: authData.accessToken,
    };

    setUser(userData);
    clearAuthToken();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

    return userData;
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const uploadMyAvatar = async (file) => {
    const currentToken = user?.token || (JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')?.token);
    if (!currentToken) throw new Error('Chưa đăng nhập');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/api/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
      body: formData,
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.success) {
      throw new Error(result?.message || 'Tải ảnh đại diện thất bại');
    }
    const newAvatarUrl = result?.data?.profile?.avatarUrl || null;
    updateUser({ avatarUrl: newAvatarUrl });
    return newAvatarUrl;
  };

  const updateMyProfile = async (profileData) => {
    const currentToken = user?.token || (JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')?.token);
    if (!currentToken) throw new Error('Chưa đăng nhập');
    const res = await fetch(`${API_BASE_URL}/api/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.success) {
      throw new Error(result?.message || 'Cập nhật thông tin thất bại');
    }
    const updatedProfile = result.data?.profile;
    const updated = {
      ...user,
      displayName: updatedProfile?.fullName || user.displayName,
      currentTitle: updatedProfile?.currentTitle || user.currentTitle,
      avatarUrl: updatedProfile?.avatarUrl || user.avatarUrl,
    };
    setUser(updated);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return result.data;
  };

  const getMyProfile = async () => {
    const currentToken = user?.token || (JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')?.token);
    if (!currentToken) return null;
    return await fetchProfile(currentToken);
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    const currentToken = user?.token || (JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')?.token);
    if (!currentToken) throw new Error('Chưa đăng nhập');
    const res = await fetch(`${API_BASE_URL}/api/me/password`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || !result?.success) {
      throw new Error(result?.message || 'Đổi mật khẩu thất bại');
    }
    return result;
  };

  const logout = () => {
    setUser(null);
    clearAuthToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
        uploadMyAvatar,
        updateMyProfile,
        getMyProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
