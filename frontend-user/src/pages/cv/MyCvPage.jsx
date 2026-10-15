import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Plus,
  Globe,
  Lock,
  Eye,
  Copy,
  Trash2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Pencil,
  Download,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { ROUTES } from '@/constants/routes';
import { cvProfileService } from '@/services/cvProfileService';
import { useCvPublishSettings, draftModeOf, startsPublic } from '@/services/cvSettingsService';
import { cvTemplateService, FALLBACK_TEMPLATES } from '@/services/cvTemplateService';
import { userProfileService } from '@/services/userProfileService';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import {
  Page,
  PageHeader,
  Toolbar,
  ToolbarGroup,
  SearchBox,
  Card,
  EmptyState,
  Badge,
  Button,
  IconButton,
  FormModal,
  Toast,
} from '@/components/ui';
import CvMiniPreview from '@/components/cv-templates/CvMiniPreview';
import CvCreateFields from './CvCreateFields';
import CvAiCreateStage from './CvAiCreateStage';

const PAGE_SIZE = 10;


const TARGET_MODE_LABELS = {
  FRONTEND: 'Frontend Developer',
  BACKEND: 'Backend Developer',
  FULLSTACK: 'Fullstack Developer',
};

const MyCvPage = () => {
  const navigate = useNavigate();

  const [allCvs, setAllCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PUBLIC, PRIVATE
  const [currentPage, setCurrentPage] = useState(1);

  const [modalType, setModalType] = useState(null); // 'delete' | null
  const [selectedCv, setSelectedCv] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiCreateMode, setIsAiCreateMode] = useState(false);
  const cvSettings = useCvPublishSettings();
  const [newCvForm, setNewCvForm] = useState({
    name: '',
    targetMode: 'FULLSTACK',
    templateId: null,
    isPublished: false,
    applyProfileData: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  // 3 template CV thật (đã clone giao diện, xem frontend-user/src/components/cv-templates) để người dùng chọn khi tạo CV
  const [templates, setTemplates] = useState([]);
  const [loadingPickers, setLoadingPickers] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingPickers(true);
      try {
        const templateList = await cvTemplateService.listRenderableTemplates();
        setTemplates(templateList && templateList.length > 0 ? templateList : FALLBACK_TEMPLATES);
      } catch (err) {
        console.warn('Lỗi tải template, dùng fallback:', err);
        setTemplates(FALLBACK_TEMPLATES);
      } finally {
        setLoadingPickers(false);
      }
    })();
  }, []);

  const displayTemplates = useMemo(() => {
    if (templates && templates.length > 0) return templates;
    return FALLBACK_TEMPLATES;
  }, [templates]);

  const templateById = useMemo(() => Object.fromEntries(displayTemplates.map((t) => [t.id, t])), [displayTemplates]);

  const showToast = (message, type = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCvs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await cvProfileService.getMyCvs({ page: 0, size: 100 });
      setAllCvs(res.content || []);
    } catch (e) {
      console.error('Lỗi tải CV:', e);
      setAllCvs([]);
      setLoadError(e.message || 'Không thể tải danh sách CV, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCvs();
  }, [loadCvs]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadCvs();
    showToast('Đã tải lại danh sách CV');
  };

  const handlePreviewCv = (cvId) => {
    // Không dùng 'noopener': phiên đăng nhập nằm trong sessionStorage (theo từng tab) và chỉ được
    // sao chép sang tab mới khi tab mở ra còn giữ quan hệ opener; nếu không tab mới sẽ bị đưa về /login.
    window.open(`${ROUTES.CV_PREVIEW}?id=${cvId}`, '_blank');
  };

  const handleDuplicate = async (cv) => {
    try {
      await cvProfileService.createCv({
        name: `${cv.name || cv.title} (Bản sao)`,
        targetMode: cv.targetMode,
        templateId: cv.templateId,
        isPublished: false,
      });
      await loadCvs();
      showToast('Đã nhân bản CV thành công!');
    } catch (e) {
      console.error('Lỗi nhân bản CV:', e);
      showToast(e.message || 'Nhân bản CV thất bại, vui lòng thử lại.', 'error');
    }
  };

  const handleOpenDelete = (cv) => {
    setSelectedCv(cv);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedCv(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCv) return;
    setIsSubmitting(true);
    try {
      await cvProfileService.deleteCv(selectedCv.id);
      showToast('Đã xóa CV thành công!');
      handleCloseModal();
      await loadCvs();
    } catch (e) {
      console.error('Lỗi xóa CV:', e);
      showToast(e.message || 'Xóa CV thất bại, vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    const defaultTemplate = displayTemplates[0] || FALLBACK_TEMPLATES[0];
    setNewCvForm({
      name: `CV ${TARGET_MODE_LABELS['FULLSTACK'] || 'Fullstack'} - ${new Date().toLocaleDateString('vi-VN')}`,
      targetMode: 'FULLSTACK',
      templateId: defaultTemplate ? defaultTemplate.id : 1,
      isPublished: startsPublic(cvSettings),
      applyProfileData: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenAiCreate = () => {
    const defaultTemplate = displayTemplates[0] || FALLBACK_TEMPLATES[0];
    setNewCvForm({
      name: `CV ${TARGET_MODE_LABELS['FULLSTACK'] || 'Fullstack'} - ${new Date().toLocaleDateString('vi-VN')}`,
      targetMode: 'FULLSTACK',
      templateId: defaultTemplate ? defaultTemplate.id : 1,
      isPublished: startsPublic(cvSettings),
      applyProfileData: true,
    });
    setIsAiCreateMode(true);
  };

  const handleTargetModeChange = (mode) => {
    setNewCvForm((prev) => {
      const newLabel = TARGET_MODE_LABELS[mode] || mode;
      let newName = prev.name;
      if (!newName || newName.startsWith('CV ')) {
        newName = `CV ${newLabel} - ${new Date().toLocaleDateString('vi-VN')}`;
      }
      return {
        ...prev,
        targetMode: mode,
        name: newName,
      };
    });
  };

  const handleCreateNormalCv = async (e) => {
    if (e) e.preventDefault();
    if (!newCvForm.name.trim()) {
      showToast('Vui lòng nhập tên bản CV', 'error');
      return;
    }
    if (displayTemplates.length > 0 && !newCvForm.templateId) {
      showToast('Vui lòng chọn một Template cho CV', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      let initialCvData = null;
      let initialActiveSections = null;

      if (newCvForm.applyProfileData) {
        // Lấy thông tin từ Hồ sơ cá nhân của người dùng
        try {
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

          initialCvData = {
            profile: profile || {},
            contacts: contacts || [],
            education: education || [],
            experiences: experiences || [],
            projects: projects || [],
            skills: skills || [],
            certificates: certificates || [],
            awards: awards || [],
            interests: interests || [],
            referrers: referrers || [],
          };

          // Các mục tiêu chuẩn luôn có
          const active = ['profile', 'contacts', 'education', 'experiences', 'skills'];
          // Các mục tùy chọn: chỉ bật nếu có dữ liệu thực tế trong hồ sơ
          if (projects && projects.length > 0) active.push('projects');
          if (certificates && certificates.length > 0) active.push('certificates');
          if (awards && awards.length > 0) active.push('awards');
          if (referrers && referrers.length > 0) active.push('referrers');
          if (interests && interests.length > 0) active.push('interests');

          initialActiveSections = active;
        } catch (loadErr) {
          console.warn('Không thể nạp toàn bộ profile:', loadErr);
        }
      } else {
        // Khởi tạo CV trống hoàn toàn để người dùng tự điền từ đầu
        const myProfile = await userProfileService.getMyProfile().catch(() => ({}));
        initialCvData = {
          profile: { fullName: myProfile?.fullName || '', avatarUrl: null },
          avatarUrl: null,
          contacts: [],
          education: [],
          experiences: [],
          projects: [],
          skills: [],
          certificates: [],
          awards: [],
          interests: [],
          referrers: [],
        };
        initialActiveSections = ['profile', 'contacts', 'education', 'experiences', 'skills'];
      }

      const created = await cvProfileService.createCv({
        name: newCvForm.name.trim(),
        targetMode: newCvForm.targetMode,
        templateId: newCvForm.templateId,
        isPublished: Boolean(newCvForm.isPublished) && cvSettings.publicLinkEnabled,
        draftMode: draftModeOf(cvSettings),
        avatarUrl: newCvForm.applyProfileData ? (initialCvData?.profile?.avatarUrl || null) : null,
        cvData: initialCvData,
        activeSections: initialActiveSections,
      });
      showToast(`Đã tạo thành công bản CV "${created.name || created.title}"!`);
      setIsCreateModalOpen(false);
      await loadCvs();
      // Điều hướng ngay tới trang chỉnh sửa từng mục của CV vừa tạo
      navigate(`${ROUTES.CV_EDITOR}?id=${created.id}`);
    } catch (err) {
      console.error('Lỗi tạo CV:', err);
      showToast(err.message || 'Tạo CV thất bại, vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartAiCv = async (e) => {
    if (e) e.preventDefault();
    if (!newCvForm.name.trim()) {
      showToast('Vui lòng nhập tên bản CV', 'error');
      return;
    }
    if (displayTemplates.length > 0 && !newCvForm.templateId) {
      showToast('Vui lòng chọn một mẫu giao diện CV', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      let initialCvData = null;
      let initialActiveSections = null;

      if (newCvForm.applyProfileData) {
        try {
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

          initialCvData = {
            profile: {
              fullName: profile.fullName || '',
              title: profile.title || '',
              summary: profile.bio || profile.summary || '',
              avatarUrl: profile.avatarUrl || null,
            },
            avatarUrl: profile.avatarUrl || null,
            contacts: contacts || [],
            education: education || [],
            experiences: experiences || [],
            projects: projects || [],
            skills: skills || [],
            certificates: certificates || [],
            awards: awards || [],
            interests: interests || [],
            referrers: referrers || [],
          };

          const active = ['profile', 'contacts', 'education', 'experiences', 'skills'];
          if (projects && projects.length > 0) active.push('projects');
          if (certificates && certificates.length > 0) active.push('certificates');
          if (awards && awards.length > 0) active.push('awards');
          if (referrers && referrers.length > 0) active.push('referrers');
          if (interests && interests.length > 0) active.push('interests');

          initialActiveSections = active;
        } catch (loadErr) {
          console.warn('Không thể nạp toàn bộ profile:', loadErr);
        }
      } else {
        const myProfile = await userProfileService.getMyProfile().catch(() => ({}));
        initialCvData = {
          profile: { fullName: myProfile?.fullName || '', avatarUrl: null },
          avatarUrl: null,
          contacts: [],
          education: [],
          experiences: [],
          projects: [],
          skills: [],
          certificates: [],
          awards: [],
          interests: [],
          referrers: [],
        };
        initialActiveSections = ['profile', 'contacts', 'education', 'experiences', 'skills'];
      }

      const created = await cvProfileService.createCv({
        name: newCvForm.name.trim(),
        targetMode: newCvForm.targetMode,
        templateId: newCvForm.templateId,
        isPublished: Boolean(newCvForm.isPublished) && cvSettings.publicLinkEnabled,
        draftMode: draftModeOf(cvSettings),
        avatarUrl: newCvForm.applyProfileData ? (initialCvData?.profile?.avatarUrl || null) : null,
        cvData: initialCvData,
        activeSections: initialActiveSections,
      });

      showToast(`Đã tạo thành công bản CV "${created.name || created.title}"! Đang chuyển đến không gian AI...`);
      setIsAiCreateMode(false);
      await loadCvs();
      // Điều hướng ngay tới trang tạo CV với AI hiện tại
      navigate(`${ROUTES.CV_BUILDER || '/cv-builder'}?id=${created.id}&mode=ai`);
    } catch (err) {
      console.error('Lỗi tạo CV với AI:', err);
      showToast(err.message || 'Khởi tạo CV thất bại, vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc + phân trang phía client (backend /api/me/cv-profiles chưa hỗ trợ tìm kiếm theo từ khóa)
  const filteredList = useMemo(() => {
    return allCvs.filter((cv) => {
      const matchesSearch =
        (cv.name || cv.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cv.targetMode || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === 'PUBLIC') return matchesSearch && cv.isPublished;
      if (filterStatus === 'PRIVATE') return matchesSearch && !cv.isPublished;
      return matchesSearch;
    });
  }, [allCvs, searchQuery, filterStatus]);

  const totalElements = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const pagedList = filteredList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const totalCvs = allCvs.length;


  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (cv) => (
    <Badge tone={cv.isPublished ? 'success' : 'warning'}>
      {cv.isPublished ? <Globe size={12} aria-hidden="true" /> : <Lock size={12} aria-hidden="true" />}
      {cv.isPublished ? 'Công khai' : 'Bản nháp'}
    </Badge>
  );

  return (
    <UserLayout fullBleed={isAiCreateMode}>
      <Toast toast={toast &&{ message: toast.message, tone: toast.type === 'error' ? 'error' : 'success' }} />

      {isAiCreateMode ? (
        <CvAiCreateStage
          form={newCvForm}
          setForm={setNewCvForm}
          onTargetModeChange={handleTargetModeChange}
          templates={displayTemplates}
          loading={loadingPickers}
          isSubmitting={isSubmitting}
          onSubmit={handleStartAiCv}
          onBack={() => setIsAiCreateMode(false)}
        />
      ) : (
        <Page>
          <PageHeader
            title="CV của tôi"
            description="Quản lý, sao chép và tùy biến các phiên bản CV cho từng vị trí ứng tuyển mục tiêu."
            actions={
              <>
                <Button variant="ai" icon={Sparkles} onClick={handleOpenAiCreate}>
                  Tạo CV với AI
                </Button>
                <Button trailingIcon={Plus} onClick={handleOpenCreateModal}>
                  Tạo CV
                </Button>
              </>
            }
          />

          <Toolbar>
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Tìm theo tên CV hoặc vị trí..."
            />
            <ToolbarGroup>
              <select
                className="ui-select ui-filter"
                aria-label="Lọc theo trạng thái"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PUBLIC">Công khai (Public)</option>
                <option value="PRIVATE">Bản nháp (Draft)</option>
              </select>
              <Button variant="secondary" icon={RotateCcw} onClick={handleResetFilters} title="Đặt lại bộ lọc và tìm kiếm">
                Đặt lại
              </Button>
              <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh} title="Tải lại danh sách" disabled={loading}>
                Tải lại
              </Button>
            </ToolbarGroup>
          </Toolbar>

          {loadError ? (
            <Card>
              <EmptyState
                icon={AlertCircle}
                title="Không thể tải danh sách CV"
                hint={loadError}
                action={<Button onClick={loadCvs}>Thử lại</Button>}
              />
            </Card>
          ) : loading ? (
            <div className="ui-cv-grid" aria-busy="true" aria-label="Đang tải danh sách CV">
              {[0, 1, 2].map((i) => (
                <div key={i} className="ui-skel ui-skel--cv" />
              ))}
            </div>
          ) : pagedList.length === 0 ? (
            <Card>
              <EmptyState
                icon={FileText}
                title={totalCvs === 0 ? 'Chưa có bản CV nào' : 'Không tìm thấy CV phù hợp'}
                hint={
                  totalCvs === 0
                    ? 'Hãy để LemoGuide AI đồng hành cùng bạn xây dựng bản CV chuyên nghiệp chuẩn quốc tế chỉ trong vài phút!'
                    : 'Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
                }
                action={
                  <>
                    <Button variant="ai" icon={Sparkles} onClick={handleOpenAiCreate}>
                      Tạo CV với AI
                    </Button>
                    <Button trailingIcon={Plus} onClick={handleOpenCreateModal}>
                      Tạo CV
                    </Button>
                  </>
                }
              />
            </Card>
          ) : (
            <div className="ui-cv-grid">
              {pagedList.map((cv) => {
                const name = cv.name || cv.title;
                const template = templateById[cv.templateId];
                const openEditor = () => navigate(`${ROUTES.CV_EDITOR}?id=${cv.id}`);
                return (
                  <article key={cv.id} className="ui-cv-card">
                    <div className="ui-cv-card__thumb">
                      <CvMiniPreview cv={cv} template={template} />
                      <button type="button" className="ui-cv-card__open" onClick={openEditor} aria-label={`Mở CV ${name}`} />
                      <span className="ui-cv-card__status">{renderStatusBadge(cv)}</span>
                    </div>
                    <div className="ui-cv-card__body">
                      <h3 className="ui-cv-card__title" title={name}>
                        {name}
                      </h3>
                      <p className="ui-hint" style={{ margin: 0 }}>
                        {TARGET_MODE_LABELS[cv.targetMode] || cv.targetMode || 'Chưa chọn vị trí'}
                      </p>
                      <div className="ui-cv-card__meta">
                        <span className="ui-inline">
                          <Calendar size={13} aria-hidden="true" />
                          Cập nhật {formatDate(cv.updatedAt || cv.createdAt)}
                        </span>
                        <span className="ui-inline">
                          <Eye size={13} aria-hidden="true" />
                          {cv.views || 0} lượt xem
                        </span>
                      </div>
                    </div>
                    <div className="ui-cv-card__foot">
                      <div className="ui-cv-card__cta">
                        <Button size="sm" icon={Pencil} onClick={openEditor}>
                          Chỉnh sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="ai"
                          icon={Sparkles}
                          onClick={() => navigate(`${ROUTES.CV_BUILDER || '/cv-builder'}?id=${cv.id}`)}
                        >
                          Sửa với AI
                        </Button>
                      </div>
                      <div className="ui-cv-card__tools">
                        <IconButton icon={Eye} label="Xem trước CV" size={15} onClick={() => handlePreviewCv(cv.id)} />
                        <IconButton
                          icon={Download}
                          label="Tải PDF"
                          size={15}
                          onClick={() => navigate(`${ROUTES.CV_EDITOR}?id=${cv.id}&download=pdf`)}
                        />
                        <IconButton icon={Copy} label="Nhân bản" size={15} onClick={() => handleDuplicate(cv)} />
                        <IconButton icon={Trash2} tone="danger" label="Xóa" size={15} onClick={() => handleOpenDelete(cv)} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !loadError && pagedList.length > 0 && (
            <Card>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                entityName="CV"
              />
            </Card>
          )}
        </Page>
    )}

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedCv}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa CV?"
        subtitle="Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống."
        message={selectedCv && (
          <>Bạn có chắc chắn muốn xóa CV <strong>"{selectedCv.name || selectedCv.title}"</strong>? Hành động này không thể hoàn tác.</>
        )}
        confirmLabel="Xác nhận xóa"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModal}
      />

      <FormModal
        open={isCreateModalOpen}
        title="Tạo bản CV mới"
        description="Khởi tạo bản CV chuyên nghiệp chuẩn ATS theo mục tiêu nghề nghiệp"
        size="lg"
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNormalCv}
        isSubmitting={isSubmitting}
        submitLabel="Tạo CV"
        submittingLabel="Đang tạo..."
      >
        <CvCreateFields
          form={newCvForm}
          setForm={setNewCvForm}
          onTargetModeChange={handleTargetModeChange}
          templates={displayTemplates}
          loading={loadingPickers}
          autoFocus
        />
      </FormModal>
    </UserLayout>
  );
};

export default MyCvPage;
