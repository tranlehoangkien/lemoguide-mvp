import { apiRequest } from '@/services/apiClient';

export const COURSE_LEVELS = [
  { value: 'BEGINNER', label: 'Cơ bản (Beginner)' },
  { value: 'INTERMEDIATE', label: 'Trung cấp (Intermediate)' },
  { value: 'ADVANCED', label: 'Nâng cao (Advanced)' },
  { value: 'ALL_LEVELS', label: 'Mọi cấp độ (All levels)' },
];

export const courseAdminService = {
  async listCourses({ page = 0, size = 10, keyword = '', level = '', isActive = null } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (keyword) params.append('keyword', keyword);
    if (level) params.append('level', level);
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      params.append('isActive', String(isActive));
    }

    const res = await apiRequest(`/api/admin/courses?${params.toString()}`);
    return res?.data || { content: [], totalElements: 0, totalPages: 1 };
  },

  async getCourse(id) {
    const res = await apiRequest(`/api/admin/courses/${id}`);
    return res?.data;
  },

  async createCourse(payload) {
    const res = await apiRequest('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  async updateCourse(id, payload) {
    const res = await apiRequest(`/api/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  /**
   * Every skill and technology a course can be tagged with. Reads the admin catalog APIs directly
   * (no local sample fallback, unlike skillService/technologyService): a fake id would tag the wrong
   * item. Tags drive course recommendations in Career Roadmap.
   */
  async listTagOptions() {
    const readAll = async (path) => {
      const items = [];
      for (let page = 0; page < 20; page += 1) {
        const res = await apiRequest(`${path}?page=${page}&size=200&sort=name,asc`);
        const content = res?.data?.content || [];
        items.push(...content);
        if (page + 1 >= (res?.data?.totalPages ?? 1) || content.length === 0) break;
      }
      return items;
    };
    const [skills, technologies] = await Promise.all([readAll('/api/admin/skills'), readAll('/api/admin/technologies')]);
    return { skills, technologies };
  },

  async deleteCourse(id) {
    await apiRequest(`/api/admin/courses/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
