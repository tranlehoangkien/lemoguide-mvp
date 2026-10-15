import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, MessageSquareCode } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { aiPromptTemplateService } from '@/services/aiPromptTemplateService';
import { aiModelService } from '@/services/aiModelService';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import {
  Page,
  PageHeader,
  Toolbar,
  ToolbarGroup,
  Card,
  Badge,
  Button,
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
} from '@/components/ui';

const PAGE_SIZE = 10;

const ACTION_TYPE_LABELS = {
  GENERATE: 'Tạo mới',
  OPTIMIZE: 'Tối ưu CV',
  MATCH_JD: 'Khớp JD',
  TRANSLATE: 'Dịch',
  GRAMMAR_CHECK: 'Kiểm tra ngữ pháp',
  CHAT: 'AI Coach - Chung (chưa chọn chủ đề)',
  CHAT_CV_COACH: 'AI Coach - Tối ưu CV/Thư xin việc',
  CHAT_INTERVIEW_COACH: 'AI Coach - Luyện tập phỏng vấn',
  CHAT_CAREER_COACH: 'AI Coach - Định hướng nghề nghiệp',
  CHAT_JOB_SEARCH_COACH: 'AI Coach - Kỹ năng tìm việc & Đàm phán',
  ANALYZE_JOB: 'Phân tích việc làm với hồ sơ',
  CV_REVIEW: 'Chấm điểm CV (ATS)',
  CV_SUGGEST: 'Gợi ý viết lại CV',
  COVER_LETTER: 'Thư xin việc',
  INTERVIEW_QUESTIONS: 'Luyện phỏng vấn: soạn câu hỏi',
  INTERVIEW_EVALUATE: 'Luyện phỏng vấn: chấm câu trả lời',
  INTERVIEW_HINT: 'Luyện phỏng vấn: gợi ý câu trả lời',
  INTERVIEW_REPORT: 'Luyện phỏng vấn: báo cáo buổi luyện',
  CAREER_PLAN: 'Định hướng: tạo lộ trình nghề nghiệp',
  COMPARE_PROFILE: 'Cộng đồng: học từ hồ sơ',
  NETWORK_ASSIST: 'Cộng đồng: trợ giúp hỏi đáp',
  HOLLAND_ADAPTIVE: 'Khám phá bản thân: trắc nghiệm Holland với AI',
};

const ACTION_TYPE_OPTIONS = [
  'GENERATE',
  'OPTIMIZE',
  'MATCH_JD',
  'TRANSLATE',
  'GRAMMAR_CHECK',
  'CHAT',
  'CHAT_CV_COACH',
  'CHAT_INTERVIEW_COACH',
  'CHAT_CAREER_COACH',
  'CHAT_JOB_SEARCH_COACH',
  'ANALYZE_JOB',
  'CV_REVIEW',
  'CV_SUGGEST',
  'COVER_LETTER',
  'INTERVIEW_QUESTIONS',
  'INTERVIEW_EVALUATE',
  'INTERVIEW_REPORT',
  'INTERVIEW_HINT',
  'CAREER_PLAN',
  'COMPARE_PROFILE',
  'NETWORK_ASSIST',
  'HOLLAND_ADAPTIVE',
];

const PROVIDER_LABELS = { OPENAI: 'OpenAI', ANTHROPIC: 'Anthropic', GOOGLE: 'Google', GROQ: 'Groq', OTHER: 'Khác' };

const emptyForm = {
  actionType: 'CHAT',
  modelId: '',
  promptText: '',
  isActive: true,
};

