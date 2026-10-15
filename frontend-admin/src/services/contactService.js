import { apiRequest } from './apiClient';

/**
 * Service quản lý kênh liên hệ (Contact) của người dùng
 * Kết nối với Backend API Spring Boot (/api/admin/users/{userId}/contacts)
 */

export const CONTACT_TYPES = [
  { value: 'PHONE', label: 'Số điện thoại', prefix: 'tel:' },
  { value: 'EMAIL', label: 'Email liên hệ', prefix: 'mailto:' },
  { value: 'LINKEDIN', label: 'LinkedIn', prefix: 'https://' },
  { value: 'GITHUB', label: 'GitHub', prefix: 'https://' },
  { value: 'WEBSITE', label: 'Website / Portfolio', prefix: 'https://' },
  { value: 'OTHER', label: 'Khác', prefix: '' },
];

export const contactService = {
  // Lấy danh sách kênh liên hệ của một User
  async listContacts(userId) {
    const res = await apiRequest(`/api/admin/users/${userId}/contacts`);
    return res?.data || [];
  },

  // Thêm mới 1 kênh liên hệ cho User
  async createContact(userId, { type, value, primary = false }) {
    const res = await apiRequest(`/api/admin/users/${userId}/contacts`, {
      method: 'POST',
      body: JSON.stringify({
        type,
        value: value.trim(),
        primary: Boolean(primary),
      }),
    });
    return res?.data;
  },

  // Cập nhật kênh liên hệ
  async updateContact(userId, contactId, { type, value, primary = false }) {
    const res = await apiRequest(`/api/admin/users/${userId}/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({
        type,
        value: value.trim(),
        primary: Boolean(primary),
      }),
    });
    return res?.data;
  },

  // Xóa kênh liên hệ
  async deleteContact(userId, contactId) {
    await apiRequest(`/api/admin/users/${userId}/contacts/${contactId}`, {
      method: 'DELETE',
    });
    return true;
  },
};
