import { apiRequest } from './apiClient';

/**
 * Service quản lý Prompt Templates AI (Admin)
 * Kết nối trực tiếp với Backend API Spring Boot (/api/admin/ai-prompt-templates)
 * Mỗi template gắn với 1 (actionType, model) - ví dụ actionType=CHAT cho model X
 * là system prompt mà tính năng AI Coach dùng khi trò chuyện qua model đó.
 */
export const aiPromptTemplateService = {
  async listTemplates({ page = 0, size = 20, actionType = null, modelId = null, isActive = null } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');
    if (actionType) {
      params.append('actionType', actionType);
    }
    if (modelId) {
      params.append('modelId', modelId);
    }
    if (isActive === true || isActive === false) {
      params.append('isActive', isActive);
    }

    const res = await apiRequest(`/api/admin/ai-prompt-templates?${params.toString()}`);
    return {
      content: res?.data?.content || [],
      totalElements: res?.data?.totalElements ?? 0,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  async getTemplate(id) {
    const res = await apiRequest(`/api/admin/ai-prompt-templates/${id}`);
    return res?.data;
  },

  async createTemplate(payload) {
    const res = await apiRequest('/api/admin/ai-prompt-templates', {
      method: 'POST',
      body: JSON.stringify({
        actionType: payload.actionType,
        modelId: Number(payload.modelId),
        promptText: payload.promptText,
        isActive: Boolean(payload.isActive),
      }),
    });
    return res?.data;
  },

  async updateTemplate(id, payload) {
    const res = await apiRequest(`/api/admin/ai-prompt-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        actionType: payload.actionType,
        modelId: Number(payload.modelId),
        promptText: payload.promptText,
        isActive: Boolean(payload.isActive),
      }),
    });
    return res?.data;
  },

  async deleteTemplate(id) {
    await apiRequest(`/api/admin/ai-prompt-templates/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
