import { Link } from 'react-router-dom';
import { Award, BookOpen, Briefcase, CheckCircle2, Clock, GraduationCap, Info } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { weekRange } from './careerSegments';
import './CareerOutcomes.css';

/** Section head shared by the three panels: icon + title + count, then a one-line lead. */
function PanelHead({ icon: Icon, title, count, children }) {
  return <header className="career-outcomes__head">
    <div className="career-outcomes__title">
      <Icon size={18} aria-hidden="true" />
      <h2>{title}</h2>
      <span className="career-outcomes__count">{count}</span>
    </div>
    <p>{children}</p>
  </header>;
}

/** `framed` wraps each panel in the page-level Card shell, for pages whose other blocks are Cards. */
function Panel({ framed, children }) {
  if (!framed) return <div className="career-outcomes__panel">{children}</div>;
  return <div className="ui-card"><div className="ui-card__core career-outcomes__panel career-outcomes__panel--framed">{children}</div></div>;
}

const ALL_SECTIONS = ['outcomes', 'planCourses', 'courses', 'jobs'];

/** `sections` limits which panels render, for pages that split them across tabs; all by default. */
export default function CareerOutcomes({ plan, framed = false, sections = ALL_SECTIONS }) {
  const show = new Set(sections);
  const outcomes = show.has('outcomes') ? plan.analysis?.outcomes || [] : [];
  // Courses the roadmap is split into (in week order); other matching courses are only extra reading.
  const allPlanCourses = (plan.segments || []).filter((s) => s.courseTitle);
  const inPlan = new Set(allPlanCourses.map((s) => s.courseId).filter(Boolean));
  const planCourses = show.has('planCourses') ? allPlanCourses : [];
  const courses = show.has('courses') ? (plan.recommendations?.courses || []).filter((c) => !inPlan.has(c.id)) : [];
  const jobs = show.has('jobs') ? (plan.recommendations?.jobs || []).filter((job) => job.score > 60).slice(0, 3) : [];
  if (!outcomes.length && !planCourses.length && !courses.length && !jobs.length) return null;
  return <section className={`career-outcomes${framed ? ' career-outcomes--framed' : ''}`} aria-label="Đầu ra và cơ hội sau lộ trình">
    {outcomes.length > 0 && <Panel framed={framed}>
      <PanelHead icon={Award} title="Kỹ năng và thành tựu sau lộ trình" count={outcomes.length}>
        Đầu ra dự kiến khi hoàn thành đầy đủ các nhiệm vụ và tiêu chí. Hãy lưu sản phẩm thực hành để kiểm chứng năng lực.
      </PanelHead>
      <ol className="career-outcomes__list">
        {outcomes.map((outcome, index) => <li key={index}>
          <span className="career-outcomes__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <strong>{outcome.skill}</strong>
          <p>{outcome.achievement}</p>
        </li>)}
      </ol>
    </Panel>}

    {planCourses.length > 0 && <Panel framed={framed}>
      <PanelHead icon={GraduationCap} title="Khóa học trong lộ trình" count={planCourses.length}>
        Lộ trình được chia theo khóa học: hoàn thành tất cả các tuần của một khóa là hoàn thành khóa học đó.
      </PanelHead>
      <ol className="career-outcomes__list career-outcomes__courses">
        {planCourses.map((segment, index) => <li key={segment.fromWeek} className={segment.completed ? 'is-completed' : ''}>
          <span className="career-outcomes__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <strong>{segment.courseId
            ? <Link to={`${ROUTES.COURSES}/${segment.courseId}`}>{segment.courseTitle}</Link>
            : segment.courseTitle}</strong>
          <p>
            <span className="career-outcomes__weeks">{weekRange(segment)}</span>
            {segment.completed
              ? <span className="career-outcomes__done"><CheckCircle2 size={13} aria-hidden="true" />Đã hoàn thành</span>
              : <span>{segment.completedWeeks}/{segment.totalWeeks} tuần đã xong</span>}
          </p>
        </li>)}
      </ol>
    </Panel>}

    {courses.length > 0 && <Panel framed={framed}>
      <PanelHead icon={BookOpen} title={allPlanCourses.length ? 'Khóa học tham khảo thêm' : 'Khóa học hỗ trợ lộ trình'} count={courses.length}>
        Các khóa học trong kho có kỹ năng trùng với đầu ra dự kiến. Chọn khóa phù hợp với nền tảng và quỹ giờ của bạn.
      </PanelHead>
      <div className="career-outcomes__grid">{courses.map((course) => <article key={course.id} className="career-outcomes__card">
        <h3><Link to={`${ROUTES.COURSES}/${course.id}`}>{course.title}</Link></h3>
        <p className="career-outcomes__meta">
          {course.provider}
          {course.durationHours ? <span><Clock size={13} aria-hidden="true" />{course.durationHours} giờ</span> : null}
        </p>
        {course.skills.length > 0 && <ul className="career-outcomes__chips" aria-label="Kỹ năng hỗ trợ">
          {course.skills.map((skill, i) => <li key={`${skill}-${i}`}>{skill}</li>)}
        </ul>}
      </article>)}</div>
    </Panel>}

    {jobs.length > 0 && <Panel framed={framed}>
      <PanelHead icon={Briefcase} title="Việc làm phù hợp sau khi hoàn thành" count={jobs.length}>
        Mức phù hợp dự kiến theo kỹ năng và công nghệ trong tin tuyển dụng, kỹ năng bắt buộc có trọng số gấp đôi. Chỉ hiển thị tối đa 3 tin còn hiệu lực, trên 60%, không vượt cấp độ mục tiêu.
      </PanelHead>
      <div className="career-outcomes__grid">{jobs.map((job) => <article key={job.id} className="career-outcomes__card">
        <span className="career-outcomes__score">
          <strong>{job.score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%</strong> phù hợp dự kiến
        </span>
        <h3><Link to={`${ROUTES.JOB_MATCHING}/${job.id}`}>{job.title}</Link></h3>
        <p className="career-outcomes__meta">{job.company}</p>
        {job.matchedSkills.length > 0 && <ul className="career-outcomes__chips" aria-label="Kỹ năng đáp ứng dự kiến">
          {job.matchedSkills.map((skill, i) => <li key={`${skill}-${i}`}>{skill}</li>)}
        </ul>}
        {job.missingSkills.length > 0 && <p className="career-outcomes__missing"><strong>Cần bổ sung:</strong> {job.missingSkills.join(', ')}</p>}
      </article>)}</div>
      <p className="career-outcomes__note"><Info size={14} aria-hidden="true" />
        Đây là đối chiếu đầu ra dự kiến, không phải xác nhận đã đạt năng lực hay đảm bảo trúng tuyển. Xem chi tiết tin để kiểm tra yêu cầu kinh nghiệm, học vấn và điều kiện khác.
      </p>
    </Panel>}
  </section>;
}
