import { apiRequest } from './apiClient';
import cv1Thumb from '@/assets/CV/CV1.jpg';
import cv2Thumb from '@/assets/CV/CV2.jpg';
import cv3Thumb from '@/assets/CV/CV3.jpg';

/**
 * Service lấy danh sách Template CV đang kích hoạt cho người dùng chọn khi
 * tạo CV mới. Tích hợp endpoint `/api/lookups/cv-templates` (public/user-facing).
 * Kể từ khi gộp theme vào template (backend V13), mỗi template đã mang theo
 * luôn color_scheme/font_pair/layout_type/density của nó.
 */

export const FALLBACK_TEMPLATES = [
  {
    id: 1,
    name: 'Sidebar Xanh Chuyên Nghiệp',
    category: 'IT / Kỹ thuật',
    thumbnailUrl: cv1Thumb,
    renderKey: 'green-sidebar',
    isPremium: false,
    isActive: true,
    description: 'Bố cục 2 cột với sidebar xanh lá nổi bật, tối ưu cho kỹ sư phần mềm & CNTT chuẩn ATS.',
    colorSchemeObject: { primary: '#3E5641', secondary: '#2C3E2E', accent: '#6B8E6F', text: '#1F2937' },
    fontPair: 'Roboto',
    layoutType: 'sidebar',
    density: 'compact',
  },
  {
    id: 2,
    name: 'Navy Hiện Đại Hai Tông',
    category: 'IT / Quản lý',
    thumbnailUrl: cv2Thumb,
    renderKey: 'navy-modern',
    isPremium: false,
    isActive: true,
    description: 'Bố cục 1 cột tinh gọn, hiện đại với tông xanh Navy thanh lịch và chuyên nghiệp.',
    colorSchemeObject: { primary: '#1E293B', secondary: '#334155', accent: '#2563EB', text: '#0F172A' },
    fontPair: 'Inter',
    layoutType: 'single',
    density: 'normal',
  },
  {
    id: 3,
    name: 'Nâu Sáng Tạo Hai Cột',
    category: 'Thiết kế & Sản phẩm',
    thumbnailUrl: cv3Thumb,
    renderKey: 'brown-two-column',
    isPremium: false,
    isActive: true,
    description: 'Bố cục 2 cột thanh thoát với tông nâu ấm áp tạo điểm nhấn cá nhân độc đáo.',
    colorSchemeObject: { primary: '#8B6F47', secondary: '#6B5637', accent: '#C9A876', text: '#3B2F1E' },
    fontPair: 'Poppins',
    layoutType: 'sidebar',
    density: 'normal',
  },
];

export const parseLayoutConfig = (layoutConfig) => {
  const fallback = { columns: 1, spacing: 'normal', sections_order: [], header_style: 'minimal-classic' };
  if (!layoutConfig) return fallback;
  if (typeof layoutConfig === 'object') return { ...fallback, ...layoutConfig };
  try {
    return { ...fallback, ...JSON.parse(layoutConfig) };
  } catch {
    return fallback;
  }
};

const FALLBACK_COLOR_SCHEME = { primary: '#15803d', secondary: '#166534', accent: '#22c55e', text: '#0f172a' };

export const parseColorScheme = (colorScheme) => {
  if (!colorScheme) return { ...FALLBACK_COLOR_SCHEME };
  if (typeof colorScheme === 'object') return { ...FALLBACK_COLOR_SCHEME, ...colorScheme };
  try {
    return { ...FALLBACK_COLOR_SCHEME, ...JSON.parse(colorScheme) };
  } catch {
    return { ...FALLBACK_COLOR_SCHEME };
  }
};

const mapTemplate = (t) => {
  let renderKey = t.renderKey;
  if (!renderKey) {
    const name = t.name || '';
    if (name.includes('Sidebar') || name.includes('Xanh') || name.includes('Fullstack') || Number(t.id) === 11 || Number(t.id) === 1) {
      renderKey = 'green-sidebar';
    } else if (name.includes('Navy') || name.includes('Frontend') || Number(t.id) === 12 || Number(t.id) === 2) {
      renderKey = 'navy-modern';
    } else if (name.includes('Nâu') || name.includes('Nau') || name.includes('Backend') || Number(t.id) === 13 || Number(t.id) === 3) {
      renderKey = 'brown-two-column';
    } else {
      renderKey = 'green-sidebar';
    }
  }

  let thumb = t.thumbnailUrl;
  if (renderKey === 'green-sidebar' || !thumb || (typeof thumb === 'string' && thumb.includes('cv1.jpg'))) thumb = cv1Thumb;
  else if (renderKey === 'navy-modern' || (typeof thumb === 'string' && thumb.includes('cv2.jpg'))) thumb = cv2Thumb;
  else if (renderKey === 'brown-two-column' || (typeof thumb === 'string' && thumb.includes('cv3.jpg'))) thumb = cv3Thumb;
  else if (typeof thumb === 'string' && thumb.startsWith('http')) thumb = thumb;
  else thumb = cv1Thumb;

  return {
    ...t,
    renderKey,
    thumbnailUrl: thumb,
    layoutConfigObject: parseLayoutConfig(t.layoutConfig),
    colorSchemeObject: parseColorScheme(t.colorScheme),
  };
};

export const cvTemplateService = {
  // Danh sách template đang active, dùng cho bộ chọn template khi tạo CV
  async listActiveTemplates() {
    try {
      const res = await apiRequest('/api/lookups/cv-templates?size=100&sort=name,asc');
      const content = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(content) && content.length > 0) {
        return content.map(mapTemplate);
      }
    } catch (error) {
      console.warn('Không thể tải danh sách template CV từ server, sử dụng template dự phòng:', error);
    }
    return FALLBACK_TEMPLATES;
  },

  // 3 template đã được clone giao diện thật — dùng cho màn hình "Tạo CV"
  async listRenderableTemplates() {
    try {
      const all = await this.listActiveTemplates();
      const renderable = all.filter((t) => !!t.renderKey);
      if (renderable.length > 0) {
        return renderable;
      }
    } catch (error) {
      console.warn('Lỗi xử lý renderable templates, sử dụng template dự phòng:', error);
    }
    return FALLBACK_TEMPLATES;
  },
};
