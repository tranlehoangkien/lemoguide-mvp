import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Compass, Heart, Hexagon, Target, ArrowRight, ArrowLeft, CheckCircle2, TrendingUp, History, Check, X, Info, ListChecks, SearchX, AlertCircle, Undo2 } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { Page, PageHeader, Card, Button, Badge, Bar, SectionCard, EmptyState, FormAlert } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { discoveryService } from '@/services/discoveryService';
import SelfDiscoveryStage from './SelfDiscoveryStage';
import HollandResult from './HollandResult';
import AdaptiveHollandChat from './AdaptiveHollandChat';
import './SelfDiscovery.css';

/** Per assessment kind: icon and the question it answers ("Tôi là ai?" for reflection, "Tôi đang ở đâu?" for skills). */
const KINDS = {
  holland: { icon: Hexagon, question: 'Tôi là ai?' },
  interests: { icon: Compass, question: 'Tôi là ai?' },
  values: { icon: Heart, question: 'Tôi là ai?' },
  skills: { icon: Target, question: 'Tôi đang ở đâu?' },
};
const HISTORY_PREVIEW = 6;
const dateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '');
const day = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '');
const signed = (value) => `${value > 0 ? '+' : ''}${value}`;

function Loading() {
  return <div className="discovery-skeleton" role="status" aria-label="Đang tải bài đánh giá">
    <div className="discovery-catalog">{[0, 1, 2].map((i) => <span key={i} className="ui-skel" />)}</div>
    <span className="ui-skel discovery-skeleton__wide" />
  </div>;
}

/** One assessment the user can start, continue or retake; the CTA row is pinned to the bottom of every card. */
function CatalogCard({ item, draft, latest, busy, onStart, onOpen }) {
  const kind = KINDS[item.kind] || KINDS.interests;
  const Icon = kind.icon;
  return <Card className="discovery-choice"><article className="discovery-choice__body">
    <div className="discovery-choice__top">
      <span className="discovery-choice__icon" aria-hidden="true"><Icon size={20} /></span>
      <span className="discovery-kicker">{kind.question}</span>
    </div>
    <h3>{item.title}</h3>
    <p className="discovery-choice__desc">{item.description}</p>
    <p className="discovery-meta">{item.total} câu · khoảng {item.minutes || '5–8'} phút</p>
    <div className="discovery-choice__status">
      {draft ? <>
        <span>Đang làm dở · {draft.answered}/{draft.total} câu</span>
        <Bar percent={(draft.answered / draft.total) * 100} />
      </> : latest ? <span><CheckCircle2 size={14} aria-hidden="true" />Hoàn thành ngày {day(latest.completedAt)}</span>
        : <span>Chưa thực hiện</span>}
    </div>
    <div className="discovery-choice__actions">
      <Button loading={busy} onClick={() => onStart(item.kind)} trailingIcon={ArrowRight}>
        {draft ? 'Tiếp tục' : latest ? 'Đánh giá lại' : 'Bắt đầu'}
      </Button>
      {latest && <button type="button" className="discovery-link" disabled={busy} onClick={() => onOpen(latest.id)}>Xem kết quả</button>}
    </div>
  </article></Card>;
}

function ProgressPanel({ progress, busy, onStart }) {
  const compared = progress?.attempts > 1;
  return <SectionCard icon={TrendingUp} title="Tiến bộ năng lực" className="discovery-progress"
    action={progress?.attempts ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => onStart('skills')}>Đánh giá lại</Button> : null}>
    {!progress?.attempts ? <div className="discovery-empty-inline">
      <p>Hoàn thành bài <strong>Năng lực nền tảng</strong> để tạo mốc ban đầu. Sau mỗi chặng học, làm lại bài để thấy bạn đã tiến bộ ở đâu.</p>
      <Button size="sm" disabled={busy} onClick={() => onStart('skills')} trailingIcon={ArrowRight}>Tạo mốc ban đầu</Button>
    </div> : <>
      <p className="discovery-meta">
        {compared ? `So sánh ${progress.attempts} lần đánh giá cùng bộ câu hỏi nền` : 'Đã lưu mốc ban đầu'} · Mốc đầu {day(progress.baselineAt)} · Gần nhất {day(progress.latestAt)}
      </p>
      <ul className="discovery-changes">{progress.changes.map((c) => <li key={c.label}>
        <div className="discovery-changes__head">
          <strong>{c.label}</strong>
          <span className="discovery-score">{c.latest}<small>/100</small></span>
        </div>
        <Bar percent={c.latest} />
        <p className="discovery-meta">
          Lần đầu {c.baseline}
          {compared && <> · <span className="discovery-delta">{signed(c.fromBaseline)} so với lần đầu</span> · {signed(c.fromPrevious)} so với lần trước</>}
        </p>
      </li>)}</ul>
      <p className="discovery-meta">Gợi ý đánh giá lại từ {day(progress.suggestedReviewAt)}, sau khi thực hành hoặc hoàn thành một mốc lộ trình.</p>
      <p className="discovery-note"><Info size={15} aria-hidden="true" />Điểm phản ánh bài tình huống ngắn, không phải chứng nhận năng lực. Việc nhớ câu hỏi có thể ảnh hưởng điểm làm lại; hãy kết hợp với sản phẩm thực hành và phản hồi từ người hướng dẫn.</p>
    </>}
  </SectionCard>;
}

