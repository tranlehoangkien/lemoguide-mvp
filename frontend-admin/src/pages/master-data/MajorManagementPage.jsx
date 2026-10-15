import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Pencil, Trash2, AlertTriangle, RefreshCw, RotateCcw, LayoutGrid, List, BookOpen } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { majorService } from '@/services/majorService';
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
  EmptyState,
  Button,
  IconButton,
  TextField,
  TextareaField,
  FormModal,
  Modal,
  DetailGrid,
  DetailItem,
  DetailSection,
  Toast,
  useToast,
} from '@/components/ui';

const PAGE_SIZE = 10;

const VIEW_OPTIONS = [
  { value: 'table', label: 'Bảng', icon: List },
  { value: 'grid', label: 'Lưới', icon: LayoutGrid },
];

const emptyMajorForm = {
  name: '',
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

const MajorManagementPage = () => {
  const [majors, setMajors] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal states: 'create' | 'edit' | 'view' | 'delete' | null
  const [modalType, setModalType] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [formData, setFormData] = useState(emptyMajorForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  const loadData = useCallback(async (page, search) => {
    setIsLoading(true);
    try {
      const data = await majorService.listMajors({
        page: page - 1,
        size: PAGE_SIZE,
        search,
      });
      setMajors(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load majors:', err);
      showToast('Không thể tải danh sách chuyên ngành', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(currentPage, searchTerm);
  }, [currentPage, searchTerm, loadData]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadData(1, '');
  };

  const handleRefresh = () => {
    loadData(currentPage, searchTerm);
    showToast('Đã tải lại danh sách chuyên ngành');
  };

  const handleOpenCreate = () => {
    setFormData(emptyMajorForm);
    setFormErrors({});
    setSelectedMajor(null);
    setModalType('create');
  };

  const handleOpenEdit = (major) => {
    setSelectedMajor(major);
    setFormData({
      name: major.name || '',
      description: major.description || '',
    });
    setFormErrors({});
    setModalType('edit');
  };

  const handleOpenView = (major) => {
    setSelectedMajor(major);
    setModalType('view');
  };

  const handleOpenDelete = (major) => {
    setSelectedMajor(major);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedMajor(null);
    setFormData(emptyMajorForm);
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
      errors.name = 'Tên chuyên ngành không được để trống';
    } else if (formData.name.trim().length > 150) {
      errors.name = 'Tên chuyên ngành không vượt quá 150 ký tự';
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
        await majorService.createMajor(formData);
        showToast(`Đã thêm mới chuyên ngành: ${formData.name}`);
      } else if (modalType === 'edit' && selectedMajor) {
        await majorService.updateMajor(selectedMajor.id, formData);
        showToast(`Đã cập nhật chuyên ngành: ${formData.name}`);
      }
      handleCloseModal();
      loadData(currentPage, searchTerm);
    } catch (err) {
      console.error('Submit major failed:', err);
      showToast(err.message || 'Thao tác không thành công, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMajor) return;
    setIsSubmitting(true);
    try {
      await majorService.deleteMajor(selectedMajor.id);
      showToast(`Đã xóa chuyên ngành: ${selectedMajor.name}`);
      handleCloseModal();
      loadData(currentPage, searchTerm);
    } catch (err) {
      console.error('Delete major failed:', err);
      showToast('Xóa chuyên ngành thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rowActions = (major) => (
    <div className="ui-row-actions">
      <IconButton icon={Eye} label="Xem chi tiết" onClick={() => handleOpenView(major)} />
      <IconButton icon={Pencil} label="Chỉnh sửa" tone="info" onClick={() => handleOpenEdit(major)} />
      <IconButton icon={Trash2} label="Xóa chuyên ngành" tone="danger" onClick={() => handleOpenDelete(major)} />
    </div>
  );

  const isFormOpen = modalType === 'create' || modalType === 'edit';
  const isEmpty = majors.length === 0;

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Quản lý Chuyên ngành (Major)"
          description="Quản lý danh sách ngành học, chuyên khoa đào tạo và hệ thống kiến thức học thuật."
          actions={
            <>
              <Segmented label="Chế độ xem" value={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
              <Button trailingIcon={Plus} onClick={handleOpenCreate}>
                Thêm mới Chuyên ngành
              </Button>
            </>
          }
        />

        <Toolbar>
          <SearchBox
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange('')}
            placeholder="Tìm theo tên chuyên ngành hoặc mô tả..."
          />
          <ToolbarGroup>
            <Button variant="secondary" icon={RotateCcw} onClick={handleResetFilters} title="Đặt lại bộ lọc và tìm kiếm">
              Đặt lại
            </Button>
            <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh} title="Tải lại danh sách" disabled={isLoading}>
              Tải lại
            </Button>
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            {isEmpty ? (
              <EmptyState
                icon={BookOpen}
                title={isLoading ? 'Đang tải dữ liệu...' : 'Không có bản ghi chuyên ngành nào phù hợp.'}
                hint={isLoading ? undefined : 'Thử đổi từ khóa tìm kiếm hoặc thêm mới một chuyên ngành.'}
              />
            ) : viewMode === 'table' ? (
              <table className="ui-table ui-table--stack">
                <thead>
                  <tr>
                    <th className="is-num">STT</th>
                    <th>Chuyên ngành</th>
                    <th>Mô tả đào tạo & học thuật</th>
                    <th>Ngày tạo</th>
                    <th className="is-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {majors.map((major, idx) => (
                    <tr key={major.id}>
                      <td className="is-num" data-label="STT">
                        {(currentPage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td data-label="Chuyên ngành">
                        <span className="ui-cell-title">{major.name}</span>
                      </td>
                      <td data-label="Mô tả">
                        <div className="ui-clamp-2" title={major.description}>
                          {major.description || <span className="ui-placeholder-text">Chưa có mô tả</span>}
                        </div>
                      </td>
                      <td className="is-muted" data-label="Ngày tạo">
                        {formatDate(major.createdAt)}
                      </td>
                      <td className="is-actions">{rowActions(major)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="ui-grid">
                {majors.map((major, idx) => (
                  <article key={major.id} className="ui-item-card">
                    <div>
                      <h3 className="ui-item-card__title">{major.name}</h3>
                      <p className="ui-clamp-3 ui-hint" style={{ margin: '8px 0 0' }}>
                        {major.description || 'Chưa có mô tả chi tiết cho chuyên ngành này.'}
                      </p>
                    </div>
                    <div className="ui-item-card__foot">
                      <span>
                        #{(currentPage - 1) * PAGE_SIZE + idx + 1} · {formatDate(major.createdAt)}
                      </span>
                      {rowActions(major)}
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
            entityName="chuyên ngành"
          />
        </Card>
      </Page>

      {/* Create / Edit */}
      <FormModal
        open={isFormOpen}
        title={modalType === 'create' ? 'Thêm mới Chuyên ngành' : 'Chỉnh sửa Chuyên ngành'}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        submitLabel={modalType === 'create' ? 'Tạo chuyên ngành' : 'Lưu thay đổi'}
      >
        <TextField
          label="Tên chuyên ngành"
          required
          placeholder="VD: Kỹ thuật phần mềm (Software Engineering)"
          value={formData.name}
          onChange={handleFieldChange('name')}
          error={formErrors.name}
        />
        <TextareaField
          label="Mô tả đào tạo & học thuật"
          placeholder="Mô tả mục tiêu đào tạo, phạm vi kiến thức chuyên môn hoặc ghi chú..."
          value={formData.description}
          onChange={handleFieldChange('description')}
        />
      </FormModal>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedMajor}
        title="Chi tiết Chuyên ngành"
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedMajor && (
            <>
              <Button variant="danger" icon={Trash2} onClick={() => setModalType('delete')}>
                Xóa
              </Button>
              <div className="ui-modal__foot-group">
                <Button variant="secondary" onClick={handleCloseModal}>
                  Đóng
                </Button>
                <Button icon={Pencil} onClick={() => handleOpenEdit(selectedMajor)}>
                  Chỉnh sửa
                </Button>
              </div>
            </>
          )
        }
      >
        {selectedMajor && (
          <>
            <div style={{ marginBottom: 16 }}>
              <h3 className="ui-modal__title">{selectedMajor.name}</h3>
              <span className="ui-hint">Mã ID: #{selectedMajor.id}</span>
            </div>
            <DetailGrid>
              <DetailItem label="Ngày khởi tạo">{formatDate(selectedMajor.createdAt)}</DetailItem>
              <DetailItem label="Cập nhật lần cuối">
                {formatDate(selectedMajor.updatedAt || selectedMajor.createdAt)}
              </DetailItem>
            </DetailGrid>
            <DetailSection title="Mô tả định hướng & học thuật">
              {selectedMajor.description || 'Chưa có thông tin mô tả cho chuyên ngành này.'}
            </DetailSection>
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedMajor}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa chuyên ngành?"
        subtitle="Dữ liệu sẽ bị xóa khỏi danh sách quản lý."
        message={
          selectedMajor && (
            <>
              Bạn có chắc chắn muốn xóa chuyên ngành <strong>"{selectedMajor.name}"</strong> khỏi hệ thống?
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

export default MajorManagementPage;
