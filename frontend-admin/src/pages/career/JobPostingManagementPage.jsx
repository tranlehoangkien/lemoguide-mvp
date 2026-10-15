import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, AlertCircle, Building2, MapPin, Briefcase, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  jobPostingAdminService,
  JOB_POSTING_SOURCES,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_POSTING_STATUSES,
} from '@/services/jobPostingAdminService';
import { skillService } from '@/services/skillService';
import { technologyService } from '@/services/technologyService';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import {
  Page,
  PageHeader,
  Toolbar,
  ToolbarGroup,
  SearchBox,
  Segmented,
  Card,
  EmptyState,
  Badge,
  Button,
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  FormModal,
  Modal,
  DetailGrid,
  DetailItem,
  DetailSection,
  Toast,
  useToast,
  DataTable,
  RowActions,
  ResetRefreshButtons,
  FilterSelect,
  ViewFooter,
  TABLE_GRID_OPTIONS,
} from '@/components/ui';

const PAGE_SIZE = 10;

const initialFormState = {
  source: 'INTERNAL',
  sourceUrl: '',
  companyName: '',
  companyLogoUrl: '',
  title: '',
  description: '',
  requirements: '',
  benefits: '',
  location: '',
  employmentType: 'FULL_TIME',
  experienceLevel: 'JUNIOR',
  salaryMin: '',
  salaryMax: '',
  isSalaryNegotiable: false,
  status: 'ACTIVE',
  skills: [],
  technologies: [],
};

const statusBadge = (status) =>
  JOB_POSTING_STATUSES.find((s) => s.value === status) || { label: status, color: '#64748b', bg: '#f1f5f9' };

const labelOf = (list, value) => list.find((i) => i.value === value)?.label || value;

