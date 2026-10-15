import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Flag, Info, MessageSquarePlus, Sparkles } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import './AdaptiveHollandChat.css';

const KIND_LABEL = { choice: 'Tình huống' };
const HINT = {
  'Hoạt động': 'Bạn có thích hoạt động này không?',
  'Năng lực': 'Bạn có thể làm tốt việc này không?',
  'Nghề nghiệp': 'Nghề này có hấp dẫn bạn không?',
  'Tự đánh giá': 'So với bạn bè cùng tuổi, bạn tự đánh giá khả năng này ở mức nào?',
};

/** Answer controls for the open question: scenario cards, yes/no items or the 1–7 self-estimate. */
function Choices({ turn, onPick }) {
  if (turn.kind === 'scale') return <div className="ahs-scale">
    <div className="ahs-scale__row" role="group" aria-label="Chọn mức từ 1 đến 7">
      {turn.options.map((o, i) => {
        const [value, label] = o.split(' · ');
        return <button key={o} type="button" className="ahs-level" aria-label={o} onClick={() => onPick(i)}>
          <strong>{value}</strong><small>{label}</small>
        </button>;
      })}
    </div>
    <div className="ahs-scale__ends" aria-hidden="true"><span>Thấp hơn bạn bè</span><span>Cao hơn bạn bè</span></div>
  </div>;
  if (turn.kind === 'binary') return <div className="ahs-binary" role="group" aria-label="Chọn câu trả lời">
    {turn.options.map((o, i) => <button key={o} type="button" className="ahs-option ahs-option--center" onClick={() => onPick(i)}>{o}</button>)}
  </div>;
  return <div className="ahs-choice" role="group" aria-label="Chọn phương án hợp với bạn hơn">
    {turn.options.slice(0, 2).map((o, i) => <button key={o} type="button" className="ahs-option" onClick={() => onPick(i)}>
      <span className="ahs-option__mark" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span>{o}</span>
    </button>)}
    <div className="ahs-choice__more">
      {turn.options.slice(2).map((o, i) => <button key={o} type="button" className="ahs-quiet" onClick={() => onPick(i + 2)}>{o}</button>)}
    </div>
  </div>;
}

/**
 * "Trắc nghiệm với AI" in the studio layout of the AI Coach tools, on the normal light page: top bar, one question
 * card (progress on top, the model's note on the previous answer, the question, the answers) and the journey beside it.
 * Neutral ink with the single accent. Scoring and stopping are decided by the server.
 */
