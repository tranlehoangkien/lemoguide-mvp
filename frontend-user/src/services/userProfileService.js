import { apiRequest } from './apiClient';

/**
 * Service quản lý toàn diện thông tin cá nhân và dữ liệu CV của Người dùng (Self-service).
 * Kết nối 100% với các endpoint Spring Boot: /api/me/** và /api/lookups/**.
 */
export const userProfileService = {
  async getProgress() {
    return (await apiRequest('/api/me/profile-progress'))?.data;
  },
  // ================= 1. HỒ SƠ & TÀI KHOẢN (/api/me) =================
  async getMyProfile() {
    const res = await apiRequest('/api/me');
    const u = res?.data;
    if (!u) throw new Error('Không thể tải thông tin tài khoản');

    return {
      id: u.id,
      email: u.email,
      role: u.role,
      status: (u.status || 'ACTIVE').toLowerCase(),
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '',
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập',
      planId: u.planId ?? null,
      planName: u.planName || 'Free',
      fullName: u.profile?.fullName || u.email?.split('@')[0],
      avatarUrl: u.profile?.avatarUrl || null,
      currentTitle: u.profile?.currentTitle || '',
      city: u.profile?.city || '',
      district: u.profile?.district || '',
      gender: u.profile?.gender || '',
      dateOfBirth: u.profile?.dateOfBirth || '',
      shortTermGoal: u.profile?.shortTermGoal || '',
      longTermGoal: u.profile?.longTermGoal || '',
    };
  },

  async updateMyProfile(data) {
    const res = await apiRequest('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res?.data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest('/api/me/avatar', {
      method: 'POST',
      body: formData,
    });
    return res?.data;
  },

  async changePassword({ currentPassword, newPassword }) {
    return await apiRequest('/api/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // ================= 2. CÁC KÊNH LIÊN LẠC (/api/me/contacts) =================
  async getContacts() {
    const res = await apiRequest('/api/me/contacts?size=100');
    return res?.data?.content || [];
  },

  async createContact(contactData) {
    const res = await apiRequest('/api/me/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
    return res?.data;
  },

  async updateContact(id, contactData) {
    const res = await apiRequest(`/api/me/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
    return res?.data;
  },

  async deleteContact(id) {
    return await apiRequest(`/api/me/contacts/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= 3. HỌC VẤN (/api/me/education) =================
  async getEducation() {
    const res = await apiRequest('/api/me/education?size=100');
    return res?.data?.content || [];
  },

  async createEducation(eduData) {
    const res = await apiRequest('/api/me/education', {
      method: 'POST',
      body: JSON.stringify(eduData),
    });
    return res?.data;
  },

  async updateEducation(id, eduData) {
    const res = await apiRequest(`/api/me/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eduData),
    });
    return res?.data;
  },

  async deleteEducation(id) {
    return await apiRequest(`/api/me/education/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= 4. KINH NGHIỆM LÀM VIỆC (/api/me/experiences) =================
  async getExperiences() {
    const res = await apiRequest('/api/me/experiences?size=100');
    return res?.data?.content || [];
  },

  async createExperience(expData) {
    const res = await apiRequest('/api/me/experiences', {
      method: 'POST',
      body: JSON.stringify(expData),
    });
    return res?.data;
  },

  async updateExperience(id, expData) {
    const res = await apiRequest(`/api/me/experiences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expData),
    });
    return res?.data;
  },

  async deleteExperience(id) {
    return await apiRequest(`/api/me/experiences/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= 5. DỰ ÁN (/api/me/projects) =================
  async getProjects() {
    const res = await apiRequest('/api/me/projects?size=100');
    return res?.data?.content || [];
  },

  async createProject(projectData) {
    const res = await apiRequest('/api/me/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return res?.data;
  },

  async updateProject(id, projectData) {
    const res = await apiRequest(`/api/me/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    return res?.data;
  },

  async deleteProject(id) {
    return await apiRequest(`/api/me/projects/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= 6. KỸ NĂNG (/api/me/skills) =================
  async getSkills() {
    const res = await apiRequest('/api/me/skills?size=100');
    return res?.data?.content || [];
  },

  async createSkill(skillData) {
    const res = await apiRequest('/api/me/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
    return res?.data;
  },

  async updateSkill(id, skillData) {
    const res = await apiRequest(`/api/me/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
    return res?.data;
  },

  async deleteSkill(id) {
    return await apiRequest(`/api/me/skills/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= 7. MỤC BỔ SUNG (/api/me/certificates, awards, interests, referrers) =================
  async getCertificates() {
    const res = await apiRequest('/api/me/certificates?size=100');
    return res?.data?.content || [];
  },
  async createCertificate(data) {
    const res = await apiRequest('/api/me/certificates', { method: 'POST', body: JSON.stringify(data) });
    return res?.data;
  },
  async updateCertificate(id, data) {
    const res = await apiRequest(`/api/me/certificates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return res?.data;
  },
  async deleteCertificate(id) {
    return await apiRequest(`/api/me/certificates/${id}`, { method: 'DELETE' });
  },

  async getAwards() {
    const res = await apiRequest('/api/me/awards?size=100');
    return res?.data?.content || [];
  },
  async createAward(data) {
    const res = await apiRequest('/api/me/awards', { method: 'POST', body: JSON.stringify(data) });
    return res?.data;
  },
  async updateAward(id, data) {
    const res = await apiRequest(`/api/me/awards/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return res?.data;
  },
  async deleteAward(id) {
    return await apiRequest(`/api/me/awards/${id}`, { method: 'DELETE' });
  },

  async getInterests() {
    const res = await apiRequest('/api/me/interests?size=100');
    return res?.data?.content || [];
  },
  async createInterest(data) {
    const res = await apiRequest('/api/me/interests', { method: 'POST', body: JSON.stringify(data) });
    return res?.data;
  },
  async updateInterest(id, data) {
    const res = await apiRequest(`/api/me/interests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return res?.data;
  },
  async deleteInterest(id) {
    return await apiRequest(`/api/me/interests/${id}`, { method: 'DELETE' });
  },

  async getReferrers() {
    const res = await apiRequest('/api/me/referrers?size=100');
    return res?.data?.content || [];
  },
  async createReferrer(data) {
    const res = await apiRequest('/api/me/referrers', { method: 'POST', body: JSON.stringify(data) });
    return res?.data;
  },
  async updateReferrer(id, data) {
    const res = await apiRequest(`/api/me/referrers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return res?.data;
  },
  async deleteReferrer(id) {
    return await apiRequest(`/api/me/referrers/${id}`, { method: 'DELETE' });
  },

  // ================= 8. LOOKUPS (/api/lookups/**) =================
  async getMajors() {
    const res = await apiRequest('/api/lookups/majors?size=200');
    return res?.data?.content || [];
  },

  async getSkillsList() {
    const res = await apiRequest('/api/lookups/skills?size=200');
    return res?.data?.content || [];
  },

  async getTechnologiesList() {
    const res = await apiRequest('/api/lookups/technologies?size=200');
    return res?.data?.content || [];
  },
};
