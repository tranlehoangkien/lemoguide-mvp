import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle, Globe, FileDown, FileType, KeyRound, FileText } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { ROUTES } from '@/constants/routes';
import { cvProfileService } from '@/services/cvProfileService';
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
  Toast,
  useToast,
  DataTable,
  RowActions,
  ResetRefreshButtons,
  FilterSelect,
  TABLE_GRID_OPTIONS,
} from '@/components/ui';

const PAGE_SIZE = 10;

const TARGET_MODE_LABELS = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  FULLSTACK: 'Fullstack',
};

const PUBLISH_MODE_LABELS = {
  PUBLIC_LINK: 'Link công khai',
  PDF: 'PDF',
  ATS_TEXT: 'ATS Text',
};

const CvManagementPage = () => {
  const [cvProfiles, setCvProfiles] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [viewMode, setViewMode] = useState('table');

  // Modal states: 'delete' | null — Chỉnh sửa/Ẩn đã bỏ khỏi trang này; xem CV mở ở tab mới.
  const [modalType, setModalType] = useState(null);
  const [selectedCv, setSelectedCv] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, showToast } = useToast();

  const loadData = useCallback(async (page, search, status) => {
    setIsLoading(true);
    try {
      const isActive = status === 'active' ? true : status === 'inactive' ? false : null;
      const data = await cvProfileService.listCvProfiles({
        page: page - 1,
        size: PAGE_SIZE,
        keyword: search,
        isActive,
      });
      setCvProfiles(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load CV profiles:', err);
      showToast('Không thể tải danh sách CV người dùng', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter, loadData]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
    loadData(1, '', 'all');
  };

  const handleRefresh = () => {
    loadData(currentPage, searchTerm, statusFilter);
    showToast('Đã tải lại danh sách CV người dùng');
  };

  const handleViewCv = (cv) => {
    // Không dùng 'noopener': phiên đăng nhập nằm trong sessionStorage (theo từng tab) và chỉ được
    // sao chép sang tab mới khi tab mở ra còn giữ quan hệ opener; nếu không tab mới sẽ bị đưa về /login.
    window.open(`${ROUTES.CV_PREVIEW}?id=${cv.id}`, '_blank');
  };

  const handleOpenDelete = (cv) => {
    setSelectedCv(cv);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedCv(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCv) return;
    setIsSubmitting(true);
    try {
      await cvProfileService.deleteCvProfile(selectedCv.id);
      showToast(`Đã xóa CV: ${selectedCv.name}`);
      handleCloseModal();
      loadData(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error('Delete CV failed:', err);
      showToast('Xóa CV thất bại, vui lòng thử lại', 'error');
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

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const shareIcon = (cv) => {
    if (cv.publishMode === 'PUBLIC_LINK') return <Globe size={13} aria-hidden="true" />;
    if (cv.publishMode === 'PDF') return <FileDown size={13} aria-hidden="true" />;
    return <FileType size={13} aria-hidden="true" />;
  };

  const statusBadge = (cv) =>
    cv.isActive ? <Badge tone="success">Hoạt động</Badge> : <Badge>Đã ẩn</Badge>;

  const rowActions = (cv) => (
    <RowActions entity="CV" onView={() => handleViewCv(cv)} onDelete={() => handleOpenDelete(cv)} />
  );

  const columns = [
    {
      header: 'Người dùng',
      cell: (cv) => (
        <>
          <div className="ui-cell-title">{cv.ownerName || <span className="ui-placeholder-text">Không rõ</span>}</div>
          <div className="ui-hint">{cv.ownerEmail || '—'}</div>
        </>
      ),
    },
    {
      header: 'Tên CV & Mục tiêu',
      label: 'CV',
      cell: (cv) => (
        <>
          <div className="ui-cell-title">{cv.name}</div>
          <Badge tone="info">{TARGET_MODE_LABELS[cv.targetMode] || cv.targetMode}</Badge>
        </>
      ),
    },
    {
      header: 'Mẫu',
      cell: (cv) => cv.templateName || <span className="ui-placeholder-text">Chưa chọn mẫu</span>,
    },
    {
      header: 'Chia sẻ',
      cell: (cv) => (
        <>
          <div className="ui-inline">
            {shareIcon(cv)}
            {PUBLISH_MODE_LABELS[cv.publishMode] || cv.publishMode}
          </div>
          {cv.sharePasswordProtected && (
            <div className="ui-inline ui-hint">
              <KeyRound size={12} aria-hidden="true" />
              <span>Có mật khẩu</span>
            </div>
          )}
        </>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (cv) => (
        <>
          {statusBadge(cv)}
          <div className="ui-hint">{cv.viewCount ?? 0} lượt xem</div>
        </>
      ),
    },
    { header: 'Ngày tạo', muted: true, cell: (cv) => formatDate(cv.createdAt) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Danh sách CV Người dùng"
          description="Theo dõi và quản lý hồ sơ CV do người dùng tạo (cv_profile). Nội dung chi tiết CV do chính người dùng chỉnh sửa."
          actions={<Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={TABLE_GRID_OPTIONS} />}
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên CV, tên hoặc email người dùng..."
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo trạng thái" value={statusFilter} onChange={handleStatusChange}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã ẩn</option>
            </FilterSelect>
            <ResetRefreshButtons
              onReset={handleResetFilters}
              onRefresh={handleRefresh}
              loading={isLoading}
            />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {viewMode === 'table' || cvProfiles.length === 0 ? (
              <DataTable
                rows={cvProfiles}
                columns={columns}
                actions={rowActions}
                startIndex={(currentPage - 1) * PAGE_SIZE}
                loading={isLoading}
                emptyIcon={FileText}
                emptyTitle="Không có bản ghi CV nào phù hợp."
                emptyHint="Thử đổi từ khóa hoặc bộ lọc trạng thái."
              />
            ) : (
              <div className="ui-grid">
                {cvProfiles.map((cv, idx) => (
                  <article key={cv.id} className="ui-item-card">
                    <div>
                      <div className="ui-item-card__row">
                        <span className="ui-hint">#{(currentPage - 1) * PAGE_SIZE + idx + 1}</span>
                        {statusBadge(cv)}
                      </div>
                      <h3 className="ui-item-card__title">{cv.name}</h3>
                      <p className="ui-hint" style={{ margin: '4px 0 0' }}>
                        {cv.ownerName || 'Không rõ người dùng'} · {cv.ownerEmail || '—'}
                      </p>
                    </div>
                    <div className="ui-item-card__foot" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Mục tiêu</span>
                        <strong style={{ color: 'var(--ui-text)' }}>{TARGET_MODE_LABELS[cv.targetMode] || cv.targetMode}</strong>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Mẫu</span>
                        <span>{cv.templateName || '—'}</span>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Chia sẻ</span>
                        <span>{PUBLISH_MODE_LABELS[cv.publishMode] || cv.publishMode}</span>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Lượt xem</span>
                        <span>{cv.viewCount ?? 0}</span>
                      </span>
                      <span className="ui-inline" style={{ justifyContent: 'space-between' }}>
                        <span>Ngày tạo</span>
                        <span>{formatDate(cv.createdAt)}</span>
                      </span>
                    </div>
                    <div className="ui-item-card__actions">{rowActions(cv)}</div>
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
            entityName="CV"
          />
        </Card>
      </Page>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedCv}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa CV?"
        subtitle="CV cùng toàn bộ lịch sử phiên bản, export sẽ bị xóa khỏi hệ thống."
        message={
          selectedCv && (
            <>
              Bạn có chắc chắn muốn xóa CV <strong>"{selectedCv.name}"</strong> của <strong>{selectedCv.ownerName}</strong>?
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

export default CvManagementPage;
