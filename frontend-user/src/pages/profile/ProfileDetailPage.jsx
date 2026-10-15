import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Trash2,
  Star,
  Layers,
  Pencil,
  Plus,
  Camera,
  Loader2,
  FileText,
  CreditCard,
  ArrowUpCircle,
  TrendingUp,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import DiscoveryProfileCard from '@/pages/self-discovery/DiscoveryProfileCard';
import { discoveryService } from '@/services/discoveryService';
import { useProfileRefresh } from '@/hooks/useProfileRefresh';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { getFullAvatarUrl } from '@/services/apiClient';
import defaultAvatarImg from '@/assets/default-avatar.jpg';
import { userProfileService } from '@/services/userProfileService';
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

// Modals
import ProfileEditModal from './modals/ProfileEditModal';
import PlanUpgradeModal from './modals/PlanUpgradeModal';
import UserContactModal from './modals/UserContactModal';
import UserEducationModal from './modals/UserEducationModal';
import UserExperienceModal from './modals/UserExperienceModal';
import UserProjectModal from './modals/UserProjectModal';
import UserSkillModal from './modals/UserSkillModal';
import UserAdditionalModal from './modals/UserAdditionalModal';

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
    case 'PHONE': return 'Số điện thoại';
    case 'EMAIL': return 'Email phụ';
    case 'GITHUB': return 'GitHub';
    case 'LINKEDIN': return 'LinkedIn';
    case 'FACEBOOK': return 'Facebook';
    case 'PORTFOLIO': return 'Portfolio';
    case 'WEBSITE': return 'Website';
    default: return type || 'Liên kết';
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

const ProfileDetailPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [educationList, setEducationList] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [awards, setAwards] = useState([]);
  const [interests, setInterests] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [discoveryError, setDiscoveryError] = useState(false);
  const initialLoadDone = useRef(false);
  const loadRevision = useRef(0);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast, showToast } = useToast();
  const setToastMessage = useCallback(
    ({ type, text }) => showToast(text, type === 'error' ? 'error' : 'success'),
    [showToast]
  );
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Pagination states
  const [eduPage, setEduPage] = useState(1);
  const [expPage, setExpPage] = useState(1);
  const [projPage, setProjPage] = useState(1);
  const [skillPage, setSkillPage] = useState(1);
  const EDU_PAGE_SIZE = 2;
  const EXP_PAGE_SIZE = 2;
  const PROJ_PAGE_SIZE = 2;
  const SKILL_PAGE_SIZE = 4;

  // Modal control states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const [isEduModalOpen, setIsEduModalOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] = useState(null);

  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);

  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const [isAdditionalModalOpen, setIsAdditionalModalOpen] = useState(false);
  const [additionalType, setAdditionalType] = useState('certificate');
  const [selectedAdditionalItem, setSelectedAdditionalItem] = useState(null);

  const fileInputRef = useRef(null);

  // Tải toàn bộ dữ liệu người dùng
  const loadAllData = useCallback(async () => {
    const revision = ++loadRevision.current;
    try {
      if (!initialLoadDone.current) setIsLoading(true);
      const [
        pData,
        cData,
        eData,
        expData,
        prjData,
        skData,
        certData,
        awData,
        inData,
        refData,
        discoveryResult,
      ] = await Promise.all([
        userProfileService.getMyProfile(),
        userProfileService.getContacts().catch(() => null),
        userProfileService.getEducation().catch(() => null),
        userProfileService.getExperiences().catch(() => null),
        userProfileService.getProjects().catch(() => null),
        userProfileService.getSkills().catch(() => null),
        userProfileService.getCertificates().catch(() => null),
        userProfileService.getAwards().catch(() => null),
        userProfileService.getInterests().catch(() => null),
        userProfileService.getReferrers().catch(() => null),
        discoveryService.summary().then(data => ({ data })).catch(() => ({ error: true })),
      ]);

      if (revision !== loadRevision.current) return;
      setProfile(pData);
      if (cData) setContacts(cData);
      if (eData) setEducationList(eData);
      if (expData) setExperiences(expData);
      if (prjData) setProjects(prjData);
      if (skData) setSkills(skData);
      if (certData) setCertificates(certData);
      if (awData) setAwards(awData);
      if (inData) setInterests(inData);
      if (refData) setReferrers(refData);
      if (!discoveryResult.error) setDiscoveryResults(discoveryResult.data);
      setDiscoveryError(Boolean(discoveryResult.error));
    } catch (err) {
      if (revision !== loadRevision.current) return;
      console.error('Lỗi khi tải thông tin chi tiết hồ sơ:', err);
      setToastMessage({ type: 'error', text: 'Không thể tải đầy đủ thông tin hồ sơ.' });
    } finally {
      if (revision === loadRevision.current) {
        initialLoadDone.current = true;
        setIsLoading(false);
      }
    }
  }, [setToastMessage]);

  useEffect(() => {
    let active = true;
    const requests = loadRevision;
    queueMicrotask(() => { if (active) loadAllData(); });
    return () => { active = false; requests.current++; };
  }, [loadAllData]);
  useProfileRefresh(authUser?.id, loadAllData);

  // Xử lý đổi ảnh đại diện
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/i)) {
      setToastMessage({ type: 'error', text: 'Chỉ chấp nhận file ảnh JPG, PNG hoặc WEBP' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage({ type: 'error', text: 'Kích thước ảnh tối đa là 5MB' });
      return;
    }

    try {
      setAvatarUploading(true);
      await userProfileService.uploadAvatar(file);
      setToastMessage({ type: 'success', text: 'Đổi ảnh đại diện thành công!' });
      loadAllData();
    } catch (err) {
      setToastMessage({ type: 'error', text: err?.message || 'Không thể tải lên ảnh đại diện' });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Popup xác nhận xóa dùng chung cho mọi mục trong trang này
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

  // Xóa các mục
  const handleDeleteContact = (id, value) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa kênh liên lạc?',
      subtitle: 'Kênh liên lạc sẽ bị xóa khỏi hồ sơ của bạn.',
      message: value ? (
        <>Bạn có chắc chắn muốn xóa kênh liên lạc <strong>"{value}"</strong> khỏi hồ sơ của bạn?</>
      ) : (
        'Bạn có chắc chắn muốn xóa kênh liên lạc này khỏi hồ sơ của bạn?'
      ),
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userProfileService.deleteContact(id);
          setToastMessage({ type: 'success', text: 'Đã xóa kênh liên lạc thành công' });
          loadAllData();
        } catch {
          setToastMessage({ type: 'error', text: 'Lỗi khi xóa liên lạc' });
        }
      },
    });
  };

  const handleDeleteEducation = (id, schoolName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa học vấn?',
      subtitle: 'Thông tin học vấn sẽ bị xóa khỏi hồ sơ của bạn.',
      message: schoolName ? (
        <>Bạn có chắc chắn muốn xóa thông tin học vấn tại <strong>"{schoolName}"</strong>?</>
      ) : (
        'Bạn có chắc chắn muốn xóa học vấn này?'
      ),
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userProfileService.deleteEducation(id);
          setToastMessage({ type: 'success', text: 'Đã xóa học vấn thành công' });
          loadAllData();
        } catch {
          setToastMessage({ type: 'error', text: 'Lỗi khi xóa học vấn' });
        }
      },
    });
  };

  const handleDeleteExperience = (id, companyName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa kinh nghiệm làm việc?',
      subtitle: 'Kinh nghiệm làm việc sẽ bị xóa khỏi hồ sơ.',
      message: (
        <>Bạn có chắc chắn muốn xóa kinh nghiệm làm việc tại <strong>"{companyName || 'công ty này'}"</strong>?</>
      ),
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userProfileService.deleteExperience(id);
          setToastMessage({ type: 'success', text: 'Đã xóa kinh nghiệm làm việc thành công' });
          loadAllData();
        } catch {
          setToastMessage({ type: 'error', text: 'Lỗi khi xóa kinh nghiệm' });
        }
      },
    });
  };

  const handleDeleteProject = (id, projectName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa dự án?',
      subtitle: 'Dự án sẽ bị xóa khỏi hồ sơ.',
      message: (
        <>Bạn có chắc chắn muốn xóa dự án <strong>"{projectName || 'này'}"</strong>?</>
      ),
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userProfileService.deleteProject(id);
          setToastMessage({ type: 'success', text: 'Đã xóa dự án thành công' });
          loadAllData();
        } catch {
          setToastMessage({ type: 'error', text: 'Lỗi khi xóa dự án' });
        }
      },
    });
  };

  const handleDeleteSkill = (id, skillName) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa kỹ năng?',
      subtitle: 'Kỹ năng sẽ bị xóa khỏi hồ sơ.',
      message: (
        <>Bạn có chắc chắn muốn xóa kỹ năng <strong>"{skillName || 'này'}"</strong> khỏi hồ sơ?</>
      ),
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          await userProfileService.deleteSkill(id);
          setToastMessage({ type: 'success', text: 'Đã xóa kỹ năng khỏi hồ sơ' });
          loadAllData();
        } catch {
          setToastMessage({ type: 'error', text: 'Lỗi khi xóa kỹ năng' });
        }
      },
    });
  };

  const handleDeleteAdditional = (type, id) => {
    setConfirmAction({
      tone: 'danger',
      icon: Trash2,
      title: 'Xác nhận xóa mục này?',
      subtitle: 'Mục đã chọn sẽ bị xóa khỏi hồ sơ của bạn.',
      message: 'Bạn có chắc chắn muốn xóa mục này?',
      confirmLabel: 'Xác nhận xóa',
      onConfirm: async () => {
        try {
          if (type === 'certificate') await userProfileService.deleteCertificate(id);
          if (type === 'award') await userProfileService.deleteAward(id);
          if (type === 'interest') await userProfileService.deleteInterest(id);
          if (type === 'referrer') await userProfileService.deleteReferrer(id);
          setToastMessage({ type: 'success', text: 'Đã xóa thành công' });
          loadAllData();
        } catch {
          setToastMessage({ type: 'error', text: 'Lỗi khi xóa' });
        }
      },
    });
  };

  const rawAvatarUrl = profile?.avatarUrl;
  const avatarSrc = rawAvatarUrl ? getFullAvatarUrl(rawAvatarUrl) : defaultAvatarImg;

  // Pagination slices
  const pagedEdu = educationList.slice((eduPage - 1) * EDU_PAGE_SIZE, eduPage * EDU_PAGE_SIZE);
  const pagedExp = experiences.slice((expPage - 1) * EXP_PAGE_SIZE, expPage * EXP_PAGE_SIZE);
  const pagedProj = projects.slice((projPage - 1) * PROJ_PAGE_SIZE, projPage * PROJ_PAGE_SIZE);
  const pagedSkills = skills.slice((skillPage - 1) * SKILL_PAGE_SIZE, skillPage * SKILL_PAGE_SIZE);

  // Danh sách các Tabs
  const tabs = [
    { id: 'overview', label: 'Tổng quan & Hồ sơ', icon: User, count: null },
    { id: 'education', label: 'Học vấn & Chuyên ngành', icon: GraduationCap, count: educationList.length },
    { id: 'experience', label: 'Kinh nghiệm làm việc', icon: Briefcase, count: experiences.length },
    { id: 'project', label: 'Dự án', icon: FolderGit2, count: projects.length },
    { id: 'skills', label: 'Kỹ năng', icon: Sparkles, count: skills.length },
    {
      id: 'more',
      label: 'Mục bổ sung',
      icon: Layers,
      count: certificates.length + awards.length + interests.length + referrers.length,
    },
  ];

  if (isLoading) {
    return (
      <UserLayout>
        <Page>
          <Card>
            <EmptyState icon={User} title="Đang tải thông tin hồ sơ..." />
          </Card>
        </Page>
      </UserLayout>
    );
  }

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
    setIsProjModalOpen(true);
  };

  const openSkill = (skill = null) => {
    setSelectedSkill(skill);
    setIsSkillModalOpen(true);
  };

  const openAdditional = (type, item = null) => {
    setAdditionalType(type);
    setSelectedAdditionalItem(item);
    setIsAdditionalModalOpen(true);
  };

  const addButton = (label, onClick) => (
    <Button size="sm" icon={Plus} onClick={onClick}>
      {label}
    </Button>
  );

  const displayName = profile?.fullName || authUser?.displayName || 'Người dùng';

  return (
    <UserLayout>
      <Toast toast={toast} />

      <Page>
        <PageHeader
          title="Hồ sơ của tôi"
          description="Quản lý thông tin cá nhân, học vấn, kinh nghiệm và kỹ năng. Dữ liệu này được dùng để tạo CV và gợi ý việc làm."
          actions={
            <>
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.DASHBOARD)}>
                Bảng điều khiển
              </Button>
              <Button icon={TrendingUp} onClick={() => navigate(ROUTES.PROGRESS)}>
                Xem tiến bộ
              </Button>
            </>
          }
        />

        <DiscoveryProfileCard results={discoveryResults} error={discoveryError} />
        <Card>
          <div className="ui-hero">
            <div className="ui-hero__who">
              <div className="ui-hero__avatar">
                <Avatar src={avatarSrc} name={profile?.fullName || authUser?.displayName || 'Avatar'} size={84} />
                {avatarUploading && (
                  <div className="ui-hero__busy" role="status" aria-label="Đang tải ảnh lên">
                    <Loader2 size={24} color="#ffffff" className="animate-spin" aria-hidden="true" />
                  </div>
                )}
                <IconButton
                  icon={Camera}
                  size={14}
                  label="Tải ảnh đại diện mới"
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
                  <h2>{displayName}</h2>
                  <Badge tone="success">Hoạt động (Active)</Badge>
                  <Badge tone="info">
                    <CreditCard size={12} aria-hidden="true" />
                    Gói: {profile?.planName || 'Free'}
                  </Badge>
                </div>
                <p className="ui-hero__role">{profile?.currentTitle || 'Chưa cập nhật chức danh'}</p>
                <div className="ui-hero__meta">
                  <span>
                    <Mail size={14} aria-hidden="true" />
                    {profile?.email || authUser?.email}
                  </span>
                  {(profile?.city || profile?.district) && (
                    <span>
                      <MapPin size={14} aria-hidden="true" />
                      {[profile?.district, profile?.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                  <span>
                    <Calendar size={14} aria-hidden="true" />
                    Khởi tạo: {profile?.createdAt || 'N/A'}
                  </span>
                  <span>
                    <Clock size={14} aria-hidden="true" />
                    Đăng nhập: {profile?.lastLoginAt || 'Chưa đăng nhập'}
                  </span>
                </div>
              </div>
            </div>

            <div className="ui-hero__actions">
              <Button icon={Pencil} onClick={() => setIsEditProfileOpen(true)}>
                Chỉnh sửa hồ sơ
              </Button>
              <Button variant="secondary" icon={ArrowUpCircle} onClick={() => setIsPlanModalOpen(true)}>
                Nâng cấp gói
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
                <DetailItem label="Họ và tên">{profile?.fullName || authUser?.displayName || 'Chưa cập nhật'}</DetailItem>
                <DetailItem label="Email chính">{profile?.email || authUser?.email}</DetailItem>
                <DetailItem label="Ngày sinh">{formatDate(profile?.dateOfBirth)}</DetailItem>
                <DetailItem label="Giới tính">
                  {profile?.gender === 'MALE' ? 'Nam' : profile?.gender === 'FEMALE' ? 'Nữ' : profile?.gender || 'Chưa cập nhật'}
                </DetailItem>
                <DetailItem label="Tỉnh / Thành phố">{profile?.city || 'Chưa cập nhật'}</DetailItem>
                <DetailItem label="Quận / Huyện">{profile?.district || 'Chưa cập nhật'}</DetailItem>
              </div>
            </SectionCard>

            <SectionCard icon={FileText} title="Định hướng và mục tiêu nghề nghiệp">
              <div className="ui-cols-2">
                <DetailSection title="Mục tiêu ngắn hạn">
                  {profile?.shortTermGoal || 'Bạn chưa cập nhật mục tiêu ngắn hạn.'}
                </DetailSection>
                <DetailSection title="Mục tiêu dài hạn">
                  {profile?.longTermGoal || 'Bạn chưa cập nhật mục tiêu dài hạn.'}
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
                  hint="Thêm số điện thoại, email phụ hoặc liên kết mạng xã hội để nhà tuyển dụng liên hệ bạn."
                />
              ) : (
                <div className="ui-cols-2">
                  {contacts.map((c) => (
                    <div key={c.id} className="ui-contact">
                      <div className="ui-contact__main">
                        <span className="ui-contact__icon">{getContactIcon(c.type)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="ui-hint">{getContactTypeLabel(c.type)}</div>
                          <a
                            className="ui-contact__value"
                            href={getContactHref(c.type, c.value)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>{c.value}</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                      <RowActions
                        entity="kênh liên lạc"
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
            count={educationList.length}
            action={addButton('Thêm học vấn', () => openEducation())}
          >
            {educationList.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="Bạn chưa có thông tin học vấn nào"
                action={
                  <Button icon={Plus} onClick={() => openEducation()}>
                    Thêm học vấn ngay
                  </Button>
                }
              />
            ) : (
              <>
                {pagedEdu.map((edu) => (
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
                        onDelete={edu.id ? () => handleDeleteEducation(edu.id, edu.schoolName) : undefined}
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
                  currentPage={eduPage}
                  totalPages={Math.max(1, Math.ceil(educationList.length / EDU_PAGE_SIZE))}
                  totalElements={educationList.length}
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
            count={experiences.length}
            action={addButton('Thêm kinh nghiệm', () => openExperience())}
          >
            {experiences.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Bạn chưa thêm kinh nghiệm làm việc nào"
                action={
                  <Button icon={Plus} onClick={() => openExperience()}>
                    Thêm kinh nghiệm ngay
                  </Button>
                }
              />
            ) : (
              <>
                {pagedExp.map((exp) => (
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
                          <Badge key={tech.id || tech.name}>{tech.name || tech}</Badge>
                        ))}
                      </div>
                    )}
                  </Entry>
                ))}
                <Pagination
                  currentPage={expPage}
                  totalPages={Math.max(1, Math.ceil(experiences.length / EXP_PAGE_SIZE))}
                  totalElements={experiences.length}
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
            count={projects.length}
            action={addButton('Thêm dự án', () => openProject())}
          >
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderGit2}
                title="Bạn chưa thêm dự án nào"
                action={
                  <Button icon={Plus} onClick={() => openProject()}>
                    Thêm dự án ngay
                  </Button>
                }
              />
            ) : (
              <>
                {pagedProj.map((proj) => (
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
                  currentPage={projPage}
                  totalPages={Math.max(1, Math.ceil(projects.length / PROJ_PAGE_SIZE))}
                  totalElements={projects.length}
                  pageSize={PROJ_PAGE_SIZE}
                  onPageChange={setProjPage}
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
            count={skills.length}
            action={addButton('Thêm kỹ năng', () => openSkill())}
          >
            {skills.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Bạn chưa thêm kỹ năng nào"
                action={
                  <Button icon={Plus} onClick={() => openSkill()}>
                    Thêm kỹ năng ngay
                  </Button>
                }
              />
            ) : (
              <>
                <div className="ui-cols-2">
                  {pagedSkills.map((sk) => {
                    const stars =
                      sk.proficiencyLevel != null
                        ? sk.proficiencyLevel > 5
                          ? Math.max(1, Math.min(5, Math.round(sk.proficiencyLevel / 20)))
                          : sk.proficiencyLevel
                        : null;
                    const typeStr = (sk.skillType || '').toUpperCase();
                    const type =
                      typeStr === 'HARD'
                        ? { tone: 'info', label: 'Chuyên môn' }
                        : typeStr === 'SOFT'
                          ? { tone: 'success', label: 'Kỹ năng mềm' }
                          : { tone: 'neutral', label: 'Ngoại ngữ' };

                    return (
                      <Entry
                        key={sk.id}
                        title={sk.skillName || `Kỹ năng #${sk.skillId}`}
                        subtitle={<>
                          <Badge tone={type.tone}>{type.label}</Badge>
                          {sk.source === 'CAREER_PLAN' && <Badge tone="success">Từ lộ trình học</Badge>}
                        </>}
                        actions={
                          <RowActions
                            entity="kỹ năng"
                            onEdit={() => openSkill(sk)}
                            onDelete={() => handleDeleteSkill(sk.id, sk.skillName)}
                          />
                        }
                      >
                        <div className="ui-inline">
                          <span className="ui-hint">Độ thành thạo (tự đánh giá):</span>
                          {stars == null ? <span className="ui-hint">Chưa đánh giá</span> : <span className="ui-stars" role="img" aria-label={`${stars} trên 5 sao`}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={14} data-on={s <= stars} />
                            ))}
                          </span>}
                        </div>
                        {sk.languageLevel && (
                          <div className="ui-inline">
                            <span className="ui-hint">Ngoại ngữ:</span>
                            <strong>{sk.languageLevel}</strong>
                          </div>
                        )}
                      </Entry>
                    );
                  })}
                </div>
                <Pagination
                  currentPage={skillPage}
                  totalPages={Math.max(1, Math.ceil(skills.length / SKILL_PAGE_SIZE))}
                  totalElements={skills.length}
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
              title="Chứng chỉ chuyên môn"
              count={certificates.length}
              action={addButton('Thêm chứng chỉ', () => openAdditional('certificate'))}
            >
              {certificates.length === 0 ? (
                <EmptyState icon={Award} title="Chưa có chứng chỉ nào" />
              ) : (
                certificates.map((c) => (
                  <Entry
                    key={c.id}
                    title={c.name}
                    subtitle={c.issuedBy ? <span>Tổ chức cấp: {c.issuedBy}</span> : null}
                    meta={c.issuedYear}
                    actions={
                      <RowActions
                        entity="chứng chỉ"
                        onEdit={() => openAdditional('certificate', c)}
                        onDelete={() => handleDeleteAdditional('certificate', c.id)}
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
              title="Giải thưởng và thành tích"
              count={awards.length}
              action={addButton('Thêm giải thưởng', () => openAdditional('award'))}
            >
              {awards.length === 0 ? (
                <EmptyState icon={Trophy} title="Chưa có giải thưởng nào" />
              ) : (
                awards.map((a) => (
                  <Entry
                    key={a.id}
                    title={a.name}
                    subtitle={a.grantedBy ? <span>Đơn vị trao: {a.grantedBy}</span> : null}
                    meta={a.grantedYear}
                    actions={
                      <RowActions
                        entity="giải thưởng"
                        onEdit={() => openAdditional('award', a)}
                        onDelete={() => handleDeleteAdditional('award', a.id)}
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
                action={addButton('Thêm', () => openAdditional('interest'))}
              >
                {interests.length === 0 ? (
                  <EmptyState icon={Heart} title="Chưa có sở thích" />
                ) : (
                  <div className="ui-chip-row">
                    {interests.map((it) => (
                      <span key={it.id} className="ui-tag" title={it.description || ''}>
                        {it.name}
                        <IconButton
                          icon={Pencil}
                          size={12}
                          tone="info"
                          label="Sửa sở thích"
                          onClick={() => openAdditional('interest', it)}
                        />
                        <IconButton
                          icon={Trash2}
                          size={12}
                          tone="danger"
                          label="Xóa sở thích"
                          onClick={() => handleDeleteAdditional('interest', it.id)}
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
                action={addButton('Thêm', () => openAdditional('referrer'))}
              >
                {referrers.length === 0 ? (
                  <EmptyState icon={UserPlus} title="Chưa có người giới thiệu" />
                ) : (
                  referrers.map((r) => (
                    <Entry
                      key={r.id}
                      title={r.name}
                      subtitle={
                        r.position || r.company
                          ? <span>{[r.position, r.company && `(${r.company})`].filter(Boolean).join(' ')}</span>
                          : null
                      }
                      actions={
                        <RowActions
                          entity="người giới thiệu"
                          onEdit={() => openAdditional('referrer', r)}
                          onDelete={() => handleDeleteAdditional('referrer', r.id)}
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

      {/* ================= ALL MODALS ================= */}
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={profile}
        contacts={contacts}
        onUpdated={loadAllData}
      />

      <PlanUpgradeModal
        isOpen={isPlanModalOpen}
        currentPlanId={profile?.planId}
        onClose={() => setIsPlanModalOpen(false)}
        onSuccess={(plan) => {
          setProfile((prev) => (prev ? { ...prev, planId: plan.id, planName: plan.name } : prev));
          setIsPlanModalOpen(false);
          setToastMessage({ type: 'success', text: `Đã đổi sang gói "${plan.name}" thành công!` });
        }}
      />

      <UserContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contact={selectedContact}
        onSaved={loadAllData}
      />

      <UserEducationModal
        isOpen={isEduModalOpen}
        onClose={() => setIsEduModalOpen(false)}
        education={selectedEducation}
        onSaved={loadAllData}
      />

      <UserExperienceModal
        isOpen={isExpModalOpen}
        onClose={() => {
          setIsExpModalOpen(false);
          setSelectedExperience(null);
        }}
        experience={selectedExperience}
        onSaved={loadAllData}
      />

      <UserProjectModal
        isOpen={isProjModalOpen}
        onClose={() => {
          setIsProjModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSaved={loadAllData}
      />

      <UserSkillModal
        isOpen={isSkillModalOpen}
        onClose={() => {
          setIsSkillModalOpen(false);
          setSelectedSkill(null);
        }}
        userSkill={selectedSkill}
        existingSkillIds={skills.map((s) => s.skillId)}
        onSaved={loadAllData}
      />

      <UserAdditionalModal
        isOpen={isAdditionalModalOpen}
        onClose={() => {
          setIsAdditionalModalOpen(false);
          setSelectedAdditionalItem(null);
        }}
        type={additionalType}
        item={selectedAdditionalItem}
        onSaved={loadAllData}
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
    </UserLayout>
  );
};

export default ProfileDetailPage;
