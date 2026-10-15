import { apiRequest } from './apiClient';

/**
 * Service cho tính năng AI Coach (chat với AI thật qua backend).
 * Kết nối /api/me/ai-conversations và /api/me/ai-conversations/{id}/messages.
 */
const formatTimestamp = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const mapMessage = (m) => ({
  id: m.id,
  sender: m.role === 'ASSISTANT' ? 'assistant' : 'user',
  content: m.content,
  timestamp: formatTimestamp(m.createdAt),
});

const mapConversationSummary = (c) => ({
  id: c.id,
  title: c.title || 'Cuộc trò chuyện mới',
  modelId: c.modelId,
  category: c.category,
  cvProfileId: c.cvProfileId ?? null,
  jobPostingId: c.jobPostingId ?? null,
  careerPlanId: c.careerPlanId ?? null,
  isPinned: c.isPinned,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  lastMessageAt: c.lastMessageAt,
});

export const aiConversationService = {
  async listConversations({ category, page = 0, size = 50 } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'lastMessageAt,desc');
    params.append('sort', 'createdAt,desc');
    params.append('sort', 'id,desc');
    if (category) params.append('category', category);
    const res = await apiRequest(`/api/me/ai-conversations?${params.toString()}`);
    return (res?.data?.content || []).map(mapConversationSummary);
  },

  async getConversation(id, { page = 0, size = 100 } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    const res = await apiRequest(`/api/me/ai-conversations/${id}?${params.toString()}`);
    const data = res?.data || {};
    return {
      conversation: mapConversationSummary(data.conversation || {}),
      messages: (data.messages?.content || []).map(mapMessage),
    };
  },

  // cvProfileId / jobPostingId (tuỳ chọn): gắn hội thoại với một CV và một việc làm, backend tự dựng
  // ngữ cảnh thật từ dữ liệu đã lưu cho mỗi lượt chat (xem CvGroundingService).
  async createConversation({ category, modelId, title, cvProfileId, jobPostingId, careerPlanId } = {}) {
    const res = await apiRequest('/api/me/ai-conversations', {
      method: 'POST',
      body: JSON.stringify({
        category: category || null,
        modelId: modelId || null,
        title: title || null,
        cvProfileId: cvProfileId || null,
        jobPostingId: jobPostingId || null,
        careerPlanId: careerPlanId || null,
      }),
    });
    return mapConversationSummary(res?.data);
  },

  async updateConversation(id, { title, isPinned, modelId } = {}) {
    const body = {};
    if (title !== undefined) body.title = title;
    if (isPinned !== undefined) body.isPinned = isPinned;
    if (modelId !== undefined) body.modelId = modelId;
    const res = await apiRequest(`/api/me/ai-conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return mapConversationSummary(res?.data);
  },

  async deleteConversation(id) {
    await apiRequest(`/api/me/ai-conversations/${id}`, { method: 'DELETE' });
    return true;
  },

  // fetchOptions cho phép truyền { signal } để hủy request đang chờ
  // context: dữ liệu bổ sung (vd. CV hiện tại dạng JSON) được chèn vào system prompt
  // riêng cho lượt này, không lưu lại vào nội dung tin nhắn hiển thị.
  async sendMessage(conversationId, { content, attachmentUrl, context } = {}, fetchOptions = {}) {
    const res = await apiRequest(`/api/me/ai-conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachmentUrl: attachmentUrl || null, context: context || null }),
      ...fetchOptions,
    });
    const data = res?.data || {};
    return {
      userMessage: mapMessage(data.userMessage),
      assistantMessage: mapMessage(data.assistantMessage),
      aiCreditsRemaining: data.aiCreditsRemaining,
    };
  },
};
