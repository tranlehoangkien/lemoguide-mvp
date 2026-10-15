import { apiRequest } from './apiClient';

/**
 * Service quản lý Model AI & API Key (Admin)
 * Kết nối trực tiếp với Backend API Spring Boot (/api/admin/ai-models)
 * Lưu ý: API Key không bao giờ được trả về nguyên văn từ backend, chỉ có cờ
 * apiKeyConfigured cho biết model đã được cấu hình khóa hay chưa.
 */
export const aiModelService = {
  // Lấy danh sách model có phân trang, tìm kiếm và lọc theo nhà cung cấp / trạng thái
  async listModels({ page = 0, size = 10, keyword = '', provider = null, isActive = null } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');
    if (keyword && keyword.trim()) {
      params.append('keyword', keyword.trim());
    }
    if (provider) {
      params.append('provider', provider);
    }
    if (isActive === true || isActive === false) {
      params.append('isActive', isActive);
    }

    const res = await apiRequest(`/api/admin/ai-models?${params.toString()}`);
    return {
      content: res?.data?.content || [],
      totalElements: res?.data?.totalElements ?? 0,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  // Xem chi tiết một model
  async getModel(id) {
    const res = await apiRequest(`/api/admin/ai-models/${id}`);
    return res?.data;
  },

  // Thêm mới model AI kèm API Key
  async createModel(modelData) {
    const res = await apiRequest('/api/admin/ai-models', {
      method: 'POST',
      body: JSON.stringify({
        provider: modelData.provider,
        modelName: modelData.modelName.trim(),
        apiKey: modelData.apiKey?.trim() || null,
        maxTokensPerRequest: Number(modelData.maxTokensPerRequest) || 4096,
        isActive: Boolean(modelData.isActive),
      }),
    });
    return res?.data;
  },

  // Cập nhật model AI. apiKey để trống (null/undefined) nghĩa là giữ nguyên khóa hiện tại.
  async updateModel(id, modelData) {
    const res = await apiRequest(`/api/admin/ai-models/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        provider: modelData.provider,
        modelName: modelData.modelName.trim(),
        apiKey: modelData.apiKey?.trim() || null,
        maxTokensPerRequest: Number(modelData.maxTokensPerRequest) || 4096,
        isActive: Boolean(modelData.isActive),
      }),
    });
    return res?.data;
  },

  // Xóa model AI
  async deleteModel(id) {
    await apiRequest(`/api/admin/ai-models/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
