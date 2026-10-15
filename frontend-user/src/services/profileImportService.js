import { apiRequest } from './apiClient';

/**
 * Trích xuất CV -> điền vào Dynamic Profile (/api/me/profile-import/**).
 * extractProfile trả về patch JSON (chuỗi) để người dùng xem trước; applyProfilePatch
 * mới thực sự ghi vào các bảng hồ sơ (contact/education/experience/...).
 */
export const profileImportService = {
  async extractProfile(sourceText) {
    const res = await apiRequest('/api/me/profile-import/extract', {
      method: 'POST',
      body: JSON.stringify({ sourceText }),
    });
    return res?.data?.patch || null;
  },

  async applyProfilePatch(patch) {
    const res = await apiRequest('/api/me/profile-import/apply', {
      method: 'POST',
      body: JSON.stringify({ patch }),
    });
    return res?.data || { created: {}, skipped: [] };
  },
};