function HistoryPanel({ history, busy, onOpen }) {
  const [all, setAll] = useState(false);
  const shown = all ? history : history.slice(0, HISTORY_PREVIEW);
  return <SectionCard icon={History} title="Lịch sử" count={history.length || null} className="discovery-history-card">
    {!history.length ? <p className="discovery-meta">Chưa có bài đánh giá nào. Chọn một bài ở trên để bắt đầu.</p> : <>
      <ul className="discovery-history">{shown.map((h) => <li key={h.id}>
        <div>
          <strong>{h.title}</strong>
          <span>{dateTime(h.completedAt || h.createdAt)} · {h.completedAt ? 'Đã hoàn thành' : `Đã lưu ${h.answered}/${h.total} câu`}</span>
        </div>
        <button type="button" className="discovery-link" disabled={busy} onClick={() => onOpen(h.id)}>{h.completedAt ? 'Xem' : 'Tiếp tục'}</button>
      </li>)}</ul>
      {history.length > HISTORY_PREVIEW && <button type="button" className="discovery-link" onClick={() => setAll(!all)}>{all ? 'Thu gọn' : `Xem tất cả ${history.length} bài`}</button>}
      <p className="discovery-meta">Lưu tối đa 100 bài gần nhất. Mốc năng lực ban đầu luôn được giữ lại.</p>
    </>}
  </SectionCard>;
}

function Question({ attempt, selected, setSelected, busy, onAnswer, heading }) {
  const q = attempt.question;
  const last = attempt.answered + 1 === attempt.total;
  return <Card className="discovery-session"><section className="discovery-session__body">
    <div className="discovery-session__head">
      <span className="discovery-kicker">{attempt.title}</span>
      <span className="discovery-count">Câu {attempt.answered + 1}<small>/{attempt.total}</small></span>
    </div>
    <Bar percent={(attempt.answered / attempt.total) * 100} />
    <p className="discovery-meta">{q.dimension} · {q.adaptive ? 'Câu hỏi theo câu trả lời của bạn' : 'Câu hỏi nền tảng'}</p>
    <h2 ref={heading} tabIndex={-1}>{q.prompt}</h2>
    <fieldset className="discovery-options" disabled={busy}>
      <legend className="ui-sr-only">Chọn một câu trả lời phù hợp nhất</legend>
      {q.options.map((option, i) => <label key={`${q.id}-${i}`} className={`discovery-option${selected === i ? ' is-selected' : ''}`}>
        <input type="radio" name="answer" value={i} checked={selected === i} onChange={() => setSelected(i)} />
        <span className="discovery-option__mark" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
        <span>{option}</span>
      </label>)}
    </fieldset>
    <div className="discovery-session__foot">
      <p className="discovery-meta">Câu trả lời được lưu khi bạn nhấn tiếp tục và không sửa lại được. Bạn có thể dừng giữa chừng.</p>
      <Button onClick={onAnswer} disabled={selected === null} loading={busy} trailingIcon={ArrowRight}>{last ? 'Xem kết quả' : 'Lưu và tiếp tục'}</Button>
    </div>
  </section></Card>;
}

