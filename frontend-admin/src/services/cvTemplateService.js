import { apiRequest } from './apiClient';

/**
 * Service quản lý Template CV (Admin)
 * Kết nối API Backend Spring Boot: /api/admin/cv-templates
 * Kể từ V13 (gộp theme vào cv_template), mỗi template cũng mang theo
 * color_scheme/font_pair/layout_type/density — trước đây thuộc bảng theme
 * riêng (frontend-admin/src/pages/cv/ThemeManagementPage.jsx, đã xoá).
 */

// Danh mục phổ biến gợi ý sẵn trong dropdown (người dùng vẫn có thể nhập danh mục mới)
export const CV_TEMPLATE_CATEGORIES = ['IT', 'Marketing', 'Sinh viên', 'Thiết kế', 'Kinh doanh', 'Khác'];

export const DEFAULT_LAYOUT_CONFIG = {
  columns: 2,
  spacing: 'normal',
  sections_order: ['header', 'experience', 'education', 'skills'],
  header_style: 'sidebar-photo',
};

export const THEME_LAYOUT_TYPES = [
  { value: 'SINGLE', label: 'Một cột (Single)' },
  { value: 'SIDEBAR', label: 'Có sidebar (Sidebar)' },
];

export const THEME_DENSITIES = [
  { value: 'COMPACT', label: 'Gọn (Compact)' },
  { value: 'NORMAL', label: 'Vừa (Normal)' },
  { value: 'SPACIOUS', label: 'Rộng (Spacious)' },
];

export const DEFAULT_COLOR_SCHEME = {
  primary: '#2563EB',
  secondary: '#1E3A8A',
  accent: '#38BDF8',
  text: '#0F172A',
};

// layout_config lưu ở backend dưới dạng chuỗi JSON thô (String), parse an toàn để dùng trong UI
export const parseLayoutConfig = (layoutConfig) => {
  if (!layoutConfig) return { ...DEFAULT_LAYOUT_CONFIG };
  if (typeof layoutConfig === 'object') return layoutConfig;
  try {
    const parsed = JSON.parse(layoutConfig);
    return {
      columns: parsed.columns === 1 ? 1 : 2,
      spacing: ['compact', 'normal', 'spacious'].includes(parsed.spacing) ? parsed.spacing : 'normal',
      sections_order: Array.isArray(parsed.sections_order) && parsed.sections_order.length > 0
        ? parsed.sections_order
        : DEFAULT_LAYOUT_CONFIG.sections_order,
      header_style: parsed.header_style || DEFAULT_LAYOUT_CONFIG.header_style,
    };
  } catch {
    return { ...DEFAULT_LAYOUT_CONFIG };
  }
};

// color_scheme cũng lưu dưới dạng chuỗi JSON thô, parse an toàn để dùng trong UI
export const parseColorScheme = (colorScheme) => {
  if (!colorScheme) return { ...DEFAULT_COLOR_SCHEME };
  if (typeof colorScheme === 'object') return { ...DEFAULT_COLOR_SCHEME, ...colorScheme };
  try {
    return { ...DEFAULT_COLOR_SCHEME, ...JSON.parse(colorScheme) };
  } catch {
    return { ...DEFAULT_COLOR_SCHEME };
  }
};

const mapTemplate = (t) => ({
  ...t,
  layoutConfigObject: parseLayoutConfig(t.layoutConfig),
  colorSchemeObject: parseColorScheme(t.colorScheme),
  usageCount: t.usageCount ?? 0,
});

export const cvTemplateService = {
  // Lấy danh sách template có phân trang, tìm kiếm và lọc
  async listTemplates({ page = 0, size = 100, keyword = '', category = '', isPremium = null, isActive = null } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');
    if (keyword && keyword.trim()) {
      params.append('keyword', keyword.trim());
    }
    if (category && category !== 'all') {
      params.append('category', category);
    }
    if (isPremium === true || isPremium === false) {
      params.append('isPremium', isPremium);
    }
    if (isActive === true || isActive === false) {
      params.append('isActive', isActive);
    }

    const res = await apiRequest(`/api/admin/cv-templates?${params.toString()}`);
    const content = (res?.data?.content || []).map(mapTemplate);
    return {
      content,
      totalElements: res?.data?.totalElements ?? 0,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  // Xem chi tiết một Template
  async getTemplate(id) {
    const res = await apiRequest(`/api/admin/cv-templates/${id}`);
    return res?.data ? mapTemplate(res.data) : null;
  },

  // Tạo mới Template
  async createTemplate(payload) {
    const res = await apiRequest('/api/admin/cv-templates', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name.trim(),
        category: payload.category?.trim() || null,
        thumbnailUrl: payload.thumbnailUrl?.trim() || null,
        layoutConfig: JSON.stringify(payload.layoutConfig || DEFAULT_LAYOUT_CONFIG),
        colorScheme: JSON.stringify(payload.colorScheme || DEFAULT_COLOR_SCHEME),
        fontPair: payload.fontPair?.trim() || null,
        layoutType: payload.layoutType || 'SINGLE',
        density: payload.density || 'NORMAL',
        renderKey: payload.renderKey?.trim() || null,
        isPremium: Boolean(payload.isPremium),
        isActive: payload.isActive !== false,
      }),
    });
    return res?.data ? mapTemplate(res.data) : null;
  },

  // Cập nhật Template
  async updateTemplate(id, payload) {
    const res = await apiRequest(`/api/admin/cv-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: payload.name.trim(),
        category: payload.category?.trim() || null,
        thumbnailUrl: payload.thumbnailUrl?.trim() || null,
        layoutConfig: JSON.stringify(payload.layoutConfig || DEFAULT_LAYOUT_CONFIG),
        colorScheme: JSON.stringify(payload.colorScheme || DEFAULT_COLOR_SCHEME),
        fontPair: payload.fontPair?.trim() || null,
        layoutType: payload.layoutType || 'SINGLE',
        density: payload.density || 'NORMAL',
        renderKey: payload.renderKey?.trim() || null,
        isPremium: Boolean(payload.isPremium),
        isActive: payload.isActive !== false,
      }),
    });
    return res?.data ? mapTemplate(res.data) : null;
  },

  // Bật / tắt kích hoạt Template (dùng thay cho xoá khi template đang được sử dụng)
  async updateStatus(id, isActive) {
    const res = await apiRequest(`/api/admin/cv-templates/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: Boolean(isActive) }),
    });
    return res?.data ? mapTemplate(res.data) : null;
  },

  // Xoá Template (backend sẽ từ chối nếu đang có CV sử dụng)
  async deleteTemplate(id) {
    await apiRequest(`/api/admin/cv-templates/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Tải lên ảnh thumbnail cho Template, trả về thumbnailUrl
  async uploadThumbnail(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest('/api/admin/cv-templates/upload-thumbnail', {
      method: 'POST',
      body: formData,
    });
    return res?.data?.thumbnailUrl || null;
  },
};
