import { apiRequest } from './apiClient';

/**
 * Service cho tính năng "Việc làm phù hợp" (Job Matching)
 * Kết nối trực tiếp với Spring Boot backend qua: /api/me/job-postings
 */

export const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  INTERNSHIP: 'Thực tập',
  CONTRACT: 'Hợp đồng',
  REMOTE: 'Remote',
};

export const EXPERIENCE_LEVEL_LABELS = {
  INTERN: 'Thực tập sinh',
  FRESHER: 'Fresher',
  JUNIOR: 'Junior',
  MID: 'Middle',
  SENIOR: 'Senior',
  LEAD: 'Lead / Trưởng nhóm',
  MANAGER: 'Quản lý',
};

export const formatSalary = (job) => {
  if (job.isSalaryNegotiable && !job.salaryMin && !job.salaryMax) return 'Thoả thuận';
  const fmt = (v) => `${Math.round(v / 1_000_000)} triệu`;
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} - ${fmt(job.salaryMax)}`;
  if (job.salaryMin) return `Từ ${fmt(job.salaryMin)}`;
  if (job.salaryMax) return `Đến ${fmt(job.salaryMax)}`;
  return 'Thoả thuận';
};

export const jobPostingService = {
  async listJobs({ page = 0, size = 12, keyword = '', location = '', employmentType = '', experienceLevel = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (location) params.append('location', location);
    if (employmentType) params.append('employmentType', employmentType);
    if (experienceLevel) params.append('experienceLevel', experienceLevel);

    const res = await apiRequest(`/api/me/job-postings?${params.toString()}`);
    return {
      content: res?.data?.content || [],
      totalElements: res?.data?.totalElements ?? 0,
      totalPages: res?.data?.totalPages ?? 1,
    };
  },

  async getTopMatches(limit = 3) {
    try {
      const res = await apiRequest(`/api/me/job-postings/top-matches?limit=${limit}`);
      return res?.data || [];
    } catch (e) {
      console.warn('Lỗi tải top việc làm phù hợp:', e);
      return [];
    }
  },

  async getLocations() {
    const res = await apiRequest('/api/me/job-postings/locations');
    return res?.data || [];
  },

  async getJob(id) {
    const res = await apiRequest(`/api/me/job-postings/${id}`);
    return res?.data || null;
  },

  /**
   * Kết quả phân tích AI đã lưu của người dùng cho tin này (không gọi AI).
   * Trả null nếu chưa từng phân tích; `stale` = hồ sơ/tin đã đổi kể từ lần phân tích.
   */
  async getAiAnalysis(id) {
    const res = await apiRequest(`/api/me/job-postings/${id}/ai-analysis`);
    return res?.data || null;
  },

  /**
   * Chạy phân tích AI so sánh hồ sơ với tin tuyển dụng. Nếu hồ sơ/tin không đổi,
   * backend trả lại kết quả đã lưu (cached: true) mà không gọi AI; `refresh: true` ép chạy lại.
   */
  async runAiAnalysis(id, { modelId = null, refresh = false } = {}) {
    const res = await apiRequest(`/api/me/job-postings/${id}/ai-analysis`, {
      method: 'POST',
      body: JSON.stringify({ modelId, refresh }),
    });
    return res?.data || null;
  },
};
