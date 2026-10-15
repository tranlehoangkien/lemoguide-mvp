import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Lock,
  AlertCircle,
  Save,
  Eye,
  Download,
  Pencil,
  X,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  Zap,
  FolderGit2,
  Phone,
  User,
  FileBadge,
  Trophy,
  Users,
  Heart,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { ROUTES } from '@/constants/routes';
import { cvProfileService } from '@/services/cvProfileService';
import { useCvPublishSettings, draftModeOf } from '@/services/cvSettingsService';
import { cvTemplateService, FALLBACK_TEMPLATES } from '@/services/cvTemplateService';
import { userProfileService } from '@/services/userProfileService';
import { getCvTemplateComponent } from '@/components/cv-templates/cvTemplateRegistry';
import CvPaginatedSheet from '@/components/cv-templates/CvPaginatedSheet';
import { exportCvToPdf } from '@/utils/exportCvPdf';
import { ALL_SECTION_DEFS, STANDARD_SECTION_KEYS } from '@/components/cv-templates/cvTemplateUtils';
import CvAiAssistantPanel from '@/components/cv-builder/CvAiAssistantPanel';
import {
  Modal,
  Badge,
  Button,
  IconButton,
  EmptyState,
  FilterSelect,
  Toast,
} from '@/components/ui';
import { mergeCvPatch, touchedSectionKeys } from '@/utils/cvAiPatch';

// Modal chỉnh sửa hồ sơ — hỗ trợ lưu độc lập vào dữ liệu của CV
import ProfileEditModal from '@/pages/profile/modals/ProfileEditModal';
import UserContactModal from '@/pages/profile/modals/UserContactModal';
import UserEducationModal from '@/pages/profile/modals/UserEducationModal';
import UserExperienceModal from '@/pages/profile/modals/UserExperienceModal';
import UserProjectModal from '@/pages/profile/modals/UserProjectModal';
import UserSkillModal from '@/pages/profile/modals/UserSkillModal';
import UserAdditionalModal from '@/pages/profile/modals/UserAdditionalModal';

const TARGET_MODE_LABELS = {
  FRONTEND: 'Frontend Developer',
  BACKEND: 'Backend Developer',
  FULLSTACK: 'Fullstack Developer',
};

const ADDITIONAL_TYPE_BY_SECTION = {
  certificates: 'certificate',
  awards: 'award',
  interests: 'interest',
  referrers: 'referrer',
};

const SECTION_ICONS = {
  education: GraduationCap,
  experiences: Briefcase,
  skills: Zap,
  projects: FolderGit2,
  contacts: Phone,
  profile: User,
  certificates: FileBadge,
  awards: Trophy,
  referrers: Users,
  interests: Heart,
};

const emptyData = () => ({
  profile: {},
  contacts: [],
  education: [],
  experiences: [],
  projects: [],
  skills: [],
  certificates: [],
  awards: [],
  interests: [],
  referrers: [],
});

const getSectionItemCount = (key, cvData) => {
  if (!cvData) return 0;
  if (key === 'profile') return cvData.profile?.fullName ? 1 : 0;
  const list = cvData[key];
  return Array.isArray(list) ? list.length : 0;
};

const formatItemCount = (key, count) => {
  if (key === 'profile') return count > 0 ? 'Đã có tóm tắt' : 'Chưa có thông tin';
  if (count === 0) return 'Chưa có dữ liệu';
  switch (key) {
    case 'contacts':
      return `${count} thông tin liên hệ`;
    case 'education':
      return `${count} trường học`;
    case 'experiences':
      return `${count} kinh nghiệm`;
    case 'skills':
      return `${count} kỹ năng`;
    case 'projects':
      return `${count} dự án`;
    case 'certificates':
      return `${count} chứng chỉ`;
    case 'awards':
      return `${count} giải thưởng`;
    case 'referrers':
      return `${count} người giới thiệu`;
    case 'interests':
      return `${count} sở thích`;
    default:
      return `${count} mục`;
  }
};

