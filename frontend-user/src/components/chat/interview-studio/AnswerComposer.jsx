import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Keyboard, Square, Send, SkipForward, Clock } from 'lucide-react';
import { Button, Segmented } from '@/components/ui';
import { useSpeechRecognition } from './useSpeech';
import { countWords, formatClock } from './interviewStudioUtils';

const MAX_ANSWER = 4000;

const MODE_OPTIONS = [
  { value: 'typed', label: 'Gõ', icon: Keyboard },
  { value: 'voice', label: 'Nói', icon: Mic },
];

/**
 * Khung trả lời một câu hỏi: gõ hoặc nói (nhận diện giọng nói của trình duyệt, tiếng Việt), đồng hồ bấm giờ và
 * bộ đếm từ. `draft` = { text, spoke, startedAt, elapsed, speech } nằm ở component cha để không mất khi chuyển qua
 * lại giữa các câu; `onDraftChange` nhận object hoặc hàm cập nhật.
 *
 * Thời lượng gửi lên backend: câu nói -> tổng thời gian micro bật (dùng để tính tốc độ nói); câu gõ -> thời gian từ
 * lần gõ đầu tiên tới lúc gửi.
 */
const AnswerComposer = ({ draft, onDraftChange, disabled, canSkip, onSubmit, onSkip }) => {
  const [mode, setMode] = useState(draft.spoke ? 'voice' : 'typed');
  const [now, setNow] = useState(() => Date.now());
  const micStartRef = useRef(null);
  const draftRef = useRef(draft);
  const submittedRef = useRef(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Gửi thất bại (component còn nguyên sau khi hết "đang chấm") thì lần rời câu sau vẫn phải dừng đồng hồ.
  useEffect(() => {
    if (!disabled) submittedRef.current = false;
  }, [disabled]);

  const running = draft.startedAt != null;
  const elapsed = draft.elapsed + (running ? Math.max(0, (now - draft.startedAt) / 1000) : 0);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [running]);

  // Rời câu hỏi (hoặc rời màn hình) thì dừng đồng hồ, để thời gian đi vắng không tính vào câu trả lời.
  useEffect(
    () => () => {
      const current = draftRef.current;
      if (!submittedRef.current && current.startedAt != null) {
        onDraftChange({
          elapsed: current.elapsed + Math.max(0, (Date.now() - current.startedAt) / 1000),
          startedAt: null,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const startClock = useCallback(() => {
    onDraftChange((prev) => (prev.startedAt == null ? { ...prev, startedAt: Date.now() } : prev));
    setNow(Date.now());
  }, [onDraftChange]);

  const appendSpeech = useCallback(
    (chunk) => {
      onDraftChange((prev) => ({ ...prev, spoke: true, text: `${prev.text}${prev.text ? ' ' : ''}${chunk}`.slice(0, MAX_ANSWER) }));
    },
    [onDraftChange]
  );

  const speech = useSpeechRecognition({ onFinal: appendSpeech });

  const stopListening = useCallback(() => {
    speech.stop();
    if (micStartRef.current != null) {
      const spent = (Date.now() - micStartRef.current) / 1000;
      micStartRef.current = null;
      onDraftChange((prev) => ({ ...prev, speech: prev.speech + spent }));
    }
  }, [speech, onDraftChange]);

  const toggleListening = () => {
    if (speech.listening) {
      stopListening();
      return;
    }
    micStartRef.current = Date.now();
    startClock();
    speech.start();
  };

  const changeMode = (next) => {
    if (next === 'typed' && speech.listening) stopListening();
    setMode(next);
  };

  const words = countWords(draft.text);
  const canSubmit = !disabled && draft.text.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    let speechSeconds = draft.speech;
    if (speech.listening) {
      speechSeconds += micStartRef.current != null ? (Date.now() - micStartRef.current) / 1000 : 0;
      stopListening();
    }
    const voice = draft.spoke && speechSeconds >= 1;
    submittedRef.current = true;
    onSubmit({
      answer: draft.text.trim(),
      source: voice ? 'voice' : 'typed',
      durationSeconds: Math.round(voice ? speechSeconds : elapsed),
    });
  };

  return (
    <div className="ivs-answer">
      <div className="ivs-answer__bar">
        {speech.supported ? (
          <Segmented label="Cách trả lời" value={mode} onChange={changeMode} options={MODE_OPTIONS} />
        ) : (
          <span className="cvs-empty-line">Trình duyệt này chưa hỗ trợ nói, hãy gõ câu trả lời (Chrome hoặc Edge hỗ trợ nói).</span>
        )}
        <span className="ivs-clock" aria-label="Thời gian trả lời">
          <Clock size={14} aria-hidden="true" /> {formatClock(elapsed)}
        </span>
      </div>

      {mode === 'voice' && speech.supported && (
        <div className="ivs-mic">
          <button
            type="button"
            className={`ivs-mic__btn${speech.listening ? ' is-on' : ''}`}
            onClick={toggleListening}
            disabled={disabled}
            aria-pressed={speech.listening}
          >
            {speech.listening ? <Square size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
            <span>{speech.listening ? 'Đang nghe, bấm để dừng' : draft.spoke ? 'Nói tiếp' : 'Bấm để bắt đầu nói'}</span>
          </button>
          {speech.listening && (
            <p className="ivs-interim" aria-live="polite">
              {speech.interim || 'Hãy nói câu trả lời của bạn...'}
            </p>
          )}
          {speech.error && (
            <div className="cvs-note cvs-note--error" role="alert">
              {speech.error}
            </div>
          )}
          <p className="ivs-hint-line">
            Trình duyệt chuyển giọng nói thành chữ qua dịch vụ của họ, LemoGuide chỉ nhận phần chữ. Bạn có thể sửa lại chữ trước
            khi gửi.
          </p>
        </div>
      )}

      <textarea
        className="ui-textarea ivs-answer__text"
        rows={8}
        maxLength={MAX_ANSWER}
        value={draft.text}
        disabled={disabled}
        placeholder={mode === 'voice' ? 'Chữ từ giọng nói của bạn sẽ hiện ở đây...' : 'Gõ câu trả lời như khi bạn nói với nhà tuyển dụng...'}
        aria-label="Câu trả lời"
        onChange={(e) => {
          const text = e.target.value;
          onDraftChange((prev) => ({ ...prev, text }));
          if (text) startClock();
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') submit();
        }}
      />
      <div className="ivs-answer__meta">
        <span>
          {words} từ · nên trả lời trong khoảng 1-2 phút (100-250 từ)
        </span>
        <span>
          {draft.text.length}/{MAX_ANSWER}
        </span>
      </div>

      <div className="cvs-actions">
        <Button variant="primary" icon={Send} loading={disabled} disabled={!canSubmit} onClick={submit}>
          {disabled ? 'AI đang chấm...' : 'Gửi câu trả lời'}
        </Button>
        {canSkip && (
          <Button variant="ghost" icon={SkipForward} disabled={disabled} onClick={onSkip}>
            Bỏ qua câu này
          </Button>
        )}
      </div>
    </div>
  );
};

export default AnswerComposer;
