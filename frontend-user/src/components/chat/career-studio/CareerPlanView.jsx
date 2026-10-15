import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, CheckCircle2, Clock3, MessageSquare, PencilLine, FileText, MessagesSquare, Compass, ListChecks, Flag, GraduationCap, Hammer } from 'lucide-react';
import { Button, PageHeader } from '@/components/ui';
import { careerPlanService } from '@/services/careerPlanService';
import { ROUTES } from '@/constants/routes';
import CareerOutcomes from './CareerOutcomes';
import { justCompletedCourse, segmentLabel, weekRange } from './careerSegments';

/** Header of one course segment in the weekly plan: course (or capstone), its weeks and progress. */
function CourseHead({ segment }) {
  const Icon = segment.courseTitle ? GraduationCap : Hammer;
  const title = segmentLabel(segment);
  return (
    <header className={`career-course-head${segment.completed ? ' is-completed' : ''}`}>
      <span className="career-course-head__icon"><Icon size={18} aria-hidden="true" /></span>
      <div className="career-course-head__text">
        <small>{weekRange(segment)}{segment.courseTitle ? ' · Khóa học' : ''}</small>
        <h4>{segment.courseId ? <Link to={`${ROUTES.COURSES}/${segment.courseId}`}>{title}</Link> : title}</h4>
      </div>
      {segment.completed
        ? <span className="career-course-head__done"><CheckCircle2 size={15} aria-hidden="true" />Đã hoàn thành</span>
        : <span className="career-course-head__progress">{segment.completedWeeks}/{segment.totalWeeks} tuần</span>}
    </header>
  );
}

function TaskRow({ task, busy, onSave, onDiscuss }) {
  const [notes, setNotes] = useState(task.notes || '');
  const dirty = notes !== (task.notes || '');
  return (
    <article className={`career-task${task.completed ? ' is-completed' : ''}`}>
      <div className="career-task-week">{task.completed ? <Check size={20} aria-label="Đã hoàn thành" /> : <><small>Tuần</small><strong>{task.weekNumber}</strong></>}</div>
      <div className="career-task-body">
        <div className="career-task-heading"><h3>{task.title}</h3><span><Clock3 size={14} /> {task.estimatedHours} giờ</span></div>
        <p>{task.action}</p>
        {task.checkpoints?.length > 0 && (
          <ul className="career-checkpoints">{task.checkpoints.map((c, i) => <li key={i}>{c}</li>)}</ul>
        )}
        <p className="career-task-criteria"><strong>Hoàn thành khi:</strong> {task.successCriteria}</p>
        {task.resources?.length > 0 && (
          <ul className="career-resources">{task.resources.map((r, i) => <li key={i}><BookOpen size={12} aria-hidden="true" /> {r}</li>)}</ul>
        )}
        <details>
          <summary>Ghi nhận kết quả {task.notes ? '· Đã có ghi chú' : ''}</summary>
          <label className="career-field"><span className="career-muted">Kết quả thực hiện hoặc đường dẫn sản phẩm</span>
            <textarea className="ui-textarea" rows={3} maxLength={2000} value={notes} disabled={busy} onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi lại điều đã làm được, khó khăn và bằng chứng hoàn thành…" />
          </label>
          <Button size="sm" variant="secondary" disabled={!dirty || busy} onClick={() => onSave(task, task.completed, notes)}>Lưu ghi chú</Button>
        </details>
        <div className="career-actions">
          <Button size="sm" variant="ghost" icon={MessageSquare} disabled={busy} onClick={() => onDiscuss(task)}>Hỏi về bước này</Button>
        </div>
      </div>
    </article>
  );
}

