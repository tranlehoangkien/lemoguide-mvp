import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, ShieldCheck, ShieldAlert, Bot } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { aiModelService } from '@/services/aiModelService';
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
  SelectField,
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

const PROVIDER_LABELS = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  OTHER: 'Khác',
};

const PROVIDER_OPTIONS = ['OPENAI', 'ANTHROPIC', 'GOOGLE', 'GROQ', 'OTHER'];

const emptyModelForm = {
  provider: 'ANTHROPIC',
  modelName: '',
  apiKey: '',
  maxTokensPerRequest: 4096,
  isActive: true,
};

const AiModelManagementPage = () => {
  const [models, setModels] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [formData, setFormData] = useState(emptyModelForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, showToast } = useToast();

  const loadData = useCallback(async (page, search, provider) => {
    setIsLoading(true);
    try {
      const data = await aiModelService.listModels({
        page: page - 1,
        size: PAGE_SIZE,
        keyword: search,
        provider: provider === 'all' ? null : provider,
      });
      setModels(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load AI models:', err);
      showToast('Không thể tải danh sách Model AI', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(currentPage, searchTerm, providerFilter);
  }, [currentPage, searchTerm, providerFilter, loadData]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setProviderFilter('all');
    setCurrentPage(1);
    loadData(1, '', 'all');
  };

  const handleRefresh = () => {
    loadData(currentPage, searchTerm, providerFilter);
    showToast('Đã tải lại danh sách Model AI');
  };

  const handleOpenCreate = () => {
    setFormData(emptyModelForm);
    setFormErrors({});
    setSelectedModel(null);
    setModalType('create');
  };

  const handleOpenEdit = (model) => {
    setSelectedModel(model);
    setFormData({
      provider: model.provider || 'ANTHROPIC',
      modelName: model.modelName || '',
      apiKey: '',
      maxTokensPerRequest: model.maxTokensPerRequest || 4096,
      isActive: Boolean(model.isActive),
    });
    setFormErrors({});
    setModalType('edit');
  };

  const handleOpenView = (model) => {
    setSelectedModel(model);
    setModalType('view');
  };

  const handleOpenDelete = (model) => {
    setSelectedModel(model);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedModel(null);
    setFormData(emptyModelForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.modelName || !formData.modelName.trim()) {
      errors.modelName = 'Tên model không được để trống';
    }
    if (modalType === 'create' && (!formData.apiKey || !formData.apiKey.trim())) {
      errors.apiKey = 'Vui lòng nhập API Key cho model mới';
    }
    if (!formData.maxTokensPerRequest || Number(formData.maxTokensPerRequest) <= 0) {
      errors.maxTokensPerRequest = 'Giới hạn token phải lớn hơn 0';
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
        await aiModelService.createModel(formData);
        showToast(`Đã thêm mới model: ${formData.modelName}`);
      } else if (modalType === 'edit' && selectedModel) {
        await aiModelService.updateModel(selectedModel.id, formData);
        showToast(`Đã cập nhật model: ${formData.modelName}`);
      }
      handleCloseModal();
      loadData(currentPage, searchTerm, providerFilter);
    } catch (err) {
      console.error('Submit AI model failed:', err);
      showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedModel) return;
    setIsSubmitting(true);
    try {
      await aiModelService.deleteModel(selectedModel.id);
      showToast(`Đã xóa model: ${selectedModel.modelName}`);
      handleCloseModal();
      loadData(currentPage, searchTerm, providerFilter);
    } catch (err) {
      console.error('Delete AI model failed:', err);
      showToast(err.message || 'Xóa model thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
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

  const handleProviderChange = (value) => {
    setProviderFilter(value);
    setCurrentPage(1);
  };

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const providerLabel = (model) => PROVIDER_LABELS[model.provider] || model.provider;

  const keyBadge = (model) =>
    model.apiKeyConfigured ? (
      <Badge tone="success">
        <ShieldCheck size={13} aria-hidden="true" />
        Đã cấu hình
      </Badge>
    ) : (
      <Badge tone="danger">
        <ShieldAlert size={13} aria-hidden="true" />
        Chưa có khóa
      </Badge>
    );

  const statusBadge = (model) =>
    model.isActive ? <Badge tone="success">Hoạt động</Badge> : <Badge>Tạm ngưng</Badge>;

  const rowActions = (model) => (
    <RowActions
      entity="model"
      onView={() => handleOpenView(model)}
      onEdit={() => handleOpenEdit(model)}
      onDelete={() => handleOpenDelete(model)}
    />
  );

  const columns = [
    { header: 'Nhà cung cấp', cell: (m) => providerLabel(m) },
    { header: 'Tên model', cell: (m) => <span className="ui-cell-title">{m.modelName}</span> },
    { header: 'API Key', cell: (m) => keyBadge(m) },
    { header: 'Giới hạn token', cell: (m) => `${m.maxTokensPerRequest?.toLocaleString('vi-VN')} tokens` },
    { header: 'Trạng thái', cell: (m) => statusBadge(m) },
    { header: 'Ngày tạo', muted: true, cell: (m) => formatDate(m.createdAt) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Model AI & API Key"
          description="Cấu hình nhà cung cấp, model và API Key phục vụ tính năng CV hỗ trợ bởi AI."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm mới Model
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên model..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo nhà cung cấp" value={providerFilter} onChange={handleProviderChange}>
              <option value="all">Tất cả nhà cung cấp</option>
              {PROVIDER_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </FilterSelect>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleRefresh} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {viewMode === 'table' || models.length === 0 ? (
              <DataTable
                rows={models}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={Bot}
                emptyTitle="Không có model AI nào phù hợp."
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc thêm mới một model."
              />
            ) : (
              <div className="ui-grid">
                {models.map((m, idx) => (
                  <article key={m.id} className="ui-item-card">
                    <div>
                      <div className="ui-item-card__row">
                        <span className="ui-hint">#{(currentPage - 1) * PAGE_SIZE + idx + 1}</span>
                        {statusBadge(m)}
                      </div>
                      <h3 className="ui-item-card__title">{m.modelName}</h3>
                      <p className="ui-hint" style={{ margin: '4px 0 0' }}>
                        {providerLabel(m)}
                      </p>
                    </div>
                    <div className="ui-item-card__foot" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>API Key</span>
                        {keyBadge(m)}
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Giới hạn token</span>
                        <strong style={{ color: 'var(--ui-text)' }}>{m.maxTokensPerRequest?.toLocaleString('vi-VN')}</strong>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Ngày tạo</span>
                        <span>{formatDate(m.createdAt)}</span>
                      </span>
                    </div>
                    <div className="ui-item-card__actions">{rowActions(m)}</div>
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
            entityName="model"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Model AI' : 'Chỉnh sửa Model AI'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo model' : 'Lưu thay đổi'}
      >
        <SelectField label="Nhà cung cấp" required value={formData.provider} onChange={handleFieldChange('provider')}>
          {PROVIDER_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABELS[p]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Tên model"
          required
          placeholder="VD: claude-sonnet-4-6"
          value={formData.modelName}
          onChange={handleFieldChange('modelName')}
          error={formErrors.modelName}
        />
        <TextField
          className="ui-col-2"
          type="password"
          autoComplete="new-password"
          label="API Key"
          required={modalType === 'create'}
          placeholder={modalType === 'edit' ? 'Để trống nếu giữ nguyên khóa hiện tại' : 'Nhập API Key của nhà cung cấp'}
          value={formData.apiKey}
          onChange={handleFieldChange('apiKey')}
          error={formErrors.apiKey}
          hint={modalType === 'edit' && selectedModel?.apiKeyConfigured ? 'Model đã có API Key được cấu hình.' : undefined}
        />
        <TextField
          type="number"
          min={1}
          label="Giới hạn token / yêu cầu"
          required
          value={formData.maxTokensPerRequest}
          onChange={handleFieldChange('maxTokensPerRequest')}
          error={formErrors.maxTokensPerRequest}
        />
        <SelectField
          label="Trạng thái"
          value={formData.isActive ? 'active' : 'inactive'}
          onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'active' }))}
        >
          <option value="active">Hoạt động</option>
          <option value="inactive">Tạm ngưng</option>
        </SelectField>
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedModel}
        title="Chi tiết Model AI"
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedModel && (
            <ViewFooter
              onDelete={() => setModalType('delete')}
              onEdit={() => handleOpenEdit(selectedModel)}
              onClose={handleCloseModal}
            />
          )
        }
      >
        {selectedModel && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h3 className="ui-modal__title">{selectedModel.modelName}</h3>
              <span className="ui-hint">{providerLabel(selectedModel)}</span>
            </div>
            <DetailGrid>
              <DetailItem label="API Key">{keyBadge(selectedModel)}</DetailItem>
              <DetailItem label="Giới hạn token">{selectedModel.maxTokensPerRequest?.toLocaleString('vi-VN')}</DetailItem>
              <DetailItem label="Trạng thái">{selectedModel.isActive ? 'Hoạt động' : 'Tạm ngưng'}</DetailItem>
              <DetailItem label="Ngày tạo">{formatDate(selectedModel.createdAt)}</DetailItem>
              <DetailItem label="Cập nhật lần cuối">
                {formatDate(selectedModel.updatedAt || selectedModel.createdAt)}
              </DetailItem>
            </DetailGrid>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedModel}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa Model AI?"
        subtitle="Model không thể xóa nếu đang được một Prompt Template sử dụng."
        message={
          selectedModel && (
            <>
              Bạn có chắc chắn muốn xóa model <strong>"{selectedModel.modelName}"</strong> ({providerLabel(selectedModel)})?
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

export default AiModelManagementPage;
