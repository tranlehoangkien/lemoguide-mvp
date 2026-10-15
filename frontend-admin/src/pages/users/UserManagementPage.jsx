import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  Users,
  Plus,
  Trash2,
  Lock,
  Unlock,
  MapPin,
  Phone,
  FileText,
  AlertTriangle,
  Mail,
  Globe,
  Link2,
  Star,
  Camera,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { userService } from '@/services/userService';
import { CONTACT_TYPES } from '@/services/contactService';
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
  TextareaField,
  SelectField,
  FormSection,
  FormModal,
  Toast,
  useToast,
  DataTable,
  RowActions,
  ResetRefreshButtons,
  FilterSelect,
  TABLE_GRID_OPTIONS,
} from '@/components/ui';

const LinkedinIcon = ({ size = 14, color = '#0a66c2' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GithubIcon = ({ size = 14, color = '#475569' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const PAGE_SIZE = 10;

const getContactIcon = (type, size = 14) => {
  switch ((type || '').toUpperCase()) {
    case 'PHONE':
      return <Phone size={size} color="#15803d" />;
    case 'EMAIL':
      return <Mail size={size} color="#0284c7" />;
    case 'LINKEDIN':
      return <LinkedinIcon size={size} color="#0a66c2" />;
    case 'GITHUB':
      return <GithubIcon size={size} color="#475569" />;
    case 'WEBSITE':
      return <Globe size={size} color="#8b5cf6" />;
    default:
      return <Link2 size={size} color="#64748b" />;
  }
};

const emptyUserForm = {
  fullName: '',
  email: '',
  password: '',
  avatarUrl: null,
  avatarFile: null,
  avatarPreview: null,
  contacts: [
    { type: 'PHONE', value: '', primary: true },
  ],
  currentTitle: '',
  dateOfBirth: '',
  gender: 'MALE',
  city: 'Hà Nội',
  district: '',
  status: 'active',
  shortTermGoal: '',
  longTermGoal: '',
};

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table');

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(emptyUserForm);
  const [formErrors, setFormErrors] = useState({});

  const { toast, showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // Load data từ API backend (kèm phân trang và filter)
  const loadData = async (page = currentPage, search = searchTerm, status = statusFilter) => {
    try {
      setIsLoading(true);
      const res = await userService.listUsers({
        page: page - 1,
        size: PAGE_SIZE,
        search,
        status,
      });
      setUsers(res.content || []);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      console.error('Error loading users:', e);
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

  // Handlers cho danh sách liên hệ (dùng chung cho cả Thêm mới và Chỉnh sửa)
  const handleAddContactRow = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...(prev.contacts || []),
        { type: 'PHONE', value: '', primary: (prev.contacts || []).length === 0 },
      ],
    }));
  };

  const handleRemoveContactRow = (idx) => {
    setFormData((prev) => {
      const list = [...(prev.contacts || [])];
      list.splice(idx, 1);
      if (list.length > 0 && !list.some((c) => c.primary)) {
        list[0].primary = true;
      }
      return { ...prev, contacts: list };
    });
  };

  const handleContactRowChange = (idx, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.contacts || [])];
      if (field === 'primary') {
        list.forEach((c, i) => {
          c.primary = i === idx;
        });
      } else {
        list[idx] = { ...list[idx], [field]: value };
      }
      return { ...prev, contacts: list };
    });
  };

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

  // Mở modal Thêm mới
  const handleOpenCreate = () => {
    setFormData({
      ...emptyUserForm,
      contacts: [{ type: 'PHONE', value: '', primary: true }],
      avatarUrl: null,
      avatarFile: null,
      avatarPreview: null,
    });
    setSelectedUser(null);
    setFormErrors({});
    setModalType('create');
  };

  // Mở modal Chỉnh sửa
  const handleOpenEdit = async (user) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      currentTitle: user.currentTitle || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || 'MALE',
      city: user.city || '',
      district: user.district || '',
      status: user.status || 'active',
      shortTermGoal: user.shortTermGoal || '',
      longTermGoal: user.longTermGoal || '',
      avatarUrl: user.avatarUrl || null,
      avatarFile: null,
      avatarPreview: null,
      contacts: [],
    });
    setFormErrors({});
    setModalType('edit');

    // Tải profile chi tiết từ API backend để có dữ liệu mới nhất (gồm cả contacts & avatar)
    try {
      const detail = await userService.getUser(user.id);
      if (detail) {
        setSelectedUser(detail);
        setFormData({
          fullName: detail.fullName || '',
          email: detail.email || '',
          currentTitle: detail.currentTitle || '',
          dateOfBirth: detail.dateOfBirth || '',
          gender: detail.gender || 'MALE',
          city: detail.city || '',
          district: detail.district || '',
          status: detail.status || 'active',
          shortTermGoal: detail.shortTermGoal || '',
          longTermGoal: detail.longTermGoal || '',
          avatarUrl: detail.avatarUrl || null,
          avatarFile: null,
          avatarPreview: null,
          contacts: Array.isArray(detail.contacts) && detail.contacts.length > 0
            ? detail.contacts.map((c) => ({ ...c }))
            : [],
        });
      }
    } catch (err) {
      console.warn('Không tải được profile chi tiết của user:', err.message);
    }
  };

  // Chuyển hướng sang trang Xem chi tiết Người dùng
  const handleOpenView = (user) => {
    navigate(ROUTES.USER_DETAIL.replace(':id', user.id));
  };

  // Mở modal Xóa
  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setModalType('delete');
  };

  // Mở modal Khóa / Mở khóa
  const handleOpenToggleStatus = (user) => {
    setSelectedUser(user);
    setModalType('toggle-status');
  };

  // Xác nhận Khóa / Mở khóa
  const handleConfirmToggleStatus = async () => {
    if (!selectedUser) return;
    const newStatus = selectedUser.status === 'banned' ? 'active' : 'banned';
    try {
      await userService.updateUser(selectedUser.id, { ...selectedUser, status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: newStatus } : u))
      );
      showToast(
        newStatus === 'banned'
          ? `Đã khóa tài khoản "${selectedUser.fullName}"`
          : `Đã mở khóa tài khoản "${selectedUser.fullName}"`
      );
      setModalType(null);
    } catch (err) {
      showToast(err.message || 'Không thể thay đổi trạng thái', 'error');
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
        await userService.createUser(formData);
        showToast(`Đã thêm mới người dùng: ${formData.fullName}`);
        setModalType(null);
        loadData(1, searchTerm, statusFilter);
        setCurrentPage(1);
      } else if (modalType === 'edit') {
        await userService.updateUser(selectedUser.id, formData);
        showToast(`Đã cập nhật người dùng: ${formData.fullName}`);
        setModalType(null);
        loadData(currentPage, searchTerm, statusFilter);
      }
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi lưu người dùng', 'error');
    }
  };

  // Xác nhận Xóa
  const handleConfirmDelete = async () => {
    try {
      await userService.deleteUser(selectedUser.id);
      showToast(`Đã xóa người dùng: ${selectedUser.fullName}`);
      setModalType(null);
      loadData(currentPage, searchTerm, statusFilter);
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi xóa người dùng', 'error');
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

  const statusBadge = (u) => {
    if (u.status === 'banned') return <Badge tone="danger">Bị cấm</Badge>;
    if (u.status === 'inactive') return <Badge tone="warning">Tạm khóa</Badge>;
    return <Badge tone="success">Hoạt động</Badge>;
  };

  const contactCell = (u, size = 14) =>
    u.primaryContact ? (
      <span className="ui-inline" title={u.contactCount > 1 ? `Người dùng có tổng cộng ${u.contactCount} kênh liên hệ` : undefined}>
        {getContactIcon(u.primaryContactType, size)}
        <span>{u.primaryContact}</span>
        {u.contactCount > 1 && <Badge tone="info">+{u.contactCount - 1}</Badge>}
      </span>
    ) : (
      <span className="ui-placeholder-text">Chưa có</span>
    );

  const rowActions = (u) => (
    <RowActions
      entity="người dùng"
      onView={() => handleOpenView(u)}
      onEdit={() => handleOpenEdit(u)}
      onDelete={() => handleOpenDelete(u)}
    >
      <IconButton
        icon={u.status === 'banned' ? Unlock : Lock}
        tone="accent"
        label={u.status === 'banned' ? 'Mở khóa' : 'Khóa'}
        onClick={() => handleOpenToggleStatus(u)}
      />
    </RowActions>
  );

  const columns = [
    {
      header: 'Người dùng',
      cell: (u) => (
        <div className="ui-person">
          <Avatar src={u.avatarUrl ? getFullAvatarUrl(u.avatarUrl) : null} name={u.fullName} size={40} />
          <div style={{ minWidth: 0 }}>
            <div className="ui-cell-title">{u.fullName}</div>
            <div className="ui-person__sub">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Chức danh & Khu vực',
      label: 'Chức danh',
      cell: (u) => (
        <>
          <div className="ui-cell-title">{u.currentTitle}</div>
          {u.city && (
            <div className="ui-inline ui-hint">
              <MapPin size={12} aria-hidden="true" />
              {u.city}
            </div>
          )}
        </>
      ),
    },
    { header: 'Liên hệ chính', label: 'Liên hệ', cell: (u) => contactCell(u) },
    {
      header: 'CV Profile',
      label: 'CV',
      cell: (u) => (
        <Badge tone="info">
          <FileText size={12} aria-hidden="true" />
          {u.cvCount} CV
        </Badge>
      ),
    },
    { header: 'Trạng thái', cell: (u) => statusBadge(u) },
    { header: 'Ngày tạo', muted: true, cell: (u) => u.createdAt },
  ];

  const hasAvatar = Boolean(formData.avatarPreview || formData.avatarUrl);
  const isBanned = selectedUser?.status === 'banned';

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Người dùng (User)"
          description="Quản lý danh sách tài khoản, hồ sơ ứng viên và trạng thái đăng nhập hệ thống."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm mới User
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo trạng thái" value={statusFilter} onChange={handleStatusChange}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động (Active)</option>
              <option value="inactive">Tạm khóa (Inactive)</option>
              <option value="banned">Bị cấm (Banned)</option>
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
            {viewMode === 'table' || users.length === 0 ? (
              <DataTable
                rows={users}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={Users}
                emptyTitle="Không có bản ghi người dùng nào phù hợp."
                emptyHint="Thử đổi từ khóa, bộ lọc hoặc thêm mới một người dùng."
              />
            ) : (
              <div className="ui-grid">
                {users.map((u, idx) => (
                  <article key={u.id} className="ui-item-card">
                    <div>
                      <div className="ui-item-card__row">
                        <span className="ui-hint">#{(currentPage - 1) * PAGE_SIZE + idx + 1}</span>
                        {statusBadge(u)}
                      </div>
                      <div className="ui-person">
                        <Avatar src={u.avatarUrl ? getFullAvatarUrl(u.avatarUrl) : null} name={u.fullName} size={48} />
                        <div style={{ minWidth: 0 }}>
                          <div className="ui-cell-title" title={u.fullName}>
                            {u.fullName}
                          </div>
                          <div className="ui-person__sub" title={u.email}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ui-item-card__foot" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Chức danh</span>
                        <strong style={{ color: 'var(--ui-text)' }}>
                          {u.currentTitle || 'Lập trình viên'}
                          {u.city ? ` (${u.city})` : ''}
                        </strong>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Liên hệ</span>
                        {contactCell(u, 13)}
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Hồ sơ CV</span>
                        <Badge tone="info">{u.cvCount} CV</Badge>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Ngày tạo</span>
                        <span>{u.createdAt}</span>
                      </span>
                    </div>
                    <div className="ui-item-card__actions">{rowActions(u)}</div>
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
            entityName="người dùng"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={modalType === 'create' || modalType === 'edit'}
        size="lg"
        columns={2}
        title={modalType === 'create' ? 'Thêm mới Người dùng' : 'Chỉnh sửa Người dùng'}
        onClose={() => setModalType(null)}
        onSubmit={handleSubmitForm}
        submitLabel={modalType === 'create' ? 'Tạo người dùng' : 'Lưu thay đổi'}
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
          label="Họ và tên"
          required
          placeholder="VD: Nguyễn Văn An"
          value={formData.fullName}
          onChange={handleFieldChange('fullName')}
          error={formErrors.fullName}
        />
        <TextField
          type="email"
          label="Email tài khoản"
          required
          placeholder="user@example.com"
          value={formData.email}
          onChange={handleFieldChange('email')}
          error={formErrors.email}
        />
        <TextField
          label="Chức danh chuyên môn"
          placeholder="VD: Fullstack Developer"
          value={formData.currentTitle}
          onChange={handleFieldChange('currentTitle')}
        />
        <SelectField label="Trạng thái tài khoản" value={formData.status} onChange={handleFieldChange('status')}>
          <option value="active">Hoạt động (Active)</option>
          <option value="inactive">Tạm khóa (Inactive)</option>
          <option value="banned">Bị cấm (Banned)</option>
        </SelectField>
        <TextField type="date" label="Ngày sinh" value={formData.dateOfBirth} onChange={handleFieldChange('dateOfBirth')} />
        <SelectField label="Giới tính" value={formData.gender} onChange={handleFieldChange('gender')}>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
          <option value="OTHER">Khác</option>
        </SelectField>
        <SelectField label="Tỉnh / Thành phố" value={formData.city} onChange={handleFieldChange('city')}>
          <option value="Hà Nội">Hà Nội</option>
          <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
          <option value="Đà Nẵng">Đà Nẵng</option>
          <option value="Cần Thơ">Cần Thơ</option>
          <option value="Khác">Khác</option>
        </SelectField>
        <TextField
          label="Quận / Huyện"
          placeholder="VD: Quận Cầu Giấy"
          value={formData.district}
          onChange={handleFieldChange('district')}
        />

        <FormSection title={`Kênh liên hệ (${(formData.contacts || []).length})`} columns={1}>
          <p className="ui-hint" style={{ margin: 0 }}>
            Thêm số điện thoại, email liên hệ, LinkedIn, GitHub hoặc website cá nhân.
          </p>
          {(!formData.contacts || formData.contacts.length === 0) && (
            <p className="ui-placeholder-text" style={{ margin: 0 }}>
              Chưa thêm kênh liên hệ nào. Bấm "Thêm kênh" để bổ sung số điện thoại hoặc email.
            </p>
          )}
          {(formData.contacts || []).map((contact, idx) => (
            <div key={contact.id || idx} className="ui-contact-row">
              <select
                className="ui-select"
                aria-label="Loại kênh liên hệ"
                value={contact.type}
                onChange={(e) => handleContactRowChange(idx, 'type', e.target.value)}
              >
                {CONTACT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                className="ui-input"
                type="text"
                aria-label="Giá trị kênh liên hệ"
                placeholder={
                  contact.type === 'PHONE'
                    ? '0912 345 678'
                    : contact.type === 'EMAIL'
                    ? 'contact@example.com'
                    : contact.type === 'LINKEDIN'
                    ? 'linkedin.com/in/username'
                    : 'Giá trị kênh liên hệ'
                }
                value={contact.value}
                onChange={(e) => handleContactRowChange(idx, 'value', e.target.value)}
              />
              <Button
                variant={contact.primary ? 'primary' : 'secondary'}
                size="sm"
                icon={Star}
                title={contact.primary ? 'Kênh chính' : 'Đặt làm kênh chính'}
                onClick={() => handleContactRowChange(idx, 'primary', true)}
              >
                {contact.primary ? 'Chính' : 'Phụ'}
              </Button>
              <IconButton icon={Trash2} tone="danger" label="Xóa dòng" size={14} onClick={() => handleRemoveContactRow(idx)} />
            </div>
          ))}
          <div>
            <Button variant="secondary" size="sm" icon={Plus} onClick={handleAddContactRow}>
              Thêm kênh
            </Button>
          </div>
        </FormSection>

        <TextareaField
          className="ui-col-2"
          rows={2}
          label="Mục tiêu nghề nghiệp ngắn hạn (Short-term Goal)"
          placeholder="VD: Trở thành CEO công ty công nghệ cho cộng đồng hàng đầu Việt Nam..."
          value={formData.shortTermGoal}
          onChange={handleFieldChange('shortTermGoal')}
        />
        <TextareaField
          className="ui-col-2"
          rows={2}
          label="Mục tiêu nghề nghiệp dài hạn (Long-term Goal)"
          placeholder="VD: Trở thành Solution Architect, dẫn dắt đội ngũ kỹ thuật công nghệ xây dựng sản phẩm chất lượng cao..."
          value={formData.longTermGoal}
          onChange={handleFieldChange('longTermGoal')}
        />
      </FormModal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedUser}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa người dùng?"
        subtitle="Tài khoản sẽ bị xóa khỏi danh sách quản lý."
        message={
          selectedUser && (
            <>
              Bạn có chắc chắn muốn xóa tài khoản <strong>"{selectedUser.fullName}"</strong> ({selectedUser.email})?
            </>
          )
        }
        confirmLabel="Xác nhận xóa"
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalType(null)}
      />

      <ConfirmActionModal
        isOpen={modalType === 'toggle-status' && !!selectedUser}
        tone={isBanned ? 'success' : 'warning'}
        icon={isBanned ? Unlock : Lock}
        title={isBanned ? 'Xác nhận mở khóa tài khoản?' : 'Xác nhận tạm khóa tài khoản?'}
        subtitle={
          isBanned
            ? 'Người dùng sẽ có thể đăng nhập lại vào hệ thống.'
            : 'Người dùng sẽ không thể đăng nhập vào hệ thống.'
        }
        message={
          selectedUser && (
            <>
              Bạn có chắc chắn muốn {isBanned ? 'mở khóa' : 'tạm khóa'} tài khoản <strong>"{selectedUser.fullName}"</strong> (
              {selectedUser.email})?
            </>
          )
        }
        confirmLabel={isBanned ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setModalType(null)}
      />
    </AdminLayout>
  );
};

export default UserManagementPage;
