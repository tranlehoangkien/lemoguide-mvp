import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Lock, Unlock, AlertTriangle, Camera } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminService } from '@/services/adminService';
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
  Avatar,
  Button,
  IconButton,
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

const availableRoles = [
  'Super Admin',
  'CV Moderator',
  'Master Data Manager',
  'Support Admin',
];

const emptyAdminForm = {
  fullName: '',
  email: '',
  role: 'CV Moderator',
  department: 'Kiểm duyệt CV',
  status: 'active',
  twoFactorEnabled: true,
  avatarUrl: null,
  avatarFile: null,
  avatarPreview: null,
};

const AdminManagementPage = () => {
  const [admins, setAdmins] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState(emptyAdminForm);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { toast, showToast } = useToast();

  // Load data từ API backend (kèm phân trang và filter)
  const loadData = async (page = currentPage, search = searchTerm, status = statusFilter) => {
    try {
      setIsLoading(true);
      const res = await adminService.listAdmins({
        page: page - 1,
        size: PAGE_SIZE,
        search,
        status,
      });
      setAdmins(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      console.error('Error loading admins:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
    loadData(1, '', 'all');
  };

  useEffect(() => {
    loadData(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter]);

  // Avatar Upload Handlers
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 5MB!', 'error');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreview: previewUrl,
    }));
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatarFile: null,
      avatarPreview: null,
      avatarUrl: null,
    }));
  };

  // Mở modal Thêm mới (Không lặp dấu cộng)
  const handleOpenCreate = () => {
    setFormData({
      ...emptyAdminForm,
      avatarUrl: null,
      avatarFile: null,
      avatarPreview: null,
    });
    setSelectedAdmin(null);
    setFormErrors({});
    setModalType('create');
  };

  // Mở modal Chỉnh sửa
  const handleOpenEdit = async (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      fullName: admin.fullName || '',
      email: admin.email || '',
      role: admin.role || 'ADMIN',
      department: admin.department || '',
      status: admin.status || 'active',
      twoFactorEnabled: admin.twoFactorEnabled ?? true,
      avatarUrl: admin.avatarUrl || null,
      avatarFile: null,
      avatarPreview: null,
    });
    setFormErrors({});
    setModalType('edit');

    // Tải profile chi tiết từ API backend
    try {
      const detail = await adminService.getAdmin(admin.id);
      if (detail) {
        setSelectedAdmin(detail);
        setFormData({
          fullName: detail.fullName || '',
          email: detail.email || '',
          role: detail.role || 'ADMIN',
          department: detail.department || '',
          status: detail.status || 'active',
          twoFactorEnabled: detail.twoFactorEnabled ?? true,
          avatarUrl: detail.avatarUrl || null,
          avatarFile: null,
          avatarPreview: null,
        });
      }
    } catch (err) {
      console.warn('Không tải được profile chi tiết của admin:', err.message);
    }
  };

  // Mở modal Xem chi tiết
  const handleOpenView = async (admin) => {
    setSelectedAdmin(admin);
    setModalType('view');

    // Tải profile chi tiết từ API backend
    try {
      const detail = await adminService.getAdmin(admin.id);
      if (detail) {
        setSelectedAdmin(detail);
      }
    } catch (err) {
      console.warn('Không tải được profile chi tiết của admin:', err.message);
    }
  };

  // Mở modal Xóa
  const handleOpenDelete = (admin) => {
    if (admin.isRoot) {
      showToast('Không thể xóa tài khoản Super Admin gốc!', 'error');
      return;
    }
    setSelectedAdmin(admin);
    setModalType('delete');
  };

  // Chuyển từ Modal View sang Edit
  const handleSwitchToEdit = () => {
    if (selectedAdmin) {
      handleOpenEdit(selectedAdmin);
    }
  };

  // Chuyển từ Modal View sang Delete
  const handleSwitchToDelete = () => {
    if (selectedAdmin) {
      handleOpenDelete(selectedAdmin);
    }
  };

  // Mở modal xác nhận Khóa / Kích hoạt
  const handleOpenToggleStatus = (admin) => {
    if (admin.isRoot) {
      showToast('Không thể khóa tài khoản Super Admin gốc', 'error');
      return;
    }
    setSelectedAdmin(admin);
    setModalType('toggle-status');
  };

  // Xác nhận Khóa / Kích hoạt
  const handleConfirmToggleStatus = async () => {
    if (!selectedAdmin) return;
    const newStatus = selectedAdmin.status === 'inactive' ? 'active' : 'inactive';
    try {
      await adminService.updateAdmin(selectedAdmin.id, { ...selectedAdmin, status: newStatus });
      setAdmins((prev) =>
        prev.map((a) => (a.id === selectedAdmin.id ? { ...a, status: newStatus } : a))
      );
      showToast(
        newStatus === 'inactive'
          ? `Đã tạm đình chỉ quyền của "${selectedAdmin.fullName}"`
          : `Đã kích hoạt lại quyền cho "${selectedAdmin.fullName}"`
      );
      setModalType(null);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật trạng thái', 'error');
    }
  };

  // Submit Form Create / Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      setFormErrors({
        fullName: formData.fullName ? null : 'Vui lòng nhập họ và tên',
        email: formData.email ? null : 'Vui lòng nhập email',
      });
      return;
    }

    try {
      if (modalType === 'create') {
        await adminService.createAdmin(formData);
        showToast(`Đã thêm mới quản trị viên: ${formData.fullName}`);
        setModalType(null);
        loadData(1, searchTerm, statusFilter);
        setCurrentPage(1);
      } else if (modalType === 'edit') {
        await adminService.updateAdmin(selectedAdmin.id, formData);
        showToast(`Đã cập nhật quản trị viên: ${formData.fullName}`);
        setModalType(null);
        loadData(currentPage, searchTerm, statusFilter);
      }
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi lưu quản trị viên', 'error');
    }
  };

  // Xác nhận Xóa
  const handleConfirmDelete = async () => {
    try {
      await adminService.deleteAdmin(selectedAdmin.id);
      showToast(`Đã xóa quản trị viên: ${selectedAdmin.fullName}`);
      setModalType(null);
      loadData(currentPage, searchTerm, statusFilter);
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi xóa quản trị viên', 'error');
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
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

  const roleTone = (role) => {
    if (role === 'Super Admin') return 'success';
    if (role === 'CV Moderator') return 'info';
    if (role === 'Master Data Manager') return 'warning';
    return 'neutral';
  };

  const statusBadge = (admin) =>
    admin.status === 'inactive' ? <Badge tone="warning">Tạm khóa</Badge> : <Badge tone="success">Hoạt động</Badge>;

  const twoFactorBadge = (admin) =>
    admin.twoFactorEnabled ? <Badge tone="success">Đã bật</Badge> : <Badge>Chưa bật</Badge>;

  const toggleLabel = (admin) => {
    if (admin.isRoot) return 'Root Admin (Không thể khóa)';
    return admin.status === 'inactive' ? 'Kích hoạt tài khoản' : 'Tạm khóa tài khoản';
  };

  const rowActions = (admin) => (
    <RowActions
      onView={() => handleOpenView(admin)}
      onEdit={() => handleOpenEdit(admin)}
      onDelete={() => handleOpenDelete(admin)}
      deleteDisabled={admin.isRoot}
      deleteLabel={admin.isRoot ? 'Root Admin (Không thể xóa)' : 'Xóa quản trị viên'}
    >
      <IconButton
        icon={admin.status === 'inactive' ? Unlock : Lock}
        tone="accent"
        label={toggleLabel(admin)}
        disabled={admin.isRoot}
        onClick={() => handleOpenToggleStatus(admin)}
      />
    </RowActions>
  );

  const columns = [
    {
      header: 'Quản trị viên',
      cell: (a) => (
        <div className="ui-person">
          <Avatar src={a.avatarUrl ? getFullAvatarUrl(a.avatarUrl) : null} name={a.fullName} size={40} />
          <div style={{ minWidth: 0 }}>
            <div className="ui-cell-title">{a.fullName}</div>
            <div className="ui-person__sub">{a.email}</div>
          </div>
        </div>
      ),
    },
    { header: 'Bộ phận', cell: (a) => a.department },
    { header: 'Bảo mật 2FA', label: '2FA', cell: (a) => twoFactorBadge(a) },
    { header: 'Trạng thái', cell: (a) => statusBadge(a) },
    { header: 'Ngày tạo', muted: true, cell: (a) => a.createdAt },
  ];

  const hasAvatar = Boolean(formData.avatarPreview || formData.avatarUrl);
  const isInactive = selectedAdmin?.status === 'inactive';

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Quản trị viên (Admin)"
          description="Quản lý danh sách ban quản trị, vai trò vận hành và an toàn bảo mật."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm mới Admin
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên quản trị viên, email hoặc bộ phận..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo trạng thái" value={statusFilter} onChange={handleStatusChange}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm khóa</option>
            </FilterSelect>
            <ResetRefreshButtons
              onReset={handleResetFilters}
              onRefresh={() => loadData(currentPage, searchTerm, statusFilter)}
              loading={isLoading}
            />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {viewMode === 'table' || admins.length === 0 ? (
              <DataTable
                rows={admins}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={ShieldCheck}
                emptyTitle="Không có quản trị viên nào phù hợp."
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc thêm mới một quản trị viên."
              />
            ) : (
              <div className="ui-grid">
                {admins.map((admin, idx) => (
                  <article
                    key={admin.id}
                    className={`ui-item-card${admin.status === 'inactive' ? ' ui-item-card--muted' : ''}`}
                  >
                    <div>
                      <div className="ui-item-card__row">
                        <span className="ui-hint">#{(currentPage - 1) * PAGE_SIZE + idx + 1}</span>
                        {statusBadge(admin)}
                      </div>
                      <div className="ui-person">
                        <Avatar src={admin.avatarUrl ? getFullAvatarUrl(admin.avatarUrl) : null} name={admin.fullName} size={48} />
                        <div style={{ minWidth: 0 }}>
                          <div className="ui-cell-title" title={admin.fullName}>
                            {admin.fullName}
                          </div>
                          <div className="ui-person__sub" title={admin.email}>
                            {admin.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <Badge tone={roleTone(admin.role)}>{admin.role}</Badge>
                      </div>
                    </div>
                    <div className="ui-item-card__foot" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Bộ phận</span>
                        <strong style={{ color: 'var(--ui-text)' }}>{admin.department || 'Ban Quản Trị'}</strong>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Bảo mật 2FA</span>
                        {twoFactorBadge(admin)}
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Ngày tạo</span>
                        <span>{admin.createdAt}</span>
                      </span>
                    </div>
                    <div className="ui-item-card__actions">{rowActions(admin)}</div>
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
            entityName="quản trị viên"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Quản trị viên' : 'Chỉnh sửa Quản trị viên'}
        onClose={() => setModalType(null)}
        onSubmit={handleSubmitForm}
        submitLabel={modalType === 'create' ? 'Tạo Admin' : 'Lưu thay đổi'}
      >
        <div className="ui-col-2 ui-person" style={{ alignItems: 'center' }}>
          <Avatar
            size={64}
            name={formData.fullName}
            src={formData.avatarPreview || (formData.avatarUrl ? getFullAvatarUrl(formData.avatarUrl) : null)}
          />
          <div>
            <div className="ui-inline" style={{ flexWrap: 'wrap' }}>
              <label className="ui-btn ui-btn--secondary ui-btn--sm" style={{ cursor: 'pointer' }}>
                <Camera size={14} aria-hidden="true" />
                <span>{hasAvatar ? 'Đổi ảnh đại diện' : 'Tải ảnh đại diện'}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="ui-sr-only"
                  onChange={handleAvatarFileChange}
                />
              </label>
              {hasAvatar && (
                <Button variant="ghost" size="sm" onClick={handleRemoveAvatar}>
                  Gỡ ảnh
                </Button>
              )}
            </div>
            <span className="ui-hint">Định dạng PNG, JPG hoặc WEBP. Tối đa 5MB.</span>
          </div>
        </div>

        <TextField
          className="ui-col-2"
          label="Họ và tên"
          required
          placeholder="VD: Lê Hoàng Anh"
          value={formData.fullName}
          onChange={handleFieldChange('fullName')}
          error={formErrors.fullName}
        />
        <TextField
          className="ui-col-2"
          type="email"
          label="Email công vụ (@lemoguide.com)"
          required
          placeholder="admin@lemoguide.com"
          value={formData.email}
          onChange={handleFieldChange('email')}
          error={formErrors.email}
        />
        <SelectField label="Vai trò (Role)" value={formData.role} onChange={handleFieldChange('role')}>
          {availableRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Bộ phận chuyên trách"
          placeholder="VD: Kiểm duyệt CV"
          value={formData.department}
          onChange={handleFieldChange('department')}
        />
        <SelectField label="Trạng thái tài khoản" value={formData.status} onChange={handleFieldChange('status')}>
          <option value="active">Hoạt động (Active)</option>
          <option value="inactive">Tạm khóa (Inactive)</option>
        </SelectField>
        <SelectField
          label="Bảo mật 2FA"
          value={formData.twoFactorEnabled ? 'true' : 'false'}
          onChange={(e) => setFormData((prev) => ({ ...prev, twoFactorEnabled: e.target.value === 'true' }))}
        >
          <option value="true">Bật xác thực 2FA</option>
          <option value="false">Tắt 2FA</option>
        </SelectField>
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedAdmin}
        title="Thông tin Quản trị viên"
        onClose={() => setModalType(null)}
        footerSplit
        footer={
          selectedAdmin && (
            <ViewFooter
              onDelete={selectedAdmin.isRoot ? undefined : handleSwitchToDelete}
              onEdit={handleSwitchToEdit}
              onClose={() => setModalType(null)}
            />
          )
        }
      >
        {selectedAdmin && (
          <>
            <div className="ui-person" style={{ marginBottom: 16 }}>
              <Avatar
                src={selectedAdmin.avatarUrl ? getFullAvatarUrl(selectedAdmin.avatarUrl) : null}
                name={selectedAdmin.fullName}
                size={64}
              />
              <div>
                <h3 className="ui-modal__title">{selectedAdmin.fullName}</h3>
                <Badge tone={roleTone(selectedAdmin.role)}>Vai trò: {selectedAdmin.role}</Badge>
              </div>
            </div>
            <DetailGrid>
              <DetailItem label="Email">{selectedAdmin.email}</DetailItem>
              <DetailItem label="Bộ phận">{selectedAdmin.department}</DetailItem>
              <DetailItem label="Trạng thái">
                {selectedAdmin.status === 'active' ? 'Đang hoạt động' : 'Tạm đình chỉ'}
              </DetailItem>
              <DetailItem label="Xác thực 2FA">{selectedAdmin.twoFactorEnabled ? 'Đã bật' : 'Chưa kích hoạt'}</DetailItem>
            </DetailGrid>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedAdmin}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa Quản trị viên?"
        subtitle="Tài khoản sẽ bị thu hồi toàn bộ quyền quản trị."
        message={
          selectedAdmin && (
            <>
              Bạn có chắc chắn muốn xóa quyền quản trị của <strong>"{selectedAdmin.fullName}"</strong> ({selectedAdmin.email})?
            </>
          )
        }
        confirmLabel="Xác nhận xóa"
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalType(null)}
      />

      <ConfirmActionModal
        isOpen={modalType === 'toggle-status' && !!selectedAdmin}
        tone={isInactive ? 'success' : 'warning'}
        icon={isInactive ? Unlock : Lock}
        title={isInactive ? 'Xác nhận kích hoạt lại quyền?' : 'Xác nhận tạm đình chỉ quyền?'}
        subtitle={
          isInactive
            ? 'Quản trị viên sẽ có thể đăng nhập và thao tác trở lại.'
            : 'Quản trị viên sẽ không thể đăng nhập vào hệ thống.'
        }
        message={
          selectedAdmin && (
            <>
              Bạn có chắc chắn muốn {isInactive ? 'kích hoạt lại quyền' : 'tạm đình chỉ quyền'} của{' '}
              <strong>"{selectedAdmin.fullName}"</strong> ({selectedAdmin.email})?
            </>
          )
        }
        confirmLabel={isInactive ? 'Xác nhận kích hoạt' : 'Xác nhận đình chỉ'}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setModalType(null)}
      />
    </AdminLayout>
  );
};

export default AdminManagementPage;
