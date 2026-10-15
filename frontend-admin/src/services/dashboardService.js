import { apiRequest } from './apiClient';

/**
 * Service cho trang Dashboard tổng quan (Admin Console)
 * Kết nối trực tiếp với Backend API Spring Boot:
 *  - /api/admin/dashboard/summary  : KPI tổng hợp + Top công nghệ
 *  - /api/admin/cv-profiles        : Hồ sơ CV mới tạo gần đây
 */
export const dashboardService = {
  // Lấy các chỉ số tổng quan (tổng người dùng, tổng CV, lượt xem, top công nghệ...)
  async getSummary() {
    const res = await apiRequest('/api/admin/dashboard/summary');
    return (
      res?.data || {
        totalUsers: 0,
        totalCvProfiles: 0,
        totalPublicViews: 0,
        newCvThisWeek: 0,
        usersGrowthPercent: null,
        cvGrowthPercent: null,
        topTechnologies: [],
      }
    );
  },

  // Lấy danh sách CV Profile mới tạo gần đây nhất
  async getRecentCvProfiles(limit = 4) {
    const params = new URLSearchParams();
    params.append('page', 0);
    params.append('size', limit);
    params.append('sort', 'createdAt,desc');

    const res = await apiRequest(`/api/admin/cv-profiles?${params.toString()}`);
    return res?.data?.content || [];
  },
};
