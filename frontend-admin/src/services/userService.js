import { apiRequest } from './apiClient';

/**
 * Service quản lý người dùng LemoGuide (USER accounts)
 * Kết nối trực tiếp 100% với Backend API Spring Boot (/api/admin/users)
 */
export const userService = {
  async getUsage(id) {
    const res = await apiRequest(`/api/admin/users/${id}/usage`);
    return res.data;
  },
  // Lấy danh sách người dùng có phân trang, tìm kiếm và lọc trạng thái
  async listUsers({ page = 0, size = 10, search = '', status = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'id,desc');
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (status && status !== 'all') {
      params.append('status', status.toUpperCase());
    }

    const res = await apiRequest(`/api/admin/users?${params.toString()}`);

    if (res?.data?.content) {
      return {
        content: res.data.content.map((u) => ({
          id: u.id,
          fullName: u.fullName || u.email?.split('@')[0],
          avatarUrl: u.avatarUrl || null,
          email: u.email,
          primaryContact: u.primaryContact || '',
          primaryContactType: u.primaryContactType || '',
          contactCount: u.contactCount || 0,
          currentTitle: u.currentTitle || 'Lập trình viên',
          city: u.city || '',
          status: (u.status || 'ACTIVE').toLowerCase(),
          cvCount: u.cvCount || 0,
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '',
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập',
          deletedAt: u.deletedAt,
          role: u.role,
        })),
        totalElements: res.data.totalElements ?? 0,
        totalPages: res.data.totalPages ?? 1,
      };
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 1,
    };
  },

  // Tải lên ảnh đại diện cho User
  async uploadAvatar(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest(`/api/admin/users/${id}/avatar`, {
      method: 'POST',
      body: formData,
    });
    return res?.data;
  },

  // Lấy thông tin chi tiết đầy đủ của một User (gồm cả profile, contacts và các phần dữ liệu CV)
  async getUser(id) {
    const res = await apiRequest(`/api/admin/users/${id}`);
    const u = res.data;
    if (!u) throw new Error('Không tìm thấy thông tin người dùng');

    return {
      id: u.id,
      email: u.email,
      role: u.role,
      status: (u.status || 'ACTIVE').toLowerCase(),
      planId: u.planId ?? null,
      planName: u.planName || null,
      fullName: u.profile?.fullName || u.email?.split('@')[0],
      avatarUrl: u.profile?.avatarUrl || null,
      currentTitle: u.profile?.currentTitle || 'Lập trình viên',
      contacts: u.contacts || [],
      education: u.education || [],
      experiences: u.experiences || [],
      projects: u.projects || [],
      skills: u.skills || [],
      certificates: u.certificates || [],
      awards: u.awards || [],
      interests: u.interests || [],
      referrers: u.referrers || [],
      city: u.profile?.city || '',
      district: u.profile?.district || '',
      gender: u.profile?.gender || '',
      dateOfBirth: u.profile?.dateOfBirth || '',
      shortTermGoal: u.profile?.shortTermGoal || '',
      longTermGoal: u.profile?.longTermGoal || '',
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '',
      lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : 'Chưa đăng nhập',
      deletedAt: u.deletedAt,
    };
  },

  // Cập nhật trạng thái tài khoản User
  async updateUserStatus(id, status) {
    return await apiRequest(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: status.toUpperCase(),
      }),
    });
  },

  // Cập nhật gói của người dùng (đổi gói ngay lập tức, không mất phí)
  async updateUserPlan(id, planId) {
    return await apiRequest(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ planId }),
    });
  },

  // Tạo người dùng mới qua API kèm danh sách liên hệ ban đầu
  async createUser(userData) {
    const createRes = await apiRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email.trim(),
        password: userData.password || 'Password123!',
        fullName: userData.fullName.trim(),
      }),
    });

    const created = createRes?.data;
    if (!created?.id) {
      throw new Error('Tạo tài khoản người dùng thất bại');
    }

    // Nếu có avatar file, tải lên avatar ngay
    if (userData.avatarFile) {
      try {
        await this.uploadAvatar(created.id, userData.avatarFile);
      } catch (aErr) {
        console.warn('Lỗi tải avatar khi tạo user:', aErr);
      }
    }

    // Nếu có bổ sung thông tin profile, gọi API cập nhật profile
    const profileUpdates = {};
    if (userData.currentTitle) profileUpdates.currentTitle = userData.currentTitle.trim();
    if (userData.city) profileUpdates.city = userData.city.trim();
    if (userData.district) profileUpdates.district = userData.district.trim();
    if (userData.dateOfBirth) profileUpdates.dateOfBirth = userData.dateOfBirth;
    if (userData.gender) profileUpdates.gender = userData.gender;
    if (userData.shortTermGoal) profileUpdates.shortTermGoal = userData.shortTermGoal.trim();
    if (userData.longTermGoal) profileUpdates.longTermGoal = userData.longTermGoal.trim();

    if (Object.keys(profileUpdates).length > 0) {
      try {
        await apiRequest(`/api/admin/users/${created.id}/profile`, {
          method: 'PATCH',
          body: JSON.stringify(profileUpdates),
        });
      } catch (err) {
        console.warn('Cập nhật profile phụ sau tạo mới gặp cảnh báo:', err);
      }
    }

    // Nếu có danh sách kênh liên hệ ban đầu, gọi API tạo contact cho user
    if (Array.isArray(userData.contacts) && userData.contacts.length > 0) {
      for (const c of userData.contacts) {
        if (c.value && c.value.trim()) {
          try {
            await apiRequest(`/api/admin/users/${created.id}/contacts`, {
              method: 'POST',
              body: JSON.stringify({
                type: c.type || 'PHONE',
                value: c.value.trim(),
                primary: Boolean(c.primary),
              }),
            });
          } catch (cErr) {
            console.warn('Lỗi tạo kênh liên hệ sau tạo user:', cErr);
          }
        }
      }
    }

    // Nếu trạng thái khác ACTIVE, cập nhật status
    if (userData.status && userData.status.toUpperCase() !== 'ACTIVE') {
      try {
        await apiRequest(`/api/admin/users/${created.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: userData.status.toUpperCase(),
          }),
        });
      } catch (err) {
        console.warn('Cập nhật status sau tạo mới gặp cảnh báo:', err);
      }
    }

    return created;
  },

  // Cập nhật người dùng (hồ sơ profile và trạng thái account)
  async updateUser(id, userData) {
    // 0. Cập nhật ảnh đại diện nếu có
    if (userData.avatarFile) {
      try {
        await this.uploadAvatar(id, userData.avatarFile);
      } catch (aErr) {
        console.warn('Lỗi cập nhật avatar user:', aErr);
      }
    }

    // 1. Cập nhật hồ sơ user_information
    const profileBody = {};
    if (userData.fullName) profileBody.fullName = userData.fullName.trim();
    if (userData.currentTitle !== undefined) profileBody.currentTitle = userData.currentTitle ? userData.currentTitle.trim() : '';
    if (userData.city !== undefined) profileBody.city = userData.city ? userData.city.trim() : '';
    if (userData.district !== undefined) profileBody.district = userData.district ? userData.district.trim() : '';
    if (userData.dateOfBirth !== undefined) profileBody.dateOfBirth = userData.dateOfBirth || null;
    if (userData.gender !== undefined) profileBody.gender = userData.gender;
    if (userData.shortTermGoal !== undefined) profileBody.shortTermGoal = userData.shortTermGoal ? userData.shortTermGoal.trim() : '';
    if (userData.longTermGoal !== undefined) profileBody.longTermGoal = userData.longTermGoal ? userData.longTermGoal.trim() : '';

    if (Object.keys(profileBody).length > 0) {
      await apiRequest(`/api/admin/users/${id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(profileBody),
      });
    }

    // 2. Cập nhật trạng thái nếu có
    if (userData.status) {
      await apiRequest(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: userData.status.toUpperCase(),
        }),
      });
    }

    // 3. Đồng bộ danh sách kênh liên hệ nếu có truyền userData.contacts
    if (Array.isArray(userData.contacts)) {
      try {
        const currentContactsRes = await apiRequest(`/api/admin/users/${id}/contacts`);
        const currentContacts = currentContactsRes?.data || [];
        const validContacts = userData.contacts.filter((c) => c.value && c.value.trim());

        // Xóa những contact cũ không còn trong danh sách mới
        const keepIds = new Set(validContacts.filter((c) => c.id).map((c) => c.id));
        for (const oldC of currentContacts) {
          if (!keepIds.has(oldC.id)) {
            try {
              await apiRequest(`/api/admin/users/${id}/contacts/${oldC.id}`, { method: 'DELETE' });
            } catch (err) {
              console.warn('Lỗi xóa contact cũ:', err);
            }
          }
        }

        // Cập nhật hoặc tạo mới
        for (const c of validContacts) {
          if (c.id) {
            try {
              await apiRequest(`/api/admin/users/${id}/contacts/${c.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  type: c.type || 'PHONE',
                  value: c.value.trim(),
                  primary: Boolean(c.primary),
                }),
              });
            } catch (err) {
              console.warn('Lỗi cập nhật contact:', err);
            }
          } else {
            try {
              await apiRequest(`/api/admin/users/${id}/contacts`, {
                method: 'POST',
                body: JSON.stringify({
                  type: c.type || 'PHONE',
                  value: c.value.trim(),
                  primary: Boolean(c.primary),
                }),
              });
            } catch (err) {
              console.warn('Lỗi tạo mới contact:', err);
            }
          }
        }
      } catch (cErr) {
        console.warn('Lỗi đồng bộ contacts:', cErr);
      }
    }

    return { id, ...userData };
  },

  // Xóa mềm người dùng
  async deleteUser(id) {
    await apiRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
    return true;
  },

  // Khôi phục tài khoản người dùng đã xóa
  async restoreUser(id) {
    return await apiRequest(`/api/admin/users/${id}/restore`, {
      method: 'POST',
    });
  },

  // Thêm thông tin học vấn cho người dùng
  async addEducation(userId, educationData) {
    return await apiRequest(`/api/admin/users/${userId}/education`, {
      method: 'POST',
      body: JSON.stringify(educationData),
    });
  },

  // Cập nhật thông tin học vấn của người dùng
  async updateEducation(userId, educationId, educationData) {
    return await apiRequest(`/api/admin/users/${userId}/education/${educationId}`, {
      method: 'PUT',
      body: JSON.stringify(educationData),
    });
  },

  // Xóa thông tin học vấn của người dùng
  async deleteEducation(userId, educationId) {
    return await apiRequest(`/api/admin/users/${userId}/education/${educationId}`, {
      method: 'DELETE',
    });
  },

  // Thêm kinh nghiệm làm việc cho người dùng
  async addExperience(userId, experienceData) {
    return await apiRequest(`/api/admin/users/${userId}/experiences`, {
      method: 'POST',
      body: JSON.stringify(experienceData),
    });
  },

  // Cập nhật kinh nghiệm làm việc của người dùng
  async updateExperience(userId, experienceId, experienceData) {
    return await apiRequest(`/api/admin/users/${userId}/experiences/${experienceId}`, {
      method: 'PUT',
      body: JSON.stringify(experienceData),
    });
  },

  // Xóa kinh nghiệm làm việc của người dùng
  async deleteExperience(userId, experienceId) {
    return await apiRequest(`/api/admin/users/${userId}/experiences/${experienceId}`, {
      method: 'DELETE',
    });
  },

  // Thêm dự án cho người dùng
  async addProject(userId, projectData) {
    return await apiRequest(`/api/admin/users/${userId}/projects`, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Cập nhật dự án của người dùng
  async updateProject(userId, projectId, projectData) {
    return await apiRequest(`/api/admin/users/${userId}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  // Xóa dự án của người dùng
  async deleteProject(userId, projectId) {
    return await apiRequest(`/api/admin/users/${userId}/projects/${projectId}`, {
      method: 'DELETE',
    });
  },

  // Gán kỹ năng cho người dùng
  async addSkill(userId, skillData) {
    return await apiRequest(`/api/admin/users/${userId}/skills`, {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  },

  // Cập nhật kỹ năng của người dùng
  async updateSkill(userId, userSkillId, skillData) {
    return await apiRequest(`/api/admin/users/${userId}/skills/${userSkillId}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
  },

  // Xóa kỹ năng khỏi hồ sơ người dùng
  async deleteSkill(userId, userSkillId) {
    return await apiRequest(`/api/admin/users/${userId}/skills/${userSkillId}`, {
      method: 'DELETE',
    });
  },

  // Thêm chứng chỉ cho người dùng
  async addCertificate(userId, certificateData) {
    return await apiRequest(`/api/admin/users/${userId}/certificates`, {
      method: 'POST',
      body: JSON.stringify(certificateData),
    });
  },

  // Cập nhật chứng chỉ của người dùng
  async updateCertificate(userId, certificateId, certificateData) {
    return await apiRequest(`/api/admin/users/${userId}/certificates/${certificateId}`, {
      method: 'PUT',
      body: JSON.stringify(certificateData),
    });
  },

  // Xóa chứng chỉ của người dùng
  async deleteCertificate(userId, certificateId) {
    return await apiRequest(`/api/admin/users/${userId}/certificates/${certificateId}`, {
      method: 'DELETE',
    });
  },

  // Thêm giải thưởng cho người dùng
  async addAward(userId, awardData) {
    return await apiRequest(`/api/admin/users/${userId}/awards`, {
      method: 'POST',
      body: JSON.stringify(awardData),
    });
  },

  // Cập nhật giải thưởng của người dùng
  async updateAward(userId, awardId, awardData) {
    return await apiRequest(`/api/admin/users/${userId}/awards/${awardId}`, {
      method: 'PUT',
      body: JSON.stringify(awardData),
    });
  },

  // Xóa giải thưởng của người dùng
  async deleteAward(userId, awardId) {
    return await apiRequest(`/api/admin/users/${userId}/awards/${awardId}`, {
      method: 'DELETE',
    });
  },

  // Thêm sở thích cho người dùng
  async addInterest(userId, interestData) {
    return await apiRequest(`/api/admin/users/${userId}/interests`, {
      method: 'POST',
      body: JSON.stringify(interestData),
    });
  },

  // Cập nhật sở thích của người dùng
  async updateInterest(userId, interestId, interestData) {
    return await apiRequest(`/api/admin/users/${userId}/interests/${interestId}`, {
      method: 'PUT',
      body: JSON.stringify(interestData),
    });
  },

  // Xóa sở thích của người dùng
  async deleteInterest(userId, interestId) {
    return await apiRequest(`/api/admin/users/${userId}/interests/${interestId}`, {
      method: 'DELETE',
    });
  },

  // Thêm người giới thiệu cho người dùng
  async addReferrer(userId, referrerData) {
    return await apiRequest(`/api/admin/users/${userId}/referrers`, {
      method: 'POST',
      body: JSON.stringify(referrerData),
    });
  },

  // Cập nhật người giới thiệu của người dùng
  async updateReferrer(userId, referrerId, referrerData) {
    return await apiRequest(`/api/admin/users/${userId}/referrers/${referrerId}`, {
      method: 'PUT',
      body: JSON.stringify(referrerData),
    });
  },

  // Xóa người giới thiệu của người dùng
  async deleteReferrer(userId, referrerId) {
    return await apiRequest(`/api/admin/users/${userId}/referrers/${referrerId}`, {
      method: 'DELETE',
    });
  },
};
