import { ArrowLeft, Check, TrendingUp, Target, Gauge, ListChecks, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui';
import AnswerFeedback from './AnswerFeedback';
import { formatDay, formatSpan, levelLabel, paceLabel, typeLabel, verdictOf } from './interviewStudioUtils';

const CRITERIA_LABELS = {
  relevance: 'Đúng trọng tâm',
  structure: 'Cấu trúc',
  depth: 'Chiều sâu và bằng chứng',
  clarity: 'Diễn đạt',
};

const Head = ({ icon: Icon, title, count }) => (
  <header className="cvs-head">
    <Icon size={20} aria-hidden="true" />
    <h3>{title}</h3>
    {count != null && <span className="cvs-head__count">{count}</span>}
  </header>
);

/**
 * Báo cáo cuối buổi: điểm tổng và điểm theo tiêu chí do backend tính từ các câu đã trả lời; phần nhận định, điểm
 * mạnh/yếu lặp lại và việc nên luyện tiếp do AI viết. Có thể mở từng câu để xem lại câu trả lời và phản hồi.
 */
const InterviewReportView = ({ session, onBack, onPracticeAgain, practicing, canPracticeAgain }) => {
  const { report, stats } = session;
  const criteria = Object.entries(session.criteriaScores || {});
  const hasSpeech = stats.averageWordsPerMinute != null;
  const pace = paceLabel(stats.averageWordsPerMinute);

  return (
    <div className="ivs-report">
      <button type="button" className="cvs__back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Về trang luyện tập
      </button>
      <h1 className="cvs__title">Báo cáo buổi phỏng vấn</h1>
      <ul className="cvs-toolbar__meta ivs-report__meta">
        <li>{session.positionTitle}</li>
        <li>
          {levelLabel(session.level)} · {typeLabel(session.interviewType)}
        </li>
        {session.targetKey !== 'none' && <li>{session.targetLabel}</li>}
        <li>{formatDay(session.completedAt || session.createdAt)}</li>
        {session.modelName && <li>{session.modelName}</li>}
      </ul>

      <div className="cvs-panel">
        <div className="cvs-verdict">
          <div className="cvs-verdict__score">
            <span className="ui-match-ring" style={{ '--p': session.overallScore ?? 0 }}>
              <strong>{session.overallScore ?? '—'}</strong>
            </span>
            Điểm buổi phỏng vấn / 100
          </div>
          <div>
            <h3 className="cvs-verdict__title">{session.verdict || verdictOf(session.overallScore)}</h3>
            {report?.summary && <p className="cvs-verdict__summary">{report.summary}</p>}
            <ul className="ivs-stats ivs-stats--report" aria-label="Thống kê buổi phỏng vấn">
              <li>
                Đã trả lời {stats.answered}/{stats.total} câu
              </li>
              {stats.skipped > 0 && <li>Bỏ qua {stats.skipped} câu</li>}
              {stats.totalSeconds > 0 && <li>Tổng thời gian: {formatSpan(stats.totalSeconds)}</li>}
              {hasSpeech && (
                <li>
                  Tốc độ nói trung bình: {stats.averageWordsPerMinute} từ/phút{pace ? ` (${pace})` : ''}
                </li>
              )}
              {stats.fillerTotal > 0 && <li>Từ đệm: {stats.fillerTotal}</li>}
            </ul>
          </div>
        </div>

        {criteria.length > 0 && (
          <section>
            <Head icon={Gauge} title="Điểm theo tiêu chí" />
            <ul className="cvs-list">
              {criteria.map(([key, score]) => (
                <li key={key} className="cvs-criterion">
                  <div className="cvs-criterion__head">
                    <strong>{CRITERIA_LABELS[key] || key}</strong>
                    <span className="cvs-criterion__score">{score}</span>
                  </div>
                  <div className="cvs-bar" role="presentation">
                    <span style={{ width: `${score}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report && (report.strengths.length > 0 || report.weaknesses.length > 0) && (
          <div className="ivs-points">
            {report.strengths.length > 0 && (
              <section className="ivs-block">
                <Head icon={Check} title="Điểm mạnh" />
                <ul className="cvs-bullets">
                  {report.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}
            {report.weaknesses.length > 0 && (
              <section className="ivs-block">
                <Head icon={TrendingUp} title="Cần cải thiện" />
                <ul className="cvs-bullets">
                  {report.weaknesses.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {report && report.priorities.length > 0 && (
          <section>
            <Head icon={Target} title="Nên luyện tiếp" count={report.priorities.length} />
            <ol className="cvs-list ivs-priorities">
              {report.priorities.map((p, i) => (
                <li key={i} className="cvs-row">
                  <div className="cvs-row__top">
                    <strong>
                      {i + 1}. {p.title}
                    </strong>
                  </div>
                  {p.action && p.action !== p.title && <p>{p.action}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <Head icon={ListChecks} title="Từng câu hỏi" count={session.questions.length} />
          <ul className="cvs-list ivs-qlist">
            {session.questions.map((q) => (
              <li key={q.id}>
                <details className="ivs-qrow">
                  <summary>
                    <span className="ivs-qrow__seq">{q.seq}</span>
                    <span className="ivs-qrow__text">{q.question}</span>
                    {q.status === 'answered' ? (
                      <span className="cvs-tag cvs-tag--strong">{q.score}</span>
                    ) : (
                      <span className="cvs-tag cvs-tag--quiet">Chưa trả lời</span>
                    )}
                  </summary>
                  <div className="ivs-qrow__body">
                    {q.status === 'answered' ? (
                      <AnswerFeedback question={q} showAnswer />
                    ) : (
                      <p className="cvs-empty-line">Bạn đã bỏ qua hoặc chưa trả lời câu này.</p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <div className="cvs-actions">
          <Button variant="primary" onClick={onBack}>
            Về trang luyện tập
          </Button>
          {canPracticeAgain && (
            <Button variant="secondary" icon={RotateCcw} loading={practicing} onClick={onPracticeAgain}>
              Luyện lại với bộ câu hỏi mới
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewReportView;
