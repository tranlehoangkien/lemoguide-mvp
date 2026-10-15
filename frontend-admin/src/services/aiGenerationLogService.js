import { apiRequest } from './apiClient';

/**
 * Service quản lý Nhật ký sử dụng AI (Admin)
 * Kết nối trực tiếp với Backend API Spring Boot (/api/admin/ai-generation-logs)
 * Đây là log ghi lại mọi lượt gọi AI (chat, tối ưu CV, match JD...): số token,
 * chi phí ước tính, trạng thái thành công/thất bại.
 */
export const aiGenerationLogService = {
  async listLogs({ page = 0, size = 20, accountId = null, actionType = null, status = null } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');
    if (accountId) {
      params.append('accountId', accountId);
    }
    if (actionType) {
      params.append('actionType', actionType);
    }
    if (status) {
      params.append('status', status);
    }

    const res = await apiRequest(`/api/admin/ai-generation-logs?${params.toString()}`);
    return {
      content: res?.data?.content || [],
      totalElements: res?.data?.totalElements ?? 0,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  async getLog(id) {
    const res = await apiRequest(`/api/admin/ai-generation-logs/${id}`);
    return res?.data;
  },

  // Xóa một dòng nhật ký (dùng khi cần dọn dữ liệu lỗi/rác, không phải thao tác thường xuyên)
  async deleteLog(id) {
    await apiRequest(`/api/admin/ai-generation-logs/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
