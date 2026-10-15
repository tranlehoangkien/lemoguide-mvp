import { apiRequest } from './apiClient';

/**
 * Service quản lý Gói & Giới hạn / Credits-Plans (Admin)
 * Kết nối trực tiếp với Backend API Spring Boot (/api/admin/plans)
 */
export const planService = {
  // Lấy danh sách gói có phân trang và tìm kiếm theo tên
  async listPlans({ page = 0, size = 10, keyword = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'id,asc');
    if (keyword && keyword.trim()) {
      params.append('keyword', keyword.trim());
    }

    const res = await apiRequest(`/api/admin/plans?${params.toString()}`);
    return {
      content: res?.data?.content || [],
      totalElements: res?.data?.totalElements ?? 0,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  // Xem chi tiết một gói
  async getPlan(id) {
    const res = await apiRequest(`/api/admin/plans/${id}`);
    return res?.data;
  },

  // Thêm mới gói
  async createPlan(planData) {
    const res = await apiRequest('/api/admin/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: planData.name.trim(),
        price: Number(planData.price) || 0,
        billingCycle: planData.billingCycle,
        aiCreditsPerMonth: Number(planData.aiCreditsPerMonth) || 0,
        messagesPerDay: planData.messagesPerDay === "" || planData.messagesPerDay == null ? null : Number(planData.messagesPerDay),
        messagesPerWeek: planData.messagesPerWeek === "" || planData.messagesPerWeek == null ? null : Number(planData.messagesPerWeek),
        messagesPerMonth: planData.messagesPerMonth === "" || planData.messagesPerMonth == null ? null : Number(planData.messagesPerMonth),
        maxCvs: planData.maxCvs === '' || planData.maxCvs === null ? null : Number(planData.maxCvs),
        allowPremiumTemplates: Boolean(planData.allowPremiumTemplates),
        isActive: Boolean(planData.isActive),
      }),
    });
    return res?.data;
  },

  // Cập nhật gói
  async updatePlan(id, planData) {
    const res = await apiRequest(`/api/admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: planData.name.trim(),
        price: Number(planData.price) || 0,
        billingCycle: planData.billingCycle,
        aiCreditsPerMonth: Number(planData.aiCreditsPerMonth) || 0,
        messagesPerDay: planData.messagesPerDay === "" || planData.messagesPerDay == null ? null : Number(planData.messagesPerDay),
        messagesPerWeek: planData.messagesPerWeek === "" || planData.messagesPerWeek == null ? null : Number(planData.messagesPerWeek),
        messagesPerMonth: planData.messagesPerMonth === "" || planData.messagesPerMonth == null ? null : Number(planData.messagesPerMonth),
        maxCvs: planData.maxCvs === '' || planData.maxCvs === null ? null : Number(planData.maxCvs),
        allowPremiumTemplates: Boolean(planData.allowPremiumTemplates),
        isActive: Boolean(planData.isActive),
      }),
    });
    return res?.data;
  },

  // Xóa gói
  async deletePlan(id) {
    await apiRequest(`/api/admin/plans/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
