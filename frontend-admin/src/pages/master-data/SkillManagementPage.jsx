import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Wrench, HeartHandshake, Languages, Award, Sparkles } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { skillService } from '@/services/skillService';
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

const getSkillTypeMeta = (type) => {
  const t = (type || '').toLowerCase();
  if (t === 'hard') return { label: 'Kỹ năng chuyên môn (Hard)', shortLabel: 'Hard Skill', icon: Wrench, tone: 'info' };
  if (t === 'soft') return { label: 'Kỹ năng mềm (Soft)', shortLabel: 'Soft Skill', icon: HeartHandshake, tone: 'success' };
  if (t === 'language') return { label: 'Ngoại ngữ (Language)', shortLabel: 'Ngoại ngữ', icon: Languages, tone: 'warning' };
  return { label: 'Khác', shortLabel: 'Khác', icon: Award, tone: 'neutral' };
};

const TypeBadge = ({ type, short = false }) => {
  const meta = getSkillTypeMeta(type);
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone}>
      <Icon size={12} aria-hidden="true" />
      {short ? meta.shortLabel : meta.label}
    </Badge>
  );
};

const emptySkillForm = {
  name: '',
  type: 'hard',
  description: '',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
};

const SkillManagementPage = () => {
  const [skills, setSkills] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [formData, setFormData] = useState(emptySkillForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  const loadData = useCallback(
    async (page, search, type) => {
      setIsLoading(true);
      try {
        const data = await skillService.listSkills({
          page: page - 1,
          size: PAGE_SIZE,
          search,
          type,
        });
        setSkills(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Failed to load skills:', err);
        showToast('Không thể tải danh sách kỹ năng', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadData(currentPage, searchTerm, selectedType);
  }, [currentPage, searchTerm, selectedType, loadData]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setCurrentPage(1);
    loadData(1, '', 'all');
  };

  const handleRefresh = () => {
    loadData(currentPage, searchTerm, selectedType);
    showToast('Đã tải lại danh sách kỹ năng');
  };

  const handleOpenCreate = () => {
    setFormData(emptySkillForm);
    setFormErrors({});
    setSelectedSkill(null);
    setModalType('create');
  };

  const handleOpenEdit = (skill) => {
    setSelectedSkill(skill);
    setFormData({
      name: skill.name || '',
      type: skill.type || 'hard',
      description: skill.description || '',
    });
    setFormErrors({});
    setModalType('edit');
  };

  const handleOpenView = (skill) => {
    setSelectedSkill(skill);
    setModalType('view');
  };

  const handleOpenDelete = (skill) => {
    setSelectedSkill(skill);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedSkill(null);
    setFormData(emptySkillForm);
    setFormErrors({});
  };

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Tên kỹ năng không được để trống';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Tên kỹ năng không vượt quá 100 ký tự';
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
        await skillService.createSkill(formData);
        showToast(`Đã thêm mới kỹ năng: ${formData.name}`);
      } else if (modalType === 'edit' && selectedSkill) {
        await skillService.updateSkill(selectedSkill.id, formData);
        showToast(`Đã cập nhật kỹ năng: ${formData.name}`);
      }
      handleCloseModal();
      loadData(currentPage, searchTerm, selectedType);
    } catch (err) {
      console.error('Submit skill failed:', err);
      showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSkill) return;
    setIsSubmitting(true);
    try {
      await skillService.deleteSkill(selectedSkill.id);
      showToast(`Đã xóa kỹ năng: ${selectedSkill.name}`);
      handleCloseModal();
      loadData(currentPage, searchTerm, selectedType);
    } catch (err) {
      console.error('Delete skill failed:', err);
      showToast('Xóa kỹ năng thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rowActions = (skill) => (
    <RowActions
      entity="kỹ năng"
      onView={() => handleOpenView(skill)}
      onEdit={() => handleOpenEdit(skill)}
      onDelete={() => handleOpenDelete(skill)}
    />
  );

  const columns = [
    { header: 'Kỹ năng', cell: (s) => <span className="ui-cell-title">{s.name}</span> },
    { header: 'Phân loại', cell: (s) => <TypeBadge type={s.type} /> },
    {
      header: 'Mô tả chi tiết',
      label: 'Mô tả',
      cell: (s) => (
        <div className="ui-clamp-2" title={s.description}>
          {s.description || <span className="ui-placeholder-text">Chưa có mô tả</span>}
        </div>
      ),
    },
    { header: 'Ngày tạo', muted: true, cell: (s) => formatDate(s.createdAt) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Kỹ năng (Skill)"
          description="Quản lý danh sách kỹ năng chuyên môn, kỹ năng mềm và trình độ ngoại ngữ."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm mới Kỹ năng
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên kỹ năng hoặc mô tả..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo phân loại" value={selectedType} onChange={handleTypeChange}>
              <option value="all">Tất cả phân loại</option>
              <option value="hard">Kỹ năng chuyên môn (Hard)</option>
              <option value="soft">Kỹ năng mềm (Soft)</option>
              <option value="language">Ngoại ngữ (Language)</option>
            </FilterSelect>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleRefresh} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {viewMode === 'table' || skills.length === 0 ? (
              <DataTable
                rows={skills}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={Sparkles}
                emptyTitle="Không có bản ghi kỹ năng nào phù hợp."
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc thêm mới một kỹ năng."
              />
            ) : (
              <div className="ui-grid">
                {skills.map((s, idx) => (
                  <article key={s.id} className="ui-item-card">
                    <div>
                      <div className="ui-item-card__row">
                        <h3 className="ui-item-card__title">{s.name}</h3>
                        <TypeBadge type={s.type} short />
                      </div>
                      <p className="ui-clamp-3 ui-hint" style={{ margin: 0 }}>
                        {s.description || 'Chưa có mô tả chi tiết cho kỹ năng này.'}
                      </p>
                    </div>
                    <div className="ui-item-card__foot">
                      <span>
                        #{(currentPage - 1) * PAGE_SIZE + idx + 1} · {formatDate(s.createdAt)}
                      </span>
                      {rowActions(s)}
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
            entityName="kỹ năng"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Kỹ năng' : 'Chỉnh sửa Kỹ năng'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo kỹ năng' : 'Lưu thay đổi'}
      >
        <TextField
          label="Tên kỹ năng"
          required
          placeholder="VD: Microservices, Tiếng Anh B2..."
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={formErrors.name}
        />
        <SelectField label="Phân loại kỹ năng" required value={formData.type} onChange={handleFieldChange('type')}>
          <option value="hard">Kỹ năng chuyên môn (Hard Skill)</option>
          <option value="soft">Kỹ năng mềm (Soft Skill)</option>
          <option value="language">Ngoại ngữ (Language)</option>
        </SelectField>
        <TextareaField
          className="ui-col-2"
          label="Mô tả kỹ năng"
          placeholder="Mô tả tiêu chuẩn năng lực, chứng chỉ tương đương hoặc ngữ cảnh ứng dụng..."
          value={formData.description}
          onChange={handleFieldChange('description')}
        />
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedSkill}
        title="Chi tiết Kỹ năng"
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedSkill && (
            <ViewFooter
              onDelete={() => setModalType('delete')}
              onEdit={() => handleOpenEdit(selectedSkill)}
              onClose={handleCloseModal}
            />
          )
        }
      >
        {selectedSkill && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h3 className="ui-modal__title">{selectedSkill.name}</h3>
              <span className="ui-hint">Mã ID: #{selectedSkill.id}</span>
            </div>
            <DetailGrid>
              <DetailItem label="Phân loại kỹ năng">
                <TypeBadge type={selectedSkill.type} />
              </DetailItem>
              <DetailItem label="Mã định danh">{selectedSkill.type?.toUpperCase()}</DetailItem>
              <DetailItem label="Ngày khởi tạo">{formatDate(selectedSkill.createdAt)}</DetailItem>
              <DetailItem label="Cập nhật lần cuối">
                {formatDate(selectedSkill.updatedAt || selectedSkill.createdAt)}
              </DetailItem>
            </DetailGrid>
            <DetailSection title="Mô tả tiêu chuẩn kỹ năng">
              {selectedSkill.description || 'Chưa có thông tin mô tả cho kỹ năng này.'}
            </DetailSection>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedSkill}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa kỹ năng?"
        subtitle="Dữ liệu sẽ bị xóa khỏi danh sách quản lý."
        message={
          selectedSkill && (
            <>
              Bạn có chắc chắn muốn xóa kỹ năng <strong>"{selectedSkill.name}"</strong> khỏi danh mục?
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

export default SkillManagementPage;
