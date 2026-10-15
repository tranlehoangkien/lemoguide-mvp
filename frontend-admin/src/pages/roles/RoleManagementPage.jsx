import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, AlertTriangle, Lock, Unlock } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { roleService } from '@/services/roleService';
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
  CheckboxField,
  FormModal,
  Modal,
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

const allAvailablePermissions = [
  { id: 'user:view', label: 'Xem danh sách Người dùng', group: 'Người dùng' },
  { id: 'user:create', label: 'Tạo tài khoản Người dùng', group: 'Người dùng' },
  { id: 'user:edit', label: 'Chỉnh sửa / Khóa Người dùng', group: 'Người dùng' },
  { id: 'user:delete', label: 'Xóa Người dùng', group: 'Người dùng' },
  { id: 'cv:view_all', label: 'Xem tất cả CV Profile', group: 'Quản lý CV' },
  { id: 'cv:moderate', label: 'Kiểm duyệt / Ẩn CV vi phạm', group: 'Quản lý CV' },
  { id: 'master:manage', label: 'Quản lý Chuyên ngành, Công nghệ, Kỹ năng', group: 'Master Data' },
  { id: 'report:view', label: 'Xem Báo cáo & Thống kê KPI', group: 'Báo cáo' },
  { id: 'system:admin_manage', label: 'Quản lý Ban quản trị & Phân quyền', group: 'Hệ thống' },
];

const emptyRoleForm = {
  name: '',
  code: '',
  desc: '',
  status: 'active',
  permissions: ['user:view', 'cv:view_all'],
};

