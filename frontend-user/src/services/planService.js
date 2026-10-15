import { apiRequest } from './apiClient';

/**
 * Service Gói & Giới hạn (Self-service) cho người dùng.
 * Kết nối /api/lookups/plans (danh sách gói đang hoạt động) và
 * /api/me/plan (đổi gói của chính mình - miễn phí, cập nhật ngay lập tức).
 */
export const planService = {
  // Lấy danh sách các gói đang hoạt động, sắp xếp theo giá tăng dần (đã do backend xử lý)
  async getActivePlans() {
    const res = await apiRequest('/api/lookups/plans');
    return res?.data || [];
  },

  // Đổi gói của chính người dùng đang đăng nhập
  async updateMyPlan(planId) {
    const res = await apiRequest('/api/me/plan', {
      method: 'PATCH',
      body: JSON.stringify({ planId }),
    });
    return res?.data;
  },
};
