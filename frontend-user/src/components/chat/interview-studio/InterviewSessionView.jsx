import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Check, ChevronRight, Lightbulb, Sparkles, RotateCcw, Volume2, VolumeX, FlagTriangleRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { interviewService } from '@/services/interviewService';
import AnswerComposer from './AnswerComposer';
import AnswerFeedback from './AnswerFeedback';
import { useSpeechSynthesis } from './useSpeech';
import { errorText, firstOpenIndex, levelLabel, typeLabel } from './interviewStudioUtils';

const EMPTY_DRAFT = { text: '', spoke: false, startedAt: null, elapsed: 0, speech: 0 };

const STATUS_LABEL = { answered: 'đã trả lời', skipped: 'đã bỏ qua', pending: 'chưa trả lời' };

/**
 * Một phiên phỏng vấn đang diễn ra: hiện từng câu hỏi, nhận câu trả lời (gõ hoặc nói), hiện phản hồi ngay sau khi
 * chấm, cho thử lại hoặc bỏ qua, rồi kết thúc để lấy báo cáo. Mọi thứ đã trả lời được backend lưu ngay nên thoát
 * giữa chừng vẫn tiếp tục được từ lịch sử.
 */
const InterviewSessionView = ({ initialSession, onExit, onFinished }) => {
  const [session, setSession] = useState(initialSession);
  const [cursor, setCursor] = useState(() => firstOpenIndex(initialSession));
  const [drafts, setDrafts] = useState({});
  const [retrying, setRetrying] = useState({});
  const [hintOpen, setHintOpen] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const suggestionRequests = useRef(new Set());
  const [busy, setBusy] = useState(null); // 'answer' | 'skip' | 'finish' | null
  const [error, setError] = useState(null);
  const tts = useSpeechSynthesis();
  const rootRef = useRef(null);

  const questions = session.questions;
  const question = questions[cursor];
  const answeredCount = questions.filter((q) => q.status === 'answered').length;
  const openLeft = questions.filter((q) => q.status === 'pending').length;
  const isFeedback = question.status === 'answered' && !retrying[question.id];
  const draft = drafts[question.id] || EMPTY_DRAFT;
  const suggestion = suggestions[question.id];

  const toggleSuggestion = async () => {
    const id = question.id;
    if (suggestionRequests.current.has(id)) return;
    if (suggestion?.answer) {
      setSuggestions((all) => ({ ...all, [id]: { ...all[id], open: !all[id].open } }));
      return;
    }
    suggestionRequests.current.add(id);
    setSuggestions((all) => ({ ...all, [id]: { open: true, loading: true } }));
    try {
      const result = await interviewService.suggestAnswer(session.id, id);
      if (!result?.answer) throw new Error('Chưa nhận được gợi ý. Vui lòng thử lại.');
      setSuggestions((all) => ({ ...all, [id]: { open: true, answer: result.answer } }));
    } catch (err) {
      setSuggestions((all) => ({ ...all, [id]: { open: true, error: errorText(err, 'Không thể tạo gợi ý lúc này. Vui lòng thử lại.') } }));
    } finally {
      suggestionRequests.current.delete(id);
    }
  };

  // Sang câu khác hoặc khi phản hồi hiện ra thì cuộn về đầu để thấy câu hỏi / điểm.
  useEffect(() => {
    rootRef.current?.scrollIntoView?.({ block: 'start' });
  }, [cursor, isFeedback]);

  // Đổi câu hỏi thì thôi đọc và xóa lỗi của câu trước.
  const go = (index) => {
    tts.cancel();
    setError(null);
    setCursor(index);
  };

  const updateDraft = useCallback(
    (id) => (patch) =>
      setDrafts((all) => {
        const prev = all[id] || EMPTY_DRAFT;
        return { ...all, [id]: typeof patch === 'function' ? patch(prev) : { ...prev, ...patch } };
      }),
    []
  );
  const draftUpdater = useMemo(() => updateDraft(question.id), [updateDraft, question.id]);

  const nextOpen = useCallback(
    (from, list) => {
      for (let step = 1; step <= list.length; step += 1) {
        const index = (from + step) % list.length;
        if (list[index].status === 'pending') return index;
      }
      return -1;
    },
    []
  );

  const submit = async ({ answer, durationSeconds, source }) => {
    setBusy('answer');
    setError(null);
    try {
      const updated = await interviewService.answer(session.id, question.id, { answer, durationSeconds, source });
      setSession(updated);
      setDrafts((all) => {
        const rest = { ...all };
        delete rest[question.id];
        return rest;
      });
      setRetrying((all) => ({ ...all, [question.id]: false }));
    } catch (err) {
      setError(errorText(err, 'Không thể chấm câu trả lời lúc này, vui lòng thử lại. Câu trả lời của bạn vẫn còn trong khung.'));
    } finally {
      setBusy(null);
    }
  };

  const skip = async () => {
    setBusy('skip');
    setError(null);
    try {
      const updated = await interviewService.skip(session.id, question.id);
      setSession(updated);
      const next = nextOpen(cursor, updated.questions);
      if (next >= 0) go(next);
    } catch (err) {
      setError(errorText(err, 'Không thể bỏ qua câu này lúc này.'));
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    setBusy('finish');
    setError(null);
    try {
      const finished = await interviewService.finish(session.id);
      onFinished(finished);
    } catch (err) {
      setError(errorText(err, 'Không thể tạo báo cáo lúc này, vui lòng thử lại. Các câu trả lời của bạn đã được lưu.'));
      setBusy(null);
    }
  };

  const goNext = () => {
    const next = nextOpen(cursor, questions);
    if (next >= 0) go(next);
  };

  const readQuestion = () => (tts.speaking ? tts.cancel() : tts.speak(question.question));

  const allDone = openLeft === 0;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="ivs-session" ref={rootRef}>
      <div className="ivs-topbar">
        <button type="button" className="cvs__back" onClick={onExit} disabled={busy != null}>
          <ArrowLeft size={16} aria-hidden="true" /> Lưu và thoát
        </button>
        <div className="ivs-topbar__meta">
          <strong>{session.positionTitle}</strong>
          <span>
            {levelLabel(session.level)} · {typeLabel(session.interviewType)}
            {session.targetKey !== 'none' ? ` · ${session.targetLabel}` : ''}
          </span>
        </div>
        {answeredCount > 0 && !allDone && (
          <Button variant="secondary" size="sm" icon={FlagTriangleRight} loading={busy === 'finish'} disabled={busy != null} onClick={finish}>
            Kết thúc sớm
          </Button>
        )}
      </div>

      <div className="ivs-progress" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}
        aria-label={`Đã trả lời ${answeredCount} trên ${questions.length} câu`}>
        <div className="cvs-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <span className="ivs-progress__text">
          Câu {cursor + 1}/{questions.length} · đã trả lời {answeredCount}
        </span>
      </div>

      <ol className="ivs-steps" aria-label="Danh sách câu hỏi">
        {questions.map((q, index) => (
          <li key={q.id}>
            <button
              type="button"
              className={`ivs-step ivs-step--${q.status}${index === cursor ? ' is-current' : ''}`}
              onClick={() => go(index)}
              disabled={busy != null}
              aria-current={index === cursor ? 'step' : undefined}
              aria-label={`Câu ${q.seq}, ${STATUS_LABEL[q.status] || q.status}${q.score != null ? `, ${q.score} điểm` : ''}`}
            >
              {q.status === 'answered' ? <Check size={14} aria-hidden="true" /> : q.seq}
            </button>
          </li>
        ))}
      </ol>

      <section className="ivs-question" aria-label={`Câu hỏi ${question.seq}`}>
        <div className="ivs-question__top">
          <span className="cvs-tag">{question.categoryLabel}</span>
          <span className="ivs-question__actions">
            {tts.available && (
              <button type="button" className="cvs-link" onClick={readQuestion}>
                {tts.speaking ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
                {tts.speaking ? 'Dừng đọc' : 'Nghe câu hỏi'}
              </button>
            )}
            {question.hint && !isFeedback && (
              <button
                type="button"
                className="cvs-link"
                aria-expanded={Boolean(hintOpen[question.id])}
                onClick={() => setHintOpen((all) => ({ ...all, [question.id]: !all[question.id] }))}
              >
                <Lightbulb size={15} aria-hidden="true" /> {hintOpen[question.id] ? 'Ẩn gợi ý' : 'Gợi ý cách trả lời'}
              </button>
            )}
            {!isFeedback && (
              <Button variant="ai" size="sm" icon={Sparkles}
                loading={Boolean(suggestion?.loading)} disabled={busy != null || suggestion?.loading}
                aria-expanded={Boolean(suggestion?.open)} aria-controls={`answer-suggestion-${question.id}`}
                onClick={toggleSuggestion}>
                {suggestion?.loading ? 'Đang tạo gợi ý…' : suggestion?.answer && suggestion.open ? 'Ẩn câu trả lời gợi ý' : 'Gợi ý câu trả lời'}
              </Button>
            )}
          </span>
        </div>
        <h2 className="ivs-question__text">{question.question}</h2>
        {hintOpen[question.id] && !isFeedback && (
          <div className="ivs-hintbox">
            {question.intent && (
              <p>
                <strong>Nhà tuyển dụng muốn thấy:</strong> {question.intent}
              </p>
            )}
            <p>
              <strong>Hướng trả lời:</strong> {question.hint}
            </p>
          </div>
        )}
        {!isFeedback && suggestion?.open && (
          <div className="ivs-hintbox ivs-answer-suggestion" id={`answer-suggestion-${question.id}`} aria-busy={Boolean(suggestion.loading)}>
            {suggestion.loading && <p role="status">AI đang soạn câu trả lời tham khảo cho câu hỏi này…</p>}
            {suggestion.error && <>
              <p role="alert">{suggestion.error}</p>
              <Button variant="secondary" size="sm" onClick={toggleSuggestion} disabled={busy != null}>Thử lại</Button>
            </>}
            {suggestion.answer && <>
              <strong>Câu trả lời tham khảo</strong>
              <p className="ivs-answer-suggestion__text">{suggestion.answer}</p>
              <p className="ui-hint">Hãy điều chỉnh theo trải nghiệm thật của bạn và diễn đạt bằng lời của mình.</p>
            </>}
          </div>
        )}
      </section>

      {error && (
        <div className="cvs-note cvs-note--error" role="alert">
          <span>{error}</span>
          {busy == null && allDone && (
            <Button size="sm" variant="secondary" onClick={finish}>
              Thử lại
            </Button>
          )}
        </div>
      )}

      {isFeedback ? (
        <>
          <AnswerFeedback question={question} showAnswer />
          <div className="cvs-actions">
            {!allDone && (
              <Button variant="primary" trailingIcon={ChevronRight} onClick={goNext}>
                Câu tiếp theo
              </Button>
            )}
            {allDone && (
              <Button variant="primary" icon={FlagTriangleRight} loading={busy === 'finish'} onClick={finish}>
                Kết thúc và xem báo cáo
              </Button>
            )}
            <Button
              variant="secondary"
              icon={RotateCcw}
              disabled={busy != null}
              onClick={() => setRetrying((all) => ({ ...all, [question.id]: true }))}
            >
              Thử trả lời lại
            </Button>
          </div>
        </>
      ) : (
        <>
          {question.status === 'answered' && (
            <div className="cvs-note" role="status">
              <span>Bạn đang trả lời lại câu này. Điểm mới sẽ thay cho điểm hiện tại ({question.score}).</span>
              <Button size="sm" variant="ghost" disabled={busy != null} onClick={() => setRetrying((all) => ({ ...all, [question.id]: false }))}>
                Giữ kết quả cũ
              </Button>
            </div>
          )}
          <AnswerComposer
            key={`${question.id}|${question.attemptCount}`}
            draft={draft}
            onDraftChange={draftUpdater}
            disabled={busy === 'answer'}
            canSkip={question.status !== 'answered'}
            onSubmit={submit}
            onSkip={skip}
          />
          {allDone && question.status === 'skipped' && (
            <div className="cvs-handoff">
              <div>
                <strong>Đã hết câu hỏi chưa trả lời</strong>
                <span>Bạn có thể trả lời câu này hoặc kết thúc để xem báo cáo.</span>
              </div>
              <Button variant="secondary" icon={FlagTriangleRight} loading={busy === 'finish'} disabled={answeredCount === 0} onClick={finish}>
                Kết thúc và xem báo cáo
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewSessionView;