const CvEditorPage = ({ withAiAssistant = false }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cvId = searchParams.get('id');
  const avatarInputRef = useRef(null);

  const [cvProfile, setCvProfile] = useState(null);
  const [template, setTemplate] = useState(null);
  const [data, setData] = useState(emptyData());
  const [activeSections, setActiveSections] = useState(STANDARD_SECTION_KEYS);
  const [showSectionManager, setShowSectionManager] = useState(true);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);

  // Trạng thái nháp của CV - chỉ cập nhật lên server khi người dùng ấn "Lưu CV"
  const [nameDraft, setNameDraft] = useState('');
  const [targetModeDraft, setTargetModeDraft] = useState('FULLSTACK');
  const [isPublishedDraft, setIsPublishedDraft] = useState(false);
  const cvSettings = useCvPublishSettings();
  const [isSaving, setIsSaving] = useState(false);

  // Modal Xem trước CV chuẩn A4
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Modal cho từng mục — mỗi modal tự xử lý chế độ "thêm mới" khi item = null
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [contactModal, setContactModal] = useState({ open: false, item: null });
  const [educationModal, setEducationModal] = useState({ open: false, item: null });
  const [experienceModal, setExperienceModal] = useState({ open: false, item: null });
  const [projectModal, setProjectModal] = useState({ open: false, item: null });
  const [skillModal, setSkillModal] = useState({ open: false, item: null });
  const [additionalModal, setAdditionalModal] = useState({ open: false, type: 'certificate', item: null });

  const showToast = (message, type = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProfileData = useCallback(async () => {
    const [profile, contacts, education, experiences, projects, skills, certificates, awards, interests, referrers] =
      await Promise.all([
        userProfileService.getMyProfile().catch(() => ({})),
        userProfileService.getContacts().catch(() => []),
        userProfileService.getEducation().catch(() => []),
        userProfileService.getExperiences().catch(() => []),
        userProfileService.getProjects().catch(() => []),
        userProfileService.getSkills().catch(() => []),
        userProfileService.getCertificates().catch(() => []),
        userProfileService.getAwards().catch(() => []),
        userProfileService.getInterests().catch(() => []),
        userProfileService.getReferrers().catch(() => []),
      ]);
    setData({ profile, contacts, education, experiences, projects, skills, certificates, awards, interests, referrers });
  }, []);

  const loadAll = useCallback(async () => {
    if (!cvId) {
      setLoadError('Thiếu mã CV.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [cv, templates] = await Promise.all([
        cvProfileService.getCvDetail(cvId),
        cvTemplateService.listActiveTemplates(),
      ]);
      if (!cv) {
        setLoadError('Không tìm thấy CV này.');
        return;
      }
      setCvProfile(cv);
      setNameDraft(cv.name || cv.title || '');
      setTargetModeDraft(cv.targetMode || 'FULLSTACK');
      setIsPublishedDraft(Boolean(cv.isPublished));
      const matchedTemplate =
        (templates || []).find((t) => Number(t.id) === Number(cv.templateId)) ||
        FALLBACK_TEMPLATES.find((t) => Number(t.id) === Number(cv.templateId)) ||
        templates?.[0] ||
        FALLBACK_TEMPLATES[0];
      setTemplate(matchedTemplate || null);

      // 1. Khởi tạo dữ liệu CV
      let parsedCvData = cv.cvData;
      if (typeof parsedCvData === 'string') {
        try {
          parsedCvData = JSON.parse(parsedCvData);
        } catch {
          parsedCvData = null;
        }
      }

      if (parsedCvData && typeof parsedCvData === 'object' && Object.keys(parsedCvData).length > 0) {
        const loadedProfile = { ...(parsedCvData.profile || {}) };
        if (!loadedProfile.avatarUrl && cv.avatarUrl) {
          loadedProfile.avatarUrl = cv.avatarUrl;
        }
        setData({
          profile: loadedProfile,
          avatarUrl: cv.avatarUrl || loadedProfile.avatarUrl || null,
          contacts: Array.isArray(parsedCvData.contacts) ? parsedCvData.contacts : [],
          education: Array.isArray(parsedCvData.education) ? parsedCvData.education : [],
          experiences: Array.isArray(parsedCvData.experiences) ? parsedCvData.experiences : [],
          projects: Array.isArray(parsedCvData.projects) ? parsedCvData.projects : [],
          skills: Array.isArray(parsedCvData.skills) ? parsedCvData.skills : [],
          certificates: Array.isArray(parsedCvData.certificates) ? parsedCvData.certificates : [],
          awards: Array.isArray(parsedCvData.awards) ? parsedCvData.awards : [],
          interests: Array.isArray(parsedCvData.interests) ? parsedCvData.interests : [],
          referrers: Array.isArray(parsedCvData.referrers) ? parsedCvData.referrers : [],
        });
      } else {
        // CV cũ chưa có cvData -> fallback tải từ Hồ sơ gốc
        await loadProfileData();
      }

      // 2. Khởi tạo các mục đang hiển thị trên CV
      let parsedSections = cv.activeSections;
      if (typeof parsedSections === 'string') {
        try {
          parsedSections = JSON.parse(parsedSections);
        } catch {
          parsedSections = null;
        }
      }
      if (Array.isArray(parsedSections) && parsedSections.length > 0) {
        setActiveSections(parsedSections);
      } else {
        setActiveSections(['profile', 'contacts', 'education', 'experiences', 'skills']);
      }

      setHasLocalChanges(false);
    } catch (e) {
      console.error('Lỗi tải trang chỉnh sửa CV:', e);
      setLoadError(e.message || 'Không thể tải CV, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [cvId, loadProfileData]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Tự động mở xem trước hoặc tải PDF nếu có cờ query param
  const shouldOpenPreview = searchParams.get('preview') === 'true';
  const shouldDownloadPdf = searchParams.get('download') === 'pdf';

  useEffect(() => {
    if (!loading && cvProfile) {
      if (shouldOpenPreview) {
        setPreviewModalOpen(true);
      }
      if (shouldDownloadPdf) {
        setTimeout(() => {
          handleDownloadPdf();
        }, 500);
      }
    }
  }, [loading, cvProfile, shouldOpenPreview, shouldDownloadPdf]);

  // Kiểm tra có thay đổi chưa lưu hay không
  const isDirty = useMemo(() => {
    if (!cvProfile) return false;
    if (hasLocalChanges) return true;
    const origName = (cvProfile.name || cvProfile.title || '').trim();
    const currName = nameDraft.trim();
    const origTarget = cvProfile.targetMode || 'FULLSTACK';
    const currTarget = targetModeDraft || 'FULLSTACK';
    const origPub = Boolean(cvProfile.isPublished);
    const currPub = Boolean(isPublishedDraft);

    return origName !== currName || origTarget !== currTarget || origPub !== currPub;
  }, [cvProfile, hasLocalChanges, nameDraft, targetModeDraft, isPublishedDraft]);

  // Khi nhấn nút "Lưu CV" thì mới gửi request cập nhật CV lên server
  const handleSaveCv = async () => {
    if (!cvProfile) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập tên bản CV', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await cvProfileService.updateCv(cvProfile.id, {
        name: trimmed,
        targetMode: targetModeDraft,
        templateId: cvProfile.templateId,
        isPublished: Boolean(isPublishedDraft),
        draftMode: cvProfile.publishMode && cvProfile.publishMode !== 'PUBLIC_LINK' ? cvProfile.publishMode : draftModeOf(cvSettings),
        avatarUrl: data.profile?.avatarUrl || data.avatarUrl || null,
        cvData: data,
        activeSections: activeSections,
      });
      setCvProfile(updated);
      setNameDraft(updated.name || updated.title || trimmed);
      setTargetModeDraft(updated.targetMode || 'FULLSTACK');
      setIsPublishedDraft(Boolean(updated.isPublished));
      setHasLocalChanges(false);
      showToast('Đã lưu bản CV thành công!');
    } catch (e) {
      console.error('Lỗi lưu CV:', e);
      showToast(e.message || 'Lưu CV thất bại, vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Tải CV về dạng PDF (vector sắc nét chuẩn in ấn A4)
  const handleDownloadPdf = () => {
    const targetElementId = previewModalOpen ? 'preview-printable-cv' : 'printable-cv';
    showToast('Đang khởi tạo bản in PDF chuẩn A4...');
    exportCvToPdf({
      elementId: targetElementId,
      title: nameDraft || cvProfile?.name || 'CV_LemoGuide',
      onAfterPrint: () => {
        showToast('Nếu trình duyệt hiển thị hộp thoại in, chọn "Lưu dưới dạng PDF" để tải về.');
      },
    });
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      showToast('Đang tải ảnh đại diện cho CV...');
      let newAvatarUrl = null;
      if (cvProfile?.id) {
        const res = await cvProfileService.uploadCvAvatar(cvProfile.id, file);
        newAvatarUrl = res?.avatarUrl || res?.profile?.avatarUrl;
      } else {
        const res = await cvProfileService.uploadCvImage(file);
        newAvatarUrl = res?.avatarUrl;
      }
      if (!newAvatarUrl || typeof newAvatarUrl !== 'string') {
        throw new Error('Không nhận được đường dẫn ảnh từ máy chủ');
      }
      setData((prev) => ({
        ...prev,
        avatarUrl: newAvatarUrl,
        profile: {
          ...(prev.profile || {}),
          avatarUrl: newAvatarUrl,
        },
      }));
      setHasLocalChanges(true);
      showToast('Đã cập nhật ảnh đại diện cho CV thành công!');
    } catch (err) {
      console.error('Lỗi tải ảnh đại diện CV:', err);
      showToast(err.message || 'Tải ảnh thất bại', 'error');
    }
  };

  // ==================== CẬP NHẬT CÁC MỤC TRÊN CV (LOCAL STATE) ====================

  const handleSaveProfileCustom = (profilePayload, contactList) => {
    setData((prev) => ({
      ...prev,
      avatarUrl: profilePayload.avatarUrl !== undefined ? profilePayload.avatarUrl : prev.avatarUrl,
      profile: {
        ...prev.profile,
        ...profilePayload,
      },
      contacts: contactList || prev.contacts,
    }));
    setHasLocalChanges(true);
    showToast('Đã cập nhật thông tin cá nhân trên CV');
  };

  const handleSaveContactCustom = (payload, itemId) => {
    setData((prev) => {
      let list = [...(prev.contacts || [])];
      if (itemId) {
        list = list.map((c) => (c.id === itemId ? { ...c, ...payload } : c));
      } else {
        list.push({ ...payload, id: `c_${Date.now()}` });
      }
      return { ...prev, contacts: list };
    });
    setHasLocalChanges(true);
    showToast('Đã lưu thông tin liên lạc');
  };

  const handleDeleteContactCustom = (itemId) => {
    setData((prev) => ({
      ...prev,
      contacts: (prev.contacts || []).filter((c) => c.id !== itemId),
    }));
    setHasLocalChanges(true);
    showToast('Đã xóa thông tin liên lạc');
  };

  const handleSaveEducationCustom = (payload, itemId) => {
    setData((prev) => {
      let list = [...(prev.education || [])];
      if (itemId) {
        list = list.map((e) => (e.id === itemId ? { ...e, ...payload } : e));
      } else {
        list.push({ ...payload, id: `edu_${Date.now()}` });
      }
      return { ...prev, education: list };
    });
    setHasLocalChanges(true);
    showToast('Đã lưu thông tin học vấn');
  };

  const handleSaveExperienceCustom = (payload, itemId) => {
    setData((prev) => {
      let list = [...(prev.experiences || [])];
      if (itemId) {
        list = list.map((e) => (e.id === itemId ? { ...e, ...payload } : e));
      } else {
        list.push({ ...payload, id: `exp_${Date.now()}` });
      }
      return { ...prev, experiences: list };
    });
    setHasLocalChanges(true);
    showToast('Đã lưu kinh nghiệm làm việc');
  };

  const handleSaveProjectCustom = (payload, itemId) => {
    setData((prev) => {
      let list = [...(prev.projects || [])];
      if (itemId) {
        list = list.map((p) => (p.id === itemId ? { ...p, ...payload } : p));
      } else {
        list.push({ ...payload, id: `prj_${Date.now()}` });
      }
      return { ...prev, projects: list };
    });
    setHasLocalChanges(true);
    showToast('Đã lưu dự án');
  };

  const handleSaveSkillCustom = (payload, itemId) => {
    setData((prev) => {
      let list = [...(prev.skills || [])];
      if (itemId) {
        list = list.map((s) => (s.id === itemId ? { ...s, ...payload } : s));
      } else {
        list.push({ ...payload, id: `sk_${Date.now()}` });
      }
      return { ...prev, skills: list };
    });
    setHasLocalChanges(true);
    showToast('Đã lưu kỹ năng');
  };

  const handleSaveAdditionalCustom = (typeOrPayload, payloadOrId, maybeId) => {
    let type = additionalModal.type;
    let payload = typeOrPayload;
    let itemId = payloadOrId;

    if (typeof typeOrPayload === 'string') {
      type = typeOrPayload;
      payload = payloadOrId;
      itemId = maybeId;
    }

    const sectionMap = {
      certificate: 'certificates',
      award: 'awards',
      interest: 'interests',
      referrer: 'referrers',
      certificates: 'certificates',
      awards: 'awards',
      interests: 'interests',
      referrers: 'referrers',
    };
    const key = sectionMap[type] || 'certificates';
    setData((prev) => {
      let list = [...(prev[key] || [])];
      if (itemId) {
        list = list.map((item) => (item.id === itemId ? { ...item, ...payload } : item));
      } else {
        list.push({ ...payload, id: `add_${Date.now()}` });
      }
      return { ...prev, [key]: list };
    });
    setHasLocalChanges(true);
    showToast('Đã lưu mục thành công');
  };

  const handleDeleteAdditionalCustom = (typeOrKey, itemId) => {
    let type = typeOrKey;
    let id = itemId;
    if (itemId === undefined) {
      type = additionalModal.type;
      id = typeOrKey;
    }
    const sectionMap = {
      certificate: 'certificates',
      award: 'awards',
      interest: 'interests',
      referrer: 'referrers',
      certificates: 'certificates',
      awards: 'awards',
      interests: 'interests',
      referrers: 'referrers',
    };
    const key = sectionMap[type] || 'certificates';
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((item) => item.id !== id),
    }));
    setHasLocalChanges(true);
    showToast('Đã xóa mục thành công');
  };

  // ==================== QUẢN LÝ MỤC CV (THÊM / XÓA MỤC) ====================

  const handleRemoveSection = (sectionKey) => {
    const def = ALL_SECTION_DEFS.find((d) => d.key === sectionKey);
    setActiveSections((prev) => prev.filter((k) => k !== sectionKey));
    setHasLocalChanges(true);
    showToast(`Đã xóa mục "${def?.label || sectionKey}" khỏi CV. Bạn có thể thêm lại ở cột bên phải.`, 'info');
  };

  const handleAddSection = (sectionKey) => {
    const def = ALL_SECTION_DEFS.find((d) => d.key === sectionKey);
    setActiveSections((prev) => {
      if (prev.includes(sectionKey)) return prev;
      return [...prev, sectionKey];
    });
    setHasLocalChanges(true);
    showToast(`Đã thêm mục "${def?.label || sectionKey}" vào CV!`);
  };

  const handleEditSection = (section, item) => {
    // Nếu mục đang bị ẩn, tự động kích hoạt mục đó khi bấm chỉnh sửa/thêm
    if (!activeSections.includes(section)) {
      setActiveSections((prev) => [...prev, section]);
      setHasLocalChanges(true);
    }

    switch (section) {
      case 'profile':
        setProfileModalOpen(true);
        break;
      case 'contacts':
        setContactModal({ open: true, item: item || null });
        break;
      case 'education':
        setEducationModal({ open: true, item: item || null });
        break;
      case 'experiences':
        setExperienceModal({ open: true, item: item || null });
        break;
      case 'projects':
        setProjectModal({ open: true, item: item || null });
        break;
      case 'skills':
        setSkillModal({ open: true, item: item || null });
        break;
      case 'certificates':
      case 'awards':
      case 'interests':
      case 'referrers':
        setAdditionalModal({ open: true, type: ADDITIONAL_TYPE_BY_SECTION[section], item: item || null });
        break;
      default:
        break;
    }
  };

  // Áp bản vá dữ liệu do trợ lý AI trả về (cột trái, chỉ có ở /cv-builder) vào
  // state CV local - giống hệt các thao tác chỉnh sửa thủ công khác, chỉ lưu
  // thật lên máy chủ khi người dùng bấm "Lưu CV".
  const handleApplyAiPatch = (patch) => {
    setData((prev) => mergeCvPatch(prev, patch));
    const touched = touchedSectionKeys(patch);
    if (touched.length > 0) {
      setActiveSections((prev) => {
        const toAdd = touched.filter((k) => !prev.includes(k));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
    }
    setHasLocalChanges(true);
    showToast('AI đã cập nhật nội dung CV — nhấn "Lưu CV" để lưu lại.');
  };


  const TemplateComponent = useMemo(
    () => (template?.renderKey ? getCvTemplateComponent(template.renderKey) : null),
    [template]
  );

  const activeSectionDefs = useMemo(
    () => ALL_SECTION_DEFS.filter((d) => activeSections.includes(d.key)),
    [activeSections]
  );

  const inactiveSectionDefs = useMemo(
    () => ALL_SECTION_DEFS.filter((d) => !activeSections.includes(d.key)),
    [activeSections]
  );

  return (
    <UserLayout fullBleed={true}>
      <div className="ui-editor">
        <Toast toast={toast && { message: toast.message, tone: toast.type === 'error' ? 'error' : 'success' }} />

        <div className="ui-editor__bar">
          <div className="ui-editor__title">
            <IconButton icon={ArrowLeft} label="Quay lại danh sách CV" onClick={() => navigate(ROUTES.MY_CV)} />
            <input
              type="text"
              className="ui-input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Tên CV"
              aria-label="Tên CV"
            />
          </div>

          {cvProfile && (
            <div className="ui-editor__actions">
              <FilterSelect label="Vị trí ứng tuyển mục tiêu" value={targetModeDraft} onChange={setTargetModeDraft}>
                {Object.entries(TARGET_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <Button
                variant="secondary"
                icon={isPublishedDraft ? Globe : Lock}
                onClick={() => setIsPublishedDraft(!isPublishedDraft)}
                disabled={!isPublishedDraft && !cvSettings.publicLinkEnabled}
                title={isPublishedDraft ? 'Đang công khai, bấm để chuyển về bản nháp'
                  : cvSettings.publicLinkEnabled ? 'Bản nháp, bấm để công khai' : 'Quản trị viên đang tạm tắt chia sẻ CV bằng link công khai'}
              >
                {isPublishedDraft ? 'Công khai' : 'Bản nháp'}
              </Button>
              <Button
                variant="secondary"
                icon={SlidersHorizontal}
                aria-pressed={showSectionManager}
                onClick={() => setShowSectionManager(!showSectionManager)}
                title={showSectionManager ? 'Ẩn thanh Quản lý mục CV' : 'Hiện thanh Quản lý mục CV'}
              >
                Quản lý mục
              </Button>
              <Button variant="secondary" icon={Eye} onClick={() => setPreviewModalOpen(true)} title="Xem trước CV chuẩn A4">
                Xem trước
              </Button>
              <Button
                variant="secondary"
                icon={Download}
                onClick={handleDownloadPdf}
                title="Tải CV về dưới dạng file PDF chuẩn in ấn A4"
              >
                Tải PDF
              </Button>
              <Button
                icon={Save}
                loading={isSaving}
                onClick={handleSaveCv}
                title={isDirty ? 'Lưu các thay đổi của bản CV' : 'Bản CV đã được lưu'}
              >
                {isSaving ? 'Đang lưu...' : isDirty ? 'Lưu CV' : 'Đã lưu'}
                {isDirty && !isSaving && <span className="ui-dot" style={{ background: '#fbbf24' }} aria-hidden="true" />}
              </Button>
            </div>
          )}
        </div>

        <div className="ui-editor__body">
          {withAiAssistant && (
            <CvAiAssistantPanel cvId={cvProfile?.id} cvName={nameDraft || cvProfile?.name} data={data} onApplyPatch={handleApplyAiPatch} />
          )}

          <div className="ui-editor__canvas">
            {loading ? (
              <EmptyState icon={FileBadge} title="Đang tải CV..." />
            ) : loadError ? (
              <EmptyState icon={AlertCircle} title="Không thể tải CV" hint={loadError} />
            ) : !TemplateComponent ? (
              <EmptyState icon={AlertCircle} title="Template của CV này chưa hỗ trợ hiển thị trực tiếp." />
            ) : (
              <div className="ui-editor__sheet">
                <div className="no-print ui-editor__tip">
                  <span>
                    Di chuột vào từng mục để chỉnh sửa (bút chì) hoặc xóa mục khỏi CV (thùng rác đỏ). Nhấn <strong>Lưu CV</strong> sau khi sửa.
                  </span>
                  <Badge>Khổ chuẩn in ấn A4 (210 × 297 mm)</Badge>
                </div>
                <CvPaginatedSheet id="printable-cv" editable>
                  <TemplateComponent
                    data={data}
                    editable
                    activeSections={activeSections}
                    onEditSection={handleEditSection}
                    onRemoveSection={handleRemoveSection}
                    onDeleteContact={handleDeleteContactCustom}
                    onDeleteAdditional={handleDeleteAdditionalCustom}
                    onEditAvatar={() => avatarInputRef.current?.click()}
                  />
                </CvPaginatedSheet>
              </div>
            )}
          </div>

          {showSectionManager && (
            <aside className="ui-editor__side" aria-label="Quản lý mục CV">
              <div className="ui-editor__side-head">
                <span className="ui-contact__icon">
                  <Layers size={17} aria-hidden="true" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>Quản lý mục CV</strong>
                  <div className="ui-hint">Bật/tắt các phần xuất hiện</div>
                </div>
                <IconButton icon={X} label="Thu gọn bảng quản lý" onClick={() => setShowSectionManager(false)} />
              </div>

              <div className="ui-editor__side-body">
                <div className="ui-detail-section" style={{ marginTop: 0 }}>
                  <h4>Mục đang hiển thị ({activeSectionDefs.length})</h4>
                  {activeSectionDefs.length === 0 ? (
                    <p className="ui-hint">Chưa có mục nào được hiển thị trên CV.</p>
                  ) : (
                    <div className="ui-stack" style={{ gap: 8 }}>
                      {activeSectionDefs.map((sec) => {
                        const IconComponent = SECTION_ICONS[sec.key] || Layers;
                        const count = getSectionItemCount(sec.key, data);
                        return (
                          <div key={sec.key} className="ui-contact">
                            <div className="ui-contact__main">
                              <span className="ui-contact__icon">
                                <IconComponent size={15} aria-hidden="true" />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: '0.875rem' }}>{sec.label}</strong>
                                <div className="ui-hint">{formatItemCount(sec.key, count)}</div>
                              </div>
                            </div>
                            <div className="ui-row-actions">
                              <IconButton
                                icon={Plus}
                                tone="info"
                                label={`Thêm / chỉnh sửa ${sec.label}`}
                                onClick={() => handleEditSection(sec.key, null)}
                              />
                              <IconButton
                                icon={Trash2}
                                tone="danger"
                                label={`Xóa mục ${sec.label} khỏi CV`}
                                onClick={() => handleRemoveSection(sec.key)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="ui-detail-section" style={{ marginTop: 0 }}>
                  <h4>Mục có thể thêm vào CV ({inactiveSectionDefs.length})</h4>
                  {inactiveSectionDefs.length === 0 ? (
                    <p className="ui-hint">Toàn bộ các mục sẵn có đều đã được kích hoạt trên CV của bạn.</p>
                  ) : (
                    <div className="ui-stack" style={{ gap: 8 }}>
                      {inactiveSectionDefs.map((sec) => {
                        const IconComponent = SECTION_ICONS[sec.key] || Layers;
                        return (
                          <div key={sec.key} className="ui-contact">
                            <div className="ui-contact__main">
                              <span className="ui-contact__icon">
                                <IconComponent size={15} aria-hidden="true" />
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: '0.875rem' }}>{sec.label}</strong>
                                <div className="ui-hint">{sec.isStandard ? 'Mục tiêu chuẩn' : 'Mục tùy chọn'}</div>
                              </div>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Plus}
                              onClick={() => handleAddSection(sec.key)}
                              title={`Thêm ${sec.label} vào CV`}
                            >
                              Thêm
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={handleAvatarFile}
      />

      <Modal
        open={previewModalOpen}
        size="xl"
        title={`Xem trước: ${nameDraft || 'Bản CV'}`}
        description={`${isPublishedDraft ? 'Công khai' : 'Bản nháp'} · Bản xem trước chuẩn ATS (chỉ hiển thị ${activeSections.length} mục bạn đã chọn, không hiển thị nút chỉnh sửa)`}
        onClose={() => setPreviewModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" icon={Download} onClick={handleDownloadPdf}>
              Tải PDF
            </Button>
            <Button icon={Pencil} onClick={() => setPreviewModalOpen(false)}>
              Tiếp tục chỉnh sửa
            </Button>
          </>
        }
      >
        {TemplateComponent ? (
          <div className="ui-editor__preview">
            <CvPaginatedSheet id="preview-printable-cv" boxShadow="0 12px 36px rgba(0,0,0,0.25)">
              <TemplateComponent data={data} editable={false} activeSections={activeSections} />
            </CvPaginatedSheet>
          </div>
        ) : (
          <EmptyState icon={AlertCircle} title="Không thể hiển thị bản xem trước." />
        )}
      </Modal>

      {/* ==================== 4. CÁC MODAL CẬP NHẬT DỮ LIỆU CV ==================== */}
      <ProfileEditModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialData={data.profile}
        contacts={data.contacts}
        onSaveCustom={handleSaveProfileCustom}
      />

      <UserContactModal
        isOpen={contactModal.open}
        onClose={() => setContactModal({ open: false, item: null })}
        contact={contactModal.item}
        onSaveItem={handleSaveContactCustom}
        onDeleteItem={handleDeleteContactCustom}
      />

      <UserEducationModal
        isOpen={educationModal.open}
        onClose={() => setEducationModal({ open: false, item: null })}
        education={educationModal.item}
        onSaveItem={handleSaveEducationCustom}
      />

      <UserExperienceModal
        isOpen={experienceModal.open}
        onClose={() => setExperienceModal({ open: false, item: null })}
        experience={experienceModal.item}
        onSaveItem={handleSaveExperienceCustom}
      />

      <UserProjectModal
        isOpen={projectModal.open}
        onClose={() => setProjectModal({ open: false, item: null })}
        project={projectModal.item}
        onSaveItem={handleSaveProjectCustom}
      />

      <UserSkillModal
        isOpen={skillModal.open}
        onClose={() => setSkillModal({ open: false, item: null })}
        userSkill={skillModal.item}
        existingSkillIds={(data?.skills || []).map((s) => s?.skillId || s?.id).filter(Boolean)}
        onSaveItem={handleSaveSkillCustom}
      />

      <UserAdditionalModal
        isOpen={additionalModal.open}
        onClose={() => setAdditionalModal({ open: false, type: additionalModal.type, item: null })}
        type={additionalModal.type}
        item={additionalModal.item}
        onSaveItem={handleSaveAdditionalCustom}
        onDeleteItem={handleDeleteAdditionalCustom}
      />
    </UserLayout>
  );
};

export default CvEditorPage;
