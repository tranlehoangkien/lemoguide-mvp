import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Crown, CreditCard, Infinity as InfinityIcon } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { planService } from '@/services/planService';
import Pagination from '@/components/common/Pagination';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import {
  Page,
  PageHeader,
  Toolbar,
  ToolbarGroup,
  SearchBox,
  Card,
  Badge,
  Button,
  TextField,
  SelectField,
  CheckboxField,
  FormModal,
  Modal,
  DetailGrid,
  DetailItem,
  Toast,
  useToast,
  DataTable,
  RowActions,
  ResetRefreshButtons,
  ViewFooter,
} from '@/components/ui';

const PAGE_SIZE = 10;

const BILLING_CYCLE_LABELS = {
  MONTHLY: 'Hàng tháng',
  YEARLY: 'Hàng năm',
  ONE_TIME: 'Một lần',
};

const BILLING_CYCLE_OPTIONS = ['MONTHLY', 'YEARLY', 'ONE_TIME'];

const emptyPlanForm = {
  name: '',
  price: 0,
  billingCycle: 'MONTHLY',
  aiCreditsPerMonth: 0,
  messagesPerDay: '',
  messagesPerWeek: '',
  messagesPerMonth: '',
  maxCvs: '',
  maxCvsUnlimited: true,
  allowPremiumTemplates: false,
  isActive: true,
};

