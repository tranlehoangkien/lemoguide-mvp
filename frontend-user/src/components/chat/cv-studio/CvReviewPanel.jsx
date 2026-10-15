import { useState, useEffect, useCallback, useRef } from 'react';
import { Gauge, Zap, RefreshCw, Clock, Cpu, ListChecks, Tags, HelpCircle, PenLine } from 'lucide-react';
import { Button } from '@/components/ui';
import { cvOptimizerService } from '@/services/cvOptimizerService';
import { formatWhen, errorText } from './cvStudioUtils';

const SEVERITY = {
  high: { label: 'Nghiêm trọng', className: 'cvs-tag--strong' },
  medium: { label: 'Nên sửa', className: '' },
  low: { label: 'Có thể cải thiện', className: 'cvs-tag--quiet' },
};

const Head = ({ icon: Icon, title, count }) => (
  <header className="cvs-head">
    <Icon size={20} aria-hidden="true" />
    <h3>{title}</h3>
    {count != null && <span className="cvs-head__count">{count}</span>}
  </header>
);

/**
 * Tab "Chấm điểm ATS". Lúc mở chỉ tải kết quả đã lưu (không gọi AI); bấm nút mới chạy. Backend dùng lại
 * kết quả đã lưu khi CV và mục tiêu không đổi, và báo `stale` khi có thay đổi.
 */
