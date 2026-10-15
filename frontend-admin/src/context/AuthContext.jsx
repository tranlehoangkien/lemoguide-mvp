import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, STORAGE_KEY, clearAuthToken } from '@/services/apiClient';
import { resetPermissions } from '@/services/adminPermissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          // Nếu token là mock token cũ, xóa bỏ để tránh lỗi 401
          if (parsed?.token && typeof parsed.token === 'string' && parsed.token.startsWith('mock-')) {
            clearAuthToken();
            setUser(null);
          } else if (parsed?.token) {
            setUser(parsed);
            // Tải profile thời gian thực từ /api/me để cập nhật avatarUrl và fullName mới nhất
            const me = await fetchProfile(parsed.token);
            if (me) {
              const updated = {
                ...parsed,
                avatarUrl: me.profile?.avatarUrl || parsed.avatarUrl || null,
                displayName: me.profile?.fullName || parsed.displayName,
                currentTitle: me.profile?.currentTitle || parsed.currentTitle || 'Super Admin',
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

    // Kiểm tra quyền hạn: Chỉ cho phép tài khoản có quyền ADMIN truy cập
    if (account?.role !== 'ADMIN') {
      throw new Error('Tài khoản này không có quyền truy cập trang quản trị LemoGuide!');
    }

    // Tải profile chi tiết từ /api/me để lấy avatarUrl và tên đầy đủ
    const me = await fetchProfile(authData.accessToken);

    const userData = {
      id: account.id,
      email: account.email,
      role: account.role,
      status: account.status,
      displayName: me?.profile?.fullName || account.email.split('@')[0] || 'Quản trị viên',
      avatarUrl: me?.profile?.avatarUrl || null,
      currentTitle: me?.profile?.currentTitle || 'Super Admin',
      token: authData.accessToken,
    };

    setUser(userData);

    // Luôn dọn dẹp trước để tránh xung đột giữa localStorage và sessionStorage
    clearAuthToken();

    // Lưu phiên vào sessionStorage: giữ đăng nhập khi refresh (F5), nhưng khi chạy lại ứng dụng hoặc đóng tab sẽ yêu cầu đăng nhập lại
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

  const logout = () => {
    setUser(null);
    clearAuthToken();
    resetPermissions();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        updateUser,
        uploadMyAvatar,
        updateMyProfile,
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