export default function AdaptiveHollandChat({ session, busy, pending, error, onAnswer, onFinish, onExit }) {
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const heading = useRef(null);
  const last = session.turns.at(-1);
  const open = last?.answer == null ? last : null;
  const answered = session.turns.filter((t) => t.answer != null);
  const previous = answered.at(-1);
  // Shown above the open question: the note on the previous answer, or the greeting at the start.
  const reaction = previous?.feedback || (!previous ? session.greeting : null);

  useEffect(() => { if (!busy) heading.current?.focus({ preventScroll: true }); }, [open?.n, busy]);

  const pick = (option) => {
    onAnswer(open.n, option, noteOpen ? note.trim() : '');
    setNote(''); setNoteOpen(false);
  };

  return <div className="ahs">
    <header className="ahs-top">
      <button type="button" className="ahs-back" onClick={onExit} disabled={busy}><ArrowLeft size={16} aria-hidden="true" />Tạm dừng</button>
      <div className="ahs-top__meta">
        <h1>Trắc nghiệm Holland với AI</h1>
        <p>Câu hỏi thay đổi theo câu trả lời của bạn. Bài dừng khi đã đủ thông tin, thường sau 15–25 câu.</p>
      </div>
      {session.canFinish && <Button size="sm" variant="secondary" icon={Flag} disabled={busy} onClick={onFinish}>Xem kết quả ngay</Button>}
    </header>

    <div className="ahs-grid">
      <Card className="ahs-card"><section className="ahs-card__body" aria-live="polite">
        <div className="ahs-progress">
          <span className="ahs-progress__count">Câu {Math.min(session.answered + 1, session.maxTurns)}</span>
          <div className="ahs-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={session.progress} aria-label="Mức đủ thông tin">
            <span style={{ width: `${Math.max(2, session.progress)}%` }} />
          </div>
          <span className="ahs-progress__pct">{session.progress}% đủ thông tin</span>
        </div>

        {error && <p className="ahs-notice" role="alert"><Info size={15} aria-hidden="true" />{error}</p>}
        {session.aiUnavailable && <p className="ahs-notice"><Info size={15} aria-hidden="true" />AI tạm thời không phản hồi. Bài tiếp tục với câu hỏi Holland chuẩn, kết quả vẫn được tính đầy đủ.</p>}

        {busy && open ? <div className="ahs-wait" role="status">
          <p className="ahs-wait__label">Bạn chọn</p>
          <p className="ahs-wait__answer">{pending != null ? open.options[pending] : '…'}</p>
          <div className="ahs-ai">
            <span className="ahs-ai__icon" aria-hidden="true"><Sparkles size={14} /></span>
            <div className="ahs-ai__body">
              <span className="ahs-ai__label">AI đang đọc câu trả lời và chọn câu tiếp theo</span>
              <span className="ui-skel ahs-skel" /><span className="ui-skel ahs-skel ahs-skel--short" />
            </div>
          </div>
        </div> : open && <>
          {reaction && <div className="ahs-ai">
            <span className="ahs-ai__icon" aria-hidden="true"><Sparkles size={14} /></span>
            <div className="ahs-ai__body">
              <span className="ahs-ai__label">{previous ? 'Nhận xét của AI' : 'LemoGuide AI'}</span>
              <p>{reaction}</p>
            </div>
          </div>}

          <div className="ahs-question">
            <span className="ahs-tag">{KIND_LABEL[open.kind] || open.section}</span>
            {open.bridge && <p className="ahs-bridge">{open.bridge}</p>}
            <h2 ref={heading} tabIndex={-1}>{open.prompt}</h2>
            {open.kind !== 'choice' && <p className="ahs-hint">{HINT[open.section]}</p>}
          </div>

          <Choices turn={open} onPick={pick} />

          <div className="ahs-foot">
            {noteOpen ? <label className="ahs-notefield">
              <span>Ghi chú cho AI (không bắt buộc, không tính điểm)</span>
              <textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: mình thích việc này nhưng chỉ khi làm cùng nhóm" />
            </label> : <button type="button" className="discovery-link" onClick={() => setNoteOpen(true)}>
              <MessageSquarePlus size={14} aria-hidden="true" />Thêm ghi chú trước khi chọn
            </button>}
            <span className="discovery-meta">Chọn là gửi ngay</span>
          </div>
        </>}
      </section></Card>

      <Card className="ahs-journey"><aside className="ahs-journey__body" aria-label="Các câu đã trả lời">
        <div className="ahs-journey__head">
          <h3>Hành trình của bạn</h3>
          <span>{answered.length} câu</span>
        </div>
        {answered.length ? <ol className="ahs-timeline">{[...answered].reverse().map((t) => <li key={t.n}>
          <span className="ahs-timeline__dot" aria-hidden="true" />
          <p className="ahs-timeline__a">{t.options[t.answer]}</p>
          <p className="ahs-timeline__q">Câu {t.n} · {t.prompt}</p>
        </li>)}</ol> : <p className="discovery-meta">Câu trả lời của bạn sẽ hiện ở đây.</p>}
        <p className="ahs-journey__how">Mỗi câu trả lời cập nhật ước lượng cho 6 nhóm Holland; câu tiếp theo nhắm vào các nhóm còn sát điểm nhau. Tối thiểu {session.minTurns} câu.</p>
      </aside></Card>
    </div>
  </div>;
}
