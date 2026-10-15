import { useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenLine, Zap, RefreshCw, TriangleAlert, Undo2, ExternalLink, HelpCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { cvOptimizerService } from '@/services/cvOptimizerService';
import { ROUTES } from '@/constants/routes';
import { errorText } from './cvStudioUtils';

/**
 * Tab "Viết lại nội dung": AI đề xuất bản viết lại cho từng trường yếu của CV (mục tiêu, mô tả kinh nghiệm,
 * mô tả dự án). Người dùng xem "hiện tại / đề xuất", sửa tay nếu muốn, chọn cái nào áp dụng. Nội dung "hiện
 * tại" do backend đọc từ CV (không phải AI chép lại) và được kiểm tra lại lúc áp dụng: trường đã bị sửa tay
 * sau khi AI đề xuất sẽ bị bỏ qua, không ghi đè. Mỗi lần áp dụng có một bản chụp để hoàn tác.
 */
const CvSuggestPanel = ({ cvId, target, targetLabel, modelId }) => {
  const navigate = useNavigate();

  // 'idle' | 'running' | 'done' | 'error'
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [picked, setPicked] = useState({});
  const [edits, setEdits] = useState({});
  const [editing, setEditing] = useState({});
  const [applied, setApplied] = useState(null); // { count, skipped, versionId, undone }
  const [applying, setApplying] = useState(false);
  const [actionError, setActionError] = useState(null);
  const seq = useRef(0);

  const suggestions = useMemo(() => data?.suggestions || [], [data]);
  const doneIds = useMemo(() => (applied && !applied.undone ? applied.ids : new Set()), [applied]);
  const selected = suggestions.filter((s) => picked[s.id] && !doneIds.has(s.id));

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setStatus('running');
    setError(null);
    setApplied(null);
    setActionError(null);
    try {
      const result = await cvOptimizerService.suggest(cvId, { target, modelId });
      if (mine !== seq.current) return;
      setData(result);
      // Gợi ý có số liệu không có trong CV mặc định chưa được chọn: người dùng phải xem trước.
      setPicked(Object.fromEntries((result?.suggestions || []).map((s) => [s.id, s.unverifiedNumbers.length === 0])));
      setEdits({});
      setEditing({});
      setStatus('done');
    } catch (err) {
      if (mine !== seq.current) return;
      setError(errorText(err, 'Không thể tạo gợi ý lúc này, vui lòng thử lại.'));
      setStatus('error');
    }
  }, [cvId, target, modelId]);

  const apply = async () => {
    if (selected.length === 0 || applying) return;
    setApplying(true);
    setActionError(null);
    try {
      const result = await cvOptimizerService.apply(cvId, {
        generationLogId: data.generationLogId,
        changes: selected.map((s) => ({ ref: s.ref, field: s.field, before: s.before, after: edits[s.id] ?? s.after })),
      });
      setApplied({
        count: result.applied,
        skipped: result.skipped || [],
        versionId: result.versionId,
        undone: false,
        ids: new Set(result.applied > 0 ? selected.map((s) => s.id) : []),
      });
    } catch (err) {
      setActionError(errorText(err, 'Không thể áp dụng thay đổi lúc này, vui lòng thử lại.'));
    } finally {
      setApplying(false);
    }
  };

  const undo = async () => {
    if (!applied?.versionId || applying) return;
    setApplying(true);
    setActionError(null);
    try {
      await cvOptimizerService.undo(cvId, applied.versionId);
      setApplied((prev) => ({ ...prev, undone: true }));
    } catch (err) {
      setActionError(errorText(err, 'Không thể hoàn tác lúc này, vui lòng thử lại.'));
    } finally {
      setApplying(false);
    }
  };

  const openEditor = () => navigate(`${ROUTES.CV_EDITOR}?id=${cvId}`);

  return (
    <div className="cvs-panel" style={{ marginTop: 0 }}>
      {(status === 'idle' || status === 'error') && (
        <div className="cvs-empty">
          <PenLine size={32} aria-hidden="true" />
          <h3>Viết lại các mục yếu của CV</h3>
          <p>
            AI đề xuất bản viết lại cho mục tiêu nghề nghiệp, mô tả kinh nghiệm và dự án theo công thức STAR, bám vị trí đã chọn
            {target ? ` (${targetLabel})` : ''}. AI không được bịa số liệu: chỗ nào thiếu thông tin, AI sẽ hỏi lại bạn.
          </p>
          {status === 'error' && (
            <div className="cvs-note cvs-note--error" role="alert">
              {error}
            </div>
          )}
          <Button variant="ai" icon={Zap} onClick={run}>
            Đề xuất bản viết lại
          </Button>
        </div>
      )}

      {status === 'running' && (
        <div className="cvs-empty" aria-busy="true" role="status">
          <span className="ui-spinner" style={{ width: 28, height: 28 }} aria-hidden="true" />
          <h3>Đang đọc CV và soạn đề xuất...</h3>
          <p>Thường mất 10-30 giây.</p>
        </div>
      )}

      {status === 'done' && (
        <>
          <div className="cvs-toolbar">
            <ul className="cvs-toolbar__meta">
              <li>Mục tiêu: {data.targetLabel}</li>
              {data.modelName && <li>{data.modelName}</li>}
            </ul>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={run}>
              Đề xuất lại
            </Button>
          </div>

          {applied && (
            <div className="cvs-note" role="status">
              <span>
                {applied.undone ? (
                  <strong>Đã hoàn tác, CV trở về như trước khi áp dụng.</strong>
                ) : applied.count > 0 ? (
                  <>
                    <strong>Đã áp dụng {applied.count} thay đổi vào CV.</strong> Bản cũ được lưu lại để hoàn tác.
                  </>
                ) : (
                  <strong>Không có thay đổi nào được áp dụng.</strong>
                )}
                {applied.skipped.length > 0 && (
                  <>
                    <br />
                    Bỏ qua {applied.skipped.length}: {applied.skipped.join(' ')}
                  </>
                )}
              </span>
              <span className="cvs-actions">
                {!applied.undone && applied.versionId && (
                  <Button size="sm" variant="secondary" icon={Undo2} loading={applying} onClick={undo}>
                    Hoàn tác
                  </Button>
                )}
                <Button size="sm" variant="secondary" icon={ExternalLink} onClick={openEditor}>
                  Mở CV
                </Button>
              </span>
            </div>
          )}
          {actionError && (
            <div className="cvs-note cvs-note--error" role="alert">
              {actionError}
            </div>
          )}

          {suggestions.length === 0 ? (
            <p className="cvs-empty-line">
              AI không thấy mục nào cần viết lại thêm. Bạn có thể chấm điểm ATS để xem các góp ý khác.
            </p>
          ) : (
            <ul className="cvs-list">
              {suggestions.map((s) => {
                const done = doneIds.has(s.id);
                const text = edits[s.id] ?? s.after;
                return (
                  <li key={s.id} className={`cvs-suggestion${done ? ' cvs-suggestion--done' : ''}`}>
                    <div className="cvs-suggestion__head">
                      <div className="cvs-suggestion__title">
                        <strong>{s.itemLabel}</strong>
                        <span>{s.fieldLabel}</span>
                      </div>
                      {done ? (
                        <span className="cvs-tag cvs-tag--quiet">
                          <Check size={12} aria-hidden="true" style={{ marginRight: 4 }} /> Đã áp dụng
                        </span>
                      ) : (
                        <label className="cvs-check">
                          <input
                            type="checkbox"
                            checked={Boolean(picked[s.id])}
                            onChange={(e) => setPicked((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                          />
                          Áp dụng
                        </label>
                      )}
                    </div>

                    <div className="cvs-diff">
                      <div className="cvs-diff__side">
                        <span className="cvs-diff__label">Hiện tại</span>
                        <p className="cvs-diff__text">{s.before || 'Đang để trống'}</p>
                      </div>
                      <div className="cvs-diff__side cvs-diff__side--after">
                        <span className="cvs-diff__label">Đề xuất</span>
                        {editing[s.id] && !done ? (
                          <textarea
                            value={text}
                            onChange={(e) => setEdits((prev) => ({ ...prev, [s.id]: e.target.value }))}
                            aria-label={`Sửa đề xuất cho ${s.itemLabel}`}
                          />
                        ) : (
                          <p className="cvs-diff__text">{text}</p>
                        )}
                        {!done && (
                          <button
                            type="button"
                            className="cvs-link"
                            style={{ justifySelf: 'start' }}
                            onClick={() => setEditing((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                          >
                            {editing[s.id] ? 'Xong' : 'Sửa lại đề xuất'}
                          </button>
                        )}
                      </div>
                    </div>

                    {s.reason && (
                      <p className="cvs-suggestion__reason">
                        <b>Vì sao: </b>
                        {s.reason}
                      </p>
                    )}
                    {s.unverifiedNumbers.length > 0 && (
                      <p className="cvs-warning" role="note">
                        <TriangleAlert size={18} aria-hidden="true" />
                        <span>
                          Số liệu <strong>{s.unverifiedNumbers.join(', ')}</strong> không có trong CV của bạn. Chỉ dùng nếu
                          đúng sự thật, hoặc sửa lại đề xuất trước khi áp dụng.
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {data.questions.length > 0 && (
            <section>
              <header className="cvs-head">
                <HelpCircle size={20} aria-hidden="true" />
                <h3>AI cần thêm thông tin từ bạn</h3>
              </header>
              <ul className="cvs-bullets">
                {data.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
              <p className="cvs-empty-line" style={{ marginTop: 12 }}>
                Bổ sung các thông tin này vào CV rồi bấm "Đề xuất lại" để có bản viết lại có số liệu thật.
              </p>
            </section>
          )}

          {suggestions.length > 0 && (
            <div className="cvs-applybar">
              <span>{selected.length > 0 ? `${selected.length} thay đổi được chọn` : 'Chọn các thay đổi muốn áp dụng'}</span>
              <Button variant="primary" loading={applying} disabled={selected.length === 0} onClick={apply}>
                Áp dụng vào CV
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CvSuggestPanel;
