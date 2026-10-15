import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Clock3, Coins, BarChart3 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { aiGenerationLogService } from '@/services/aiGenerationLogService';
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

const PAGE_SIZE = 20;

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

const STATUS_META = {
  SUCCESS: { label: 'Thành công', color: '#15803d', bg: '#dcfce7', icon: ShieldCheck },
  FAILED: { label: 'Thất bại', color: '#dc2626', bg: '#fee2e2', icon: ShieldAlert },
  TIMEOUT: { label: 'Hết thời gian', color: '#b45309', bg: '#fef3c7', icon: Clock3 },
};

const STATUS_OPTIONS = ['SUCCESS', 'FAILED', 'TIMEOUT'];

const AiGenerationLogManagementPage = () => {
  const [logs, setLogs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [accountIdFilter, setAccountIdFilter] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalType, setModalType] = useState(null); // 'view' | 'delete' | null
  const [selectedLog, setSelectedLog] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast, showToast } = useToast();

  const loadData = useCallback(async (page, accountId, actionType, status) => {
    setIsLoading(true);
    try {
      const data = await aiGenerationLogService.listLogs({
        page: page - 1,
        size: PAGE_SIZE,
        accountId: accountId ? Number(accountId) : null,
        actionType: actionType === 'all' ? null : actionType,
        status: status === 'all' ? null : status,
      });
      setLogs(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load AI generation logs:', err);
      showToast('Không thể tải nhật ký sử dụng AI', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData(currentPage, accountIdFilter, actionTypeFilter, statusFilter);
  }, [currentPage, accountIdFilter, actionTypeFilter, statusFilter, loadData]);

  const handleResetFilters = () => {
    setAccountIdFilter('');
    setActionTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
    loadData(1, '', 'all', 'all');
  };

  const handleRefresh = () => {
    loadData(currentPage, accountIdFilter, actionTypeFilter, statusFilter);
    showToast('Đã tải lại nhật ký sử dụng AI');
  };

  const handleOpenView = (log) => {
    setSelectedLog(log);
    setModalType('view');
  };

  const handleOpenDelete = (log) => {
    setSelectedLog(log);
    setModalType('delete');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedLog(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLog) return;
    setIsSubmitting(true);
    try {
      await aiGenerationLogService.deleteLog(selectedLog.id);
      showToast(`Đã xóa nhật ký #${selectedLog.id}`);
      handleCloseModal();
      loadData(currentPage, accountIdFilter, actionTypeFilter, statusFilter);
    } catch (err) {
      console.error('Delete generation log failed:', err);
      showToast(err.message || 'Xóa nhật ký thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return dateStr;
    }
  };

  const formatCost = (cost) => {
    const n = Number(cost);
    if (!n) return '0';
    return n.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  };

  const STATUS_TONE = { SUCCESS: 'success', FAILED: 'danger', TIMEOUT: 'warning' };

  const handleAccountIdChange = (value) => {
    setAccountIdFilter(value);
    setCurrentPage(1);
  };

  const handleActionTypeChange = (value) => {
    setActionTypeFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const statusBadge = (log) => {
    const meta = STATUS_META[log.status] || STATUS_META.SUCCESS;
    const Icon = meta.icon;
    return (
      <Badge tone={STATUS_TONE[log.status] || 'success'}>
        <Icon size={13} aria-hidden="true" />
        {meta.label}
      </Badge>
    );
  };

  const rowActions = (log) => (
    <RowActions entity="nhật ký" onView={() => handleOpenView(log)} onDelete={() => handleOpenDelete(log)} />
  );

  const columns = [
    {
      header: 'Tài khoản',
      cell: (l) => (
        <>
          <div className="ui-cell-title">{l.accountEmail || `Account #${l.accountId}`}</div>
          <div className="ui-hint">ID: {l.accountId}</div>
        </>
      ),
    },
    { header: 'Hành động', cell: (l) => ACTION_TYPE_LABELS[l.actionType] || l.actionType },
    { header: 'Input token', cell: (l) => l.inputTokens?.toLocaleString('vi-VN') },
    { header: 'Output token', cell: (l) => l.outputTokens?.toLocaleString('vi-VN') },
    { header: 'Chi phí', cell: (l) => formatCost(l.cost) },
    { header: 'Trạng thái', cell: (l) => statusBadge(l) },
    { header: 'Thời gian', muted: true, cell: (l) => formatDateTime(l.createdAt) },
  ];

  return (
    <AdminLayout>
      <Toast toast={toast} />

      <Page fill>
        <PageHeader
          title="Nhật ký sử dụng AI"
          description="Toàn bộ lịch sử gọi AI (chat, tối ưu CV, khớp JD...): số token tiêu tốn, chi phí ước tính và trạng thái từng lượt gọi."
        />

        <Toolbar>
          <SearchBox
            type="number"
            min={1}
            value={accountIdFilter}
            onChange={handleAccountIdChange}
            onClear={() => handleAccountIdChange('')}
            placeholder="Lọc theo Account ID..."
            label="Lọc theo Account ID"
          />
          <ToolbarGroup>
            <FilterSelect label="Lọc theo hành động" value={actionTypeFilter} onChange={handleActionTypeChange}>
              <option value="all">Tất cả hành động</option>
              {ACTION_TYPE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_TYPE_LABELS[a]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect label="Lọc theo trạng thái" value={statusFilter} onChange={handleStatusChange}>
              <option value="all">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </FilterSelect>
            <ResetRefreshButtons onReset={handleResetFilters} onRefresh={handleRefresh} loading={isLoading} />
          </ToolbarGroup>
        </Toolbar>

        <Card fill>
          <div className="ui-table-scroll" aria-busy={isLoading}>
            <DataTable
              rows={logs}
              columns={columns}
              actions={rowActions}
              startIndex={(currentPage - 1) * PAGE_SIZE}
              loading={isLoading}
              emptyIcon={BarChart3}
              emptyTitle="Không có nhật ký sử dụng nào phù hợp."
              emptyHint="Thử đổi bộ lọc để xem các lượt gọi AI khác."
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            entityName="nhật ký"
          />
        </Card>
      </Page>

      {/* View */}
      <Modal
        open={modalType === 'view' && !!selectedLog}
        size="lg"
        title={selectedLog ? `Chi tiết nhật ký #${selectedLog.id}` : 'Chi tiết nhật ký'}
        onClose={handleCloseModal}
        footerSplit
        footer={
          selectedLog && <ViewFooter onDelete={() => setModalType('delete')} onClose={handleCloseModal} />
        }
      >
        {selectedLog && (
          <>
            <DetailGrid>
              <DetailItem label="Tài khoản">{selectedLog.accountEmail || `Account #${selectedLog.accountId}`}</DetailItem>
              <DetailItem label="Hành động">{ACTION_TYPE_LABELS[selectedLog.actionType] || selectedLog.actionType}</DetailItem>
              <DetailItem label="Token (input / output)">
                <span className="ui-inline">
                  <Coins size={14} aria-hidden="true" /> {selectedLog.inputTokens} / {selectedLog.outputTokens}
                </span>
              </DetailItem>
              <DetailItem label="Chi phí ước tính">{formatCost(selectedLog.cost)}</DetailItem>
              <DetailItem label="Trạng thái">{statusBadge(selectedLog)}</DetailItem>
              <DetailItem label="Thời gian">{formatDateTime(selectedLog.createdAt)}</DetailItem>
            </DetailGrid>
            <DetailSection title="Nội dung yêu cầu (input)">{selectedLog.inputSummary || '—'}</DetailSection>
            <DetailSection title="Nội dung phản hồi (output)">{selectedLog.outputSummary || '—'}</DetailSection>
            {selectedLog.errorMessage && <DetailSection title="Lỗi ghi nhận">{selectedLog.errorMessage}</DetailSection>}
          </>
        )}
      </Modal>

      <ConfirmActionModal
        isOpen={modalType === 'delete' && !!selectedLog}
        tone="danger"
        icon={AlertTriangle}
        title="Xác nhận xóa nhật ký?"
        subtitle="Hành động này chỉ nên dùng để dọn dữ liệu lỗi/rác, không ảnh hưởng tới credit đã trừ."
        message={
          selectedLog && (
            <>
              Bạn có chắc chắn muốn xóa nhật ký <strong>#{selectedLog.id}</strong> (
              {ACTION_TYPE_LABELS[selectedLog.actionType] || selectedLog.actionType})?
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

export default AiGenerationLogManagementPage;
