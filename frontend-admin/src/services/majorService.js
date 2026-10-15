import { apiRequest } from './apiClient';

/**
 * Service quản lý Chuyên ngành (Majors)
 * Kết nối API Backend Spring Boot: /api/admin/majors
 */

// Dữ liệu mẫu khởi tạo phong phú cho hệ thống gợi ý & fallback
const DEFAULT_SAMPLE_MAJORS = [
  {
    id: 1,
    name: 'Kỹ thuật phần mềm (Software Engineering)',
    description: 'Đào tạo quy trình phát triển phần mềm chuẩn công nghiệp, kiến trúc hệ thống, kiểm thử và quản lý dự án Agile/Scrum.',
    createdAt: '2026-01-10T08:00:00',
    updatedAt: '2026-03-01T10:30:00',
  },
  {
    id: 2,
    name: 'Khoa học máy tính (Computer Science)',
    description: 'Nghiên cứu nền tảng lý thuyết tính toán, thuật toán nâng cao, cấu trúc dữ liệu, trí tuệ nhân tạo và xử lý ngôn ngữ tự nhiên.',
    createdAt: '2026-01-12T09:15:00',
    updatedAt: '2026-02-15T14:20:00',
  },
  {
    id: 3,
    name: 'Hệ thống thông tin (Information Systems)',
    description: 'Thiết kế, tích hợp và tối ưu hóa hệ thống ERP, CRM, phân tích nghiệp vụ (Business Analysis) và kiến trúc dữ liệu doanh nghiệp.',
    createdAt: '2026-01-15T11:00:00',
    updatedAt: '2026-02-28T16:45:00',
  },
  {
    id: 4,
    name: 'An toàn thông tin (Cybersecurity & Information Security)',
    description: 'Bảo mật mạng, mật mã học, phân tích mã độc, đánh giá an ninh ứng dụng (Pentest) và phản ứng sự cố an ninh SOC/SIEM.',
    createdAt: '2026-01-20T14:30:00',
    updatedAt: '2026-03-05T09:10:00',
  },
  {
    id: 5,
    name: 'Khoa học dữ liệu & Trí tuệ nhân tạo (Data Science & AI)',
    description: 'Khai phá dữ liệu lớn (Big Data), học máy (Machine Learning), học sâu (Deep Learning) và trực quan hóa phân tích kinh doanh.',
    createdAt: '2026-01-25T13:20:00',
    updatedAt: '2026-03-08T11:00:00',
  },
  {
    id: 6,
    name: 'Mạng máy tính & Truyền thông dữ liệu (Network & Communications)',
    description: 'Quản trị hạ tầng mạng viễn thông, mạng đám mây (Cloud Networking), ảo hóa mạng SDN và giao thức IoT.',
    createdAt: '2026-02-01T10:00:00',
    updatedAt: '2026-02-25T15:30:00',
  },
  {
    id: 7,
    name: 'Thiết kế Đồ họa & Đa phương tiện (Graphic & Multimedia Design)',
    description: 'Nghiên cứu trải nghiệm người dùng UI/UX, thiết kế giao diện sản phẩm số, hiệu ứng kỹ xảo 2D/3D và hoạt họa tương tác.',
    createdAt: '2026-02-05T15:00:00',
    updatedAt: '2026-03-02T13:40:00',
  },
  {
    id: 8,
    name: 'Công nghệ thông tin ứng dụng (Information Technology)',
    description: 'Ứng dụng tổng hợp giải pháp phần cứng, phần mềm, quản trị hệ cơ sở dữ liệu và vận hành hệ thống IT doanh nghiệp.',
    createdAt: '2026-02-10T08:45:00',
    updatedAt: '2026-02-20T17:00:00',
  },
];

const LOCAL_STORAGE_KEY = 'lemoguide_admin_majors_cache';

const getLocalCache = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return DEFAULT_SAMPLE_MAJORS;
};

const saveLocalCache = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
};

export const majorService = {
  // Lấy danh sách chuyên ngành có tìm kiếm và phân trang
  async listMajors({ page = 0, size = 10, search = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');
    if (search && search.trim()) {
      params.append('keyword', search.trim());
    }

    try {
      const res = await apiRequest(`/api/admin/majors?${params.toString()}`);
      if (res?.data?.content) {
        // Cập nhật local cache nếu có dữ liệu thật từ backend
        return {
          content: res.data.content,
          totalElements: res.data.totalElements ?? res.data.content.length,
          totalPages: res.data.totalPages ?? 1,
        };
      }
    } catch (error) {
      console.warn('Backend /api/admin/majors not responding, using local data cache:', error.message);
    }

    // Fallback qua local cache
    let items = getLocalCache();
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q))
      );
    }

    const totalElements = items.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const start = page * size;
    const paginated = items.slice(start, start + size);

    return {
      content: paginated,
      totalElements,
      totalPages,
    };
  },

  // Xem chi tiết chuyên ngành
  async getMajor(id) {
    try {
      const res = await apiRequest(`/api/admin/majors/${id}`);
      if (res?.data) return res.data;
    } catch (e) {
      console.warn('Backend getMajor failed, fallback to cache');
    }
    const items = getLocalCache();
    return items.find((m) => String(m.id) === String(id)) || null;
  },

  // Thêm mới chuyên ngành
  async createMajor({ name, description }) {
    try {
      const res = await apiRequest('/api/admin/majors', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description?.trim() || null,
        }),
      });
      if (res?.data) {
        // Cập nhật thêm vào cache
        const items = getLocalCache();
        saveLocalCache([res.data, ...items]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend createMajor error, saving in local cache:', e.message);
    }

    // Fallback save in cache
    const items = getLocalCache();
    const newMajor = {
      id: Date.now(),
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newMajor, ...items];
    saveLocalCache(updated);
    return newMajor;
  },

  // Cập nhật chuyên ngành
  async updateMajor(id, { name, description }) {
    try {
      const res = await apiRequest(`/api/admin/majors/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          description: description?.trim() || null,
        }),
      });
      if (res?.data) {
        const items = getLocalCache();
        const updated = items.map((m) => (String(m.id) === String(id) ? res.data : m));
        saveLocalCache(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateMajor error, updating in local cache:', e.message);
    }

    // Fallback update in cache
    const items = getLocalCache();
    let updatedItem = null;
    const updated = items.map((m) => {
      if (String(m.id) === String(id)) {
        updatedItem = {
          ...m,
          name: name.trim(),
          description: description?.trim() || '',
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return m;
    });
    saveLocalCache(updated);
    return updatedItem;
  },

  // Xóa chuyên ngành
  async deleteMajor(id) {
    try {
      await apiRequest(`/api/admin/majors/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Backend deleteMajor error, removing from local cache:', e.message);
    }
    const items = getLocalCache();
    const filtered = items.filter((m) => String(m.id) !== String(id));
    saveLocalCache(filtered);
    return true;
  },
};
