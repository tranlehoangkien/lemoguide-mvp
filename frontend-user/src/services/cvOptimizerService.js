import { apiRequest } from './apiClient';

/**
 * Các tác vụ AI trên một CV của người dùng: chấm điểm ATS, gợi ý viết lại, áp dụng/hoàn tác, thư xin việc.
 * Kết nối backend: /api/me/cv-profiles/{id}/ai/* và /api/me/cover-letters (module cvoptimizer).
 *
 * `target` = { jobPostingId } (việc làm trong hệ thống) hoặc { jdText } (mô tả dán vào), hoặc null.
 */

const post = (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body || {}) });

export const cvOptimizerService = {
  /** Kết quả chấm điểm đã lưu cho (CV, mục tiêu) - không gọi AI. Trả null nếu chưa có. */
  async getStoredReview(cvId, target) {
    const res = await post(`/api/me/cv-profiles/${cvId}/ai/review`, { target: target || null, cachedOnly: true });
    return res?.data || null;
  },

  /** Chấm điểm CV. Nếu CV/mục tiêu không đổi, backend trả lại kết quả đã lưu (cached: true). */
  async review(cvId, { target, modelId, refresh = false } = {}) {
    const res = await post(`/api/me/cv-profiles/${cvId}/ai/review`, {
      target: target || null,
      modelId: modelId || null,
      refresh,
    });
    return res?.data || null;
  },

  async suggest(cvId, { target, modelId } = {}) {
    const res = await post(`/api/me/cv-profiles/${cvId}/ai/suggest`, { target: target || null, modelId: modelId || null });
    return res?.data || null;
  },

  /** changes: [{ ref, field, before, after }] - các gợi ý người dùng đã chấp nhận. */
  async apply(cvId, { changes, generationLogId }) {
    const res = await post(`/api/me/cv-profiles/${cvId}/ai/apply`, { changes, generationLogId: generationLogId || null });
    return res?.data || null;
  },

  async undo(cvId, versionId) {
    const res = await post(`/api/me/cv-profiles/${cvId}/ai/undo/${versionId}`);
    return res?.data || null;
  },

  async generateCoverLetter(cvId, { target, modelId, tone, language, notes }) {
    const res = await post(`/api/me/cv-profiles/${cvId}/cover-letters`, {
      target: target || null,
      modelId: modelId || null,
      tone,
      language,
      notes: notes || null,
    });
    return res?.data || null;
  },

  async listCoverLetters(cvId) {
    const res = await apiRequest(`/api/me/cv-profiles/${cvId}/cover-letters`);
    return res?.data || [];
  },

  async updateCoverLetter(id, { title, content }) {
    const res = await apiRequest(`/api/me/cover-letters/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content }),
    });
    return res?.data || null;
  },

  async deleteCoverLetter(id) {
    await apiRequest(`/api/me/cover-letters/${id}`, { method: 'DELETE' });
  },
};