const JobPostingManagementPage = () => {
  const [jobs, setJobs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const [allSkills, setAllSkills] = useState([]);
  const [allTechnologies, setAllTechnologies] = useState([]);

  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [viewMode, setViewMode] = useState('table');

  const { toast, showToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          skillService.listSkills({ page: 0, size: 200 }),
          technologyService.listTechnologies({ page: 0, size: 200 }),
        ]);
        setAllSkills(sRes?.content || []);
        setAllTechnologies(tRes?.content || []);
      } catch (err) {
        console.error('Lỗi tải danh mục kỹ năng / công nghệ:', err);
      }
    })();
  }, []);

  const loadData = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await jobPostingAdminService.listJobs({
          page: page - 1,
          size: PAGE_SIZE,
          keyword: searchTerm.trim(),
          employmentType: employmentFilter,
          experienceLevel: levelFilter,
        });
        setJobs(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(page);
      } catch (err) {
        console.error('Lỗi khi tải danh sách việc làm:', err);
        setLoadError(err.message || 'Không thể tải danh sách việc làm');
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, employmentFilter, levelFilter]
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleOpenCreate = () => {
    setSelectedJob(null);
    setFormData(initialFormState);
    setFormErrors({});
    setModalType('create');
  };

  const handleOpenView = (job) => {
    setSelectedJob(job);
    setModalType('view');
  };

  const handleOpenEdit = (job) => {
    setSelectedJob(job);
    setFormData({
      source: job.source || 'INTERNAL',
      sourceUrl: job.sourceUrl || '',
      companyName: job.companyName || '',
      companyLogoUrl: job.companyLogoUrl || '',
      title: job.title || '',
      description: job.description || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      location: job.location || '',
      employmentType: job.employmentType || 'FULL_TIME',
      experienceLevel: job.experienceLevel || 'JUNIOR',
      salaryMin: job.salaryMin !== null && job.salaryMin !== undefined ? String(job.salaryMin) : '',
      salaryMax: job.salaryMax !== null && job.salaryMax !== undefined ? String(job.salaryMax) : '',
      isSalaryNegotiable: Boolean(job.isSalaryNegotiable),
      status: job.status || 'ACTIVE',
      skills: (job.skills || []).map((s) => (typeof s === 'object' ? s.name || s.id : s)),
      technologies: (job.technologies || []).map((t) => (typeof t === 'object' ? t.name || t.id : t)),
    });
    setFormErrors({});
    setModalType('edit');
  };

  const handleOpenDelete = (job) => {
    setSelectedJob(job);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedJob(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const buildPayload = () => {
    return {
      source: formData.source,
      sourceUrl: formData.sourceUrl || null,
      companyName: formData.companyName.trim(),
      companyLogoUrl: formData.companyLogoUrl?.trim() || null,
      title: formData.title.trim(),
      description: formData.description.trim(),
      requirements: formData.requirements?.trim() || null,
      benefits: formData.benefits?.trim() || null,
      location: formData.location?.trim() || null,
      employmentType: formData.employmentType,
      experienceLevel: formData.experienceLevel,
      salaryMin: formData.salaryMin !== '' ? parseInt(formData.salaryMin, 10) : null,
      salaryMax: formData.salaryMax !== '' ? parseInt(formData.salaryMax, 10) : null,
      isSalaryNegotiable: Boolean(formData.isSalaryNegotiable),
      status: formData.status,
      skills: (formData.skills || []).map((s) => {
        const found = allSkills.find((item) => item.name === s || String(item.id) === String(s));
        return found ? { id: found.id, name: found.name } : { name: String(s) };
      }),
      technologies: (formData.technologies || []).map((t) => {
        const found = allTechnologies.find((item) => item.name === t || String(item.id) === String(t));
        return found ? { id: found.id, name: found.name } : { name: String(t) };
      }),
    };
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.companyName.trim() || !formData.description.trim()) {
      setFormErrors({
        title: formData.title.trim() ? null : 'Vui lòng nhập tiêu đề công việc',
        companyName: formData.companyName.trim() ? null : 'Vui lòng nhập tên công ty',
        description: formData.description.trim() ? null : 'Vui lòng nhập mô tả công việc',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === 'create') {
        await jobPostingAdminService.createJob(buildPayload());
        showToast('Tạo tin tuyển dụng thành công!');
      } else if (modalType === 'edit' && selectedJob) {
        await jobPostingAdminService.updateJob(selectedJob.id, buildPayload());
        showToast('Cập nhật tin tuyển dụng thành công!');
      }
      handleCloseModal();
      loadData(currentPage);
    } catch (err) {
      console.error('Lỗi khi lưu tin tuyển dụng:', err);
      showToast(err.message || 'Có lỗi xảy ra khi lưu tin tuyển dụng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedJob) return;
    setIsSubmitting(true);
    try {
      await jobPostingAdminService.deleteJob(selectedJob.id);
      showToast('Đã xóa tin tuyển dụng thành công!');
      handleCloseModal();
      loadData(currentPage);
    } catch (err) {
      console.error('Lỗi khi xóa tin tuyển dụng:', err);
      showToast(err.message || 'Có lỗi xảy ra khi xóa tin tuyển dụng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setEmploymentFilter('');
    setLevelFilter('');
  };


  const formatSalary = (min, max, isNegotiable) => {
    if (isNegotiable) return 'Thương lượng';
    if (!min && !max) return 'Thỏa thuận';
    if (min && max) return `${(min / 1000000).toFixed(0)} - ${(max / 1000000).toFixed(0)} triệu`;
    if (min) return `Từ ${(min / 1000000).toFixed(0)} triệu`;
    return `Tới ${(max / 1000000).toFixed(0)} triệu`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const STATUS_TONE = { ACTIVE: 'success', DRAFT: 'neutral', EXPIRED: 'warning', CLOSED: 'danger' };
  const renderStatus = (status) => (
    <Badge tone={STATUS_TONE[status] || 'neutral'}>{statusBadge(status).label}</Badge>
  );

  const handleSearchChange = (value) => setSearchTerm(value);

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const rowActions = (job) => (
    <RowActions
      entity="việc làm"
      onView={() => handleOpenView(job)}
      onEdit={() => handleOpenEdit(job)}
      onDelete={() => handleOpenDelete(job)}
    />
  );

  const columns = [
    {
      header: 'Vị trí & Công ty',
      cell: (job) => (
        <>
          <div className="ui-cell-title">{job.title}</div>
          <div className="ui-inline ui-hint">
            <Building2 size={13} aria-hidden="true" />
            <span>{job.companyName}</span>
          </div>
        </>
      ),
    },
    {
      header: 'Địa điểm & Loại hình',
      label: 'Địa điểm',
      cell: (job) => (
        <>
          <div className="ui-inline">
            <MapPin size={13} aria-hidden="true" />
            <span>{job.location || 'Chưa cập nhật'}</span>
          </div>
          <div className="ui-hint">{labelOf(EMPLOYMENT_TYPES, job.employmentType)}</div>
        </>
      ),
    },
    { header: 'Mức lương', cell: (job) => formatSalary(job.salaryMin, job.salaryMax, job.isSalaryNegotiable) },
    { header: 'Cấp bậc', cell: (job) => labelOf(EXPERIENCE_LEVELS, job.experienceLevel) },
    { header: 'Trạng thái', cell: (job) => renderStatus(job.status) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Việc làm"
          description="Quản lý danh sách tin tuyển dụng, vị trí ứng tuyển và yêu cầu kỹ năng."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm việc làm
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tiêu đề, công ty..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo hình thức" value={employmentFilter} onChange={setEmploymentFilter}>
              <option value="">Tất cả hình thức</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Lọc theo cấp bậc" value={levelFilter} onChange={setLevelFilter}>
              <option value="">Tất cả cấp bậc</option>
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </FilterSelect>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={() => loadData(currentPage)} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {loadError ? (
              <EmptyState
                icon={AlertCircle}
                title="Không thể tải danh sách việc làm"
                hint={loadError}
                action={<Button onClick={() => loadData(currentPage)}>Thử lại</Button>}
              />
            ) : viewMode === 'table' || jobs.length === 0 ? (
              <DataTable
                rows={jobs}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={Briefcase}
                emptyTitle="Không có tin tuyển dụng nào phù hợp"
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc thêm mới một tin tuyển dụng."
              />
            ) : (
              <div className="ui-grid">
                {jobs.map((job) => (
                  <article key={job.id} className="ui-item-card">
                    <div>
                      <div className="ui-item-card__row">
                        <h3 className="ui-item-card__title">{job.title}</h3>
                        {renderStatus(job.status)}
                      </div>
                      <div className="ui-inline ui-hint">
                        <Building2 size={14} aria-hidden="true" />
                        <span>{job.companyName}</span>
                      </div>
                      <div className="ui-inline ui-hint" style={{ marginTop: 6 }}>
                        <MapPin size={14} aria-hidden="true" />
                        <span>{job.location || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    <div className="ui-item-card__foot">
                      <strong style={{ color: 'var(--ui-text)' }}>
                        {formatSalary(job.salaryMin, job.salaryMax, job.isSalaryNegotiable)}
                      </strong>
                      {rowActions(job)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => loadData(page)}
            entityName="tin tuyển dụng"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        size="lg"
        columns={2}
        title={modalType === 'create' ? 'Thêm mới tin tuyển dụng' : 'Chỉnh sửa tin tuyển dụng'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
      >
        <TextField
          label="Tiêu đề công việc"
          required
          placeholder="VD: Senior Frontend Developer"
          value={formData.title}
          onChange={handleFieldChange('title')}
          error={formErrors.title}
        />
        <TextField
          label="Tên công ty"
          required
          placeholder="VD: Lemonade IT Solution"
          value={formData.companyName}
          onChange={handleFieldChange('companyName')}
          error={formErrors.companyName}
        />
        <TextField
          label="Địa điểm làm việc"
          placeholder="VD: Hà Nội, Hybrid"
          value={formData.location}
          onChange={handleFieldChange('location')}
        />
        <TextField
          label="Logo URL công ty"
          placeholder="https://..."
          value={formData.companyLogoUrl}
          onChange={handleFieldChange('companyLogoUrl')}
        />
        <SelectField label="Hình thức làm việc" value={formData.employmentType} onChange={handleFieldChange('employmentType')}>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Cấp bậc" value={formData.experienceLevel} onChange={handleFieldChange('experienceLevel')}>
          {EXPERIENCE_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </SelectField>
        <SelectField className="ui-col-2" label="Trạng thái" value={formData.status} onChange={handleFieldChange('status')}>
          {JOB_POSTING_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </SelectField>
        <TextField
          type="number"
          label="Lương tối thiểu (VNĐ)"
          placeholder="VD: 15000000"
          disabled={formData.isSalaryNegotiable}
          value={formData.salaryMin}
          onChange={handleFieldChange('salaryMin')}
        />
        <TextField
          type="number"
          label="Lương tối đa (VNĐ)"
          placeholder="VD: 30000000"
          disabled={formData.isSalaryNegotiable}
          value={formData.salaryMax}
          onChange={handleFieldChange('salaryMax')}
        />
        <CheckboxField
          className="ui-col-2"
          label="Thương lượng"
          checked={formData.isSalaryNegotiable}
          onChange={(e) => {
            const { checked } = e.target;
            setFormData((prev) => ({ ...prev, isSalaryNegotiable: checked }));
          }}
        />
        <TextareaField
          className="ui-col-2"
          label="Mô tả công việc"
          required
          placeholder="Chi tiết công việc..."
          value={formData.description}
          onChange={handleFieldChange('description')}
          error={formErrors.description}
        />
        <TextareaField
          className="ui-col-2"
          rows={3}
          label="Yêu cầu ứng viên"
          placeholder="Kinh nghiệm, kỹ năng cần có..."
          value={formData.requirements}
          onChange={handleFieldChange('requirements')}
        />
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedJob}
        size="lg"
        title="Chi tiết Tin tuyển dụng"
        description={selectedJob ? `#ID-${selectedJob.id}` : undefined}
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedJob && (
            <ViewFooter
              onDelete={() => setModalType('delete')}
              onEdit={() => handleOpenEdit(selectedJob)}
              onClose={handleCloseModal}
            />
          )
        }
      >
        {selectedJob && (
          <>
            <div className="ui-item-card__row" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 className="ui-modal__title">{selectedJob.title}</h3>
                <div className="ui-inline ui-hint" style={{ marginTop: 6 }}>
                  <Building2 size={16} aria-hidden="true" />
                  <span>{selectedJob.companyName}</span>
                  {selectedJob.sourceUrl && (
                    <a href={selectedJob.sourceUrl} target="_blank" rel="noreferrer" className="ui-link ui-inline">
                      <span>Xem liên kết tuyển dụng</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
              {renderStatus(selectedJob.status)}
            </div>

            <div style={{ marginTop: 16 }}>
              <DetailGrid>
                <DetailItem label="Địa điểm">
                  <span className="ui-inline">
                    <MapPin size={14} aria-hidden="true" />
                    {selectedJob.location || 'Chưa cập nhật'}
                  </span>
                </DetailItem>
                <DetailItem label="Hình thức làm việc">{labelOf(EMPLOYMENT_TYPES, selectedJob.employmentType)}</DetailItem>
                <DetailItem label="Cấp bậc kinh nghiệm">{labelOf(EXPERIENCE_LEVELS, selectedJob.experienceLevel)}</DetailItem>
                <DetailItem label="Mức lương">
                  {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.isSalaryNegotiable)}
                </DetailItem>
                <DetailItem label="Nguồn dữ liệu">{labelOf(JOB_POSTING_SOURCES, selectedJob.source)}</DetailItem>
                <DetailItem label="Ngày đăng">{formatDate(selectedJob.createdAt)}</DetailItem>
              </DetailGrid>
            </div>

            {((selectedJob.skills && selectedJob.skills.length > 0) ||
              (selectedJob.technologies && selectedJob.technologies.length > 0)) && (
              <div className="ui-detail-section">
                <h4>Kỹ năng & Công nghệ</h4>
                <div className="ui-chip-row">
                  {(selectedJob.skills || []).map((s, idx) => (
                    <Badge key={`s-${idx}`} tone="success">
                      {typeof s === 'object' ? s.name || s.id : s}
                    </Badge>
                  ))}
                  {(selectedJob.technologies || []).map((t, idx) => (
                    <Badge key={`t-${idx}`} tone="info">
                      {typeof t === 'object' ? t.name || t.id : t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <DetailSection title="Mô tả công việc">{selectedJob.description || 'Chưa có mô tả chi tiết.'}</DetailSection>
            {selectedJob.requirements && <DetailSection title="Yêu cầu ứng viên">{selectedJob.requirements}</DetailSection>}
            {selectedJob.benefits && <DetailSection title="Quyền lợi & Chế độ">{selectedJob.benefits}</DetailSection>}
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete'}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa việc làm"
        message={`Bạn có chắc chắn muốn xóa tin tuyển dụng "${selectedJob?.title}" của công ty "${selectedJob?.companyName}"?`}
        confirmLabel="Xóa việc làm"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModal}
      />
    </AdminLayout>
  );
};

export default JobPostingManagementPage;
