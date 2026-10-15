import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Sparkles,
  Award,
  Trophy,
  Heart,
  UserPlus,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  Star,
  Layers,
  FileText,
  Pencil,
  Plus,
  Camera,
  Loader2,
  CreditCard,
  BarChart3,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { userService } from '@/services/userService';
import { contactService } from '@/services/contactService';
import { ROUTES } from '@/constants/routes';
import { getFullAvatarUrl } from '@/services/apiClient';
import UserEditModal from './UserEditModal';
import UsageLimitsModal from './UsageLimitsModal';
import AddContactModal from './AddContactModal';
import AddEducationModal from './AddEducationModal';
import AddExperienceModal from './AddExperienceModal';
import AddProjectModal from './AddProjectModal';
import AddSkillModal from './AddSkillModal';
import AddCertificateModal from './AddCertificateModal';
import AddAwardModal from './AddAwardModal';
import AddInterestModal from './AddInterestModal';
import AddReferrerModal from './AddReferrerModal';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import {
  Page,
  PageHeader,
  Card,
  Tabs,
  SectionCard,
  Entry,
  EmptyState,
  Badge,
  Avatar,
  Button,
  IconButton,
  RowActions,
  DetailItem,
  DetailSection,
  Toast,
  useToast,
} from '@/components/ui';

const LinkedinIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Helper lấy icon theo loại kênh liên hệ
const getContactIcon = (type, size = 16) => {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'PHONE':
      return <Phone size={size} />;
    case 'EMAIL':
      return <Mail size={size} />;
    case 'GITHUB':
      return <GithubIcon size={size} />;
    case 'LINKEDIN':
      return <LinkedinIcon size={size} />;
    case 'FACEBOOK':
    case 'WEBSITE':
    case 'PORTFOLIO':
    default:
      return <Globe size={size} />;
  }
};

const getContactTypeLabel = (type) => {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'PHONE':
      return 'Số điện thoại';
    case 'EMAIL':
      return 'Email phụ';
    case 'GITHUB':
      return 'GitHub';
    case 'LINKEDIN':
      return 'LinkedIn';
    case 'FACEBOOK':
      return 'Facebook';
    case 'PORTFOLIO':
      return 'Portfolio';
    case 'WEBSITE':
      return 'Website';
    default:
      return type || 'Liên kết';
  }
};

const getContactHref = (type, value) => {
  if (!value) return '#';
  const t = (type || '').toUpperCase();
  if (t === 'PHONE') return `tel:${value}`;
  if (t === 'EMAIL') return `mailto:${value}`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
};

