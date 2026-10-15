import { apiRequest, API_BASE_URL } from './apiClient';

export const COURSE_LEVEL_LABELS = { BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao' };
export const COURSE_SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Học phí thấp đến cao' },
  { value: 'duration_asc', label: 'Thời lượng ngắn nhất' },
  { value: 'title_asc', label: 'Tên A–Z' },
];
export const formatCoursePrice = (course) => {
  if (course.isFree) return 'Miễn phí';
  if (course.price == null || course.price === '' || !Number.isFinite(Number(course.price))) return 'Liên hệ nhà cung cấp';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(course.price));
};
export const formatCourseDuration = (hours) => hours > 0 ? `${hours} giờ` : 'Chưa cập nhật thời lượng';

/** Only HTTP(S) links are usable as external course destinations. */
export const courseExternalUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
};
export const courseThumbnailUrl = (value) => {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) return courseExternalUrl(`${API_BASE_URL.replace(/\/$/, '')}${value}`);
  return courseExternalUrl(value);
};

export const courseService = {
  async list(filters, { signal } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value != null) params.set(key, String(value));
    });
    return (await apiRequest(`/api/me/courses?${params}`, { signal })).data;
  },
  async get(id, { signal } = {}) { return (await apiRequest(`/api/me/courses/${id}`, { signal })).data; },
  async filters({ signal } = {}) { return (await apiRequest('/api/me/courses/filters', { signal })).data; },
  async related(id, { signal } = {}) { return (await apiRequest(`/api/me/courses/${id}/related`, { signal })).data; },
};
