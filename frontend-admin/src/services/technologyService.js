import { apiRequest } from './apiClient';

/**
 * Service quản lý Công nghệ (Technologies)
 * Quản lý danh mục công nghệ, ngôn ngữ, framework, cơ sở dữ liệu
 */

export const TECH_CATEGORIES = [
  'Programming Language',
  'Frontend Framework & Library',
  'Backend Framework',
  'Database - Relational',
  'Database - NoSQL',
  'Cloud Platform',
  'CI/CD & Automation',
  'Containerization & Orchestration',
  'Mobile Development',
  'Data Science & Machine Learning',
  'Testing & QA',
  'Version Control',
  'Message Queue & Streaming',
  'API & Protocol',
  'Web Server',
  'Build Tool & Package Manager',
  'Design & Prototyping',
  'Project Management Tool',
  'Monitoring & Logging',
  'Operating System',
  'Game Development',
  'Blockchain',
  'Security Tool',
];

const DEFAULT_SAMPLE_TECHNOLOGIES = [
  {
    id: 1,
    name: 'React.js',
    category: 'Frontend',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    description: 'Thư viện JavaScript mã nguồn mở hàng đầu để xây dựng giao diện người dùng tương tác dạng Single Page Application (SPA).',
    createdAt: '2026-01-10T08:00:00',
    updatedAt: '2026-03-01T10:30:00',
  },
  {
    id: 2,
    name: 'Spring Boot',
    category: 'Backend',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
    description: 'Framework Java mạnh mẽ theo chuẩn doanh nghiệp, tối ưu hóa phát triển RESTful Microservices và hệ thống phân tán chịu tải cao.',
    createdAt: '2026-01-11T09:00:00',
    updatedAt: '2026-03-02T11:20:00',
  },
  {
    id: 3,
    name: 'PostgreSQL',
    category: 'Database',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    description: 'Hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở đối tượng (ORDBMS) tiên tiến, hỗ trợ chuẩn ACID toàn vẹn và JSON mở rộng.',
    createdAt: '2026-01-12T10:15:00',
    updatedAt: '2026-02-28T14:45:00',
  },
  {
    id: 4,
    name: 'Docker',
    category: 'DevOps & Cloud',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    description: 'Nền tảng đóng gói ứng dụng thành các Container cô lập, đảm bảo tính nhất quán môi trường từ phát triển cục bộ tới máy chủ Production.',
    createdAt: '2026-01-15T14:00:00',
    updatedAt: '2026-03-05T09:10:00',
  },
  {
    id: 5,
    name: 'Flutter',
    category: 'Mobile',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
    description: 'Bộ công cụ UI của Google hỗ trợ biên dịch đa nền tảng (iOS, Android, Web, Desktop) từ một mã nguồn Dart duy nhất.',
    createdAt: '2026-01-18T13:20:00',
    updatedAt: '2026-03-04T16:00:00',
  },
  {
    id: 6,
    name: 'TypeScript',
    category: 'Frontend',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    description: 'Ngôn ngữ mở rộng của JavaScript bổ sung hệ thống kiểu tĩnh chặt chẽ (Static Typing), giúp code bảo trì dễ dàng trong dự án lớn.',
    createdAt: '2026-01-20T10:30:00',
    updatedAt: '2026-02-26T15:30:00',
  },
  {
    id: 7,
    name: 'Node.js',
    category: 'Backend',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    description: 'Môi trường thực thi JavaScript xây dựng trên V8 engine của Chrome, kiến trúc Event-driven Non-blocking I/O tối ưu cho Web socket.',
    createdAt: '2026-01-22T11:00:00',
    updatedAt: '2026-03-03T10:15:00',
  },
  {
    id: 8,
    name: 'Python',
    category: 'AI & Machine Learning',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    description: 'Ngôn ngữ lập trình đa năng phổ biến nhất thế giới trong lĩnh vực Khoa học dữ liệu, Thị giác máy tính, Xử lý ngôn ngữ tự nhiên và AI.',
    createdAt: '2026-01-25T15:40:00',
    updatedAt: '2026-03-06T12:00:00',
  },
  {
    id: 9,
    name: 'Redis',
    category: 'Database',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
    description: 'Cơ sở dữ liệu lưu trữ trong bộ nhớ RAM (In-memory) tốc độ cực cao, ứng dụng làm Cache, Message Broker và Pub/Sub.',
    createdAt: '2026-02-01T08:30:00',
    updatedAt: '2026-02-25T13:10:00',
  },
  {
    id: 10,
    name: 'Kubernetes',
    category: 'DevOps & Cloud',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',
    description: 'Hệ thống điều phối Container tự động hóa việc triển khai, mở rộng quy mô linh hoạt và quản trị cụm máy chủ phân tán.',
    createdAt: '2026-02-05T09:50:00',
    updatedAt: '2026-03-07T14:20:00',
  },
];