// Helper format ngày
const formatDate = (dateStr) => {
  if (!dateStr) return 'Chưa xác định';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
};

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'education' | 'experience' | 'project' | 'skills' | 'more'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [eduPage, setEduPage] = useState(1);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [expPage, setExpPage] = useState(1);
  const { toast, showToast } = useToast();

  const EDU_PAGE_SIZE = 2;
  const educationList = user?.education || [];
  const totalEduElements = educationList.length;
  const totalEduPages = Math.max(1, Math.ceil(totalEduElements / EDU_PAGE_SIZE));
  const safeEduPage = Math.min(Math.max(1, eduPage), totalEduPages);
  const paginatedEducation = educationList.slice(
    (safeEduPage - 1) * EDU_PAGE_SIZE,
    safeEduPage * EDU_PAGE_SIZE
  );

  const EXP_PAGE_SIZE = 2;
  const experienceList = user?.experiences || [];
  const totalExpElements = experienceList.length;
  const totalExpPages = Math.max(1, Math.ceil(totalExpElements / EXP_PAGE_SIZE));
  const safeExpPage = Math.min(Math.max(1, expPage), totalExpPages);
  const paginatedExperience = experienceList.slice(
    (safeExpPage - 1) * EXP_PAGE_SIZE,
    safeExpPage * EXP_PAGE_SIZE
  );

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectPage, setProjectPage] = useState(1);

  const PROJECT_PAGE_SIZE = 2;
  const projectList = user?.projects || [];
  const totalProjectElements = projectList.length;
  const totalProjectPages = Math.max(1, Math.ceil(totalProjectElements / PROJECT_PAGE_SIZE));
  const safeProjectPage = Math.min(Math.max(1, projectPage), totalProjectPages);
  const paginatedProjects = projectList.slice(
    (safeProjectPage - 1) * PROJECT_PAGE_SIZE,
    safeProjectPage * PROJECT_PAGE_SIZE
  );

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillPage, setSkillPage] = useState(1);

  const SKILL_PAGE_SIZE = 4;
  const skillList = user?.skills || [];
  const totalSkillElements = skillList.length;
  const totalSkillPages = Math.max(1, Math.ceil(totalSkillElements / SKILL_PAGE_SIZE));
  const safeSkillPage = Math.min(Math.max(1, skillPage), totalSkillPages);
  const paginatedSkills = skillList.slice(
    (safeSkillPage - 1) * SKILL_PAGE_SIZE,
    safeSkillPage * SKILL_PAGE_SIZE
  );

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [selectedAward, setSelectedAward] = useState(null);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [isReferrerModalOpen, setIsReferrerModalOpen] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState(null);

  const loadUserData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getUser(id);
      setUser(data);
    } catch (err) {
      console.error('Lỗi tải thông tin chi tiết người dùng:', err);
      setError(err.message || 'Không thể tải thông tin người dùng.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Xử lý đổi ảnh đại diện người dùng
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
      showToast('Chỉ chấp nhận file ảnh JPG, PNG hoặc WEBP', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 5MB', 'error');
      return;
    }

    try {
      setAvatarUploading(true);
      await userService.uploadAvatar(user.id, file);
      showToast('Đã đổi ảnh đại diện người dùng thành công!');
      loadUserData();
    } catch (err) {
      showToast('Lỗi tải lên ảnh đại diện: ' + (err.message || 'Thao tác thất bại'), 'error');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Popup xác nhận dùng chung cho mọi thao tác Khóa / Mở khóa / Xóa trong trang này
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  const closeConfirmAction = () => {
    if (isConfirmSubmitting) return;
    setConfirmAction(null);
  };

  const handleConfirmActionSubmit = async () => {
    if (!confirmAction || isConfirmSubmitting) return;
    setIsConfirmSubmitting(true);
    await confirmAction.onConfirm();
    setIsConfirmSubmitting(false);
    setConfirmAction(null);
  };

  const openStatusDialog = () => {
    if (!user) return;
    const isBanned = user.status === 'banned';
    setConfirmAction({
      tone: isBanned ? 'success' : 'warning',
      icon: isBanned ? Unlock : Lock,
      title: isBanned ? 'Xác nhận mở khóa tài khoản?' : 'Xác nhận tạm khóa tài khoản?',
      subtitle: isBanned
        ? 'Người dùng sẽ có thể đăng nhập và sử dụng toàn bộ chức năng của hệ thống.'
        : 'Người dùng sẽ ngay lập tức bị vô hiệu hóa quyền đăng nhập và các hoạt động trên hệ thống.',
      message: (
        <>Bạn có chắc chắn muốn {isBanned ? 'mở khóa' : 'tạm khóa'} tài khoản <strong>"{user.fullName}"</strong> ({user.email})?</>
      ),
      confirmLabel: isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản',
      onConfirm: async () => {
        const newStatus = isBanned ? 'ACTIVE' : 'BANNED';
        try {
          await userService.updateUserStatus(user.id, newStatus);
          setUser((prev) => ({ ...prev, status: newStatus.toLowerCase() }));
          showToast(newStatus === 'BANNED' ? 'Đã khóa tài khoản thành công' : 'Đã kích hoạt tài khoản thành công');
        } catch (err) {
          showToast('Lỗi cập nhật trạng thái: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  const openDeleteDialog = () => {
    if (!user) return;
    setConfirmAction({
      tone: 'danger',
      icon: AlertTriangle,
      title: 'Cảnh báo: Vô hiệu hóa tài khoản?',
      subtitle: 'Tài khoản sẽ bị vô hiệu hóa khỏi danh sách hoạt động trên hệ thống.',
      message: (
        <>Bạn có chắc chắn muốn vô hiệu hóa tài khoản <strong>"{user.fullName}"</strong> ({user.email})?</>
      ),
      confirmLabel: 'Xác nhận xóa tài khoản',
      onConfirm: async () => {
        try {
          await userService.deleteUser(user.id);
          showToast('Đã vô hiệu hóa tài khoản thành công');
          setTimeout(() => navigate(ROUTES.USERS), 300);
        } catch (err) {
          showToast('Lỗi xóa người dùng: ' + (err.message || 'Không thể hoàn tất'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa kênh liên lạc
  const handleDeleteContact = (contactId, contactValue) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa kênh liên lạc?',
      subtitle: 'Kênh liên lạc sẽ bị xóa khỏi hồ sơ của người dùng.',
      message: <>Bạn có chắc chắn muốn xóa kênh liên lạc <strong>"{contactValue || 'này'}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await contactService.deleteContact(user.id, contactId);
          showToast('Đã xóa kênh liên lạc thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa kênh liên lạc: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa thông tin học vấn
  const handleDeleteEducation = (educationId, schoolName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa học vấn?',
      subtitle: 'Thông tin học vấn sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa thông tin học vấn tại <strong>"{schoolName}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteEducation(user.id, educationId);
          showToast('Đã xóa thông tin học vấn thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa học vấn: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa kinh nghiệm làm việc
  const handleDeleteExperience = (experienceId, companyName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa kinh nghiệm làm việc?',
      subtitle: 'Kinh nghiệm làm việc sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa kinh nghiệm làm việc tại <strong>"{companyName || 'công ty này'}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteExperience(user.id, experienceId);
          showToast('Đã xóa kinh nghiệm làm việc thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa kinh nghiệm làm việc: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa dự án
  const handleDeleteProject = (projectId, projectName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa dự án?',
      subtitle: 'Dự án sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa dự án <strong>"{projectName || 'này'}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteProject(user.id, projectId);
          showToast('Đã xóa thông tin dự án thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa dự án: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa kỹ năng
  const handleDeleteSkill = (userSkillId, skillName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa kỹ năng?',
      subtitle: 'Kỹ năng sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa kỹ năng <strong>"{skillName || 'này'}"</strong> khỏi hồ sơ?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteSkill(user.id, userSkillId);
          showToast('Đã xóa thông tin kỹ năng thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa kỹ năng: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa chứng chỉ
  const handleDeleteCertificate = (certificateId, name) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa chứng chỉ?',
      subtitle: 'Chứng chỉ sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa chứng chỉ <strong>"{name || 'này'}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteCertificate(user.id, certificateId);
          showToast('Đã xóa chứng chỉ thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa chứng chỉ: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa giải thưởng
  const handleDeleteAward = (awardId, name) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa giải thưởng?',
      subtitle: 'Giải thưởng sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa giải thưởng <strong>"{name || 'này'}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteAward(user.id, awardId);
          showToast('Đã xóa giải thưởng thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa giải thưởng: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa sở thích
  const handleDeleteInterest = (interestId, name) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa sở thích?',
      subtitle: 'Sở thích sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa sở thích <strong>"{name || 'này'}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteInterest(user.id, interestId);
          showToast('Đã xóa sở thích thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa sở thích: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  // Xử lý Xóa người giới thiệu
  const handleDeleteReferrer = (referrerId, name) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa người giới thiệu?',
      subtitle: 'Người giới thiệu sẽ bị xóa khỏi hồ sơ.',
      message: <>Bạn có chắc chắn muốn xóa người giới thiệu <strong>"{name || 'này'}"</strong>?</>,
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userService.deleteReferrer(user.id, referrerId);
          showToast('Đã xóa người giới thiệu thành công');
          loadUserData();
        } catch (err) {
          showToast('Lỗi xóa người giới thiệu: ' + (err.message || 'Thao tác thất bại'), 'error');
        }
      },
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Page>
          <Card>
            <EmptyState icon={User} title="Đang tải dữ liệu hồ sơ người dùng..." />
          </Card>
        </Page>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <Page>
          <Card>
            <EmptyState
              icon={AlertTriangle}
              title="Không tìm thấy hồ sơ"
              hint={error || 'Hồ sơ người dùng không tồn tại hoặc đã bị xóa.'}
              action={
                <Button icon={ArrowLeft} onClick={() => navigate(ROUTES.USERS)}>
                  Quay lại danh sách Người dùng
                </Button>
              }
            />
          </Card>
        </Page>
      </AdminLayout>
    );
  }

  // Danh sách các Tabs
  const tabs = [
    { id: 'overview', label: 'Tổng quan & Hồ sơ', icon: User, count: null },
    { id: 'education', label: 'Học vấn & Chuyên ngành', icon: GraduationCap, count: (user.education || []).length },
    { id: 'experience', label: 'Kinh nghiệm làm việc', icon: Briefcase, count: (user.experiences || []).length },
    { id: 'project', label: 'Dự án', icon: FolderGit2, count: (user.projects || []).length },
    { id: 'skills', label: 'Kỹ năng', icon: Sparkles, count: (user.skills || []).length },
    {
      id: 'more',
      label: 'Mục bổ sung',
      icon: Layers,
      count:
        (user.certificates || []).length +
        (user.awards || []).length +
        (user.interests || []).length +
        (user.referrers || []).length,
    },
  ];

  const openContact = (contact = null) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
  };

  const openEducation = (education = null) => {
    setSelectedEducation(education);
    setIsEduModalOpen(true);
  };

  const openExperience = (experience = null) => {
    setSelectedExperience(experience);
    setIsExpModalOpen(true);
  };

  const openProject = (project = null) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  const openSkill = (skill = null) => {
    setSelectedSkill(skill);
    setIsSkillModalOpen(true);
  };

  const addButton = (label, onClick) => (
    <Button size="sm" icon={Plus} onClick={onClick}>
      {label}
    </Button>
  );

  const isBanned = user.status === 'banned';
  const contacts = user.contacts || [];
  const certificates = user.certificates || [];
  const awards = user.awards || [];
  const interests = user.interests || [];
  const referrers = user.referrers || [];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page>
        <PageHeader
          title="Chi tiết hồ sơ người dùng"
          description={user.email}
          actions={
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.USERS)}>
              Danh sách người dùng
            </Button>
          }
        />

        <Card>
          <div className="ui-hero">
            <div className="ui-hero__who">
              <div className="ui-hero__avatar">
                <Avatar
                  src={user.avatarUrl ? getFullAvatarUrl(user.avatarUrl) : null}
                  name={user.fullName || 'U'}
                  size={84}
                />
                {avatarUploading && (
                  <div className="ui-hero__busy" role="status" aria-label="Đang tải ảnh lên">
                    <Loader2 size={24} color="#ffffff" className="animate-spin" aria-hidden="true" />
                  </div>
                )}
                <IconButton
                  icon={Camera}
                  size={14}
                  label="Thay đổi ảnh đại diện người dùng"
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={handleAvatarFileChange}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <div className="ui-hero__name">
                  <h2>{user.fullName}</h2>
                  <Badge tone={isBanned ? 'danger' : 'success'}>
                    {isBanned ? 'Bị cấm (Banned)' : 'Hoạt động (Active)'}
                  </Badge>
                  <Badge tone="info">
                    <CreditCard size={12} aria-hidden="true" />
                    Gói: {user.planName || 'Free'}
                  </Badge>
                </div>
                <p className="ui-hero__role">{user.currentTitle || 'Lập trình viên'}</p>
                <div className="ui-hero__meta">
                  <span>
                    <Mail size={14} aria-hidden="true" />
                    {user.email}
                  </span>
                  {(user.city || user.district) && (
                    <span>
                      <MapPin size={14} aria-hidden="true" />
                      {[user.district, user.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span>
                    <Calendar size={14} aria-hidden="true" />
                    Khởi tạo: {user.createdAt || 'N/A'}
                  </span>
                  <span>
                    <Clock size={14} aria-hidden="true" />
                    Đăng nhập: {user.lastLoginAt || 'Chưa đăng nhập'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ui-hero__actions">
              <Button variant="secondary" icon={BarChart3} onClick={() => setIsPlanModalOpen(true)}>
                Giới hạn & Sử dụng
              </Button>
              <Button icon={Pencil} onClick={() => setIsEditModalOpen(true)}>
                Chỉnh sửa người dùng
              </Button>
              <Button variant="warning" icon={isBanned ? Unlock : Lock} onClick={openStatusDialog}>
                {isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </Button>
              <Button variant="danger" icon={Trash2} onClick={openDeleteDialog}>
                Xóa người dùng
              </Button>
            </div>
          </div>
        </Card>

        <Tabs
          label="Các phần của hồ sơ"
          value={activeTab}
          onChange={setActiveTab}
          options={tabs.map((tab) => ({ value: tab.id, label: tab.label, icon: tab.icon, count: tab.count }))}
        />

        {activeTab === 'overview' && (
          <div className="ui-stack">
            <SectionCard icon={User} title="Thông tin hồ sơ cá nhân">
              <div className="ui-detail-grid ui-detail-grid--flat">
                <DetailItem label="Họ và tên">{user.fullName || 'Chưa cập nhật'}</DetailItem>
                <DetailItem label="Email chính">{user.email}</DetailItem>
                <DetailItem label="Ngày sinh">{formatDate(user.dateOfBirth)}</DetailItem>
                <DetailItem label="Giới tính">
                  {user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : user.gender || 'Chưa cập nhật'}
                </DetailItem>
                <DetailItem label="Tỉnh / Thành phố">{user.city || 'Chưa cập nhật'}</DetailItem>
                <DetailItem label="Quận / Huyện">{user.district || 'Chưa cập nhật'}</DetailItem>
              </div>
            </SectionCard>

            <SectionCard icon={FileText} title="Định hướng và mục tiêu nghề nghiệp">
              <div className="ui-cols-2">
                <DetailSection title="Mục tiêu ngắn hạn">
                  {user.shortTermGoal || 'Người dùng chưa cập nhật mục tiêu ngắn hạn.'}
                </DetailSection>
                <DetailSection title="Mục tiêu dài hạn">
                  {user.longTermGoal || 'Người dùng chưa cập nhật mục tiêu dài hạn.'}
                </DetailSection>
              </div>
            </SectionCard>

            <SectionCard
              icon={Globe}
              title="Các kênh liên lạc"
              count={contacts.length}
              action={addButton('Thêm liên lạc', () => openContact())}
            >
              {contacts.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="Chưa có kênh liên lạc nào"
                  hint="Bấm Thêm liên lạc để bổ sung số điện thoại, email phụ hoặc liên kết mạng xã hội."
                />
              ) : (
                <div className="ui-cols-2">
                  {contacts.map((c) => (
                    <div key={c.id || c.value} className="ui-contact">
                      <div className="ui-contact__main">
                        <span className="ui-contact__icon">{getContactIcon(c.type, 18)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="ui-hint">{getContactTypeLabel(c.type)}</div>
                          <a
                            className="ui-contact__value"
                            href={getContactHref(c.type, c.value)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>{c.value}</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                      <RowActions
                        entity="liên lạc"
                        onEdit={() => openContact(c)}
                        onDelete={() => handleDeleteContact(c.id, c.value)}
                      >
                        {(c.primary || c.isPrimary) && <Badge tone="warning">★ Chính</Badge>}
                      </RowActions>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {activeTab === 'education' && (
          <SectionCard
            icon={GraduationCap}
            title="Lịch sử học vấn và chuyên ngành đào tạo"
            count={totalEduElements}
            action={addButton('Thêm học vấn', () => openEducation())}
          >
            {totalEduElements === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="Người dùng chưa có thông tin học vấn nào"
                action={
                  <Button icon={Plus} onClick={() => openEducation()}>
                    Thêm học vấn ngay
                  </Button>
                }
              />
            ) : (
              <>
                {paginatedEducation.map((edu) => (
                  <Entry
                    key={edu.id}
                    title={edu.schoolName}
                    subtitle={
                      <>
                        <span>
                          Chuyên ngành: {edu.majorName || (edu.majorId ? `Mã chuyên ngành #${edu.majorId}` : 'Chưa phân loại')}
                        </span>
                        {edu.classification && <Badge tone="info">Xếp loại: {edu.classification}</Badge>}
                      </>
                    }
                    meta={`${formatDate(edu.startDate)} — ${edu.endDate ? formatDate(edu.endDate) : 'Hiện tại'}`}
                    actions={
                      <RowActions
                        entity="học vấn"
                        onEdit={() => openEducation(edu)}
                        onDelete={() => handleDeleteEducation(edu.id, edu.schoolName)}
                      />
                    }
                  >
                    {edu.gpa && (
                      <p>
                        <strong>GPA:</strong> {edu.gpa}
                      </p>
                    )}
                    {edu.thesisAchievement && (
                      <p>
                        <strong>Đề tài / Khóa luận tốt nghiệp:</strong> {edu.thesisAchievement}
                      </p>
                    )}
                  </Entry>
                ))}
                <Pagination
                  currentPage={safeEduPage}
                  totalPages={totalEduPages}
                  totalElements={totalEduElements}
                  pageSize={EDU_PAGE_SIZE}
                  onPageChange={setEduPage}
                  entityName="học vấn"
                />
              </>
            )}
          </SectionCard>
        )}

        {activeTab === 'experience' && (
          <SectionCard
            icon={Briefcase}
            title="Kinh nghiệm làm việc và sự nghiệp"
            count={totalExpElements}
            action={addButton('Thêm kinh nghiệm', () => openExperience())}
          >
            {totalExpElements === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Người dùng chưa có kinh nghiệm làm việc nào"
                action={
                  <Button icon={Plus} onClick={() => openExperience()}>
                    Thêm kinh nghiệm ngay
                  </Button>
                }
              />
            ) : (
              <>
                {paginatedExperience.map((exp) => (
                  <Entry
                    key={exp.id}
                    title={exp.jobTitle || 'Vị trí công việc'}
                    subtitle={
                      <>
                        <span>{exp.companyName}</span>
                        {exp.targetTag && (
                          <Badge tone="info">
                            {exp.targetTag === 'FRONTEND'
                              ? 'Frontend'
                              : exp.targetTag === 'BACKEND'
                                ? 'Backend'
                                : exp.targetTag === 'FULLSTACK'
                                  ? 'Fullstack'
                                  : exp.targetTag}
                          </Badge>
                        )}
                      </>
                    }
                    meta={`${formatDate(exp.startDate)} — ${exp.current ? 'Đang làm việc tại đây' : formatDate(exp.endDate)}`}
                    actions={
                      <RowActions
                        entity="kinh nghiệm"
                        onEdit={() => openExperience(exp)}
                        onDelete={() => handleDeleteExperience(exp.id, exp.companyName)}
                      />
                    }
                  >
                    {exp.description && <p>{exp.description}</p>}
                    {Array.isArray(exp.technologies) && exp.technologies.length > 0 && (
                      <div className="ui-chip-row">
                        <span className="ui-hint">Công nghệ:</span>
                        {exp.technologies.map((tech) => (
                          <Badge key={tech.id || tech.name || tech}>{tech.name || tech}</Badge>
                        ))}
                      </div>
                    )}
                  </Entry>
                ))}
                <Pagination
                  currentPage={safeExpPage}
                  totalPages={totalExpPages}
                  totalElements={totalExpElements}
                  pageSize={EXP_PAGE_SIZE}
                  onPageChange={setExpPage}
                  entityName="kinh nghiệm"
                />
              </>
            )}
          </SectionCard>
        )}

        {activeTab === 'project' && (
          <SectionCard
            icon={FolderGit2}
            title="Dự án cá nhân và thực tế"
            count={totalProjectElements}
            action={addButton('Thêm dự án', () => openProject())}
          >
            {totalProjectElements === 0 ? (
              <EmptyState
                icon={FolderGit2}
                title="Người dùng chưa có dự án nào"
                action={
                  <Button icon={Plus} onClick={() => openProject()}>
                    Thêm dự án ngay
                  </Button>
                }
              />
            ) : (
              <>
                {paginatedProjects.map((proj) => (
                  <Entry
                    key={proj.id}
                    title={proj.name}
                    subtitle={proj.role ? <span>Vai trò: {proj.role}</span> : null}
                    meta={`${formatDate(proj.startDate)} — ${proj.endDate ? formatDate(proj.endDate) : 'Đang phát triển'}`}
                    actions={
                      <RowActions
                        entity="dự án"
                        onEdit={() => openProject(proj)}
                        onDelete={() => handleDeleteProject(proj.id, proj.name)}
                      />
                    }
                  >
                    {proj.description && <p>{proj.description}</p>}
                    {(proj.demoUrl || proj.githubUrl) && (
                      <div className="ui-chip-row">
                        {proj.demoUrl && (
                          <a className="ui-link ui-inline" href={proj.demoUrl} target="_blank" rel="noreferrer">
                            <ExternalLink size={14} aria-hidden="true" />
                            Trải nghiệm Demo
                          </a>
                        )}
                        {proj.githubUrl && (
                          <a className="ui-link ui-inline" href={proj.githubUrl} target="_blank" rel="noreferrer">
                            <GithubIcon size={14} />
                            Mã nguồn GitHub
                          </a>
                        )}
                      </div>
                    )}
                    {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                      <div className="ui-chip-row">
                        <span className="ui-hint">Công nghệ sử dụng:</span>
                        {proj.technologies.map((tech) => (
                          <Badge key={tech.id || tech.name || tech}>{tech.name || tech}</Badge>
                        ))}
                      </div>
                    )}
                  </Entry>
                ))}
                <Pagination
                  currentPage={safeProjectPage}
                  totalPages={totalProjectPages}
                  totalElements={totalProjectElements}
                  pageSize={PROJECT_PAGE_SIZE}
                  onPageChange={setProjectPage}
                  entityName="dự án"
                />
              </>
            )}
          </SectionCard>
        )}

        {activeTab === 'skills' && (
          <SectionCard
            icon={Sparkles}
            title="Kỹ năng chuyên môn và năng lực"
            count={totalSkillElements}
            action={addButton('Thêm kỹ năng', () => openSkill())}
          >
            {totalSkillElements === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Người dùng chưa có kỹ năng nào"
                action={
                  <Button icon={Plus} onClick={() => openSkill()}>
                    Thêm kỹ năng ngay
                  </Button>
                }
              />
            ) : (
              <>
                <div className="ui-cols-2">
                  {paginatedSkills.map((s, idx) => {
                    const typeStr = (s.skillType || '').toLowerCase();
                    const type =
                      typeStr === 'hard'
                        ? { tone: 'info', label: 'Chuyên môn' }
                        : typeStr === 'soft'
                          ? { tone: 'success', label: 'Kỹ năng mềm' }
                          : { tone: 'neutral', label: 'Ngoại ngữ' };

                    return (
                      <Entry
                        key={s.id || idx}
                        title={s.skillName || `Kỹ năng #${s.skillId}`}
                        subtitle={<Badge tone={type.tone}>{type.label}</Badge>}
                        actions={
                          <RowActions
                            entity="kỹ năng"
                            onEdit={() => openSkill(s)}
                            onDelete={() => handleDeleteSkill(s.id, s.skillName)}
                          />
                        }
                      >
                        {s.proficiencyLevel != null && (
                          <div className="ui-inline">
                            <span className="ui-hint">Độ thành thạo:</span>
                            <span className="ui-stars" role="img" aria-label={`${s.proficiencyLevel} trên 5 sao`}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={14} data-on={star <= s.proficiencyLevel} />
                              ))}
                            </span>
                          </div>
                        )}
                        {s.languageLevel && (
                          <div className="ui-inline">
                            <span className="ui-hint">Ngoại ngữ:</span>
                            <strong>{s.languageLevel}</strong>
                          </div>
                        )}
                      </Entry>
                    );
                  })}
                </div>
                <Pagination
                  currentPage={safeSkillPage}
                  totalPages={totalSkillPages}
                  totalElements={totalSkillElements}
                  pageSize={SKILL_PAGE_SIZE}
                  onPageChange={setSkillPage}
                  entityName="kỹ năng"
                />
              </>
            )}
          </SectionCard>
        )}

        {activeTab === 'more' && (
          <div className="ui-stack">
            <SectionCard
              icon={Award}
              title="Chứng chỉ đạt được"
              count={certificates.length}
              action={addButton('Thêm chứng chỉ', () => {
                setSelectedCertificate(null);
                setIsCertModalOpen(true);
              })}
            >
              {certificates.length === 0 ? (
                <EmptyState icon={Award} title="Chưa có chứng chỉ nào" />
              ) : (
                certificates.map((c, i) => (
                  <Entry
                    key={c.id || i}
                    title={c.name}
                    subtitle={c.issuedBy ? <span>Tổ chức cấp: {c.issuedBy}</span> : null}
                    meta={c.issuedYear}
                    actions={
                      <RowActions
                        entity="chứng chỉ"
                        onEdit={() => {
                          setSelectedCertificate(c);
                          setIsCertModalOpen(true);
                        }}
                        onDelete={() => handleDeleteCertificate(c.id, c.name)}
                      />
                    }
                  >
                    {c.description && <p>{c.description}</p>}
                  </Entry>
                ))
              )}
            </SectionCard>

            <SectionCard
              icon={Trophy}
              title="Giải thưởng và danh hiệu"
              count={awards.length}
              action={addButton('Thêm giải thưởng', () => {
                setSelectedAward(null);
                setIsAwardModalOpen(true);
              })}
            >
              {awards.length === 0 ? (
                <EmptyState icon={Trophy} title="Chưa có giải thưởng nào" />
              ) : (
                awards.map((a, i) => (
                  <Entry
                    key={a.id || i}
                    title={a.name}
                    subtitle={a.grantedBy ? <span>Đơn vị trao: {a.grantedBy}</span> : null}
                    meta={a.grantedYear}
                    actions={
                      <RowActions
                        entity="giải thưởng"
                        onEdit={() => {
                          setSelectedAward(a);
                          setIsAwardModalOpen(true);
                        }}
                        onDelete={() => handleDeleteAward(a.id, a.name)}
                      />
                    }
                  >
                    {a.description && <p>{a.description}</p>}
                  </Entry>
                ))
              )}
            </SectionCard>

            <div className="ui-cols-2">
              <SectionCard
                icon={Heart}
                title="Sở thích"
                count={interests.length}
                action={addButton('Thêm', () => {
                  setSelectedInterest(null);
                  setIsInterestModalOpen(true);
                })}
              >
                {interests.length === 0 ? (
                  <EmptyState icon={Heart} title="Chưa có sở thích" />
                ) : (
                  <div className="ui-chip-row">
                    {interests.map((it, i) => (
                      <span key={it.id || i} className="ui-tag" title={it.description || ''}>
                        {it.name}
                        <IconButton
                          icon={Pencil}
                          size={12}
                          tone="info"
                          label="Chỉnh sửa sở thích"
                          onClick={() => {
                            setSelectedInterest(it);
                            setIsInterestModalOpen(true);
                          }}
                        />
                        <IconButton
                          icon={Trash2}
                          size={12}
                          tone="danger"
                          label="Xóa sở thích"
                          onClick={() => handleDeleteInterest(it.id, it.name)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                icon={UserPlus}
                title="Người giới thiệu"
                count={referrers.length}
                action={addButton('Thêm', () => {
                  setSelectedReferrer(null);
                  setIsReferrerModalOpen(true);
                })}
              >
                {referrers.length === 0 ? (
                  <EmptyState icon={UserPlus} title="Chưa có người giới thiệu" />
                ) : (
                  referrers.map((r, i) => (
                    <Entry
                      key={r.id || i}
                      title={r.name}
                      subtitle={
                        r.position || r.company
                          ? <span>{[r.position, r.company && `(${r.company})`].filter(Boolean).join(' ')}</span>
                          : null
                      }
                      actions={
                        <RowActions
                          entity="người giới thiệu"
                          onEdit={() => {
                            setSelectedReferrer(r);
                            setIsReferrerModalOpen(true);
                          }}
                          onDelete={() => handleDeleteReferrer(r.id, r.name)}
                        />
                      }
                    />
                  ))
                )}
              </SectionCard>
            </div>
          </div>
        )}
      </Page>

      {/* Modal Popup Chỉnh sửa người dùng */}
      <UserEditModal
        isOpen={isEditModalOpen}
        user={user}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          showToast('Đã cập nhật thông tin người dùng thành công!');
          loadUserData();
        }}
      />

      <UsageLimitsModal
        isOpen={isPlanModalOpen}
        user={user}
        onClose={() => setIsPlanModalOpen(false)}
      />

      {/* Modal Popup Thêm / Chỉnh sửa kênh liên lạc */}
      <AddContactModal
        isOpen={isContactModalOpen}
        userId={user?.id}
        contact={selectedContact}
        onClose={() => {
          setIsContactModalOpen(false);
          setSelectedContact(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật kênh liên lạc thành công!' : 'Đã thêm kênh liên lạc thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa học vấn */}
      <AddEducationModal
        isOpen={isEduModalOpen}
        userId={user.id}
        education={selectedEducation}
        onClose={() => {
          setIsEduModalOpen(false);
          setSelectedEducation(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật thông tin học vấn thành công!' : 'Đã thêm thông tin học vấn thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa kinh nghiệm làm việc */}
      <AddExperienceModal
        isOpen={isExpModalOpen}
        userId={user.id}
        experience={selectedExperience}
        onClose={() => {
          setIsExpModalOpen(false);
          setSelectedExperience(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật kinh nghiệm làm việc thành công!' : 'Đã thêm kinh nghiệm làm việc thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa dự án */}
      <AddProjectModal
        isOpen={isProjectModalOpen}
        userId={user.id}
        project={selectedProject}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProject(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật dự án thành công!' : 'Đã thêm dự án thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa kỹ năng */}
      <AddSkillModal
        isOpen={isSkillModalOpen}
        userId={user.id}
        userSkill={selectedSkill}
        existingSkillIds={(user.skills || []).map((s) => s.skillId).filter(Boolean)}
        onClose={() => {
          setIsSkillModalOpen(false);
          setSelectedSkill(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật kỹ năng thành công!' : 'Đã thêm kỹ năng thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa chứng chỉ */}
      <AddCertificateModal
        isOpen={isCertModalOpen}
        userId={user.id}
        certificate={selectedCertificate}
        onClose={() => {
          setIsCertModalOpen(false);
          setSelectedCertificate(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật chứng chỉ thành công!' : 'Đã thêm chứng chỉ thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa giải thưởng */}
      <AddAwardModal
        isOpen={isAwardModalOpen}
        userId={user.id}
        award={selectedAward}
        onClose={() => {
          setIsAwardModalOpen(false);
          setSelectedAward(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật giải thưởng thành công!' : 'Đã thêm giải thưởng thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa sở thích */}
      <AddInterestModal
        isOpen={isInterestModalOpen}
        userId={user.id}
        interest={selectedInterest}
        onClose={() => {
          setIsInterestModalOpen(false);
          setSelectedInterest(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật sở thích thành công!' : 'Đã thêm sở thích thành công!');
          loadUserData();
        }}
      />

      {/* Modal Popup Thêm / Chỉnh sửa người giới thiệu */}
      <AddReferrerModal
        isOpen={isReferrerModalOpen}
        userId={user.id}
        referrer={selectedReferrer}
        onClose={() => {
          setIsReferrerModalOpen(false);
          setSelectedReferrer(null);
        }}
        onSuccess={(isEdit) => {
          showToast(isEdit ? 'Đã cập nhật người giới thiệu thành công!' : 'Đã thêm người giới thiệu thành công!');
          loadUserData();
        }}
      />

      <ConfirmActionModal
        isOpen={!!confirmAction}
        tone={confirmAction?.tone}
        icon={confirmAction?.icon}
        title={confirmAction?.title}
        subtitle={confirmAction?.subtitle}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        isSubmitting={isConfirmSubmitting}
        onConfirm={handleConfirmActionSubmit}
        onCancel={closeConfirmAction}
      />
    </AdminLayout>
  );
};

export default UserDetailPage;
