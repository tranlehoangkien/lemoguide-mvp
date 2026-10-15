import { Check, TrendingUp, Quote, CornerDownRight, TriangleAlert, Mic } from 'lucide-react';
import { formatSpan, paceLabel, verdictOf } from './interviewStudioUtils';

/**
 * Phản hồi cho một câu trả lời: điểm (do backend tính từ 4 tiêu chí), điểm từng tiêu chí, điểm mạnh, điểm cần sửa,
 * câu trả lời mẫu dựa trên chính ý của người dùng, câu hỏi đào sâu, và số liệu nói. Dùng cả trong phiên luyện tập
 * lẫn trang báo cáo (`compact` bỏ phần tiêu đề điểm để nhúng trong danh sách).
 */
const AnswerFeedback = ({ question, showAnswer = false }) => {
  const evaluation = question.evaluation;
  if (!evaluation) return null;

  const voice = question.answerSource === 'voice';
  const pace = paceLabel(question.wordsPerMinute);
  const attempts = question.attemptCount > 1 && question.previousScore != null;
  const delta = attempts ? question.score - question.previousScore : 0;

  return (
    <div className="ivs-feedback">
      <div className="ivs-score">
        <span className="ui-match-ring" style={{ '--p': question.score ?? 0 }}>
          <strong>{question.score}</strong>
        </span>
        <div>
          <h3 className="ivs-score__title">{verdictOf(question.score)}</h3>
          <p className="ivs-score__meta">
            Điểm câu trả lời / 100
            {attempts && (
              <>
                {' · '}
                <span className="ivs-delta">
                  <TrendingUp size={14} aria-hidden="true" />
                  Lần {question.attemptCount}: {delta > 0 ? `+${delta}` : delta} so với lần trước ({question.previousScore})
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {evaluation.note && (
        <div className="cvs-note" role="status">
          <span>{evaluation.note}</span>
        </div>
      )}

      {showAnswer && question.answer && (
        <div className="ivs-block">
          <h4>Câu trả lời của bạn{voice ? ' (bằng giọng nói)' : ''}</h4>
          <p className="ivs-answer-text">{question.answer}</p>
        </div>
      )}

      {evaluation.criteria.length > 0 && (
        <ul className="cvs-list ivs-criteria">
          {evaluation.criteria.map((c) => (
            <li key={c.key} className="cvs-criterion">
              <div className="cvs-criterion__head">
                <strong>{c.label}</strong>
                <span className="cvs-criterion__score">{c.score}</span>
              </div>
              <div className="cvs-bar" role="presentation">
                <span style={{ width: `${c.score}%` }} />
              </div>
              {c.comment && <p className="ivs-comment">{c.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {(evaluation.strengths.length > 0 || evaluation.improvements.length > 0) && (
        <div className="ivs-points">
          {evaluation.strengths.length > 0 && (
            <div className="ivs-block">
              <h4>
                <Check size={16} aria-hidden="true" /> Điểm mạnh
              </h4>
              <ul className="cvs-bullets">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {evaluation.improvements.length > 0 && (
            <div className="ivs-block">
              <h4>
                <TrendingUp size={16} aria-hidden="true" /> Cần cải thiện
              </h4>
              <ul className="cvs-bullets">
                {evaluation.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {evaluation.sampleAnswer && (
        <div className="ivs-block ivs-sample">
          <h4>
            <Quote size={16} aria-hidden="true" /> Gợi ý cách trả lời tốt hơn
          </h4>
          <p className="ivs-answer-text">{evaluation.sampleAnswer}</p>
          <p className="ivs-hint-line">Viết lại từ chính ý và CV của bạn, hãy nói bằng lời của mình.</p>
          {evaluation.unverifiedNumbers.length > 0 && (
            <div className="cvs-warning" role="status">
              <TriangleAlert size={16} aria-hidden="true" />
              <span>
                Bản mẫu có con số ({evaluation.unverifiedNumbers.join(', ')}) không thấy trong CV hay câu trả lời của bạn. Chỉ
                dùng khi đó là số thật.
              </span>
            </div>
          )}
        </div>
      )}

      {evaluation.followUp && (
        <div className="ivs-block">
          <h4>
            <CornerDownRight size={16} aria-hidden="true" /> Nhà tuyển dụng có thể hỏi tiếp
          </h4>
          <p className="ivs-followup">{evaluation.followUp}</p>
        </div>
      )}

      <ul className="ivs-stats" aria-label="Thống kê câu trả lời">
        {question.durationSeconds != null && <li>Thời gian: {formatSpan(question.durationSeconds)}</li>}
        {question.wordCount != null && <li>{question.wordCount} từ</li>}
        {voice && question.wordsPerMinute != null && (
          <li>
            <Mic size={13} aria-hidden="true" /> Tốc độ nói: {question.wordsPerMinute} từ/phút{pace ? ` (${pace})` : ''}
          </li>
        )}
        {question.fillerCount != null && (
          <li>
            Từ đệm: {question.fillerCount}
            {voice ? ' (trình duyệt thường bỏ bớt từ đệm nên số thực tế có thể cao hơn)' : ''}
          </li>
        )}
      </ul>
    </div>
  );
};

export default AnswerFeedback;
