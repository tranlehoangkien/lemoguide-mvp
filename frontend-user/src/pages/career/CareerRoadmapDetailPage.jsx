import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Award, BookOpen, Calendar, CalendarRange, Check, CheckCircle2, Clock3, Compass, Flag, GraduationCap, Hammer,
  Play, Route, Sparkles, Target, Trash2, Trophy,
} from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { Page, PageHeader, Card, SectionCard, Badge, Button, EmptyState, Tabs } from '@/components/ui';
import { careerPlanService } from '@/services/careerPlanService';
import { ROUTES } from '@/constants/routes';
import mascot from '@/assets/images/9.svg';
import './CareerRoadmapDetail.css';
import RoadmapCommunityInvite from './RoadmapCommunityInvite';
import CareerOutcomes from '@/components/chat/career-studio/CareerOutcomes';
import { justCompletedCourse, segmentLabel, segmentOfWeek, weekRange } from '@/components/chat/career-studio/careerSegments';

const PHASES = ['Nền tảng', 'Thực hành', 'Tổng kết'];
function phaseIndexOf(index, total) { return Math.min(2, Math.floor((index * 3) / total)); }
function phaseOf(index, total) { return PHASES[phaseIndexOf(index, total)]; }
const INTENT_LABELS = { target: 'Đã có mục tiêu', explore: 'Khám phá hướng đi', transition: 'Chuyển nghề / phát triển' };
const TAB_IDS = ['journey', 'analysis', 'outcomes', 'courses'];

/** Which course this week studies, and where it sits inside that course. */
function CourseContext({ segment, week }) {
  if (!segment) return null;
  const Icon = segment.courseTitle ? GraduationCap : Hammer;
  const title = segmentLabel(segment);
  return <div className={`journey-course${segment.completed ? ' is-completed' : ''}`}>
    <Icon size={18} aria-hidden="true" />
    <div>
      <small>{segment.courseTitle ? `Khóa học · tuần ${week - segment.fromWeek + 1}/${segment.totalWeeks}` : weekRange(segment)}</small>
      <strong>{segment.courseId ? <Link to={`${ROUTES.COURSES}/${segment.courseId}`}>{title}</Link> : title}</strong>
    </div>
    {segment.completed && <span className="journey-course__done"><CheckCircle2 size={14} aria-hidden="true" />Đã hoàn thành</span>}
  </div>;
}

function TaskEditor({ task, segment, busy, onSave }) {
  const [notes, setNotes] = useState(task.notes || '');
  return <div className="journey-task">
    <CourseContext segment={segment} week={task.weekNumber} />
    <h2>{task.title}</h2>
    <span className="journey-time"><Clock3 size={15} /> {task.estimatedHours} giờ thực hiện</span>
    <h3>Việc cần làm</h3><p>{task.action}</p>
    {task.checkpoints?.length > 0 && (
      <ul className="journey-checkpoints">{task.checkpoints.map((c, i) => <li key={i}>{c}</li>)}</ul>
    )}
    <div className="journey-criteria"><h3>Hoàn thành khi</h3><p>{task.successCriteria}</p></div>
    {task.resources?.length > 0 && (
      <ul className="journey-resources">{task.resources.map((r, i) => <li key={i}><BookOpen size={12} aria-hidden="true" /> {r}</li>)}</ul>
    )}
    <label htmlFor="journey-notes">Kết quả và ghi chú</label>
    <textarea id="journey-notes" className="ui-textarea" rows={5} maxLength={2000} disabled={busy} value={notes}
      onChange={(e) => setNotes(e.target.value)} placeholder="Ghi lại kết quả, đường dẫn sản phẩm hoặc điều bạn cần cải thiện…" />
    <div className="journey-task-actions">
      <Button variant="secondary" disabled={busy || notes === (task.notes || '')} onClick={() => onSave(task, task.completed, notes)}>Lưu ghi chú</Button>
      <Button icon={Check} loading={busy} onClick={() => onSave(task, !task.completed, notes)}>
        {task.completed ? 'Đánh dấu chưa xong' : 'Hoàn thành mốc này'}
      </Button>
    </div>
  </div>;
}

