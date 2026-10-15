import { apiRequest } from './apiClient';

/**
 * Service quản lý Kỹ năng (Skills) cho phía người dùng (frontend-user)
 * Tích hợp endpoint `/api/lookups/skills` dành cho mọi tài khoản đã đăng nhập
 */

export const SKILL_TYPES = [
  { value: 'hard', label: 'Kỹ năng chuyên môn (Hard Skill)', color: '#0284c7', bg: '#e0f2fe', darkBg: 'rgba(2, 132, 199, 0.2)' },
  { value: 'soft', label: 'Kỹ năng mềm (Soft Skill)', color: '#16a34a', bg: '#dcfce7', darkBg: 'rgba(22, 163, 74, 0.2)' },
  { value: 'language', label: 'Ngoại ngữ (Language)', color: '#8b5cf6', bg: '#ede9fe', darkBg: 'rgba(139, 92, 246, 0.2)' },
];

const DEFAULT_SAMPLE_SKILLS = [
  {
    id: 1,
    name: 'Kiến trúc Microservices (Microservices Architecture)',
    type: 'hard',
    description: 'Thiết kế hệ thống hướng dịch vụ độc lập, giao tiếp bất đồng bộ qua Message Queue (Kafka, RabbitMQ) và API Gateway.',
    createdAt: '2026-01-10T08:00:00',
    updatedAt: '2026-03-01T10:30:00',
  },
  {
    id: 2,
    name: 'Thiết kế & Tối ưu RESTful API',
    type: 'hard',
    description: 'Chuẩn hóa định dạng JSON, phân trang, versioning, mã phản hồi HTTP chuẩn và tài liệu hóa OpenAPI / Swagger.',
    createdAt: '2026-01-11T09:15:00',
    updatedAt: '2026-02-28T14:20:00',
  },
  {
    id: 3,
    name: 'Giao tiếp & Thuyết trình chuyên nghiệp',
    type: 'soft',
    description: 'Khả năng truyền đạt giải pháp kỹ thuật mạch lạc tới các bên liên quan phi kỹ thuật (Stakeholders, Product Owner).',
    createdAt: '2026-01-12T11:00:00',
    updatedAt: '2026-03-02T16:45:00',
  },
  {
    id: 4,
    name: 'Tiếng Anh chuyên ngành IT (IELTS 7.0 / TOEIC 850+)',
    type: 'language',
    description: 'Đọc hiểu tài liệu kiến trúc, viết tài liệu kỹ thuật RFC và làm việc trực tiếp với đội ngũ kỹ sư toàn cầu.',
    createdAt: '2026-01-15T14:30:00',
    updatedAt: '2026-03-05T09:10:00',
  },
  {
    id: 5,
    name: 'Clean Code & Refactoring',
    type: 'hard',
    description: 'Tuân thủ các nguyên lý SOLID, Design Patterns, áp dụng quy trình kiểm thử đơn vị Unit Test (TDD/BDD).',
    createdAt: '2026-01-18T13:20:00',
    updatedAt: '2026-03-04T11:00:00',
  },
  {
    id: 6,
    name: 'Quản lý thời gian & Ưu tiên công việc',
    type: 'soft',
    description: 'Lập kế hoạch sprint khoa học, cam kết deadline và điều phối nguồn lực hiệu quả theo ma trận Eisenhower.',
    createdAt: '2026-01-20T10:00:00',
    updatedAt: '2026-02-25T15:30:00',
  },
  {
    id: 7,
    name: 'Tiếng Nhật N3 (IT Comm-tor & Technical Japanese)',
    type: 'language',
    description: 'Trao đổi nghiệp vụ phần mềm với khách hàng thị trường Nhật Bản, dịch tài liệu thiết kế chi tiết (Basic/Detail Design).',
    createdAt: '2026-01-22T15:00:00',
    updatedAt: '2026-03-03T13:40:00',
  },
  {
    id: 8,
    name: 'Tư duy giải quyết vấn đề (Problem Solving)',
    type: 'soft',
    description: 'Phân tích nguyên nhân gốc rễ (Root Cause Analysis - 5 Whys), gỡ lỗi hệ thống phức tạp và đưa ra giải pháp bền vững.',
    createdAt: '2026-01-25T08:45:00',
    updatedAt: '2026-02-20T17:00:00',
  },
  {
    id: 9,
    name: 'Bảo mật ứng dụng Web (OWASP Top 10)',
    type: 'hard',
    description: 'Nhận diện và phòng chống các lỗ hổng SQLi, XSS, CSRF, IDOR, quản lý xác thực phân quyền an toàn với JWT/OAuth2.',
    createdAt: '2026-02-01T09:30:00',
    updatedAt: '2026-02-27T10:15:00',
  },
  {
    id: 10,
    name: 'Làm việc nhóm & Hợp tác liên chức năng',
    type: 'soft',
    description: 'Phối hợp nhịp nhàng giữa đội ngũ Kỹ thuật, Kiểm thử QA, Thiết kế UI/UX và Vận hành DevOps trong môi trường Agile.',
    createdAt: '2026-02-05T14:10:00',
    updatedAt: '2026-03-06T15:30:00',
  },
  {
    id: 11,
    name: 'Software Deployment & Release Management',
    type: 'hard',
    description: 'Planning and executing safe, repeatable production releases.',
    createdAt: '2026-02-10T14:10:00',
    updatedAt: '2026-03-06T15:30:00',
  },
];

const LOCAL_STORAGE_KEY = 'lemoguide_user_skills_cache';

const getLocalCache = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return DEFAULT_SAMPLE_SKILLS;
};

const saveLocalCache = (data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
};

export const skillService = {
  // Lấy danh sách kỹ năng có tìm kiếm, lọc theo loại (hard, soft, language) và phân trang
  async listSkills({ page = 0, size = 10, search = '', type = 'all' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('sort', 'name,asc');
    if (search && search.trim()) {
      params.append('keyword', search.trim());
    }
    if (type && type !== 'all') {
      params.append('type', type);
    }

    try {
      const res = await apiRequest(`/api/lookups/skills?${params.toString()}`);
      if (res?.data?.content) {
        return {
          content: res.data.content,
          totalElements: res.data.totalElements ?? res.data.content.length,
          totalPages: res.data.totalPages ?? 1,
        };
      }
    } catch (error) {
      console.warn('Backend /api/lookups/skills not responding, using local cache:', error.message);
    }

    // Fallback qua local cache
    let items = getLocalCache();
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    if (type && type !== 'all') {
      items = items.filter((s) => (s.type || '').toLowerCase() === type.toLowerCase());
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
};
