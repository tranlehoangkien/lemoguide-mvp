import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  AlertTriangle,
  XCircle,
  X,
  ImageOff,
  Upload,
  GripVertical,
  Crown,
  Columns2,
  LayoutTemplate,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  cvTemplateService,
  CV_TEMPLATE_CATEGORIES,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_COLOR_SCHEME,
  THEME_LAYOUT_TYPES,
  THEME_DENSITIES,
} from '@/services/cvTemplateService';
import { getFullAvatarUrl } from '@/services/apiClient';
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
  Badge,
  Button,
  IconButton,
  Field,
  TextField,
  SelectField,
  CheckboxField,
  Switch,
  FormSection,
  FormModal,
  Modal,
  DetailGrid,
  DetailItem,
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

const SPACING_LABELS = {
  compact: 'Gọn (Compact)',
  normal: 'Vừa (Normal)',
  spacious: 'Rộng (Spacious)',
};

const HEADER_STYLE_OPTIONS = [
  { value: 'sidebar-photo', label: 'Sidebar có ảnh đại diện' },
  { value: 'top-banner', label: 'Banner ngang phía trên' },
  { value: 'centered-photo', label: 'Ảnh đại diện căn giữa' },
  { value: 'minimal-classic', label: 'Tối giản cổ điển' },
];

const SECTION_CATALOG = {
  header: 'Thông tin cá nhân',
  experience: 'Kinh nghiệm làm việc',
  education: 'Học vấn',
  skills: 'Kỹ năng',
  projects: 'Dự án',
  certificates: 'Chứng chỉ',
  awards: 'Giải thưởng',
  interests: 'Sở thích',
  referrers: 'Người giới thiệu',
};

const CATEGORY_TONES = ['info', 'success', 'warning', 'danger', 'neutral'];

const getCategoryTone = (category) => {
  const key = category || 'Khác';
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return CATEGORY_TONES[hash % CATEGORY_TONES.length];
};

const emptyTemplateForm = () => ({
  name: '',
  category: CV_TEMPLATE_CATEGORIES[0],
  thumbnailUrl: '',
  isPremium: false,
  isActive: true,
  layoutConfig: { ...DEFAULT_LAYOUT_CONFIG, sections_order: [...DEFAULT_LAYOUT_CONFIG.sections_order] },
  colorScheme: { ...DEFAULT_COLOR_SCHEME },
  fontPair: 'Inter',
  layoutType: 'SINGLE',
  density: 'NORMAL',
  renderKey: '',
});

const resolveThumbnail = (url) => {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  return getFullAvatarUrl(url);
};