/** The four Holland parts in bank order with their sizes (mirrors HollandBank: 8 items × 6 types, self-rating 2 × 6). */
const HOLLAND_PARTS = [
  { title: 'Hoạt động', size: 48, hint: 'Bạn có thích làm không' },
  { title: 'Năng lực', size: 48, hint: 'Bạn có làm tốt không' },
  { title: 'Nghề nghiệp', size: 48, hint: 'Nghề có hấp dẫn bạn không' },
  { title: 'Tự đánh giá', size: 12, hint: 'Thang 1–7 so với bạn bè' },
];

/**
 * Holland items in the same studio layout as "Trắc nghiệm với AI": top bar, one question card and the four parts beside
 * it. One click (or key 1–7) saves the answer and moves on, so the last answer of this session can be taken back.
 * The scored type is not shown; only the part and how to answer it.
 */
function HollandQuestion({ attempt, pending, busy, onAnswer, onUndo, canUndo, onExit, heading }) {
  const q = attempt.question;
  const scale = q.options.length > 2;
  const part = q.section.split(' · ').at(-1);
  const percent = Math.round((attempt.answered / attempt.total) * 100);
  const parts = HOLLAND_PARTS.map((p, i) => {
    const before = HOLLAND_PARTS.slice(0, i).reduce((sum, x) => sum + x.size, 0);
    return { ...p, done: Math.min(Math.max(attempt.answered - before, 0), p.size) };
  });
  const current = parts.findIndex((p) => p.title === part);

  useEffect(() => {
    const onKey = (e) => {
      if (busy || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < q.options.length) { e.preventDefault(); onAnswer(i); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, q.options.length, onAnswer]);

  return <div className="ahs">
    <header className="ahs-top">
      <button type="button" className="ahs-back" onClick={onExit} disabled={busy}><ArrowLeft size={16} aria-hidden="true" />Tạm dừng</button>
      <div className="ahs-top__meta">
        <h1>{attempt.title}</h1>
        <p>{attempt.total} câu ngắn trong 4 phần. Không có đáp án đúng hay sai; chọn là lưu ngay và bạn có thể dừng, tiếp tục bất cứ lúc nào.</p>
      </div>
    </header>

    <div className="ahs-grid">
      <Card className="ahs-card"><section className="ahs-card__body" aria-live="polite">
        <div className="ahs-progress">
          <span className="ahs-progress__count">Câu {attempt.answered + 1}<small>/{attempt.total}</small></span>
          <div className="ahs-progress__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Tiến độ bài trắc nghiệm">
            <span style={{ width: `${Math.max(2, percent)}%` }} />
          </div>
          <span className="ahs-progress__pct">{percent}%</span>
        </div>

        <div className="ahs-question" key={q.id}>
          <span className="ahs-tag">{q.section}</span>
          <h2 ref={heading} tabIndex={-1}>{q.prompt}</h2>
          <p className="ahs-hint">{q.instruction}</p>
        </div>

        {scale ? <div className="ahs-scale">
          <div className="ahs-scale__row" role="group" aria-label="Chọn mức từ 1 đến 7, câu trả lời được lưu ngay">
            {q.options.map((option, i) => {
              const [value, label] = option.split(' · ');
              return <button key={`${q.id}-${i}`} type="button" className={`ahs-level${pending === i ? ' is-pending' : ''}`}
                aria-label={option} disabled={busy} onClick={() => onAnswer(i)}>
                <strong>{value}</strong><small>{label}</small>
              </button>;
            })}
          </div>
          <div className="ahs-scale__ends" aria-hidden="true"><span>Thấp hơn bạn bè</span><span>Cao hơn bạn bè</span></div>
        </div> : <div className="ahs-binary" role="group" aria-label="Chọn câu trả lời, câu trả lời được lưu ngay">
          {q.options.map((option, i) => <button key={`${q.id}-${i}`} type="button" className={`ahs-option ahs-option--center hq-option${pending === i ? ' is-pending' : ''}`}
            disabled={busy} onClick={() => onAnswer(i)}>
            <span>{option}</span><kbd aria-hidden="true">{i + 1}</kbd>
          </button>)}
        </div>}

        <div className="ahs-foot">
          {canUndo ? <button type="button" className="discovery-link" disabled={busy} onClick={onUndo}>
            <Undo2 size={14} aria-hidden="true" />Sửa câu trước
          </button> : <span className="discovery-meta">Trả lời theo cảm nhận đầu tiên</span>}
          <span className="discovery-meta">Chọn là lưu ngay<span className="hq-keys"> · phím {scale ? '1–7' : '1 / 2'}</span></span>
        </div>
      </section></Card>

      <Card className="ahs-journey"><aside className="ahs-journey__body" aria-label="Các phần của bài trắc nghiệm">
        <div className="ahs-journey__head">
          <h3>Các phần</h3>
          <span>{attempt.answered}/{attempt.total} câu</span>
        </div>
        <ol className="hq-parts">{parts.map((p, i) => {
          const state = p.done === p.size ? 'done' : i === current ? 'current' : 'todo';
          return <li key={p.title} className={`is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="hq-parts__dot" aria-hidden="true">{state === 'done' ? <Check size={12} strokeWidth={2.5} /> : i + 1}</span>
            <div className="hq-parts__body">
              <div className="hq-parts__head">
                <strong>{p.title}</strong>
                <span>{state === 'done' ? 'Xong' : state === 'current' ? `${p.done}/${p.size}` : `${p.size} câu`}</span>
              </div>
              <p>{p.hint}</p>
              {state === 'current' && <div className="hq-parts__bar"><span style={{ width: `${Math.max(3, (p.done / p.size) * 100)}%` }} /></div>}
            </div>
          </li>;
        })}</ol>
        <p className="ahs-journey__how">Mã Holland được tính từ cả bốn phần, nên hãy trả lời hết để kết quả ổn định. Nhóm Holland của từng câu được ẩn để bạn trả lời tự nhiên.</p>
      </aside></Card>
    </div>
  </div>;
}

function Result({ attempt, busy, onStart, heading }) {
  if (attempt.result.holland) return <HollandResult attempt={attempt} busy={busy} onStart={onStart} heading={heading} />;
  const { result } = attempt;
  return <>
    <Card className="discovery-result"><section className="discovery-result__body">
      <div className="discovery-result__head">
        <div>
          <span className="discovery-kicker">Kết quả · {dateTime(attempt.completedAt)}</span>
          <h2 ref={heading} tabIndex={-1}>{attempt.title}</h2>
        </div>
        <Badge tone="success"><CheckCircle2 size={13} aria-hidden="true" />Đã hoàn thành</Badge>
      </div>
      <p className="discovery-summary">{result.summary}</p>
      <ul className="discovery-scores">{result.scores.map((s) => <li key={s.dimension}>
        <div className="discovery-changes__head">
          <strong>{s.label}</strong>
          <span className="discovery-score" aria-label={`${s.label}: ${s.score} trên 100`}>{s.score}<small>/100</small></span>
        </div>
        <Bar percent={s.score} />
        <p>{s.action}</p>
      </li>)}</ul>
      <p className="discovery-note"><Info size={15} aria-hidden="true" />{result.note}</p>
      <div className="discovery-result__actions">
        <Link className="ui-btn ui-btn--primary ui-btn--has-trail" to={ROUTES.CAREER_ROADMAP}>
          <span>Xây dựng hoặc điều chỉnh lộ trình</span><span className="ui-btn__trail"><ArrowRight size={14} aria-hidden="true" /></span>
        </Link>
        <Button variant="secondary" onClick={() => onStart(attempt.kind)} loading={busy}>Đánh giá lại</Button>
      </div>
      <p className="discovery-meta">Khi tạo hoặc điều chỉnh lộ trình, chọn dùng hồ sơ để đưa kết quả mới nhất vào tư vấn. Lộ trình hiện có chỉ thay đổi khi bạn chủ động điều chỉnh.</p>
    </section></Card>
    {result.review.length > 0 && <SectionCard icon={ListChecks} title="Nhìn lại từng tình huống" count={result.review.length}>
      <p className="discovery-meta">Đọc lời giải và thử áp dụng vào công việc trước khi đánh giá lại.</p>
      <ul className="discovery-review">{result.review.map((r, i) => {
        const right = r.selected === r.correct;
        return <li key={i}><details>
          <summary>
            <span className={`discovery-review__mark${right ? ' is-right' : ''}`} aria-label={right ? 'Trả lời đúng' : 'Chưa đúng'}>{right ? <Check size={14} /> : <X size={14} />}</span>
            <span>{i + 1}. {r.question}{r.adaptive && <em> · Luyện tập thích ứng</em>}</span>
          </summary>
          <div className="discovery-review__body">
            <p><span>Bạn chọn</span>{r.selected}</p>
            {!right && <p><span>Đáp án</span><strong>{r.correct}</strong></p>}
            <p className="discovery-meta">{r.explanation}</p>
          </div>
        </details></li>;
      })}</ul>
    </SectionCard>}
  </>;
}

export default function SelfDiscoveryPage() {
  const [params, setParams] = useSearchParams();
  const attemptId = params.get('attempt');
  const aiId = params.get('ai');
  // Without ?attempt or ?view=all the page opens on the intro stage (same pattern as "Việc làm phù hợp").
  const intro = !attemptId && !aiId && params.get('view') !== 'all';
  const [catalog, setCatalog] = useState([]);
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const heading = useRef(null);
  const actionLock = useRef(false);
  // Holland answers given in this session, newest last, so "Sửa câu trước" knows which answer to take back.
  const [given, setGiven] = useState([]);
  // "Trắc nghiệm với AI" session shown at ?ai=<id>.
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([discoveryService.catalog(), discoveryService.history(), discoveryService.progress(),
      attemptId ? discoveryService.get(attemptId) : Promise.resolve(null),
      aiId ? discoveryService.getAdaptive(aiId) : Promise.resolve(null)])
      .then(([c, h, p, a, s]) => {
        if (!active) return;
        // An unfinished AI test opened from the history continues in the chat view.
        if (a?.kind === 'holland-ai' && !a.completedAt) { setParams({ ai: a.id }, { replace: true }); return; }
        setCatalog(c); setHistory(h); setProgress(p); setAttempt(a); setSession(s); setSelected(null); setError('');
      })
      .catch((e) => { if (active) setError(e.message || 'Không tải được dữ liệu.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attemptId, aiId, revision, setParams]);

  useEffect(() => { heading.current?.focus(); }, [attempt?.question?.id, attempt?.completedAt]);

  const run = async (action) => {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e.message || 'Chưa lưu được. Vui lòng thử lại.'); }
    finally { actionLock.current = false; setBusy(false); }
  };
  const open = (id) => { setLoading(true); setAttempt(null); setSession(null); setGiven([]); setParams(id ? { attempt: id } : { view: 'all' }); };
  const showAll = () => setParams({ view: 'all' });
  const showIntro = () => setParams({});
  const startAi = () => run(async () => {
    const s = await discoveryService.startAdaptive();
    setSession(s); setAttempt(null); setParams({ ai: s.id });
  });
  const start = (kind) => (kind === 'holland-ai' ? startAi() : run(async () => { const a = await discoveryService.start(kind); open(a.id); }));
  const answerAi = (turn, option, note) => run(async () => {
    setSelected(option);
    const s = await discoveryService.answerAdaptive(session.id, turn, option, note);
    setSession(s); setSelected(null);
    if (s.completedAt) setRevision((v) => v + 1);
  });
  const finishAi = () => run(async () => {
    const s = await discoveryService.finishAdaptive(session.id);
    setSession(s); setRevision((v) => v + 1);
  });
  const answer = () => run(async () => {
    const a = await discoveryService.answer(attempt.id, attempt.question.id, selected);
    setAttempt(a); setSelected(null);
    if (a.completedAt) setRevision((v) => v + 1);
  });
  const answerHolland = (option) => run(async () => {
    setSelected(option);
    const a = await discoveryService.answer(attempt.id, attempt.question.id, option);
    setGiven((g) => [...g, attempt.question.id]);
    setAttempt(a); setSelected(null);
    if (a.completedAt) setRevision((v) => v + 1);
  });
  const undo = () => run(async () => {
    const a = await discoveryService.undo(attempt.id, given[given.length - 1]);
    setGiven((g) => g.slice(0, -1));
    setAttempt(a); setSelected(null);
  });
  const reload = () => { setLoading(true); setRevision((v) => v + 1); };
  const failedInitially = error && !loading && !catalog.length;

  if (intro) return <UserLayout fullBleed>
    <SelfDiscoveryStage catalog={catalog} history={history} progress={progress} loading={loading} busy={busy}
      error={failedInitially ? error : ''} notice={failedInitially ? '' : error} onStart={start} onOpenAll={showAll} onRetry={reload}
      onStartAi={startAi} />
  </UserLayout>;

  // A running AI test or Holland inventory brings its own studio top bar instead of the page header.
  const hollandRunning = !loading && !!attempt?.question?.section;
  const studio = (aiId && session && !session.completedAt && !loading) || hollandRunning;
  return <UserLayout><Page className="discovery-page">
    {!studio && <PageHeader title="Khám phá bản thân" description="Tìm mã Holland của bạn, hiểu điều bạn coi trọng, nhận diện năng lực hiện tại và nhìn lại thay đổi qua từng chặng."
      back={!attemptId && !aiId ? <button type="button" className="ui-back-btn" onClick={showIntro}>
        <ArrowLeft size={16} aria-hidden="true" /><span>Quay lại trang giới thiệu</span>
      </button> : undefined} />}

    {failedInitially ? <Card><EmptyState icon={AlertCircle} title="Không tải được dữ liệu" hint={error}
      action={<Button variant="secondary" onClick={reload}>Thử lại</Button>} /></Card> : <>
      {error && !studio && <FormAlert>{error}</FormAlert>}
      {loading ? <Loading /> : aiId ? (session ? (studio ? <AdaptiveHollandChat session={session} busy={busy} pending={busy ? selected : null} error={error}
          onAnswer={answerAi} onFinish={finishAi} onExit={() => open(null)} />
        : <div className="discovery-focus discovery-focus--wide">
          <div><Button variant="ghost" size="sm" icon={ArrowLeft} disabled={busy} onClick={() => open(null)}>Tất cả bài đánh giá</Button></div>
          <HollandResult busy={busy} onStart={start} heading={heading}
            attempt={{ id: session.id, kind: 'holland-ai', title: 'Trắc nghiệm Holland với AI', completedAt: session.completedAt, result: session.result }} />
        </div>) : <Card><EmptyState icon={SearchX} title="Không tìm thấy bài trắc nghiệm"
          hint="Bài có thể không thuộc tài khoản của bạn."
          action={<Button variant="secondary" icon={ArrowLeft} onClick={() => open(null)}>Về khám phá bản thân</Button>} /></Card>)
        : attemptId && !attempt ? <Card><EmptyState icon={SearchX} title="Không tìm thấy bài đánh giá"
        hint="Bài có thể đã bị xóa khỏi lịch sử hoặc không thuộc tài khoản của bạn."
        action={<Button variant="secondary" icon={ArrowLeft} onClick={() => open(null)}>Về khám phá bản thân</Button>} /></Card>
        : hollandRunning ? <>
          {error && <FormAlert>{error}</FormAlert>}
          <HollandQuestion attempt={attempt} pending={busy ? selected : null} busy={busy} onAnswer={answerHolland}
            onUndo={undo} canUndo={given.length > 0} onExit={() => open(null)} heading={heading} />
        </>
        : attempt ? <div className={`discovery-focus${attempt.result?.holland ? ' discovery-focus--wide' : ''}`}>
          <div><Button variant="ghost" size="sm" icon={ArrowLeft} disabled={busy} onClick={() => open(null)}>{attempt.completedAt ? 'Tất cả bài đánh giá' : 'Tạm dừng và quay lại'}</Button></div>
          {attempt.question ? <Question attempt={attempt} selected={selected} setSelected={setSelected} busy={busy} onAnswer={answer} heading={heading} />
            : attempt.result && <Result attempt={attempt} busy={busy} onStart={start} heading={heading} />}
        </div> : <>
          <section className="discovery-section" aria-labelledby="discovery-catalog-title">
            <div className="discovery-section__head">
              <h2 id="discovery-catalog-title">Chọn một bài để bắt đầu</h2>
              <p className="discovery-meta">Mỗi bài có thể dừng và tiếp tục bất cứ lúc nào. Kết quả được dùng khi bạn tạo lộ trình.</p>
            </div>
            <div className="discovery-catalog">{catalog.map((item) => <CatalogCard key={item.kind} item={item} busy={busy} onStart={start} onOpen={open}
              draft={history.find((h) => h.kind === item.kind && !h.completedAt)}
              latest={history.find((h) => h.kind === item.kind && h.completedAt)} />)}</div>
          </section>
          <div className="discovery-columns">
            <ProgressPanel progress={progress} busy={busy} onStart={start} />
            <HistoryPanel history={history} busy={busy} onOpen={open} />
          </div>
        </>}
    </>}
  </Page></UserLayout>;
}
