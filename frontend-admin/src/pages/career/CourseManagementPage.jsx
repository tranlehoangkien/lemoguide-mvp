import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  ExternalLink,
  BookOpen,
  Clock,
  Calendar,
  Tags,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { courseAdminService, COURSE_LEVELS } from '@/services/courseAdminService';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import SearchableMultiSelect from '@/components/common/SearchableMultiSelect';
import { SKILL_TYPES } from '@/services/skillService';
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
  Field,
  FormAlert,
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
  title: '',
  provider: '',
  description: '',
  url: '',
  thumbnailUrl: '',
  level: 'BEGINNER',
  durationHours: '',
  price: '',
  isFree: false,
  isActive: true,
  skillIds: [],
  technologyIds: [],
};

const labelOf = (list, value) => list.find((i) => i.value === value)?.label || value;

const CourseManagementPage = () => {
  const [courses, setCourses] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [viewMode, setViewMode] = useState('table');
  // Skill/technology catalog for the tag pickers, loaded once when a form first opens.
  const [tagOptions, setTagOptions] = useState(null);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState(null);

  const { toast, showToast } = useToast();

  const loadData = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await courseAdminService.listCourses({
          page: page - 1,
          size: PAGE_SIZE,
          keyword: searchTerm.trim(),
          level: levelFilter,
        });
        setCourses(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(page);
      } catch (err) {
        console.error('Lỗi khi tải danh sách khóa học:', err);
        setLoadError(err.message || 'Không thể tải danh sách khóa học');
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, levelFilter]
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const loadTagOptions = useCallback(async () => {
    setTagsLoading(true);
    setTagsError(null);
    try {
      setTagOptions(await courseAdminService.listTagOptions());
    } catch (err) {
      console.error('Lỗi khi tải kỹ năng / công nghệ:', err);
      setTagsError(err.message || 'Không thể tải danh sách kỹ năng và công nghệ');
    } finally {
      setTagsLoading(false);
    }
  }, []);

  const ensureTagOptions = () => {
    if (!tagOptions && !tagsLoading) loadTagOptions();
  };

  // The course's current tags are merged in so their chips show even before (or without) the catalog.
  const skillOptions = useMemo(() => {
    const byId = new Map();
    (tagOptions?.skills || []).forEach((s) => byId.set(s.id, {
      value: s.id,
      label: s.name,
      category: SKILL_TYPES.find((t) => t.value === String(s.type || '').toLowerCase())?.label,
    }));
    (selectedCourse?.skills || []).forEach((s) => { if (!byId.has(s.id)) byId.set(s.id, { value: s.id, label: s.name }); });
    return [...byId.values()];
  }, [tagOptions, selectedCourse]);

  const technologyOptions = useMemo(() => {
    const byId = new Map();
    (tagOptions?.technologies || []).forEach((t) => byId.set(t.id, { value: t.id, label: t.name, category: t.category }));
    (selectedCourse?.technologies || []).forEach((t) => { if (!byId.has(t.id)) byId.set(t.id, { value: t.id, label: t.name }); });
    return [...byId.values()];
  }, [tagOptions, selectedCourse]);

  const technologyCategories = useMemo(
    () => [...new Set((tagOptions?.technologies || []).map((t) => t.category).filter(Boolean))].sort(),
    [tagOptions]
  );

  const handleOpenCreate = () => {
    setSelectedCourse(null);
    setFormData(initialFormState);
    setFormErrors({});
    setModalType('create');
    ensureTagOptions();
  };

  const handleOpenView = (course) => {
    setSelectedCourse(course);
    setModalType('view');
  };

  const handleOpenEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || '',
      provider: course.provider || '',
      description: course.description || '',
      url: course.url || '',
      thumbnailUrl: course.thumbnailUrl || '',
      level: course.level || 'BEGINNER',
      durationHours: course.durationHours !== null && course.durationHours !== undefined ? String(course.durationHours) : '',
      price: course.price !== null && course.price !== undefined ? String(course.price) : '',
      isFree: Boolean(course.isFree),
      isActive: course.isActive !== undefined ? Boolean(course.isActive) : true,
      skillIds: (course.skills || []).map((s) => s.id),
      technologyIds: (course.technologies || []).map((t) => t.id),
    });
    setFormErrors({});
    setModalType('edit');
    ensureTagOptions();
  };

  const handleOpenDelete = (course) => {
    setSelectedCourse(course);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedCourse(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const buildPayload = () => {
    return {
      title: formData.title.trim(),
      provider: formData.provider?.trim() || null,
      description: formData.description?.trim() || null,
      url: formData.url?.trim() || null,
      thumbnailUrl: formData.thumbnailUrl?.trim() || null,
      level: formData.level,
      durationHours: formData.durationHours !== '' ? parseInt(formData.durationHours, 10) : null,
      price: formData.isFree || formData.price === '' ? 0 : parseFloat(formData.price),
      isFree: Boolean(formData.isFree),
      isActive: Boolean(formData.isActive),
      // Always sent: the API replaces the tags with these lists, so omitting them would clear them.
      skillIds: formData.skillIds,
      technologyIds: formData.technologyIds,
    };
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormErrors({ title: 'Vui lòng nhập tên khóa học' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalType === 'create') {
        await courseAdminService.createCourse(buildPayload());
        showToast('Tạo khóa học thành công!');
      } else if (modalType === 'edit' && selectedCourse) {
        await courseAdminService.updateCourse(selectedCourse.id, buildPayload());
        showToast('Cập nhật khóa học thành công!');
      }
      handleCloseModal();
      loadData(currentPage);
    } catch (err) {
      console.error('Lỗi khi lưu khóa học:', err);
      showToast(err.message || 'Có lỗi xảy ra khi lưu khóa học', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCourse) return;
    setIsSubmitting(true);
    try {
      await courseAdminService.deleteCourse(selectedCourse.id);
      showToast('Đã xóa khóa học thành công!');
      handleCloseModal();
      loadData(currentPage);
    } catch (err) {
      console.error('Lỗi khi xóa khóa học:', err);
      showToast(err.message || 'Có lỗi xảy ra khi xóa khóa học', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setLevelFilter('');
  };


  const formatPrice = (price, isFree) => {
    if (isFree || price === 0) return 'Miễn phí';
    if (!price) return 'Liên hệ';
    return `${Number(price).toLocaleString('vi-VN')} đ`;
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

  const handleSearchChange = (value) => setSearchTerm(value);

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleCheckChange = (field) => (e) => {
    const { checked } = e.target;
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const statusBadge = (course) =>
    course.isActive !== false ? <Badge tone="success">Hiển thị</Badge> : <Badge>Ẩn</Badge>;

  const rowActions = (course) => (
    <RowActions
      entity="khóa học"
      onView={() => handleOpenView(course)}
      onEdit={() => handleOpenEdit(course)}
      onDelete={() => handleOpenDelete(course)}
    />
  );

  const columns = [
    {
      header: 'Khóa học',
      cell: (c) => (
        <>
          <div className="ui-cell-title">{c.title}</div>
          {c.url && (
            <a href={c.url} target="_blank" rel="noreferrer" className="ui-link ui-inline" style={{ fontSize: '0.8125rem' }}>
              <span>Xem liên kết</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </>
      ),
    },
    { header: 'Nhà cung cấp', cell: (c) => c.provider || 'LemoGuide' },
    { header: 'Cấp độ', cell: (c) => labelOf(COURSE_LEVELS, c.level) },
    { header: 'Thời lượng', cell: (c) => (c.durationHours ? `${c.durationHours} giờ` : 'Chưa cập nhật') },
    { header: 'Học phí', cell: (c) => formatPrice(c.price, c.isFree) },
    { header: 'Trạng thái', cell: (c) => statusBadge(c) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Khóa học"
          description="Quản lý kho khóa học, tài liệu và lộ trình học tập cho người dùng."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm khóa học
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên khóa học, nhà cung cấp..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo cấp độ" value={levelFilter} onChange={setLevelFilter}>
              <option value="">Tất cả cấp độ</option>
              {COURSE_LEVELS.map((l) => (
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
                title="Không thể tải danh sách khóa học"
                hint={loadError}
                action={<Button onClick={() => loadData(currentPage)}>Thử lại</Button>}
              />
            ) : viewMode === 'table' || courses.length === 0 ? (
              <DataTable
                rows={courses}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={BookOpen}
                emptyTitle="Không có khóa học nào phù hợp"
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc thêm mới một khóa học."
              />
            ) : (
              <div className="ui-grid">
                {courses.map((c) => (
                  <article key={c.id} className="ui-item-card">
                    <div>
                      <div className="ui-item-card__row">
                        <h3 className="ui-item-card__title">{c.title}</h3>
                        {statusBadge(c)}
                      </div>
                      <div className="ui-inline ui-hint">
                        <GraduationCap size={14} aria-hidden="true" />
                        <span>{c.provider || 'LemoGuide'}</span>
                      </div>
                      <div className="ui-inline ui-hint" style={{ marginTop: 6 }}>
                        <Clock size={14} aria-hidden="true" />
                        <span>{c.durationHours ? `${c.durationHours} giờ học` : 'Chưa xác định thời lượng'}</span>
                      </div>
                    </div>
                    <div className="ui-item-card__foot">
                      <strong style={{ color: 'var(--ui-text)' }}>{formatPrice(c.price, c.isFree)}</strong>
                      {rowActions(c)}
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
            entityName="khóa học"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        size="lg"
        columns={2}
        title={modalType === 'create' ? 'Thêm mới khóa học' : 'Chỉnh sửa khóa học'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
      >
        <TextField
          className="ui-col-2"
          label="Tên khóa học"
          required
          placeholder="VD: Fullstack React & Node.js từ cơ bản đến nâng cao"
          value={formData.title}
          onChange={handleFieldChange('title')}
          error={formErrors.title}
        />
        <TextField
          label="Nhà cung cấp / Nền tảng"
          placeholder="VD: Coursera, Udemy, LemoGuide..."
          value={formData.provider}
          onChange={handleFieldChange('provider')}
        />
        <SelectField label="Cấp độ" value={formData.level} onChange={handleFieldChange('level')}>
          {COURSE_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </SelectField>
        <TextField
          className="ui-col-2"
          type="url"
          label="Đường dẫn khóa học (URL)"
          placeholder="https://..."
          value={formData.url}
          onChange={handleFieldChange('url')}
        />
        <TextField
          type="number"
          label="Thời lượng (giờ)"
          placeholder="VD: 36"
          value={formData.durationHours}
          onChange={handleFieldChange('durationHours')}
        />
        <TextField
          type="number"
          label="Học phí (VNĐ)"
          placeholder="VD: 499000"
          disabled={formData.isFree}
          value={formData.price}
          onChange={handleFieldChange('price')}
        />
        <CheckboxField
          className="ui-col-2"
          label="Miễn phí"
          checked={formData.isFree}
          onChange={handleCheckChange('isFree')}
        />
        <TextareaField
          className="ui-col-2"
          rows={3}
          label="Mô tả khóa học"
          placeholder="Mô tả nội dung, mục tiêu của khóa học..."
          value={formData.description}
          onChange={handleFieldChange('description')}
        />
        {tagsError && (
          <FormAlert>
            {tagsError}. Các thẻ hiện có của khóa học vẫn được giữ nguyên khi lưu.{' '}
            <Button size="sm" variant="secondary" onClick={loadTagOptions}>Thử lại</Button>
          </FormAlert>
        )}
        <Field
          className="ui-col-2"
          label="Kỹ năng đào tạo"
          hint="Dùng để gợi ý khóa học trong Lộ trình phát triển và các khóa liên quan."
        >
          {() => (
            <SearchableMultiSelect
              options={skillOptions}
              values={formData.skillIds}
              onChange={(ids) => setFormData((prev) => ({ ...prev, skillIds: ids }))}
              placeholder="Chọn các kỹ năng khóa học giúp phát triển..."
              searchPlaceholder="Gõ tên kỹ năng (ví dụ: RESTful API Design, Unit Testing...)"
              loading={tagsLoading}
              categories={SKILL_TYPES.map((t) => t.label)}
              emptyText="Không tìm thấy kỹ năng phù hợp"
            />
          )}
        </Field>
        <Field
          className="ui-col-2"
          label="Công nghệ sử dụng"
          hint="Gắn đúng công nghệ (Java, Spring Boot, Docker...) để khóa học khớp với kỹ năng đầu ra của lộ trình."
        >
          {() => (
            <SearchableMultiSelect
              options={technologyOptions}
              values={formData.technologyIds}
              onChange={(ids) => setFormData((prev) => ({ ...prev, technologyIds: ids }))}
              placeholder="Chọn các công nghệ được dạy trong khóa học..."
              searchPlaceholder="Gõ tên công nghệ (ví dụ: Java, Docker, PostgreSQL...)"
              loading={tagsLoading}
              categories={technologyCategories}
              emptyText="Không tìm thấy công nghệ phù hợp"
            />
          )}
        </Field>
        <CheckboxField
          className="ui-col-2"
          label="Hiển thị khóa học cho người dùng"
          checked={formData.isActive}
          onChange={handleCheckChange('isActive')}
        />
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedCourse}
        size="lg"
        title="Chi tiết Khóa học"
        description={selectedCourse ? `#ID-${selectedCourse.id}` : undefined}
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedCourse && (
            <ViewFooter
              onDelete={() => setModalType('delete')}
              onEdit={() => handleOpenEdit(selectedCourse)}
              onClose={handleCloseModal}
            />
          )
        }
      >
        {selectedCourse && (
          <>
            <div className="ui-item-card__row" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 className="ui-modal__title">{selectedCourse.title}</h3>
                <div className="ui-inline ui-hint" style={{ marginTop: 6 }}>
                  <GraduationCap size={16} aria-hidden="true" />
                  <span>{selectedCourse.provider || 'LemoGuide'}</span>
                  {selectedCourse.url && (
                    <a href={selectedCourse.url} target="_blank" rel="noreferrer" className="ui-link ui-inline">
                      <span>Xem liên kết khóa học</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
              {selectedCourse.isActive !== false ? <Badge tone="success">Đang hiển thị</Badge> : <Badge>Đã ẩn</Badge>}
            </div>

            {selectedCourse.thumbnailUrl && (
              <img
                src={selectedCourse.thumbnailUrl}
                alt={selectedCourse.title}
                className="ui-cover"
                style={{ margin: '16px 0' }}
              />
            )}

            <div style={{ marginTop: 16 }}>
              <DetailGrid>
                <DetailItem label="Trình độ">
                  <span className="ui-inline">
                    <BookOpen size={14} aria-hidden="true" />
                    {labelOf(COURSE_LEVELS, selectedCourse.level)}
                  </span>
                </DetailItem>
                <DetailItem label="Thời lượng đào tạo">
                  <span className="ui-inline">
                    <Clock size={14} aria-hidden="true" />
                    {selectedCourse.durationHours ? `${selectedCourse.durationHours} giờ học` : 'Chưa xác định'}
                  </span>
                </DetailItem>
                <DetailItem label="Học phí">{formatPrice(selectedCourse.price, selectedCourse.isFree)}</DetailItem>
                <DetailItem label="Ngày cập nhật">
                  <span className="ui-inline">
                    <Calendar size={14} aria-hidden="true" />
                    {formatDate(selectedCourse.updatedAt || selectedCourse.createdAt)}
                  </span>
                </DetailItem>
              </DetailGrid>
            </div>

            <DetailSection title="Mô tả khóa học">
              {selectedCourse.description || 'Chưa có mô tả chi tiết cho khóa học này.'}
            </DetailSection>

            <DetailSection title="Kỹ năng và công nghệ">
              {(selectedCourse.skills?.length || 0) + (selectedCourse.technologies?.length || 0) > 0 ? (
                <span className="ui-inline" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {(selectedCourse.skills || []).map((sk) => <Badge key={`s-${sk.id}`} tone="success">{sk.name}</Badge>)}
                  {(selectedCourse.technologies || []).map((t) => <Badge key={`t-${t.id}`}>{t.name}</Badge>)}
                </span>
              ) : (
                <span className="ui-inline ui-hint">
                  <Tags size={14} aria-hidden="true" />
                  Chưa gắn kỹ năng hay công nghệ, khóa học sẽ khó được gợi ý trong Lộ trình phát triển.
                </span>
              )}
            </DetailSection>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete'}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa khóa học"
        message={`Bạn có chắc chắn muốn xóa khóa học "${selectedCourse?.title}"?`}
        confirmLabel="Xóa khóa học"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModal}
      />
    </AdminLayout>
  );
};

export default CourseManagementPage;