export default function CareerPlanView({ plan, onChange, onBack, onAdjust, onDiscuss, chatBusy, onInterview }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const saveTask = async (task, completed, notes) => {
    if (saving) return;
    setSaving(true); setError(''); setSaved('');
    try {
      const next = await careerPlanService.updateTask(plan.id, task.id, { completed, notes });
      onChange(next);
      const finished = justCompletedCourse(plan, next, task.weekNumber);
      setSaved(finished ? `Bạn đã hoàn thành khóa học “${finished.courseTitle}”.` : `Đã lưu nhiệm vụ tuần ${task.weekNumber}.`);
    } catch (err) { setError(err.message || 'Không lưu được tiến độ. Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };
  return (
    <>
      <PageHeader
        back={
          <button
            type="button"
            className="cvs__back"
            onClick={onBack}
            disabled={saving || chatBusy}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Lộ trình của tôi</span>
          </button>
        }
        title={plan.targetRole}
        description={`${plan.durationWeeks} tuần · ${plan.hoursPerWeek} giờ / tuần · Đã lưu ${new Date(plan.createdAt).toLocaleDateString('vi-VN')}`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={PencilLine}
              disabled={saving || chatBusy}
              onClick={onAdjust}
            >
              Điều chỉnh lộ trình
            </Button>
            <Button
              variant="secondary"
              icon={MessageSquare}
              loading={chatBusy}
              disabled={saving}
              onClick={() => onDiscuss()}
            >
              Trao đổi với AI Coach
            </Button>
          </>
        }
      />
      <section className="career-analysis">
        <div className="cvs-head"><Compass size={18} aria-hidden="true" /><h3>Điểm xuất phát và mục tiêu</h3></div>
        <p>{plan.analysis.summary}</p>
        <p className="career-outcome"><strong>Đầu ra dự kiến:</strong> {plan.analysis.successCriteria}</p>
        <div className="career-two-col">
          <div className="career-panel"><h3>Điểm mạnh có thể tận dụng</h3>
            {plan.analysis.strengths.length ? <ul>{plan.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="career-muted">Chưa có đủ bằng chứng. Hãy bổ sung hồ sơ hoặc kết quả thực hành.</p>}
          </div>
          <div className="career-panel"><h3>Kỹ năng cần ưu tiên</h3>
            {plan.analysis.gaps.length ? <ul className="career-gaps">{plan.analysis.gaps.map((g, i) => <li key={i}>
              <strong>{g.skill}</strong><span className="career-gap-label">{g.status === 'missing' ? 'Cần bổ sung' : 'Chưa đủ bằng chứng'}</span><p>{g.reason}</p>
            </li>)}</ul> : <p className="career-muted">Chưa xác định thêm khoảng trống từ dữ liệu hiện có.</p>}
          </div>
        </div>
        {plan.analysis.directions.length > 0 && <div className="career-panel career-directions"><h3>Những hướng bạn có thể thử</h3>
          {plan.analysis.directions.map((d, i) => <div key={i}><strong>{d.role}</strong><p>{d.reason}</p></div>)}
          <p className="career-muted">Dùng “Điều chỉnh lộ trình” để chọn hướng khác sau khi trải nghiệm.</p>
        </div>}
        {plan.analysis.nextSteps && <p className="career-next-steps"><Flag size={16} aria-hidden="true" /><span><strong>Sau khi hoàn thành:</strong> {plan.analysis.nextSteps}</span></p>}
      </section>
      <CareerOutcomes plan={plan} />
      <section className="career-tasks-section" aria-label="Nhiệm vụ theo tuần">
        <div className="cvs-head"><ListChecks size={18} aria-hidden="true" /><h3>Kế hoạch từng tuần</h3></div>
        {error && <div className="cvs-note cvs-note--error" role="alert">{error}</div>}
        <p className="career-save-status" role="status">{saving ? 'Đang lưu tiến độ…' : saved}</p>
        {plan.segments?.length ? (
          <div className="career-courses">{plan.segments.map((segment) => (
            <section key={segment.fromWeek} className="career-course" aria-label={`${segmentLabel(segment)}, ${weekRange(segment).toLowerCase()}`}>
              <CourseHead segment={segment} />
              <div className="career-tasks">
                {plan.tasks.filter((t) => t.weekNumber >= segment.fromWeek && t.weekNumber <= segment.toWeek)
                  .map((task) => <TaskRow key={task.id} task={task} busy={saving || chatBusy} onSave={saveTask} onDiscuss={onDiscuss} />)}
              </div>
            </section>
          ))}</div>
        ) : (
          <div className="career-tasks">{plan.tasks.map((task) => <TaskRow key={task.id} task={task} busy={saving || chatBusy} onSave={saveTask} onDiscuss={onDiscuss} />)}</div>
        )}
      </section>
      <div className="career-panel career-handoff">
        <div><strong>Đưa kết quả thực hành vào bước tiếp theo</strong><p className="career-muted">Bổ sung dự án đã hoàn thành vào CV và luyện trình bày kinh nghiệm của bạn.</p></div>
        <div className="career-actions"><Link className="ui-btn ui-btn--secondary" to={plan.cvProfileId ? `${ROUTES.CV_EDITOR}?id=${plan.cvProfileId}` : ROUTES.MY_CV}><FileText size={16} /> Cập nhật CV</Link>
          <Button variant="secondary" icon={MessagesSquare} disabled={saving || chatBusy} onClick={onInterview}>Luyện phỏng vấn</Button></div>
      </div>
    </>
  );
}