const AiPromptTemplateManagementPage = () => {
  const [templates, setTemplates] = useState([]);
  const [models, setModels] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');

  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'view' | 'delete' | null
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, showToast } = useToast();

  const modelLabel = (modelId) => {
    const m = models.find((mm) => mm.id === modelId);
    if (!m) return `Model #${modelId}`;
    return `${m.modelName} (${PROVIDER_LABELS[m.provider] || m.provider})`;
  };

  const loadModels = useCallback(async () => {
    try {
      const data = await aiModelService.listModels({ page: 0, size: 100 });
      setModels(data.content || []);
    } catch (err) {
      console.error('Failed to load AI models for prompt template form:', err);
    }
  }, []);

  const loadData = useCallback(async (page, actionType, modelId) => {
    setIsLoading(true);
    try {
      const data = await aiPromptTemplateService.listTemplates({
        page: page - 1,
        size: PAGE_SIZE,
        actionType: actionType === 'all' ? null : actionType,
        modelId: modelId === 'all' ? null : modelId,
      });
      setTemplates(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load prompt templates:', err);
      showToast('Không thể tải danh sách Prompt Template', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    loadData(currentPage, actionTypeFilter, modelFilter);
  }, [currentPage, actionTypeFilter, modelFilter, loadData]);

  const handleResetFilters = () => {
    setActionTypeFilter('all');
    setModelFilter('all');
    setCurrentPage(1);
    loadData(1, 'all', 'all');
  };

  const handleRefresh = () => {
    loadData(currentPage, actionTypeFilter, modelFilter);
    showToast('Đã tải lại danh sách Prompt Template');
  };

  const handleOpenCreate = () => {
    setFormData({ ...emptyForm, modelId: models[0]?.id || '' });
    setFormErrors({});
    setSelectedTemplate(null);
    setModalType('create');
  };

  const handleOpenEdit = (t) => {
    setSelectedTemplate(t);
    setFormData({
      actionType: t.actionType,
      modelId: t.modelId,
      promptText: t.promptText,
      isActive: Boolean(t.isActive),
    });
    setFormErrors({});
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
    setFormData(emptyForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.modelId) {
      errors.modelId = 'Vui lòng chọn Model AI';
    }
    if (!formData.promptText || !formData.promptText.trim()) {
      errors.promptText = 'Nội dung prompt không được để trống';
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
        await aiPromptTemplateService.createTemplate(formData);
        showToast('Đã thêm mới Prompt Template');
      } else if (modalType === 'edit' && selectedTemplate) {
        await aiPromptTemplateService.updateTemplate(selectedTemplate.id, formData);
        showToast('Đã cập nhật Prompt Template');
      }
      handleCloseModal();
      loadData(currentPage, actionTypeFilter, modelFilter);
    } catch (err) {
      console.error('Submit prompt template failed:', err);
      showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    try {
      await aiPromptTemplateService.deleteTemplate(selectedTemplate.id);
      showToast('Đã xóa Prompt Template');
      handleCloseModal();
      loadData(currentPage, actionTypeFilter, modelFilter);
    } catch (err) {
      console.error('Delete prompt template failed:', err);
      showToast(err.message || 'Xóa thất bại, vui lòng thử lại', 'error');
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

  const truncate = (text, max = 90) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max)}...` : text;
  };

  const handleActionTypeChange = (value) => {
    setActionTypeFilter(value);
    setCurrentPage(1);
  };

  const handleModelFilterChange = (value) => {
    setModelFilter(value);
    setCurrentPage(1);
  };

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const statusBadge = (t) => (t.isActive ? <Badge tone="success">Hoạt động</Badge> : <Badge>Tạm ngưng</Badge>);

  const rowActions = (t) => (
    <RowActions
      entity="template"
      onView={() => handleOpenView(t)}
      onEdit={() => handleOpenEdit(t)}
      onDelete={() => handleOpenDelete(t)}
    />
  );

  const columns = [
    { header: 'Hành động', cell: (t) => <span className="ui-cell-title">{ACTION_TYPE_LABELS[t.actionType] || t.actionType}</span> },
    { header: 'Model', cell: (t) => modelLabel(t.modelId) },
    {
      header: 'Nội dung prompt',
      label: 'Prompt',
      cell: (t) => (
        <div className="ui-clamp-2" title={t.promptText}>
          {truncate(t.promptText)}
        </div>
      ),
    },
    { header: 'Phiên bản', cell: (t) => <Badge tone="info">v{t.version}</Badge> },
    { header: 'Trạng thái', cell: (t) => statusBadge(t) },
    { header: 'Cập nhật', muted: true, cell: (t) => formatDate(t.updatedAt || t.createdAt) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Prompt Templates"
          description='System prompt cho từng hành động AI trên từng model, ví dụ prompt cho "Trò chuyện (AI Coach)" của một model cụ thể.'
          actions={
            <Button trailingIcon={Plus} onClick={handleOpenCreate}>
              Thêm mới Template
            </Button>
          }
        />

        <Toolbar>
          <ToolbarGroup>
            <FilterSelect label="Lọc theo hành động" value={actionTypeFilter} onChange={handleActionTypeChange}>
              <option value="all">Tất cả hành động</option>
              {ACTION_TYPE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_TYPE_LABELS[a]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Lọc theo model" value={modelFilter} onChange={handleModelFilterChange}>
              <option value="all">Tất cả model</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.modelName}
                </option>
              ))}
            </FilterSelect>
          </ToolbarGroup>
          <ToolbarGroup>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleRefresh} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            <DataTable
              rows={templates}
              columns={columns}
              actions={rowActions}
              startIndex={(currentPage - 1) * PAGE_SIZE}
              loading={isLoading}
              emptyIcon={MessageSquareCode}
              emptyTitle="Chưa có Prompt Template nào phù hợp."
              emptyHint="Thử đổi bộ lọc hoặc thêm mới một template."
            />
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
        open={modalType === 'create' || modalType === 'edit'}
        size="lg"
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Prompt Template' : 'Chỉnh sửa Prompt Template'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo template' : 'Lưu thay đổi'}
      >
        <SelectField label="Hành động" required value={formData.actionType} onChange={handleFieldChange('actionType')}>
          {ACTION_TYPE_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_TYPE_LABELS[a]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Model AI" required value={formData.modelId} onChange={handleFieldChange('modelId')} error={formErrors.modelId}>
          <option value="">-- Chọn model --</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.modelName} ({PROVIDER_LABELS[m.provider] || m.provider})
            </option>
          ))}
        </SelectField>
        <TextareaField
          className="ui-col-2"
          rows={8}
          label="Nội dung prompt (system prompt)"
          required
          placeholder="VD: Bạn là Trợ lý AI LemoGuide, một chuyên gia tư vấn nghề nghiệp và CV..."
          value={formData.promptText}
          onChange={handleFieldChange('promptText')}
          error={formErrors.promptText}
          hint={
            modalType === 'edit'
              ? 'Lưu ý: mỗi lần sửa sẽ tăng số phiên bản (version) lên 1 để giữ lịch sử prompt.'
              : undefined
          }
        />
        <SelectField
          className="ui-col-2"
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
        open={modalType === 'view' && !!selectedTemplate}
        size="lg"
        title={selectedTemplate ? `Chi tiết Prompt Template #${selectedTemplate.id}` : 'Chi tiết Prompt Template'}
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
            <DetailGrid>
              <DetailItem label="Hành động">{ACTION_TYPE_LABELS[selectedTemplate.actionType] || selectedTemplate.actionType}</DetailItem>
              <DetailItem label="Model">{modelLabel(selectedTemplate.modelId)}</DetailItem>
              <DetailItem label="Phiên bản">v{selectedTemplate.version}</DetailItem>
              <DetailItem label="Trạng thái">{selectedTemplate.isActive ? 'Hoạt động' : 'Tạm ngưng'}</DetailItem>
              <DetailItem label="Ngày tạo">{formatDate(selectedTemplate.createdAt)}</DetailItem>
              <DetailItem label="Cập nhật lần cuối">
                {formatDate(selectedTemplate.updatedAt || selectedTemplate.createdAt)}
              </DetailItem>
            </DetailGrid>
            <DetailSection title="Nội dung prompt">{selectedTemplate.promptText}</DetailSection>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedTemplate}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa Prompt Template?"
        subtitle="Template không thể xóa nếu đã có nhật ký sử dụng. Hãy tạm ngưng thay vì xóa trong trường hợp đó."
        message={
          selectedTemplate && (
            <>
              Bạn có chắc chắn muốn xóa template{' '}
              <strong>{ACTION_TYPE_LABELS[selectedTemplate.actionType] || selectedTemplate.actionType}</strong> của model{' '}
              <strong>{modelLabel(selectedTemplate.modelId)}</strong>?
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

export default AiPromptTemplateManagementPage;