const CvReviewPanel = ({ cvId, target, targetLabel, modelId, onGoSuggest }) => {
  // 'loading' | 'idle' | 'running' | 'done' | 'error'
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  useEffect(() => {
    const mine = ++seq.current;
    cvOptimizerService
      .getStoredReview(cvId, target)
      .then((stored) => {
        if (mine !== seq.current) return;
        setData(stored);
        setStatus(stored ? 'done' : 'idle');
      })
      .catch(() => mine === seq.current && setStatus('idle'));
    return () => {
      seq.current += 1;
    };
    // Panel được tạo lại (key) mỗi khi đổi CV/mục tiêu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(
    async (refresh = false) => {
      const mine = ++seq.current;
      setStatus('running');
      setError(null);
      try {
        const result = await cvOptimizerService.review(cvId, { target, modelId, refresh });
        if (mine !== seq.current) return;
        setData(result);
        setStatus('done');
      } catch (err) {
        if (mine !== seq.current) return;
        setError(errorText(err, 'Không thể chấm điểm CV lúc này, vui lòng thử lại.'));
        setStatus(data ? 'done' : 'error');
      }
    },
    [cvId, target, modelId, data]
  );

  const review = data?.review;
  const running = status === 'running';
  const when = formatWhen(data?.analyzedAt);

  return (
    <div className="cvs-panel" style={{ marginTop: 0 }}>
      {status === 'loading' && <p className="cvs-empty-line">Đang kiểm tra kết quả đã lưu...</p>}

      {(status === 'idle' || status === 'error') && (
        <div className="cvs-empty">
          <Gauge size={32} aria-hidden="true" />
          <h3>Chấm điểm CV theo tiêu chí ATS</h3>
          <p>
            AI đánh giá bố cục, từ khóa, số liệu, cách diễn đạt và mức liên quan tới mục tiêu, rồi chỉ ra từng chỗ cần sửa.
            {target ? ` Mục tiêu: ${targetLabel}.` : ' Chưa chọn mục tiêu nên AI sẽ đánh giá chung.'}
          </p>
          {status === 'error' && (
            <div className="cvs-note cvs-note--error" role="alert">
              {error}
            </div>
          )}
          <Button variant="ai" icon={Zap} onClick={() => run(false)}>
            Chấm điểm CV
          </Button>
        </div>
      )}

      {status === 'running' && !review && (
        <div className="cvs-empty" aria-busy="true" role="status">
          <span className="ui-spinner" style={{ width: 28, height: 28 }} aria-hidden="true" />
          <h3>Đang đọc và chấm điểm CV của bạn...</h3>
          <p>Thường mất 10-20 giây.</p>
        </div>
      )}

      {review && (
        <>
          <div className="cvs-toolbar">
            <ul className="cvs-toolbar__meta">
              <li>Mục tiêu: {data.targetLabel}</li>
              {when && (
                <li>
                  <Clock size={14} aria-hidden="true" /> {when}
                  {data.cached ? ' · đã lưu' : ''}
                </li>
              )}
              {data.modelName && (
                <li>
                  <Cpu size={14} aria-hidden="true" /> {data.modelName}
                </li>
              )}
            </ul>
            <Button size="sm" variant="secondary" icon={RefreshCw} loading={running} onClick={() => run(true)}>
              Chấm lại
            </Button>
          </div>

          {error && (
            <div className="cvs-note cvs-note--error" role="alert">
              {error}
            </div>
          )}
          {data.stale && !running && (
            <div className="cvs-note" role="status">
              <span>
                <strong>CV hoặc mục tiêu đã thay đổi</strong> kể từ lần chấm này, kết quả có thể chưa còn đúng.
              </span>
              <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => run(true)}>
                Chấm lại
              </Button>
            </div>
          )}

          <div className="cvs-verdict">
            <div className="cvs-verdict__score">
              <span className="ui-match-ring" style={{ '--p': review.overallScore ?? 0 }}>
                <strong>{review.overallScore != null ? `${review.overallScore}` : '—'}</strong>
              </span>
              Điểm CV / 100
            </div>
            <div>
              {review.verdict && <h3 className="cvs-verdict__title">{review.verdict}</h3>}
              {review.summary && <p className="cvs-verdict__summary">{review.summary}</p>}
            </div>
          </div>

          {review.criteria.length > 0 && (
            <section>
              <Head icon={Gauge} title="Điểm theo tiêu chí" />
              <ul className="cvs-list">
                {review.criteria.map((c) => (
                  <li key={c.key} className="cvs-criterion">
                    <div className="cvs-criterion__head">
                      <strong>{c.label}</strong>
                      <span className="cvs-criterion__score">{c.score}</span>
                    </div>
                    <div className="cvs-bar" role="presentation">
                      <span style={{ width: `${c.score}%` }} />
                    </div>
                    {c.finding && <p style={{ margin: 0, color: 'var(--ui-text-2)', lineHeight: 1.65 }}>{c.finding}</p>}
                    {c.fix && (
                      <div className="cvs-row__fix">
                        <span>Cách cải thiện</span>
                        <p style={{ margin: 0 }}>{c.fix}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {review.sectionFindings.length > 0 && (
            <section>
              <Head icon={ListChecks} title="Cần sửa trong CV" count={review.sectionFindings.length} />
              <ul className="cvs-list">
                {review.sectionFindings.map((f, i) => {
                  const sev = SEVERITY[f.severity] || SEVERITY.medium;
                  return (
                    <li key={i} className="cvs-row">
                      <div className="cvs-row__top">
                        <strong>{f.itemLabel}</strong>
                        <span className={`cvs-tag ${sev.className}`}>{sev.label}</span>
                      </div>
                      <p>{f.issue}</p>
                      {f.suggestion && (
                        <div className="cvs-row__fix">
                          <span>Gợi ý</span>
                          <p style={{ margin: 0, color: 'var(--ui-text)' }}>{f.suggestion}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {review.keywordCoverage.length > 0 && (
            <section>
              <Head icon={Tags} title="Từ khóa của vị trí" count={review.keywordCoverage.length} />
              <div className="cvs-keywords">
                {['present', 'missing'].map((status2) => {
                  const items = review.keywordCoverage.filter((k) => k.status === status2);
                  return (
                    <div key={status2} className="cvs-keywords__col">
                      <h4>{status2 === 'present' ? `Đã có trong CV (${items.length})` : `Còn thiếu (${items.length})`}</h4>
                      {items.length === 0 ? (
                        <p className="cvs-empty-line">Không có.</p>
                      ) : (
                        <div className="cvs-chips">
                          {items.map((k) => (
                            <span key={k.keyword} className={`cvs-chip${status2 === 'present' ? ' cvs-chip--have' : ''}`}>
                              {k.keyword}
                              {k.where && <small>{status2 === 'present' ? k.where : `Nên thêm: ${k.where}`}</small>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {review.missingFacts.length > 0 && (
            <section>
              <Head icon={HelpCircle} title="Cần bạn bổ sung" />
              <ul className="cvs-bullets">
                {review.missingFacts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </section>
          )}

          <div className="cvs-actions">
            <Button variant="primary" icon={PenLine} onClick={onGoSuggest}>
              Viết lại nội dung theo các góp ý
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CvReviewPanel;
