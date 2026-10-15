import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Cpu } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { technologyService, TECH_CATEGORIES } from '@/services/technologyService';
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
  Field,
  TextField,
  TextareaField,
  SelectField,
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

const getCategoryTone = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('front')) return 'info';
  if (cat.includes('back')) return 'success';
  if (cat.includes('data')) return 'warning';
  if (cat.includes('devops') || cat.includes('cloud')) return 'info';
  if (cat.includes('mobile')) return 'warning';
  if (cat.includes('ai') || cat.includes('machine')) return 'danger';
  return 'neutral';
};

const emptyTechForm = {
  name: '',
  category: 'Frontend',
  iconUrl: '',
  description: '',
};

const TechnologyManagementPage = () => {
  const [technologies, setTechnologies] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableCategories, setAvailableCategories] = useState(TECH_CATEGORIES);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  const [formData, setFormData] = useState(emptyTechForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  // Tải danh sách phân loại từ backend
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const list = await technologyService.getCategories();
        if (Array.isArray(list) && list.length > 0) {
          setAvailableCategories(list);
        }
      } catch (err) {
        console.warn('Lỗi tải categories:', err);
      }
    };
    fetchCats();
  }, []);

  const loadData = useCallback(async (page, search, category) => {
    setIsLoading(true);
    try {
      const data = await technologyService.listTechnologies({
        page: page - 1,
        size: PAGE_SIZE,
        search,
        category,
      });
      setTechnologies(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load technologies:', err);
      showToast('Không thể tải danh sách công nghệ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(currentPage, searchTerm, selectedCategory);
  }, [currentPage, searchTerm, selectedCategory, loadData]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setCurrentPage(1);
    loadData(1, '', 'all');
  };

  const handleRefresh = () => {
    loadData(currentPage, searchTerm, selectedCategory);
    showToast('Đã tải lại danh sách công nghệ');
  };

  const handleOpenCreate = () => {
    setFormData(emptyTechForm);
    setFormErrors({});
    setSelectedTech(null);
    setModalType('create');
  };

  const handleOpenEdit = (tech) => {
    setSelectedTech(tech);
    setFormData({
      name: tech.name || '',
      category: tech.category || 'Frontend',
      iconUrl: tech.iconUrl || '',
      description: tech.description || '',
    });
    setFormErrors({});
    setModalType('edit');
  };

  const handleOpenView = (tech) => {
    setSelectedTech(tech);
    setModalType('view');
  };

  const handleOpenDelete = (tech) => {
    setSelectedTech(tech);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedTech(null);
    setFormData(emptyTechForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Tên công nghệ không được để trống';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Tên công nghệ không vượt quá 100 ký tự';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (modalType === 'create') {
        await technologyService.createTechnology(formData);
        showToast(`Đã thêm mới công nghệ: ${formData.name}`);
      } else if (modalType === 'edit' && selectedTech) {
        await technologyService.updateTechnology(selectedTech.id, formData);
        showToast(`Đã cập nhật công nghệ: ${formData.name}`);
      }
      handleCloseModal();
      loadData(currentPage, searchTerm, selectedCategory);
    } catch (err) {
      console.error('Submit technology failed:', err);
      showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTech) return;
    setIsSubmitting(true);
    try {
      await technologyService.deleteTechnology(selectedTech.id);
      showToast(`Đã xóa công nghệ: ${selectedTech.name}`);
      handleCloseModal();
      loadData(currentPage, searchTerm, selectedCategory);
    } catch (err) {
      console.error('Delete technology failed:', err);
      showToast('Xóa công nghệ thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
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

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const rowActions = (tech) => (
    <RowActions
      entity="công nghệ"
      onView={() => handleOpenView(tech)}
      onEdit={() => handleOpenEdit(tech)}
      onDelete={() => handleOpenDelete(tech)}
    />
  );

  const columns = [
    { header: 'Công nghệ', cell: (t) => <span className="ui-cell-title">{t.name}</span> },
    { header: 'Phân loại', cell: (t) => <Badge tone={getCategoryTone(t.category)}>{t.category || 'Khác'}</Badge> },
    {
      header: 'Mô tả chi tiết',
      label: 'Mô tả',
      cell: (t) => (
        <div className="ui-clamp-2" title={t.description}>
          {t.description || <span className="ui-placeholder-text">Chưa có mô tả</span>}
        </div>
      ),
    },
    { header: 'Ngày tạo', muted: true, cell: (t) => formatDate(t.createdAt) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Công nghệ (Technology)"
          description="Quản lý danh sách framework, ngôn ngữ, cơ sở dữ liệu và công cụ lập trình."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm mới Công nghệ
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên công nghệ hoặc mô tả..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo phân loại" value={selectedCategory} onChange={handleCategoryChange}>
              <option value="all">Tất cả phân loại</option>
              <optgroup label="Nhóm phân loại chính">
                <option value="Programming Language">Ngôn ngữ lập trình</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database (Cơ sở dữ liệu)</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Mobile">Mobile</option>
                <option value="AI & Machine Learning">AI & Machine Learning</option>
                <option value="Testing & QA">Testing & QA</option>
                <option value="Tools & Utilities">Tools & Utilities</option>
              </optgroup>
              {availableCategories && availableCategories.length > 0 && (
                <optgroup label="Danh mục chi tiết trong hệ thống">
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </optgroup>
              )}
            </FilterSelect>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleRefresh} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {viewMode === 'table' || technologies.length === 0 ? (
              <DataTable
                rows={technologies}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={Cpu}
                emptyTitle="Không có bản ghi công nghệ nào phù hợp."
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc thêm mới một công nghệ."
              />
            ) : (
              <div className="ui-grid">
                {technologies.map((t, idx) => (
                  <article key={t.id} className="ui-item-card">
                    <div>
                      <div className="ui-item-card__row">
                        <h3 className="ui-item-card__title">{t.name}</h3>
                        <Badge tone={getCategoryTone(t.category)}>{t.category}</Badge>
                      </div>
                      <p className="ui-clamp-3 ui-hint" style={{ margin: 0 }}>
                        {t.description || 'Chưa có mô tả chi tiết cho công nghệ này.'}
                      </p>
                    </div>
                    <div className="ui-item-card__foot">
                      <span>
                        #{(currentPage - 1) * PAGE_SIZE + idx + 1} · {formatDate(t.createdAt)}
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
            entityName="công nghệ"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Công nghệ' : 'Chỉnh sửa Công nghệ'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo công nghệ' : 'Lưu thay đổi'}
      >
        <TextField
          label="Tên công nghệ"
          required
          placeholder="VD: React.js, Docker..."
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={formErrors.name}
        />
        <SelectField label="Phân loại / Danh mục" required value={formData.category} onChange={handleFieldChange('category')}>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </SelectField>
        <Field className="ui-col-2" label="Đường dẫn biểu tượng (Icon URL)">
          {(control) => (
            <div className="ui-inline">
              <input
                className="ui-input"
                type="url"
                placeholder="https://cdn.jsdelivr.net/gh/devicons/...svg"
                value={formData.iconUrl}
                onChange={handleFieldChange('iconUrl')}
                {...control}
              />
              <div className="ui-icon-preview" title="Xem trước icon">
                {formData.iconUrl ? (
                  <img
                    src={formData.iconUrl}
                    alt="Xem trước biểu tượng"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Cpu size={20} aria-hidden="true" />
                )}
              </div>
            </div>
          )}
        </Field>
        <TextareaField
          className="ui-col-2"
          label="Mô tả công nghệ"
          placeholder="Mô tả công năng chính, kiến trúc hoặc mục đích ứng dụng..."
          value={formData.description}
          onChange={handleFieldChange('description')}
        />
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedTech}
        title="Chi tiết Công nghệ"
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedTech && (
            <ViewFooter
              onDelete={() => setModalType('delete')}
              onEdit={() => handleOpenEdit(selectedTech)}
              onClose={handleCloseModal}
            />
          )
        }
      >
        {selectedTech && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h3 className="ui-modal__title">{selectedTech.name}</h3>
              <span className="ui-hint">Mã ID: #{selectedTech.id}</span>
            </div>
            <DetailGrid>
              <DetailItem label="Phân loại danh mục">
                <Badge tone={getCategoryTone(selectedTech.category)}>{selectedTech.category}</Badge>
              </DetailItem>
              <DetailItem label="Biểu tượng (Icon)">
                {selectedTech.iconUrl ? (
                  <a href={selectedTech.iconUrl} target="_blank" rel="noreferrer" className="ui-link">
                    {selectedTech.iconUrl.length > 35 ? selectedTech.iconUrl.substring(0, 35) + '...' : selectedTech.iconUrl}
                  </a>
                ) : (
                  'Chưa có biểu tượng'
                )}
              </DetailItem>
              <DetailItem label="Ngày khởi tạo">{formatDate(selectedTech.createdAt)}</DetailItem>
              <DetailItem label="Cập nhật lần cuối">
                {formatDate(selectedTech.updatedAt || selectedTech.createdAt)}
              </DetailItem>
            </DetailGrid>
            <DetailSection title="Mô tả công nghệ">
              {selectedTech.description || 'Chưa có thông tin mô tả cho công nghệ này.'}
            </DetailSection>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedTech}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa công nghệ?"
        subtitle="Dữ liệu sẽ bị xóa khỏi danh sách quản lý."
        message={
          selectedTech && (
            <>
              Bạn có chắc chắn muốn xóa công nghệ <strong>"{selectedTech.name}"</strong> khỏi hệ thống?
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

export default TechnologyManagementPage;