const formatVnd = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const PlanManagementPage = () => {
  const [plans, setPlans] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState(emptyPlanForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, showToast } = useToast();

  const loadData = useCallback(async (page, search) => {
    setIsLoading(true);
    try {
      const data = await planService.listPlans({
        page: page - 1,
        size: PAGE_SIZE,
        keyword: search,
      });
      setPlans(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load plans:', err);
      showToast('Không thể tải danh sách Gói & Giới hạn', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(currentPage, searchTerm);
  }, [currentPage, searchTerm, loadData]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadData(1, '');
  };

  const handleRefresh = () => {
    loadData(currentPage, searchTerm);
    showToast('Đã tải lại danh sách Gói & Giới hạn');
  };

  const handleOpenCreate = () => {
    setFormData(emptyPlanForm);
    setFormErrors({});
    setSelectedPlan(null);
    setModalType('create');
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || '',
      price: plan.price ?? 0,
      billingCycle: plan.billingCycle || 'MONTHLY',
      aiCreditsPerMonth: plan.aiCreditsPerMonth ?? 0,
      messagesPerDay: plan.messagesPerDay ?? '',
      messagesPerWeek: plan.messagesPerWeek ?? '',
      messagesPerMonth: plan.messagesPerMonth ?? '',
      maxCvs: plan.maxCvs === null || plan.maxCvs === undefined ? '' : plan.maxCvs,
      maxCvsUnlimited: plan.maxCvs === null || plan.maxCvs === undefined,
      allowPremiumTemplates: Boolean(plan.allowPremiumTemplates),
      isActive: Boolean(plan.isActive),
    });
    setFormErrors({});
    setModalType('edit');
  };

  const handleOpenView = (plan) => {
    setSelectedPlan(plan);
    setModalType('view');
  };

  const handleOpenDelete = (plan) => {
    setSelectedPlan(plan);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedPlan(null);
    setFormData(emptyPlanForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    for (const field of ['messagesPerDay', 'messagesPerWeek', 'messagesPerMonth']) {
      const value = formData[field];
      if (value !== '' && (!Number.isSafeInteger(Number(value)) || Number(value) < 0)) {
        errors[field] = 'Nhập số nguyên không âm, hoặc để trống nếu không giới hạn';
      }
    }
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Tên gói không được để trống';
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      errors.price = 'Giá phải là số lớn hơn hoặc bằng 0';
    }
    if (formData.aiCreditsPerMonth === '' || Number(formData.aiCreditsPerMonth) < 0) {
      errors.aiCreditsPerMonth = 'Số credit AI/tháng phải là số lớn hơn hoặc bằng 0';
    }
    if (!formData.maxCvsUnlimited && (formData.maxCvs === '' || Number(formData.maxCvs) < 0)) {
      errors.maxCvs = 'Giới hạn số CV phải là số lớn hơn hoặc bằng 0, hoặc chọn "Không giới hạn"';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      maxCvs: formData.maxCvsUnlimited ? null : formData.maxCvs,
    };

    setIsSubmitting(true);
    try {
      if (modalType === 'create') {
        await planService.createPlan(payload);
        showToast(`Đã thêm mới gói: ${formData.name}`);
      } else if (modalType === 'edit' && selectedPlan) {
        await planService.updatePlan(selectedPlan.id, payload);
        showToast(`Đã cập nhật gói: ${formData.name}`);
      }
      handleCloseModal();
      loadData(currentPage, searchTerm);
    } catch (err) {
      console.error('Submit plan failed:', err);
      showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      await planService.deletePlan(selectedPlan.id);
      showToast(`Đã xóa gói: ${selectedPlan.name}`);
      handleCloseModal();
      loadData(currentPage, searchTerm);
    } catch (err) {
      console.error('Delete plan failed:', err);
      showToast(err.message || 'Xóa gói thất bại, vui lòng thử lại', 'error');
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

  const handleFieldChange = (field) => (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: null }));
  };

  const cvLimit = (plan) =>
    plan.maxCvs === null || plan.maxCvs === undefined ? (
      <span className="ui-inline">
        <InfinityIcon size={14} aria-hidden="true" /> Không giới hạn
      </span>
    ) : (
      Number(plan.maxCvs).toLocaleString('vi-VN')
    );

  const rowActions = (plan) => (
    <RowActions
      entity="gói"
      onView={() => handleOpenView(plan)}
      onEdit={() => handleOpenEdit(plan)}
      onDelete={() => handleOpenDelete(plan)}
    />
  );

  const columns = [
    { header: 'Tên gói', cell: (p) => <span className="ui-cell-title">{p.name}</span> },
    {
      header: 'Giá / Chu kỳ',
      label: 'Giá',
      cell: (p) => (
        <>
          <div className="ui-cell-title">{formatVnd(p.price)}</div>
          <div className="ui-hint">{BILLING_CYCLE_LABELS[p.billingCycle] || p.billingCycle}</div>
        </>
      ),
    },
    { header: 'Credit AI/tháng', label: 'Credit AI', cell: (p) => Number(p.aiCreditsPerMonth || 0).toLocaleString('vi-VN') },
    { header: 'Tin nhắn', cell: (p) => (
      <>
        <div className="ui-cell-title">{p.messagesPerMonth == null ? 'Không giới hạn' : p.messagesPerMonth.toLocaleString('vi-VN')} / tháng</div>
        <div className="ui-hint">{p.messagesPerWeek == null ? 'Không giới hạn' : p.messagesPerWeek.toLocaleString('vi-VN')} / tuần</div>
        <div className="ui-hint">{p.messagesPerDay == null ? 'Không giới hạn' : p.messagesPerDay.toLocaleString('vi-VN')} / ngày</div>
      </>
    ) },
    { header: 'Giới hạn CV', cell: (p) => cvLimit(p) },
    {
      header: 'Template Premium',
      label: 'Premium',
      cell: (p) =>
        p.allowPremiumTemplates ? (
          <Badge tone="warning">
            <Crown size={13} aria-hidden="true" /> Có
          </Badge>
        ) : (
          <Badge>Không</Badge>
        ),
    },
    {
      header: 'Trạng thái',
      cell: (p) => (p.isActive ? <Badge tone="success">Hoạt động</Badge> : <Badge>Tạm ngưng</Badge>),
    },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Gói & Giới hạn (Credits/Plans)"
          description="Quản lý các gói thuê bao, giá và giới hạn (credit AI/tháng, số CV) áp dụng cho tài khoản người dùng."
          actions={
            <Button trailingIcon={Plus} onClick={handleOpenCreate}>
              Thêm mới Gói
            </Button>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên gói..."
          />
          <ToolbarGroup>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleRefresh} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            <DataTable
              rows={plans}
              columns={columns}
              actions={rowActions}
              startIndex={(currentPage - 1) * PAGE_SIZE}
              loading={isLoading}
              emptyIcon={CreditCard}
              emptyTitle="Không có gói nào phù hợp."
              emptyHint="Thử đổi từ khóa hoặc thêm mới một gói."
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            entityName="gói"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Gói' : 'Chỉnh sửa Gói'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo gói' : 'Lưu thay đổi'}
      >
        <TextField
          className="ui-col-2"
          label="Tên gói"
          required
          placeholder="VD: Free, Pro, Enterprise"
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={formErrors.name}
        />
        <TextField
          type="number"
          min={0}
          step={1000}
          label="Giá (VNĐ)"
          required
          value={formData.price}
          onChange={handleFieldChange('price')}
          error={formErrors.price}
          hint={formatVnd(formData.price)}
        />
        <SelectField label="Chu kỳ thanh toán" required value={formData.billingCycle} onChange={handleFieldChange('billingCycle')}>
          {BILLING_CYCLE_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {BILLING_CYCLE_LABELS[c]}
            </option>
          ))}
        </SelectField>
        <TextField
          className="ui-col-2"
          type="number"
          min={0}
          label="Số credit AI / tháng"
          required
          value={formData.aiCreditsPerMonth}
          onChange={handleFieldChange('aiCreditsPerMonth')}
          error={formErrors.aiCreditsPerMonth}
        />
        <TextField
          type="number"
          min={0}
          label="Giới hạn số CV được tạo"
          disabled={formData.maxCvsUnlimited}
          placeholder={formData.maxCvsUnlimited ? 'Không giới hạn' : 'VD: 5'}
          value={formData.maxCvsUnlimited ? '' : formData.maxCvs}
          onChange={handleFieldChange('maxCvs')}
          error={formErrors.maxCvs}
        />
        <CheckboxField
          label="Không giới hạn"
          checked={formData.maxCvsUnlimited}
          onChange={(e) => {
            const { checked } = e.target;
            setFormData((prev) => ({ ...prev, maxCvsUnlimited: checked }));
            if (formErrors.maxCvs) setFormErrors((prev) => ({ ...prev, maxCvs: null }));
          }}
        />
        {[
          ['messagesPerDay', 'Tin nhắn / ngày'],
          ['messagesPerWeek', 'Tin nhắn / tuần'],
          ['messagesPerMonth', 'Tin nhắn / tháng'],
        ].map(([field, label]) => (
          <TextField key={field} type="number" min={0} step={1} label={label}
            placeholder="Không giới hạn" hint="Để trống: không giới hạn. Nhập 0: không cho gửi."
            value={formData[field]} onChange={handleFieldChange(field)} error={formErrors[field]} />
        ))}
        <SelectField
          label="Template Premium"
          value={formData.allowPremiumTemplates ? 'yes' : 'no'}
          onChange={(e) => setFormData((prev) => ({ ...prev, allowPremiumTemplates: e.target.value === 'yes' }))}
        >
          <option value="no">Không cho phép</option>
          <option value="yes">Cho phép</option>
        </SelectField>
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
        open={modalType === 'view' && !!selectedPlan}
        title="Chi tiết Gói"
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedPlan && (
            <ViewFooter
              onDelete={() => setModalType('delete')}
              onEdit={() => handleOpenEdit(selectedPlan)}
              onClose={handleCloseModal}
            />
          )
        }
      >
        {selectedPlan && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h3 className="ui-modal__title">{selectedPlan.name}</h3>
              <span className="ui-hint">
                {formatVnd(selectedPlan.price)} / {BILLING_CYCLE_LABELS[selectedPlan.billingCycle] || selectedPlan.billingCycle}
              </span>
            </div>
            <DetailGrid>
              <DetailItem label="Credit AI/tháng">{Number(selectedPlan.aiCreditsPerMonth || 0).toLocaleString('vi-VN')}</DetailItem>
              <DetailItem label="Giới hạn số CV">{cvLimit(selectedPlan)}</DetailItem>
              <DetailItem label="Tin nhắn/ngày">{selectedPlan.messagesPerDay ?? 'Không giới hạn'}</DetailItem>
              <DetailItem label="Tin nhắn/tuần">{selectedPlan.messagesPerWeek ?? 'Không giới hạn'}</DetailItem>
              <DetailItem label="Tin nhắn/tháng">{selectedPlan.messagesPerMonth ?? 'Không giới hạn'}</DetailItem>
              <DetailItem label="Template Premium">
                {selectedPlan.allowPremiumTemplates ? 'Cho phép' : 'Không cho phép'}
              </DetailItem>
              <DetailItem label="Trạng thái">{selectedPlan.isActive ? 'Hoạt động' : 'Tạm ngưng'}</DetailItem>
              <DetailItem label="Ngày tạo">{formatDate(selectedPlan.createdAt)}</DetailItem>
              <DetailItem label="Cập nhật lần cuối">
                {formatDate(selectedPlan.updatedAt || selectedPlan.createdAt)}
              </DetailItem>
            </DetailGrid>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedPlan}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa Gói?"
        subtitle="Gói không thể xóa nếu vẫn còn tài khoản đang sử dụng."
        message={
          selectedPlan && (
            <>
              Bạn có chắc chắn muốn xóa gói <strong>"{selectedPlan.name}"</strong>?
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

export default PlanManagementPage;
