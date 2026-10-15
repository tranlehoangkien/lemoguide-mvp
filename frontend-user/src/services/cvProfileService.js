import { apiRequest } from './apiClient';

/**
 * Service quản lý CV cá nhân của người dùng (Self-service CV Engine)
 * Kết nối trực tiếp với Spring Boot backend qua: /api/me/cv-profiles
 */

const VALID_PUBLISH_MODES = ['PUBLIC_LINK', 'PDF', 'ATS_TEXT'];
const VALID_TARGET_MODES = ['FRONTEND', 'BACKEND', 'FULLSTACK'];

// Một CV chỉ thực sự xem công khai được khi is_active=true VÀ publish_mode=PUBLIC_LINK
// (xem PublicCvProfileService.requireShareable ở backend) - không phải "PUBLIC"/"PRIVATE".
const safeJsonParse = (val, fallback = null) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const mapCv = (c) => ({
  ...c,
  title: c.name || 'CV Không tiêu đề',
  isPublished: Boolean(c.isActive) && c.publishMode === 'PUBLIC_LINK',
  views: c.viewCount || 0,
  avatarUrl: c.avatarUrl || null,
  cvData: safeJsonParse(c.cvData, null),
  activeSections: safeJsonParse(c.activeSections, null),
});

const resolvePublishMode = (data) => {
  if (VALID_PUBLISH_MODES.includes(data.publishMode)) return data.publishMode;
  // Drafts use the private mode chosen by admins (PDF or ATS_TEXT), passed as draftMode by the caller.
  return data.isPublished ? 'PUBLIC_LINK' : (VALID_PUBLISH_MODES.includes(data.draftMode) && data.draftMode !== 'PUBLIC_LINK' ? data.draftMode : 'PDF');
};

const resolveTargetMode = (data) => (VALID_TARGET_MODES.includes(data.targetMode) ? data.targetMode : 'FULLSTACK');

export const cvProfileService = {
  // Lấy danh sách CV của tôi
  async getMyCvs({ page = 0, size = 20 } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');

    const res = await apiRequest(`/api/me/cv-profiles?${params.toString()}`);
    const content = (res?.data?.content || []).map(mapCv);
    return {
      content,
      totalElements: res?.data?.totalElements ?? content.length,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  // Chi tiết CV
  async getCvDetail(id) {
    const res = await apiRequest(`/api/me/cv-profiles/${id}`);
    return res?.data ? mapCv(res.data) : null;
  },

  // Tạo mới CV
  async createCv(data) {
    const res = await apiRequest('/api/me/cv-profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name || data.title || 'CV Mới tạo',
        targetMode: resolveTargetMode(data),
        publishMode: resolvePublishMode(data),
        templateId: data.templateId ? Number(data.templateId) : null,
        avatarUrl: data.avatarUrl || null,
        cvData: data.cvData ? (typeof data.cvData === 'string' ? data.cvData : JSON.stringify(data.cvData)) : null,
        activeSections: data.activeSections
          ? (typeof data.activeSections === 'string' ? data.activeSections : JSON.stringify(data.activeSections))
          : null,
        isActive: data.isActive !== false,
      }),
    });
    return res?.data ? mapCv(res.data) : null;
  },

  // Cập nhật CV
  async updateCv(id, data) {
    const res = await apiRequest(`/api/me/cv-profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: data.name || data.title,
        targetMode: resolveTargetMode(data),
        publishMode: resolvePublishMode(data),
        templateId: data.templateId ? Number(data.templateId) : null,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : null,
        cvData: data.cvData ? (typeof data.cvData === 'string' ? data.cvData : JSON.stringify(data.cvData)) : null,
        activeSections: data.activeSections
          ? (typeof data.activeSections === 'string' ? data.activeSections : JSON.stringify(data.activeSections))
          : null,
        isActive: data.isActive !== false,
      }),
    });
    return res?.data ? mapCv(res.data) : null;
  },

  // Tải ảnh đại diện riêng cho CV (không ảnh hưởng hồ sơ profile cá nhân)
  async uploadCvAvatar(cvId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest(`/api/me/cv-profiles/${cvId}/avatar`, {
      method: 'POST',
      body: formData,
    });
    return res?.data ? mapCv(res.data) : null;
  },

  // Tải ảnh đơn lẻ dành cho CV (trả về { avatarUrl })
  async uploadCvImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest('/api/me/cv-profiles/upload-avatar', {
      method: 'POST',
      body: formData,
    });
    return res?.data || null;
  },

  // Trích xuất text từ file CV PDF tải lên (dùng cho trợ lý AI CV Builder, không lưu gì cả)
  async extractPdfText(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest('/api/me/cv-profiles/extract-pdf-text', {
      method: 'POST',
      body: formData,
    });
    return res?.data?.text || '';
  },

  // Xóa CV
  async deleteCv(id) {
    await apiRequest(`/api/me/cv-profiles/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