const RoleManagementPage = () => {
  const [roles, setRoles] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState(emptyRoleForm);
  const [formErrors, setFormErrors] = useState({});

  const { toast, showToast } = useToast();

  // Tải dữ liệu từ Backend / Role Service
  const loadData = useCallback(async (page, search, status) => {
    setIsLoading(true);
    try {
      const data = await roleService.listRoles({
        page: page - 1,
        size: PAGE_SIZE,
        search,
        status,
      });
      setRoles(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load roles:', err);
      showToast('Không thể tải dữ liệu vai trò', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
    loadData(1, '', 'all');
  };

  useEffect(() => {
    loadData(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter, loadData]);

  // Mở modal Thêm mới (Không lặp dấu cộng)
  const handleOpenCreate = () => {
    setFormData(emptyRoleForm);
    setFormErrors({});
    setSelectedRole(null);
    setModalType('create');
  };

  // Mở modal Chỉnh sửa
  const handleOpenEdit = async (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      desc: role.desc,
      status: role.status,
      permissions: [...(role.permissions || [])],
    });
    setFormErrors({});
    setModalType('edit');

    try {
      const detail = await roleService.getRole(role.id);
      if (detail) {
        setSelectedRole(detail);
        setFormData({
          name: detail.name,
          code: detail.code,
          desc: detail.desc,
          status: detail.status,
          permissions: [...(detail.permissions || [])],
        });
      }
    } catch (err) {
      console.warn('Lỗi tải chi tiết vai trò:', err.message);
    }
  };

  // Mở modal Xem chi tiết
  const handleOpenView = async (role) => {
    setSelectedRole(role);
    setModalType('view');

    try {
      const detail = await roleService.getRole(role.id);
      if (detail) {
        setSelectedRole(detail);
      }
    } catch (err) {
      console.warn('Lỗi tải chi tiết vai trò:', err.message);
    }
  };

  // Mở modal Xóa
  const handleOpenDelete = (role) => {
    if (role.isSystem) {
      showToast('Không thể xóa vai trò hệ thống mặc định', 'error');
      return;
    }
    setSelectedRole(role);
    setModalType('delete');
  };

  // Chuyển trực tiếp từ Modal View sang Edit để bớt thao tác
  const handleSwitchToEdit = () => {
    if (selectedRole) {
      handleOpenEdit(selectedRole);
    }
  };

  // Chuyển trực tiếp từ Modal View sang Delete để bớt thao tác
  const handleSwitchToDelete = () => {
    if (selectedRole) {
      handleOpenDelete(selectedRole);
    }
  };

  // Mở modal xác nhận Kích hoạt / Tạm khóa của vai trò
  const handleOpenToggleStatus = (role) => {
    if (role.isSystem) {
      showToast('Không thể thay đổi trạng thái vai trò hệ thống mặc định', 'error');
      return;
    }
    setSelectedRole(role);
    setModalType('toggle-status');
  };

  // Xác nhận Kích hoạt / Tạm khóa vai trò
  const handleConfirmToggleStatus = async () => {
    if (!selectedRole) return;
    const newStatus = selectedRole.status === 'inactive' ? 'active' : 'inactive';
    try {
      await roleService.updateRole(selectedRole.id, { ...selectedRole, status: newStatus });
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRole.id ? { ...r, status: newStatus } : r))
      );
      showToast(
        newStatus === 'inactive'
          ? `Đã tạm khóa vai trò "${selectedRole.name}"`
          : `Đã kích hoạt vai trò "${selectedRole.name}"`
      );
      setModalType(null);
    } catch {
      showToast('Có lỗi xảy ra khi thay đổi trạng thái', 'error');
    }
  };

  // Toggle quyền hạn trong form
  const handleTogglePermInForm = (permId) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      const updated = current.includes(permId)
        ? current.filter((id) => id !== permId)
        : [...current, permId];
      return { ...prev, permissions: updated };
    });
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      setFormErrors({
        name: formData.name ? null : 'Vui lòng nhập tên vai trò',
        code: formData.code ? null : 'Vui lòng nhập mã vai trò',
      });
      return;
    }

    try {
      if (modalType === 'create') {
        await roleService.createRole(formData);
        showToast(`Đã thêm mới vai trò: ${formData.name}`);
      } else if (modalType === 'edit') {
        await roleService.updateRole(selectedRole.id, formData);
        showToast(`Đã cập nhật vai trò: ${formData.name}`);
      }
      setModalType(null);
      loadData(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi lưu vai trò', 'error');
    }
  };

  // Xác nhận Xóa
  const handleConfirmDelete = async () => {
    if (!selectedRole) return;
    try {
      await roleService.deleteRole(selectedRole.id);
      showToast(`Đã xóa vai trò: ${selectedRole.name}`);
      setModalType(null);
      loadData(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi xóa vai trò', 'error');
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

  const statusBadge = (role) =>
    role.status === 'inactive' ? <Badge tone="warning">Tạm khóa</Badge> : <Badge tone="success">Hoạt động</Badge>;

  const typeBadge = (role) => (role.isSystem ? <Badge tone="info">Hệ thống (Mặc định)</Badge> : <Badge>Tùy chỉnh (Custom)</Badge>);

  const toggleLabel = (role) => {
    if (role.isSystem) return 'Vai trò hệ thống mặc định (Không thể khóa)';
    return role.status === 'inactive' ? 'Kích hoạt vai trò' : 'Tạm khóa vai trò';
  };

  const rowActions = (role) => (
    <RowActions
      onView={() => handleOpenView(role)}
      onEdit={() => handleOpenEdit(role)}
      onDelete={() => handleOpenDelete(role)}
      deleteDisabled={role.isSystem}
      deleteLabel={role.isSystem ? 'Vai trò hệ thống mặc định (Không thể xóa)' : 'Xóa vai trò'}
    >
      <IconButton
        icon={role.status === 'inactive' ? Unlock : Lock}
        tone="accent"
        label={toggleLabel(role)}
        disabled={role.isSystem}
        onClick={() => handleOpenToggleStatus(role)}
      />
    </RowActions>
  );

  const columns = [
    { header: 'Tên vai trò', cell: (r) => <span className="ui-cell-title">{r.name}</span> },
    { header: 'Mã định danh (Code)', label: 'Code', cell: (r) => <code className="ui-code">{r.code}</code> },
    {
      header: 'Mô tả phạm vi',
      label: 'Mô tả',
      cell: (r) => (
        <div className="ui-clamp-2" title={r.desc}>
          {r.desc}
        </div>
      ),
    },
    { header: 'Số admin', cell: (r) => `${r.userCount || 0} admin` },
    { header: 'Quyền được cấp', label: 'Quyền', cell: (r) => <Badge tone="info">{(r.permissions || []).length} quyền</Badge> },
    { header: 'Loại vai trò', label: 'Loại', cell: (r) => typeBadge(r) },
    { header: 'Trạng thái', cell: (r) => statusBadge(r) },
  ];

  const isEditingForm = modalType === 'create' || modalType === 'edit';
  const isInactive = selectedRole?.status === 'inactive';

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Vai trò & Phân quyền (Role)"
          description="Cấu hình phân quyền hệ thống LemoGuide, gán chức năng và kiểm soát thẩm quyền các nhóm admin."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm mới Role
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên vai trò, mã code hoặc mô tả..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo trạng thái" value={statusFilter} onChange={handleStatusChange}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động (Active)</option>
              <option value="inactive">Tạm khóa (Inactive)</option>
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
            {viewMode === 'table' || roles.length === 0 ? (
              <DataTable
                rows={roles}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={Shield}
                emptyTitle="Không tìm thấy vai trò nào phù hợp."
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc tạo mới một vai trò."
              />
            ) : (
              <div className="ui-grid">
                {roles.map((role, idx) => (
                  <article key={role.id} className={`ui-item-card${role.status === 'inactive' ? ' ui-item-card--muted' : ''}`}>
                    <div>
                      <div className="ui-item-card__row">
                        <span className="ui-hint">#{(currentPage - 1) * PAGE_SIZE + idx + 1}</span>
                        <div className="ui-chip-row">
                          {typeBadge(role)}
                          {statusBadge(role)}
                        </div>
                      </div>
                      <h3 className="ui-item-card__title ui-inline">
                        <Shield size={18} aria-hidden="true" />
                        <span title={role.name}>{role.name}</span>
                      </h3>
                      <div style={{ margin: '6px 0 10px' }}>
                        <code className="ui-code">{role.code}</code>
                      </div>
                      <p className="ui-clamp-2 ui-hint" style={{ margin: 0 }} title={role.desc}>
                        {role.desc || 'Không có mô tả chi tiết'}
                      </p>
                    </div>
                    <div className="ui-item-card__foot" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Admin đảm nhiệm</span>
                        <strong style={{ color: 'var(--ui-text)' }}>{role.userCount || 0} admin</strong>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Quyền được cấp</span>
                        <Badge tone="info">{(role.permissions || []).length} quyền</Badge>
                      </span>
                    </div>
                    <div className="ui-item-card__actions">{rowActions(role)}</div>
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
            entityName="vai trò"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={isEditingForm}
        size="lg"
        columns={2}
        title={modalType === 'create' ? 'Tạo vai trò (Role) mới' : 'Chỉnh sửa vai trò & phân quyền'}
        onClose={() => setModalType(null)}
        onSubmit={handleSubmitForm}
        submitLabel={modalType === 'create' ? 'Tạo vai trò' : 'Lưu thay đổi'}
      >
        <TextField
          label="Tên vai trò"
          required
          placeholder="VD: Content Auditor"
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={formErrors.name}
        />
        <TextField
          label="Mã định danh (Code)"
          required
          placeholder="ROLE_AUDITOR"
          value={formData.code}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            setFormData((prev) => ({ ...prev, code: value }));
            if (formErrors.code) setFormErrors((prev) => ({ ...prev, code: null }));
          }}
          error={formErrors.code}
        />
        <TextField
          className="ui-col-2"
          label="Mô tả phạm vi trách nhiệm"
          placeholder="Mô tả thẩm quyền của vai trò này..."
          value={formData.desc}
          onChange={handleFieldChange('desc')}
        />
        <Field
          className="ui-col-2"
          label={`Thiết lập quyền hạn (${(formData.permissions || []).length} quyền đã chọn)`}
        >
          {() => (
            <div className="ui-check-list">
              {allAvailablePermissions.map((perm) => (
                <CheckboxField
                  key={perm.id}
                  label={
                    <>
                      {perm.label} <span className="ui-check__group">({perm.group})</span>
                    </>
                  }
                  checked={(formData.permissions || []).includes(perm.id)}
                  onChange={() => handleTogglePermInForm(perm.id)}
                />
              ))}
            </div>
          )}
        </Field>
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedRole}
        size="lg"
        title={selectedRole ? `Chi tiết vai trò ${selectedRole.name}` : 'Chi tiết vai trò'}
        onClose={() => setModalType(null)}
        footerSplit
        footer={
          selectedRole && (
            <ViewFooter
              deleteLabel="Xóa vai trò"
              onDelete={selectedRole.isSystem ? undefined : handleSwitchToDelete}
              onEdit={handleSwitchToEdit}
              onClose={() => setModalType(null)}
            />
          )
        }
      >
        {selectedRole && (
          <>
            <div style={{ marginBottom: 12 }}>
              <h3 className="ui-modal__title">{selectedRole.name}</h3>
              <code className="ui-code">{selectedRole.code}</code>
            </div>
            <p className="ui-hint" style={{ margin: '0 0 16px' }}>
              {selectedRole.desc}
            </p>
            <div className="ui-detail-section" style={{ marginTop: 0 }}>
              <h4>Danh sách quyền được cấp ({(selectedRole.permissions || []).length} quyền)</h4>
              <div className="ui-chip-row">
                {(selectedRole.permissions || []).map((pId) => (
                  <Badge key={pId} tone="success">
                    ✓ {pId}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedRole}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa vai trò?"
        subtitle="Vai trò này sẽ bị loại khỏi hệ thống."
        message={
          selectedRole && (
            <>
              Bạn có chắc chắn muốn xóa vai trò <strong>"{selectedRole.name}"</strong> ({selectedRole.code}) không?
            </>
          )
        }
        confirmLabel="Xác nhận xóa"
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalType(null)}
      />

      <ConfirmActionModal
        isOpen={modalType === 'toggle-status' && !!selectedRole}
        tone={isInactive ? 'success' : 'warning'}
        icon={isInactive ? Unlock : Lock}
        title={isInactive ? 'Xác nhận kích hoạt vai trò?' : 'Xác nhận tạm khóa vai trò?'}
        subtitle={
          isInactive
            ? 'Vai trò sẽ được gán lại cho các tài khoản liên quan.'
            : 'Vai trò sẽ tạm ngừng áp dụng quyền hạn cho các tài khoản liên quan.'
        }
        message={
          selectedRole && (
            <>
              Bạn có chắc chắn muốn {isInactive ? 'kích hoạt' : 'tạm khóa'} vai trò <strong>"{selectedRole.name}"</strong> (
              {selectedRole.code}) không?
            </>
          )
        }
        confirmLabel={isInactive ? 'Xác nhận kích hoạt' : 'Xác nhận khóa'}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setModalType(null)}
      />
    </AdminLayout>
  );
};

export default RoleManagementPage;
