import { apiRequest } from './apiClient';

/**
 * Service quản lý CV người dùng (Admin oversight)
 * Kết nối trực tiếp với Backend API Spring Boot (/api/admin/cv-profiles)
 * Lưu ý: getCvProfile trả về đầy đủ nội dung CV (cvData/activeSections/avatarUrl)
 * để admin xem bản xem trước thật (CvPreviewOnlyPage) khi kiểm duyệt, nhưng
 * nội dung chi tiết (học vấn, kỹ năng...) vẫn chỉ do chính người dùng chỉnh sửa —
 * trang quản lý CV của admin không có chức năng sửa/ẩn CV.
 */
export const cvProfileService = {
  // Lấy danh sách CV có phân trang, tìm kiếm và lọc trạng thái
  async listCvProfiles({ page = 0, size = 10, keyword = '', isActive = null } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');
    if (keyword && keyword.trim()) {
      params.append('keyword', keyword.trim());
    }
    if (isActive === true || isActive === false) {
      params.append('isActive', isActive);
    }

    const res = await apiRequest(`/api/admin/cv-profiles?${params.toString()}`);
    return {
      content: res?.data?.content || [],
      totalElements: res?.data?.totalElements ?? 0,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  // Xem chi tiết một CV
  async getCvProfile(id) {
    const res = await apiRequest(`/api/admin/cv-profiles/${id}`);
    return res?.data;
  },

  // Xóa CV khỏi hệ thống
  async deleteCvProfile(id) {
    await apiRequest(`/api/admin/cv-profiles/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
