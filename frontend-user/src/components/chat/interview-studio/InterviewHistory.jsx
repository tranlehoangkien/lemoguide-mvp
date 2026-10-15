import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { useState } from 'react';
import { Play, FileText, Trash2, TrendingUp } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';
import { formatDay, levelLabel, typeLabel } from './interviewStudioUtils';

const CRITERIA_LABELS = {
  relevance: 'Đúng trọng tâm',
  structure: 'Cấu trúc',
  depth: 'Chiều sâu và bằng chứng',
  clarity: 'Diễn đạt',
};

const CHART_POINTS = 10;

const signed = (n) => (n > 0 ? `+${n}` : String(n));

/** Điểm các buổi đã hoàn thành, cũ -> mới, kèm chênh lệch của lần gần nhất so với lần trước. */
const ProgressChart = ({ sessions }) => {
  const done = sessions
    .filter((s) => s.status === 'completed' && s.overallScore != null)
    .slice(0, CHART_POINTS)
    .reverse();

  if (done.length < 2) {
    return (
      <p className="cvs-empty-line">
        {done.length === 0
          ? 'Hoàn thành một buổi phỏng vấn để bắt đầu theo dõi điểm số.'
          : 'Hoàn thành thêm một buổi nữa để thấy tiến bộ giữa các lần luyện.'}
      </p>
    );
  }

  const latest = done[done.length - 1];
  const previous = done[done.length - 2];
  const diff = latest.overallScore - previous.overallScore;
  const criteria = Object.keys(CRITERIA_LABELS).filter(
    (key) => latest.criteriaScores?.[key] != null && previous.criteriaScores?.[key] != null
  );

  return (
    <div className="ivs-chart">
      <div className="ivs-chart__head">
        <span className="ivs-chart__figure">{latest.overallScore}</span>
        <span className="ivs-chart__delta">
          <TrendingUp size={15} aria-hidden="true" />
          {diff === 0 ? 'Bằng buổi trước' : `${signed(diff)} điểm so với buổi trước`}
        </span>
      </div>
      <ol className="ivs-bars" aria-label="Điểm các buổi phỏng vấn gần đây">
        {done.map((s, index) => (
          <li key={s.id} className={index === done.length - 1 ? 'is-latest' : undefined}>
            <span className="ivs-bars__score">{s.overallScore}</span>
            <span className="ivs-bars__col" style={{ height: `${Math.max(4, s.overallScore)}%` }} />
            <span className="ivs-bars__day">{formatDay(s.completedAt || s.createdAt).slice(0, 5)}</span>
          </li>
        ))}
      </ol>
      {criteria.length > 0 && (
        <ul className="ivs-deltas" aria-label="Thay đổi theo tiêu chí so với buổi trước">
          {criteria.map((key) => {
            const change = latest.criteriaScores[key] - previous.criteriaScores[key];
            return (
              <li key={key}>
                <span>{CRITERIA_LABELS[key]}</span>
                <strong>{latest.criteriaScores[key]}</strong>
                <small>{change === 0 ? '=' : signed(change)}</small>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/**
 * Lịch sử luyện tập: biểu đồ tiến bộ và danh sách buổi đã làm. Buổi dở dang có nút "Tiếp tục", buổi đã xong mở
 * báo cáo. Xóa được xác nhận qua popup chung của hệ thống.
 */
const InterviewHistory = ({ sessions, loading, error, onRetry, onOpen, onDelete, opening }) => {
  const [confirming, setConfirming] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(null);

  const remove = async (id) => {
    if (deleting != null) return;
    setDeleting(id); setDeleteError('');
    try {
      await onDelete(id);
      setConfirming(null);
    } catch (err) {
      setDeleteError(err.message || 'Không xóa được buổi luyện tập. Vui lòng thử lại.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="ivs-history" aria-label="Lịch sử luyện tập">
      <ConfirmActionModal isOpen={confirming != null} title="Xóa buổi luyện tập" icon={Trash2} confirmLabel="Xóa buổi luyện tập"
        message={<>{deleteError && <span role="alert">{deleteError}<br /></span>}Bạn có chắc muốn xóa buổi luyện tập “{sessions.find((s) => s.id === confirming)?.positionTitle}”? Thao tác này không thể hoàn tác.</>}
        isSubmitting={deleting != null} onConfirm={() => remove(confirming)} onCancel={() => { if (deleting == null) setConfirming(null); }} />
      <header className="cvs-head">
        <h3>Lịch sử luyện tập</h3>
      </header>

      {loading && <p className="cvs-empty-line">Đang tải lịch sử...</p>}
      {error && (
        <div className="cvs-note cvs-note--error" role="alert">
          {error}
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      )}
      {!loading && !error && sessions.length === 0 && <p className="cvs-empty-line">Bạn chưa có buổi luyện tập nào.</p>}

      {sessions.length > 0 && (
        <>
          <ProgressChart sessions={sessions} />
          <ul className="cvs-list ivs-sessions">
            {sessions.map((s) => {
              const done = s.status === 'completed';
              return (
                <li key={s.id} className="ivs-session-row">
                  <div className="ivs-session-row__main">
                    <strong>{s.positionTitle}</strong>
                    <small>
                      {levelLabel(s.level)} · {typeLabel(s.interviewType)} · {formatDay(s.completedAt || s.createdAt)}
                      {s.targetLabel && s.targetLabel !== 'Không có mục tiêu cụ thể' ? ` · ${s.targetLabel}` : ''}
                    </small>
                  </div>
                  {done ? (
                    <span className="cvs-tag cvs-tag--strong" title={s.verdict || undefined}>
                      {s.overallScore ?? '—'} điểm
                    </span>
                  ) : (
                    <span className="cvs-tag">
                      Đang dở {s.answeredCount}/{s.questionCount}
                    </span>
                  )}
                  <div className="ivs-session-row__actions">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={done ? FileText : Play}
                          loading={opening === s.id}
                          disabled={opening != null}
                          onClick={() => onOpen(s.id)}
                        >
                          {done ? 'Xem báo cáo' : 'Tiếp tục'}
                        </Button>
                        <IconButton tone="danger" icon={Trash2} label="Xóa buổi luyện tập" onClick={() => { setDeleteError(''); setConfirming(s.id); }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};

export default InterviewHistory;
