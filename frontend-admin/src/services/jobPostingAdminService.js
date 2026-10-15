import { apiRequest } from '@/services/apiClient';

export const JOB_POSTING_SOURCES = [
  { value: 'INTERNAL', label: 'Hệ thống (Internal)' },
  { value: 'TOPCV', label: 'TopCV' },
  { value: 'ITVIEC', label: 'ITviec' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'VIETNAMWORKS', label: 'VietnamWorks' },
  { value: 'OTHER', label: 'Khác' },
];

export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Toàn thời gian (Full-time)' },
  { value: 'PART_TIME', label: 'Bán thời gian (Part-time)' },
  { value: 'INTERNSHIP', label: 'Thực tập sinh (Internship)' },
  { value: 'CONTRACT', label: 'Hợp đồng (Contract)' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'REMOTE', label: 'Từ xa (Remote)' },
];

export const EXPERIENCE_LEVELS = [
  { value: 'INTERN', label: 'Intern' },
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MIDDLE', label: 'Middle' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'MANAGER', label: 'Manager' },
];

export const JOB_POSTING_STATUSES = [
  { value: 'ACTIVE', label: 'Đang tuyển (Active)', color: '#15803d', bg: '#dcfce7' },
  { value: 'DRAFT', label: 'Bản nháp (Draft)', color: '#64748b', bg: '#f1f5f9' },
  { value: 'EXPIRED', label: 'Hết hạn (Expired)', color: '#d97706', bg: '#fef3c7' },
  { value: 'CLOSED', label: 'Đã đóng (Closed)', color: '#dc2626', bg: '#fee2e2' },
];

export const jobPostingAdminService = {
  async listJobs({ page = 0, size = 10, keyword = '', location = '', employmentType = '', experienceLevel = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    if (employmentType) params.append('employmentType', employmentType);
    if (experienceLevel) params.append('experienceLevel', experienceLevel);

    const res = await apiRequest(`/api/admin/job-postings?${params.toString()}`);
    return res?.data || { content: [], totalElements: 0, totalPages: 1 };
  },

  async getJob(id) {
    const res = await apiRequest(`/api/admin/job-postings/${id}`);
    return res?.data;
  },

  async createJob(payload) {
    const res = await apiRequest('/api/admin/job-postings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  async updateJob(id, payload) {
    const res = await apiRequest(`/api/admin/job-postings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res?.data;
  },

  async deleteJob(id) {
    await apiRequest(`/api/admin/job-postings/${id}`, {
      method: 'DELETE',
    });
    return true;
  },
};
