import { apiRequest } from './apiClient';

/**
 * Service quản lý ban quản trị LemoGuide (ADMIN accounts)
 * Kết nối trực tiếp 100% với Backend API Spring Boot (/api/admin/admins)
 */
export const adminService = {
  // Lấy danh sách quản trị viên có phân trang, tìm kiếm và lọc trạng thái
  async listAdmins({ page = 0, size = 10, search = '', status = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'id,desc');
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (status && status !== 'all') {
      params.append('status', status.toUpperCase());
    }

    const res = await apiRequest(`/api/admin/admins?${params.toString()}`);

    if (res?.data?.content) {
      return {
        content: res.data.content.map((a) => ({
          id: a.id,
          fullName: a.fullName || a.email?.split('@')[0],
          avatarUrl: a.avatarUrl || null,
          email: a.email,
          role: a.role || 'ADMIN',
          department: a.currentTitle || a.department || 'Ban Điều Hành',
          status: (a.status || 'ACTIVE').toLowerCase(),
          twoFactorEnabled: true,
          createdAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '',
          lastLoginAt: a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập',
          deletedAt: a.deletedAt,
          isRoot: a.id === 1 || a.id === 10 || a.email === 'admin1@lemoguide.com',
        })),
        totalElements: res.data.totalElements ?? 0,
        totalPages: res.data.totalPages ?? 1,
      };
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 1,
    };
  },

  // Tải lên ảnh đại diện cho Admin
  async uploadAvatar(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest(`/api/admin/admins/${id}/avatar`, {
      method: 'POST',
      body: formData,
    });
    return res?.data;
  },

  // Lấy thông tin chi tiết đầy đủ của một Admin
  async getAdmin(id) {
    const res = await apiRequest(`/api/admin/admins/${id}`);
    const a = res.data;
    if (!a) throw new Error('Không tìm thấy thông tin quản trị viên');

    return {
      id: a.id,
      email: a.email,
      role: a.role || 'ADMIN',
      status: (a.status || 'ACTIVE').toLowerCase(),
      fullName: a.profile?.fullName || a.email?.split('@')[0],
      avatarUrl: a.profile?.avatarUrl || null,
      currentTitle: a.profile?.currentTitle || 'Quản trị viên',
      department: a.profile?.currentTitle || 'Ban Quản Trị',
      city: a.profile?.city || '',
      district: a.profile?.district || '',
      gender: a.profile?.gender || '',
      dateOfBirth: a.profile?.dateOfBirth || '',
      twoFactorEnabled: true,
      createdAt: a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '',
      lastLoginAt: a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập',
      deletedAt: a.deletedAt,
      isRoot: a.id === 1 || a.id === 10 || a.email === 'admin1@lemoguide.com',
    };
  },

  // Tạo quản trị viên mới qua API
  async createAdmin(data) {
    const createRes = await apiRequest('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email.trim(),
        password: data.password || 'Password123!',
        fullName: data.fullName.trim(),
      }),
    });

    const created = createRes?.data;
    if (!created?.id) {
      throw new Error('Tạo tài khoản quản trị viên thất bại');
    }

    // Nếu có avatar file, tải lên avatar ngay
    if (data.avatarFile) {
      try {
        await this.uploadAvatar(created.id, data.avatarFile);
      } catch (aErr) {
        console.warn('Lỗi tải avatar khi tạo admin:', aErr);
      }
    }

    // Cập nhật profile phụ (phòng ban / chức danh, thành phố) nếu có
    const profileUpdates = {};
    if (data.department) profileUpdates.currentTitle = data.department.trim();
    if (data.currentTitle) profileUpdates.currentTitle = data.currentTitle.trim();
    if (data.city) profileUpdates.city = data.city.trim();

    if (Object.keys(profileUpdates).length > 0) {
      try {
        await apiRequest(`/api/admin/admins/${created.id}/profile`, {
          method: 'PATCH',
          body: JSON.stringify(profileUpdates),
        });
      } catch (err) {
        console.warn('Cập nhật profile phụ admin sau tạo mới gặp cảnh báo:', err);
      }
    }

    // Nếu trạng thái khác ACTIVE, cập nhật status
    if (data.status && data.status.toUpperCase() !== 'ACTIVE') {
      try {
        await apiRequest(`/api/admin/admins/${created.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: data.status.toUpperCase(),
          }),
        });
      } catch (err) {
        console.warn('Cập nhật status sau tạo mới gặp cảnh báo:', err);
      }
    }

    return created;
  },

  // Cập nhật quản trị viên
  async updateAdmin(id, data) {
    // 0. Cập nhật ảnh đại diện nếu có
    if (data.avatarFile) {
      try {
        await this.uploadAvatar(id, data.avatarFile);
      } catch (aErr) {
        console.warn('Lỗi cập nhật avatar admin:', aErr);
      }
    }

    // 1. Cập nhật hồ sơ admin_information
    const profileBody = {};
    if (data.fullName) profileBody.fullName = data.fullName.trim();
    if (data.department !== undefined || data.currentTitle !== undefined) {
      profileBody.currentTitle = (data.department || data.currentTitle || '').trim();
    }
    if (data.city !== undefined) profileBody.city = data.city ? data.city.trim() : '';

    if (Object.keys(profileBody).length > 0) {
      await apiRequest(`/api/admin/admins/${id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(profileBody),
      });
    }

    // 2. Cập nhật trạng thái nếu có
    if (data.status) {
      await apiRequest(`/api/admin/admins/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: data.status.toUpperCase(),
        }),
      });
    }

    return { id, ...data };
  },

  // Xóa mềm quản trị viên
  async deleteAdmin(id) {
    await apiRequest(`/api/admin/admins/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Khôi phục tài khoản quản trị viên đã xóa
  async restoreAdmin(id) {
    return await apiRequest(`/api/admin/admins/${id}/restore`, {
      method: 'POST',
    });
  },
};