const LOCAL_STORAGE_KEY = 'lemoguide_admin_technologies_cache';

const getLocalCache = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return DEFAULT_SAMPLE_TECHNOLOGIES;
};

const saveLocalCache = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
};

export const technologyService = {
  // Lấy danh sách công nghệ có tìm kiếm, lọc theo phân loại và phân trang
  async listTechnologies({ page = 0, size = 10, search = '', category = 'all' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'createdAt,desc');
    if (search && search.trim()) {
      params.append('keyword', search.trim());
    }
    if (category && category !== 'all') {
      params.append('category', category);
    }

    try {
      const res = await apiRequest(`/api/admin/technologies?${params.toString()}`);
      if (res?.data?.content) {
        return {
          content: res.data.content,
          totalElements: res.data.totalElements ?? res.data.content.length,
          totalPages: res.data.totalPages ?? 1,
        };
      }
    } catch (error) {
      console.warn('Backend /api/admin/technologies not responding, using local cache:', error.message);
    }

    // Fallback qua local cache
    let items = getLocalCache();
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    if (category && category !== 'all') {
      const c = category.toLowerCase();
      items = items.filter((t) => {
        const cat = (t.category || '').toLowerCase();
        return cat === c || cat.includes(c) || c.includes(cat);
      });
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

  // Lấy danh sách các phân loại (Categories) thực tế
  async getCategories() {
    try {
      const res = await apiRequest('/api/admin/technologies/categories');
      if (Array.isArray(res?.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend getCategories failed, using default list:', e.message);
    }
    return TECH_CATEGORIES;
  },

  // Xem chi tiết công nghệ
  async getTechnology(id) {
    try {
      const res = await apiRequest(`/api/admin/technologies/${id}`);
      if (res?.data) return res.data;
    } catch (e) {
      console.warn('Backend getTechnology failed, fallback to cache');
    }
    const items = getLocalCache();
    return items.find((t) => String(t.id) === String(id)) || null;
  },

  // Thêm mới công nghệ
  async createTechnology({ name, category, iconUrl, description }) {
    try {
      const res = await apiRequest('/api/admin/technologies', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          category: category?.trim() || 'Khác',
          iconUrl: iconUrl?.trim() || null,
          description: description?.trim() || null,
        }),
      });
      if (res?.data) {
        const items = getLocalCache();
        saveLocalCache([res.data, ...items]);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend createTechnology error, saving in local cache:', e.message);
    }

    const items = getLocalCache();
    const newTech = {
      id: Date.now(),
      name: name.trim(),
      category: category?.trim() || 'Khác',
      iconUrl: iconUrl?.trim() || '',
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalCache([newTech, ...items]);
    return newTech;
  },

  // Cập nhật công nghệ
  async updateTechnology(id, { name, category, iconUrl, description }) {
    try {
      const res = await apiRequest(`/api/admin/technologies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          category: category?.trim() || 'Khác',
          iconUrl: iconUrl?.trim() || null,
          description: description?.trim() || null,
        }),
      });
      if (res?.data) {
        const items = getLocalCache();
        const updated = items.map((t) => (String(t.id) === String(id) ? res.data : t));
        saveLocalCache(updated);
        return res.data;
      }
    } catch (e) {
      console.warn('Backend updateTechnology error, updating in local cache:', e.message);
    }

    const items = getLocalCache();
    let updatedItem = null;
    const updated = items.map((t) => {
      if (String(t.id) === String(id)) {
        updatedItem = {
          ...t,
          name: name.trim(),
          category: category?.trim() || t.category || 'Khác',
          iconUrl: iconUrl?.trim() || '',
          description: description?.trim() || '',
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return t;
    });
    saveLocalCache(updated);
    return updatedItem;
  },

  // Xóa công nghệ
  async deleteTechnology(id) {
    try {
      await apiRequest(`/api/admin/technologies/${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Backend deleteTechnology error, removing from local cache:', e.message);
    }
    const items = getLocalCache();
    const filtered = items.filter((t) => String(t.id) !== String(id));
    saveLocalCache(filtered);
    return true;
  },
};