function Journey({ plan }) {
  const navigate = useNavigate();
  const [data, setData] = useState(plan);
  const [selected, setSelected] = useState(plan.tasks.find((t) => !t.completed)?.id ?? plan.tasks[0]?.id);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const lock = useRef(false);
  // The open tab lives in the URL so a reload or shared link lands on the same section.
  const [params, setParams] = useSearchParams();
  const tab = TAB_IDS.includes(params.get('tab')) ? params.get('tab') : 'journey';
  const setTab = (next) => setParams(next === 'journey' ? {} : { tab: next }, { replace: true });
  const tasks = [...data.tasks].sort((a, b) => a.weekNumber - b.weekNumber);
  const task = tasks.find((t) => t.id === selected);
  const rows = Math.ceil(tasks.length / 3);
  const height = Math.max(220, rows * 210);
  const points = tasks.map((t, i) => ({ task: t, x: 150 + (Math.floor(i / 3) % 2 ? 2 - i % 3 : i % 3) * 300, y: 80 + Math.floor(i / 3) * 210 }));
  const path = points.map((p, i) => {
    if (!i) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    if (prev.y === p.y) return `L ${p.x} ${p.y}`;
    const edge = p.x === 750 ? 900 : 0;
    return `C ${edge} ${prev.y}, ${edge} ${p.y}, ${p.x} ${p.y}`;
  }).join(' ');
  const selectedIndex = Math.max(0, points.findIndex((p) => p.task.id === selected));
  const travelPct = points.length > 1 ? (selectedIndex / (points.length - 1)) * 100 : 100;
  const currentPhase = phaseIndexOf(selectedIndex, tasks.length);
  const phaseCounts = PHASES.map((_, pi) => tasks.filter((_, i) => phaseIndexOf(i, tasks.length) === pi).length);
  // Roadmaps split by course show the courses instead of the generic three phases.
  const segments = data.segments || [];
  const currentSegment = task ? segmentOfWeek(segments, task.weekNumber) : null;
  const save = async (current, completed, notes) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const next = await careerPlanService.updateTask(data.id, current.id, { completed, notes });
      const finished = justCompletedCourse(data, next, current.weekNumber);
      setData(next);
      setNotice(finished ? `Bạn đã hoàn thành khóa học “${finished.courseTitle}”.` : `Đã lưu kết quả tuần ${current.weekNumber}.`);
      setTimeout(() => setNotice(''), 3000);
    } catch (err) { setError(err.message || 'Không lưu được tiến độ. Vui lòng thử lại.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const removePlan = async () => {
    if (deleting) return;
    setDeleting(true); setDeleteError('');
    try {
      await careerPlanService.remove(data.id);
      navigate(ROUTES.CAREER_ROADMAP, { replace: true });
    } catch (err) { setDeleteError(err.message || 'Không xóa được lộ trình. Vui lòng thử lại.'); }
    finally { setDeleting(false); }
  };
  const analysis = data.analysis || {};
  const nextTask = tasks.find((t) => !t.completed);
  const finished = data.totalCount > 0 && data.completedCount === data.totalCount;
  const outcomeCount = analysis.outcomes?.length || 0;
  const jobCount = (data.recommendations?.jobs || []).filter((job) => job.score > 60).slice(0, 3).length;
  const planCourses = segments.filter((s) => s.courseTitle);
  const inPlan = new Set(planCourses.map((s) => s.courseId).filter(Boolean));
  const extraCourseCount = (data.recommendations?.courses || []).filter((c) => !inPlan.has(c.id)).length;
  const tabOptions = [
    { value: 'journey', label: 'Hành trình phát triển', icon: Route, count: data.totalCount },
    { value: 'analysis', label: 'Phân tích & định hướng', icon: Compass, count: null },
    { value: 'outcomes', label: 'Kỹ năng & thành tựu', icon: Award, count: outcomeCount + jobCount },
    { value: 'courses', label: 'Khóa học', icon: GraduationCap, count: planCourses.length + extraCourseCount },
  ];
  const continueJourney = () => { setTab('journey'); if (nextTask) setSelected(nextTask.id); };
  return <>
    <ConfirmActionModal
      isOpen={confirmDelete}
      title="Xóa lộ trình"
      icon={Trash2}
      confirmLabel="Xóa lộ trình"
      message={
        <>
          {deleteError && <span role="alert">{deleteError}<br /></span>}
          Bạn có chắc muốn xóa lộ trình “{data.targetRole}” cùng toàn bộ nhiệm vụ và tiến độ? Thao tác này không thể hoàn tác.
        </>
      }
      isSubmitting={deleting}
      onConfirm={removePlan}
      onCancel={() => { if (!deleting) setConfirmDelete(false); }}
    />
    <PageHeader
      back={
        <button
          type="button"
          className="ui-back-btn"
          onClick={() => navigate(ROUTES.COACH)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Bảng điều khiển</span>
        </button>
      }
      title="Lộ trình phát triển"
      description="Theo dõi từng tuần của hành trình, xem phân tích năng lực và các khóa học đồng hành cùng mục tiêu của bạn."
      actions={<Button variant="secondary" icon={Compass} onClick={() => navigate(ROUTES.SELF_DISCOVERY)}>Đánh giá năng lực & tiến bộ</Button>}
    />

    <Card>
      <div className="ui-hero journey-hero">
        <div className="ui-hero__who">
          <span className="ui-match-ring journey-hero__ring" style={{ '--p': data.progress }} role="img"
            aria-label={`Hoàn thành ${data.progress}%`}><strong>{data.progress}%</strong></span>
          <div className="journey-hero__text">
            <div className="ui-hero__name">
              <h2>{data.targetRole}</h2>
              <Badge tone={finished ? 'success' : 'neutral'}>{finished ? 'Đã hoàn thành' : 'Đang thực hiện'}</Badge>
              {INTENT_LABELS[data.intent] && <Badge>{INTENT_LABELS[data.intent]}</Badge>}
            </div>
            <p className="ui-hero__role journey-hero__next">
              {nextTask ? `Mốc tiếp theo · Tuần ${nextTask.weekNumber}: ${nextTask.title}` : 'Bạn đã đi hết hành trình — chúc mừng!'}
            </p>
            <div className="ui-hero__meta">
              <span><CalendarRange size={14} aria-hidden="true" />{data.durationWeeks} tuần</span>
              <span><Clock3 size={14} aria-hidden="true" />{data.hoursPerWeek} giờ / tuần</span>
              <span><CheckCircle2 size={14} aria-hidden="true" />{data.completedCount}/{data.totalCount} tuần hoàn thành</span>
              {data.createdAt && <span><Calendar size={14} aria-hidden="true" />Khởi tạo: {new Date(data.createdAt).toLocaleDateString('vi-VN')}</span>}
            </div>
          </div>
        </div>
        <div className="ui-hero__actions">
          {nextTask && <Button icon={Play} onClick={continueJourney}>Tiếp tục tuần {nextTask.weekNumber}</Button>}
          <Button variant="secondary" icon={Trash2} onClick={() => { setDeleteError(''); setConfirmDelete(true); }}>Xóa lộ trình</Button>
        </div>
      </div>
    </Card>

    <RoadmapCommunityInvite />

    <Tabs label="Các phần của lộ trình" value={tab} onChange={setTab} options={tabOptions} />

    {/* Kept mounted so an unsaved note survives switching tabs. */}
    <div className="journey-tab" hidden={tab !== 'journey'}>
      <div className="journey-layout">
        <Card className="journey-map-card">
          <header className="journey-map-heading">
            <div><h2>Hành trình phát triển</h2><p>Chọn một mốc trên bản đồ để xem nhiệm vụ và ghi nhận kết quả.</p></div>
            <img src={mascot} alt="" aria-hidden="true" className="journey-map-mascot" />
          </header>
          {segments.length > 0 ? (
            <ol className="journey-phase-legend journey-course-legend" aria-label="Các khóa học trong lộ trình">
              {segments.map((seg) => (
                <li key={seg.fromWeek}>
                  <button type="button" disabled={busy}
                    className={`${seg === currentSegment ? 'is-active' : ''}${seg.completed ? ' is-done' : ''}`}
                    aria-pressed={seg === currentSegment}
                    onClick={() => setSelected((tasks.find((t) => t.weekNumber >= seg.fromWeek && t.weekNumber <= seg.toWeek && !t.completed)
                      ?? tasks.find((t) => t.weekNumber === seg.fromWeek))?.id)}>
                    {seg.completed ? <Check size={12} aria-hidden="true" /> : <span className="journey-phase-legend__dot" />}
                    <span className="journey-course-legend__name">{segmentLabel(seg)}</span>
                    <em>{seg.completed ? weekRange(seg) : `${seg.completedWeeks}/${seg.totalWeeks} tuần`}</em>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="journey-phase-legend" aria-label="Các giai đoạn">
              {PHASES.map((label, pi) => (
                <li key={label} className={pi === currentPhase ? 'is-active' : ''}>
                  <span className="journey-phase-legend__dot" />{label}<em>{phaseCounts[pi]}</em>
                </li>
              ))}
            </ol>
          )}
          <div className="journey-map-scroll">
            <div className="journey-map" style={{ height }}>
              <svg viewBox={`0 0 900 ${height}`} preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="journey-accent" x1="0" y1="0" x2="0" y2="1"><stop style={{ stopColor: 'var(--color-accent-surface)' }} /><stop offset="1" style={{ stopColor: 'var(--ui-accent)' }} /></linearGradient></defs>
                <path d={path} fill="none" stroke="var(--ui-hair)" strokeWidth="64" strokeLinecap="round" />
                <path d={path} pathLength="100" fill="none" stroke="url(#journey-accent)" strokeWidth="64" strokeLinecap="round"
                  style={{ strokeDasharray: `${travelPct} 100`, transition: 'stroke-dasharray .6s cubic-bezier(0.32,0.72,0,1)' }} />
                <path d={path} fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2" strokeDasharray="5 9" />
              </svg>
              <ol className="journey-stops">{points.map(({ task: t, x, y }, i) => <li key={t.id} style={{ left: `${x / 9}%`, top: y }}>
                <button type="button" className={`journey-stop${t.completed ? ' is-done' : ''}${t.id === selected ? ' is-active' : ''}`} aria-pressed={t.id === selected}
                  aria-label={`Tuần ${t.weekNumber}: ${t.title}, ${t.completed ? 'đã hoàn thành' : 'chưa hoàn thành'}`} disabled={busy} onClick={() => setSelected(t.id)}>
                  <span className="journey-dot">{t.completed ? <Check size={22} /> : String(t.weekNumber).padStart(2, '0')}</span>
                  <span className="journey-stop-label"><small><span className="journey-phase-word">{segments.length ? segmentLabel(segmentOfWeek(segments, t.weekNumber)) : phaseOf(i, tasks.length)}</span> · TUẦN {t.weekNumber}</small><strong>{t.title}</strong></span>
                </button>
              </li>)}</ol>
            </div>
          </div>
          <footer className="journey-destination">
            <Trophy size={24} />
            <div>
              <strong>Đích đến của bạn</strong>
              <p>{analysis.successCriteria}</p>
              <div className="journey-destination-stats">
                <span>{data.durationWeeks} tuần</span>
                <span>{data.hoursPerWeek} giờ / tuần</span>
              </div>
            </div>
          </footer>
        </Card>
        <Card className="journey-detail-panel">
          <div className="journey-detail-head">
            <span className="journey-detail-eyebrow">Chi tiết mốc</span>
            {task && <span className="journey-detail-week">Tuần {task.weekNumber}/{data.durationWeeks}</span>}
          </div>
          {error && <p className="journey-error" role="alert">{error}</p>}
          <p className="journey-notice" role="status">{busy ? 'Đang lưu tiến độ…' : notice}</p>
          {task ? tasks.map((item) => <div key={item.id} hidden={item.id !== selected}><TaskEditor task={item} segment={segmentOfWeek(segments, item.weekNumber)} busy={busy} onSave={save} /></div>) : <EmptyState title="Chưa có nhiệm vụ" />}
        </Card>
      </div>
    </div>

    {tab === 'analysis' && <div className="ui-stack journey-tab">
      <SectionCard icon={Compass} title="Nhận định tổng quan">
        <p className="journey-summary">{analysis.summary || 'Chưa có nhận định tổng quan cho lộ trình này.'}</p>
        {analysis.nextSteps && (
          <div className="journey-next-steps">
            <Flag size={18} className="journey-next-steps__icon" aria-hidden="true" />
            <div className="journey-next-steps__content"><strong>Sau khi hoàn thành</strong><span>{analysis.nextSteps}</span></div>
          </div>
        )}
      </SectionCard>
      <div className="ui-cols-2 journey-cols">
        <SectionCard icon={CheckCircle2} title="Điểm mạnh có thể tận dụng" count={analysis.strengths?.length || null}>
          {analysis.strengths?.length ? (
            <ul className="journey-rows">
              {analysis.strengths.map((s, i) => (
                <li key={i}><Check size={15} className="journey-rows__mark" aria-hidden="true" /><span>{s}</span></li>
              ))}
            </ul>
          ) : <p className="journey-muted">Chưa có đủ bằng chứng. Hãy bổ sung hồ sơ hoặc kết quả thực hành.</p>}
        </SectionCard>
        <SectionCard icon={Target} title="Kỹ năng cần ưu tiên" count={analysis.gaps?.length || null}>
          {analysis.gaps?.length ? (
            <ul className="journey-rows">
              {analysis.gaps.map((g, i) => (
                <li key={i} className="journey-rows__gap">
                  <div className="journey-gap-head">
                    <strong className="journey-gap-name">{g.skill}</strong>
                    <Badge tone={g.status === 'missing' ? 'danger' : 'warning'}>
                      {g.status === 'missing' ? 'Cần bổ sung' : 'Chưa đủ bằng chứng'}
                    </Badge>
                  </div>
                  {g.reason && <p className="journey-gap-reason">{g.reason}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="journey-muted">Chưa xác định thêm khoảng trống từ dữ liệu hiện có.</p>}
        </SectionCard>
      </div>
      {analysis.directions?.length > 0 && (
        <SectionCard icon={Sparkles} title="Những hướng bạn có thể thử" count={analysis.directions.length}>
          <ol className="journey-directions-grid">
            {analysis.directions.map((d, i) => (
              <li key={i} className="journey-direction-card">
                <span className="journey-direction-card__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <strong>{d.role}</strong>
                <p>{d.reason}</p>
              </li>
            ))}
          </ol>
        </SectionCard>
      )}
    </div>}

    {tab === 'outcomes' && <div className="journey-tab">
      {outcomeCount + jobCount > 0
        ? <CareerOutcomes plan={data} framed sections={['outcomes', 'jobs']} />
        : <Card><EmptyState icon={Award} title="Chưa có đầu ra dự kiến" hint="Kỹ năng và thành tựu sẽ xuất hiện khi lộ trình có tiêu chí đầu ra." /></Card>}
    </div>}

    {tab === 'courses' && <div className="journey-tab">
      {planCourses.length + extraCourseCount > 0
        ? <CareerOutcomes plan={data} framed sections={['planCourses', 'courses']} />
        : <Card><EmptyState icon={GraduationCap} title="Chưa có khóa học phù hợp" hint="Lộ trình này chưa gắn khóa học nào và kho khóa học chưa có khóa trùng kỹ năng đầu ra."
          action={<Button variant="secondary" icon={BookOpen} onClick={() => navigate(ROUTES.COURSES)}>Xem kho khóa học</Button>} /></Card>}
    </div>}
  </>;
}

export default function CareerRoadmapDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    careerPlanService.get(id).then((plan) => { if (!cancelled) setResult({ id, retry, plan }); })
      .catch((err) => { if (!cancelled) setResult({ id, retry, error: err.message || 'Không tải được lộ trình.' }); });
    return () => { cancelled = true; };
  }, [id, retry]);
  const ready = result?.id === id && result?.retry === retry;
  return <UserLayout><Page className="journey-page">
    {!ready ? <Card><div role="status"><EmptyState title="Đang tải lộ trình…" /></div></Card>
      : result.error ? <Card><EmptyState title="Không thể mở lộ trình" hint={result.error} action={<><Button onClick={() => setRetry((n) => n + 1)}>Thử lại</Button><Link to={ROUTES.CAREER_ROADMAP}>Về trang lộ trình</Link></>} /></Card>
        : <Journey key={id} plan={result.plan} />}
  </Page></UserLayout>;
}
