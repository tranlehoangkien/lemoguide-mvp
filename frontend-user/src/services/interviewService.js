import { apiRequest } from './apiClient';

/**
 * Interview Studio (AI Coach > Luyện tập phỏng vấn). Kết nối backend: /api/me/interview-sessions (module
 * interviewpractice). Mọi hàm trả về phiên luyện tập đầy đủ (câu hỏi, câu trả lời, phản hồi, thống kê) để giao
 * diện thay nguyên trạng thái, trừ `list` (lịch sử) và `remove`.
 *
 * `target` = { jobPostingId } (việc làm trong hệ thống) hoặc { jdText } (mô tả dán vào), hoặc null.
 */

const post = (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body || {}) });

export const interviewService = {
  /** Soạn câu hỏi từ CV và mục tiêu rồi mở phiên (một lần gọi AI, khoảng 10-25 giây). */
  async create({ cvProfileId, target, positionTitle, level, interviewType, questionCount, modelId }) {
    const res = await post('/api/me/interview-sessions', {
      cvProfileId: cvProfileId || null,
      target: target || null,
      positionTitle: positionTitle || null,
      level,
      interviewType,
      questionCount,
      modelId: modelId || null,
    });
    return res?.data || null;
  },

  /** Lịch sử luyện tập, mới nhất trước. */
  async list() {
    const res = await apiRequest('/api/me/interview-sessions');
    return res?.data || [];
  },

  async get(id) {
    const res = await apiRequest(`/api/me/interview-sessions/${id}`);
    return res?.data || null;
  },

  /** source: 'typed' | 'voice'; durationSeconds: thời gian trả lời đo ở trình duyệt. Chấm điểm mất khoảng 5-15 giây. */
  async answer(sessionId, questionId, { answer, durationSeconds, source }) {
    const res = await post(`/api/me/interview-sessions/${sessionId}/questions/${questionId}/answer`, {
      answer,
      durationSeconds: durationSeconds ?? null,
      source: source || 'typed',
    });
    return res?.data || null;
  },

  async skip(sessionId, questionId) {
    const res = await post(`/api/me/interview-sessions/${sessionId}/questions/${questionId}/skip`);
    return res?.data || null;
  },

  async suggestAnswer(sessionId, questionId) {
    const res = await post(`/api/me/interview-sessions/${sessionId}/questions/${questionId}/hint`);
    return res?.data;
  },

  /** Tính điểm và viết báo cáo cuối buổi. Gọi lại khi buổi đã kết thúc chỉ trả về kết quả cũ. */
  async finish(sessionId) {
    const res = await post(`/api/me/interview-sessions/${sessionId}/finish`);
    return res?.data || null;
  },

  async remove(sessionId) {
    await apiRequest(`/api/me/interview-sessions/${sessionId}`, { method: 'DELETE' });
  },
};
