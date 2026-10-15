import { apiRequest } from './apiClient';

/**
 * Service quản lý vai trò và phân quyền (Role)
 * Kết nối trực tiếp với Backend API Spring Boot (/api/admin/roles)
 */

const defaultPermissionsMap = {
  ADMIN: [
    'user:view', 'user:create', 'user:edit', 'user:delete',
    'cv:view_all', 'cv:moderate',
    'master:manage', 'report:view', 'system:admin_manage',
  ],
  USER: [
    'user:view', 'cv:view_all',
  ],
};

let localCustomRoles = [];

export const roleService = {
  // Lấy danh sách vai trò thực tế từ backend
  async listRoles({ page = 0, size = 10, search = '', status = '' } = {}) {
    let backendRoles = [];

    const res = await apiRequest('/api/admin/roles');
    if (res?.data && Array.isArray(res.data)) {
      backendRoles = res.data.map((r) => ({
        id: r.id,
        name: r.name === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Người dùng (User)',
        code: `ROLE_${r.name.toUpperCase()}`,
        rawName: r.name,
        desc: r.description || (r.name === 'ADMIN' ? 'Toàn quyền điều hành hệ thống LemoGuide' : 'Người dùng xây dựng hồ sơ CV'),
        userCount: r.accountCount ?? 0,
        isSystem: true,
        status: 'active',
        permissions: defaultPermissionsMap[r.name.toUpperCase()] || ['user:view', 'cv:view_all'],
      }));
    }

    let allRoles = [...localCustomRoles, ...backendRoles];

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      allRoles = allRoles.filter(
        (r) =>
          r.name.toLowerCase().includes(s) ||
          r.code.toLowerCase().includes(s) ||
          (r.desc && r.desc.toLowerCase().includes(s))
      );
    }

    if (status && status !== 'all') {
      allRoles = allRoles.filter((r) => r.status === status);
    }

    const totalElements = allRoles.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = allRoles.slice(start, start + size);

    return {
      content,
      totalElements,
      totalPages,
    };
  },

  // Lấy chi tiết một vai trò
  async getRole(id) {
    if (typeof id === 'number' || !isNaN(Number(id))) {
      try {
        const res = await apiRequest(`/api/admin/roles/${id}`);
        const r = res.data;
        if (r) {
          return {
            id: r.id,
            name: r.name === 'ADMIN' ? 'Quản trị viên (Admin)' : 'Người dùng (User)',
            code: `ROLE_${r.name.toUpperCase()}`,
            desc: r.description,
            userCount: r.accountCount ?? 0,
            isSystem: true,
            status: 'active',
            permissions: defaultPermissionsMap[r.name.toUpperCase()] || ['user:view'],
          };
        }
      } catch (err) {
        console.warn('Lấy role từ backend thất bại:', err.message);
      }
    }

    const found = localCustomRoles.find((r) => r.id === id);
    if (found) return found;
    throw new Error('Không tìm thấy vai trò');
  },

  // Tạo vai trò mới
  async createRole(roleData) {
    const newRole = {
      id: roleData.code ? roleData.code.toLowerCase().replace(/[^a-z0-9]/g, '_') : Date.now(),
      name: roleData.name,
      code: roleData.code.toUpperCase(),
      desc: roleData.desc || '',
      userCount: 0,
      isSystem: false,
      status: roleData.status || 'active',
      permissions: roleData.permissions || ['user:view', 'cv:view_all'],
    };
    localCustomRoles = [newRole, ...localCustomRoles];
    return newRole;
  },

  // Cập nhật vai trò
  async updateRole(id, roleData) {
    localCustomRoles = localCustomRoles.map((r) => (r.id === id ? { ...r, ...roleData } : r));
    return { id, ...roleData };
  },

  // Xóa vai trò
  async deleteRole(id) {
    localCustomRoles = localCustomRoles.filter((r) => r.id !== id);
    return { success: true };
  },
};