const CvTemplateManagementPage = () => {
  const [templates, setTemplates] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'view' | 'delete' | null
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(emptyTemplateForm());
  const [formErrors, setFormErrors] = useState({});
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

  const { toast, showToast } = useToast();

  const loadData = useCallback(async (page, search, category, status) => {
    setIsLoading(true);
    try {
      const isActive = status === 'active' ? true : status === 'inactive' ? false : null;
      const data = await cvTemplateService.listTemplates({
        page: page - 1,
        size: PAGE_SIZE,
        keyword: search,
        category,
        isActive,
      });
      setTemplates(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load CV templates:', err);
      showToast(err.message || 'Không thể tải danh sách template', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(currentPage, searchTerm, selectedCategory, statusFilter);
  }, [currentPage, searchTerm, selectedCategory, statusFilter, loadData]);

  const mergedCategories = useMemo(() => {
    const fromData = templates.map((t) => t.category).filter(Boolean);
    return Array.from(new Set([...CV_TEMPLATE_CATEGORIES, ...fromData]));
  }, [templates]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStatusFilter('all');
    setCurrentPage(1);
    loadData(1, '', 'all', 'all');
  };

  const handleRefresh = () => {
    loadData(currentPage, searchTerm, selectedCategory, statusFilter);
    showToast('Đã tải lại danh sách template');
  };

  const handleOpenCreate = () => {
    setFormData(emptyTemplateForm());
    setFormErrors({});
    setSelectedTemplate(null);
    setThumbnailFile(null);
    setThumbnailPreview('');
    setModalType('create');
  };

  const handleOpenEdit = (t) => {
    setSelectedTemplate(t);
    setFormData({
      name: t.name || '',
      category: t.category || CV_TEMPLATE_CATEGORIES[0],
      thumbnailUrl: t.thumbnailUrl || '',
      isPremium: Boolean(t.isPremium),
      isActive: t.isActive !== false,
      layoutConfig: { ...t.layoutConfigObject, sections_order: [...t.layoutConfigObject.sections_order] },
      colorScheme: { ...DEFAULT_COLOR_SCHEME, ...t.colorSchemeObject },
      fontPair: t.fontPair || 'Inter',
      layoutType: t.layoutType || 'SINGLE',
      density: t.density || 'NORMAL',
      renderKey: t.renderKey || '',
    });
    setFormErrors({});
    setThumbnailFile(null);
    setThumbnailPreview(t.thumbnailUrl || '');
    setModalType('edit');
  };

  const handleOpenView = (t) => {
    setSelectedTemplate(t);
    setModalType('view');
  };

  const handleOpenDelete = (t) => {
    setSelectedTemplate(t);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedTemplate(null);
    setFormData(emptyTemplateForm());
    setFormErrors({});
    setThumbnailFile(null);
    setThumbnailPreview('');
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Chỉ chấp nhận ảnh định dạng JPEG, PNG hoặc WebP', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Kích thước ảnh thumbnail tối đa 3MB', 'error');
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Tên template không được để trống';
    } else if (formData.name.trim().length > 150) {
      errors.name = 'Tên template không vượt quá 150 ký tự';
    }
    if (formData.category && formData.category.length > 100) {
      errors.category = 'Danh mục không vượt quá 100 ký tự';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let thumbnailUrl = formData.thumbnailUrl;
      if (thumbnailFile) {
        thumbnailUrl = await cvTemplateService.uploadThumbnail(thumbnailFile);
      }
      const payload = { ...formData, thumbnailUrl };

      if (modalType === 'create') {
        await cvTemplateService.createTemplate(payload);
        showToast(`Đã thêm mới template: ${formData.name}`);
      } else if (modalType === 'edit' && selectedTemplate) {
        await cvTemplateService.updateTemplate(selectedTemplate.id, payload);
        showToast(`Đã cập nhật template: ${formData.name}`);
      }
      handleCloseModal();
      loadData(currentPage, searchTerm, selectedCategory, statusFilter);
    } catch (err) {
      console.error('Submit CV template failed:', err);
      showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (t) => {
    setTogglingId(t.id);
    try {
      await cvTemplateService.updateStatus(t.id, !t.isActive);
      showToast(!t.isActive ? `Đã kích hoạt template: ${t.name}` : `Đã tắt kích hoạt template: ${t.name}`);
      loadData(currentPage, searchTerm, selectedCategory, statusFilter);
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      await cvTemplateService.deleteTemplate(selectedTemplate.id);
      showToast(`Đã xóa template: ${selectedTemplate.name}`);
      handleCloseModal();
      loadData(currentPage, searchTerm, selectedCategory, statusFilter);
    } catch (err) {
      console.error('Delete CV template failed:', err);
      showToast(err.message || 'Xóa template thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateFromDeleteModal = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      await cvTemplateService.updateStatus(selectedTemplate.id, false);
      showToast(`Đã tắt kích hoạt template: ${selectedTemplate.name}`);
      handleCloseModal();
      loadData(currentPage, searchTerm, selectedCategory, statusFilter);
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Layout Config editor helpers ---
  const setLayoutField = (field, value) => {
    setFormData((prev) => ({ ...prev, layoutConfig: { ...prev.layoutConfig, [field]: value } }));
  };

  const remainingSections = useMemo(() => {
    const used = new Set(formData.layoutConfig.sections_order);
    return Object.keys(SECTION_CATALOG).filter((k) => !used.has(k));
  }, [formData.layoutConfig.sections_order]);

  const handleAddSection = (key) => {
    if (!key) return;
    setLayoutField('sections_order', [...formData.layoutConfig.sections_order, key]);
  };

  const handleRemoveSection = (index) => {
    if (formData.layoutConfig.sections_order.length <= 1) return;
    const next = formData.layoutConfig.sections_order.filter((_, i) => i !== index);
    setLayoutField('sections_order', next);
  };

  const handleDragStart = (index) => () => setDragIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (index) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...formData.layoutConfig.sections_order];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setLayoutField('sections_order', next);
    setDragIndex(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleColorChange = (key) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, colorScheme: { ...prev.colorScheme, [key]: value } }));
  };

  const premiumBadge = (t) =>
    t.isPremium ? (
      <Badge tone="warning">
        <Crown size={12} aria-hidden="true" />
        Premium
      </Badge>
    ) : (
      <Badge>Free</Badge>
    );

  const activeSwitch = (t) => (
    <Switch
      checked={Boolean(t.isActive)}
      disabled={togglingId === t.id}
      onChange={() => handleToggleStatus(t)}
      label={t.isActive ? 'Đang kích hoạt, bấm để tắt' : 'Đã tắt, bấm để kích hoạt'}
    />
  );

  const rowActions = (t) => (
    <RowActions
      entity="template"
      onView={() => handleOpenView(t)}
      onEdit={() => handleOpenEdit(t)}
      onDelete={() => handleOpenDelete(t)}
    />
  );

  const thumbBox = (t, size = { width: 56, height: 40 }) => {
    const thumb = resolveThumbnail(t.thumbnailUrl);
    return (
      <div className="ui-thumb" style={size}>
        {thumb ? <img src={thumb} alt={t.name} /> : <ImageOff size={18} aria-hidden="true" />}
      </div>
    );
  };

  const columns = [
    { header: 'Ảnh', cell: (t) => thumbBox(t) },
    {
      header: 'Tên template',
      cell: (t) => (
        <span className="ui-inline">
          <span
            className="ui-dot"
            title={`${t.colorSchemeObject?.primary || ''}`}
            style={{ backgroundColor: t.colorSchemeObject?.primary || 'var(--ui-muted)' }}
            aria-hidden="true"
          />
          <span className="ui-cell-title">{t.name}</span>
        </span>
      ),
    },
    { header: 'Danh mục', cell: (t) => <Badge tone={getCategoryTone(t.category)}>{t.category || 'Khác'}</Badge> },
    { header: 'Premium', cell: (t) => premiumBadge(t) },
    { header: 'Số CV dùng', cell: (t) => t.usageCount },
    { header: 'Trạng thái', cell: (t) => activeSwitch(t) },
    { header: 'Ngày tạo', muted: true, cell: (t) => formatDate(t.createdAt) },
  ];

  const isFormOpen = modalType === 'create' || modalType === 'edit';
  const inUse = (selectedTemplate?.usageCount || 0) > 0;

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Template CV"
          description="Quản lý các mẫu CV (template) người dùng có thể chọn khi tạo hồ sơ."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm Template
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên template..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo danh mục" value={selectedCategory} onChange={handleCategoryChange}>
              <option value="all">Tất cả danh mục</option>
              {mergedCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Lọc theo trạng thái" value={statusFilter} onChange={handleStatusChange}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang kích hoạt</option>
              <option value="inactive">Đã tắt</option>
            </FilterSelect>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleRefresh} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {viewMode === 'table' || templates.length === 0 ? (
              <DataTable
                rows={templates}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={LayoutTemplate}
                emptyTitle="Không có template nào phù hợp."
                emptyHint="Thử đổi bộ lọc hoặc thêm mới một template."
              />
            ) : (
              <div className="ui-grid">
                {templates.map((t) => (
                  <article key={t.id} className="ui-item-card">
                    <div>
                      {thumbBox(t, { width: '100%', height: 150 })}
                      <div className="ui-item-card__row" style={{ marginTop: 12 }}>
                        <h3 className="ui-item-card__title">{t.name}</h3>
                        <Badge tone={getCategoryTone(t.category)}>{t.category || 'Khác'}</Badge>
                      </div>
                      <p className="ui-hint" style={{ margin: 0 }}>
                        {t.usageCount} CV đang sử dụng
                      </p>
                    </div>
                    <div className="ui-item-card__foot">
                      <span className="ui-inline">
                        {activeSwitch(t)}
                        {premiumBadge(t)}
                      </span>
                      {rowActions(t)}
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
            onPageChange={setCurrentPage}
            entityName="template"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={isFormOpen}
        size="xl"
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Template CV' : 'Chỉnh sửa Template CV'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo template' : 'Lưu thay đổi'}
      >
        <TextField
          label="Tên template"
          required
          placeholder="VD: Modern Sidebar, Minimal ATS..."
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={formErrors.name}
        />
        <TextField
          label="Danh mục"
          list="template-category-options"
          placeholder="Chọn hoặc nhập danh mục mới..."
          value={formData.category}
          onChange={handleFieldChange('category')}
          error={formErrors.category}
        />
        <datalist id="template-category-options">
          {mergedCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="ui-col-2 ui-person">
          <div className="ui-thumb" style={{ width: 96, height: 64 }}>
            {thumbnailPreview ? (
              <img src={resolveThumbnail(thumbnailPreview)} alt="Xem trước thumbnail" />
            ) : (
              <ImageOff size={24} aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="ui-inline" style={{ flexWrap: 'wrap' }}>
              <label className="ui-btn ui-btn--secondary ui-btn--sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} aria-hidden="true" />
                <span>{thumbnailPreview ? 'Đổi ảnh thumbnail' : 'Tải ảnh thumbnail'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="ui-sr-only"
                  onChange={handleThumbnailChange}
                />
              </label>
              {thumbnailPreview && (
                <Button variant="ghost" size="sm" onClick={handleRemoveThumbnail}>
                  Gỡ ảnh
                </Button>
              )}
            </div>
            <span className="ui-hint">Định dạng JPEG, PNG hoặc WebP. Tối đa 3MB.</span>
          </div>
        </div>

        <CheckboxField
          label="Premium"
          checked={formData.isPremium}
          onChange={(e) => {
            const { checked } = e.target;
            setFormData((prev) => ({ ...prev, isPremium: checked }));
          }}
        />
        <CheckboxField
          label="Kích hoạt"
          checked={formData.isActive}
          onChange={(e) => {
            const { checked } = e.target;
            setFormData((prev) => ({ ...prev, isActive: checked }));
          }}
        />

        <FormSection title="Bảng màu & Font (color_scheme)">
          {[
            { key: 'primary', label: 'Màu chính *' },
            { key: 'secondary', label: 'Màu phụ *' },
            { key: 'accent', label: 'Màu nhấn' },
            { key: 'text', label: 'Màu chữ' },
          ].map(({ key, label }) => (
            <Field key={key} label={label}>
              {(control) => (
                <div className="ui-color-row">
                  <input
                    type="color"
                    aria-label={`${label} (bộ chọn màu)`}
                    value={
                      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(formData.colorScheme[key] || '')
                        ? formData.colorScheme[key]
                        : '#000000'
                    }
                    onChange={handleColorChange(key)}
                  />
                  <input
                    className="ui-input"
                    type="text"
                    placeholder="#RRGGBB"
                    value={formData.colorScheme[key] || ''}
                    onChange={handleColorChange(key)}
                    {...control}
                  />
                </div>
              )}
            </Field>
          ))}
          <TextField
            label="Font chữ"
            placeholder="VD: Inter, Roboto..."
            value={formData.fontPair}
            onChange={handleFieldChange('fontPair')}
          />
          <SelectField label="Kiểu Layout" value={formData.layoutType} onChange={handleFieldChange('layoutType')}>
            {THEME_LAYOUT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Độ dày (density)" value={formData.density} onChange={handleFieldChange('density')}>
            {THEME_DENSITIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>
          <TextField
            className="ui-col-2"
            label="Render key (nâng cao)"
            placeholder="Để trống, chỉ dùng cho 3 template đã được lập trình giao diện riêng"
            value={formData.renderKey}
            onChange={handleFieldChange('renderKey')}
            hint="Khớp với component React đã lập trình sẵn (green-sidebar, navy-modern, brown-two-column). Sai giá trị sẽ khiến trang chỉnh sửa CV không hiển thị được."
          />
        </FormSection>

        <FormSection title="Cấu hình Layout (layout_config)">
          <Field label="Số cột">
            {() => (
              <div className="ui-radio-row">
                {[1, 2].map((n) => (
                  <label key={n} className="ui-radio">
                    <input
                      type="radio"
                      name="columns"
                      checked={formData.layoutConfig.columns === n}
                      onChange={() => setLayoutField('columns', n)}
                    />
                    <Columns2 size={15} aria-hidden="true" />
                    {n} cột
                  </label>
                ))}
              </div>
            )}
          </Field>
          <SelectField
            label="Khoảng cách (spacing)"
            value={formData.layoutConfig.spacing}
            onChange={(e) => setLayoutField('spacing', e.target.value)}
          >
            {Object.entries(SPACING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField
            className="ui-col-2"
            label="Kiểu Header (header_style)"
            value={formData.layoutConfig.header_style}
            onChange={(e) => setLayoutField('header_style', e.target.value)}
          >
            {HEADER_STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>

          <Field className="ui-col-2" label="Thứ tự các Section (kéo thả để sắp xếp)">
            {() => (
              <>
                {remainingSections.length > 0 && (
                  <select
                    className="ui-select"
                    aria-label="Thêm section"
                    value=""
                    onChange={(e) => handleAddSection(e.target.value)}
                  >
                    <option value="">+ Thêm section...</option>
                    {remainingSections.map((key) => (
                      <option key={key} value={key}>
                        {SECTION_CATALOG[key] || key}
                      </option>
                    ))}
                  </select>
                )}
                <div className="ui-sortable">
                  {formData.layoutConfig.sections_order.map((key, index) => (
                    <div
                      key={key}
                      draggable
                      className="ui-sortable__item"
                      data-dragging={dragIndex === index}
                      onDragStart={handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop(index)}
                    >
                      <GripVertical size={15} aria-hidden="true" />
                      <span className="ui-cell-title" style={{ flex: 1 }}>
                        {SECTION_CATALOG[key] || key}
                      </span>
                      <span className="ui-code">{key}</span>
                      {formData.layoutConfig.sections_order.length > 1 && (
                        <IconButton icon={X} label="Bỏ section này" size={14} onClick={() => handleRemoveSection(index)} />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Field>
        </FormSection>
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedTemplate}
        size="lg"
        title="Xem trước Template"
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedTemplate && (
            <ViewFooter
              onDelete={() => setModalType('delete')}
              onEdit={() => handleOpenEdit(selectedTemplate)}
              onClose={handleCloseModal}
            />
          )
        }
      >
        {selectedTemplate && (
          <>
            {resolveThumbnail(selectedTemplate.thumbnailUrl) && (
              <img
                src={resolveThumbnail(selectedTemplate.thumbnailUrl)}
                alt={selectedTemplate.name}
                className="ui-cover"
                style={{ marginBottom: 16 }}
              />
            )}
            <div style={{ marginBottom: 16 }}>
              <h3 className="ui-modal__title">{selectedTemplate.name}</h3>
              <span className="ui-hint">Mã ID: #{selectedTemplate.id}</span>
            </div>
            <DetailGrid>
              <DetailItem label="Danh mục">{selectedTemplate.category || 'Khác'}</DetailItem>
              <DetailItem label="Premium">{selectedTemplate.isPremium ? 'Có' : 'Không'}</DetailItem>
              <DetailItem label="Số CV đang dùng">{selectedTemplate.usageCount}</DetailItem>
              <DetailItem label="Trạng thái">{selectedTemplate.isActive ? 'Đang kích hoạt' : 'Đã tắt'}</DetailItem>
              <DetailItem label="Số cột / Spacing">
                {selectedTemplate.layoutConfigObject.columns} cột · {SPACING_LABELS[selectedTemplate.layoutConfigObject.spacing]}
              </DetailItem>
              <DetailItem label="Ngày tạo">{formatDate(selectedTemplate.createdAt)}</DetailItem>
            </DetailGrid>
            <div className="ui-detail-section">
              <h4>Thứ tự Section</h4>
              <div className="ui-chip-row">
                {selectedTemplate.layoutConfigObject.sections_order.map((key, i) => (
                  <Badge key={key} tone="success">
                    {i + 1}. {SECTION_CATALOG[key] || key}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Delete: blocked while in use, otherwise a plain confirm */}
      <Modal
        open={modalType === 'delete' && !!selectedTemplate && inUse}
        size="sm"
        title="Không thể xóa template"
        description="Template đang được sử dụng"
        onClose={handleCloseModal}
        busy={isSubmitting}
        dismissOnBackdrop
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>
              Đóng
            </Button>
            <Button
              variant="warning"
              icon={XCircle}
              loading={isSubmitting}
              disabled={!selectedTemplate?.isActive}
              onClick={handleDeactivateFromDeleteModal}
            >
              {selectedTemplate?.isActive ? (isSubmitting ? 'Đang xử lý...' : 'Tắt kích hoạt ngay') : 'Đã tắt kích hoạt'}
            </Button>
          </>
        }
      >
        {selectedTemplate && (
          <div className="ui-confirm">
            <div className="ui-confirm__icon ui-confirm__icon--warning">
              <AlertTriangle size={22} aria-hidden="true" />
            </div>
            <p className="ui-confirm__msg">
              Template <strong>"{selectedTemplate.name}"</strong> đang được <strong>{selectedTemplate.usageCount}</strong> người dùng
              sử dụng, không thể xóa. Bạn có thể <strong>tắt kích hoạt (is_active)</strong> thay vì xóa để ngăn người dùng mới chọn
              template này.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedTemplate && !inUse}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa template?"
        subtitle="Dữ liệu sẽ bị xóa khỏi danh sách quản lý."
        message={
          selectedTemplate && (
            <>
              Bạn có chắc chắn muốn xóa template <strong>"{selectedTemplate.name}"</strong> khỏi hệ thống?
            </>
          )
        }
        confirmLabel="Xác nhận xóa"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseModal}
      />
    </AdminLayout>
  );
};

export default CvTemplateManagementPage;
