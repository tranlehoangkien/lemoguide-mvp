import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ClipboardCheck, Gauge, ListChecks, Map, RefreshCw, Route, TrendingUp } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { Badge, Bar, Button, EmptyState, Entry, Page, PageHeader, SectionCard, StatCard } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/context/AuthContext';
import { useProfileRefresh } from '@/hooks/useProfileRefresh';
import { userProfileService } from '@/services/userProfileService';
import './ProgressPage.css';

const date = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '';
const delta = (value) => `${value > 0 ? '+' : ''}${value}`;
const percentOf = (done, total) => total ? Math.round((done / total) * 100) : 0;

const SectionLink = ({ to, children }) => (
  <Link className="progress-link" to={to}>{children}<ArrowRight size={14} aria-hidden="true" /></Link>
);

function SkillsSection({ skills }) {
  return <SectionCard icon={Route} title="Kỹ năng đang học trong lộ trình" count={skills.length || null}
    action={<SectionLink to={ROUTES.CAREER_ROADMAP}>Mở lộ trình</SectionLink>}>
    {skills.length === 0
      ? <p className="ui-hint">Tiến độ kỹ năng sẽ xuất hiện khi lộ trình có nhiệm vụ gắn với khóa học.</p>
      : <div className="ui-cols-2">{skills.map((skill) => {
        const done = skill.completedTasks === skill.totalTasks;
        return <Entry key={skill.skillId != null ? `skill-${skill.skillId}` : `technology-${skill.technologyId}`} title={skill.skillName}
          subtitle={<Badge tone={done ? 'success' : 'info'}>{done ? 'Đã hoàn thành các nhiệm vụ' : 'Đang học'}</Badge>}
          meta={`${percentOf(skill.completedTasks, skill.totalTasks)}%`}>
          <p>{skill.completedTasks}/{skill.totalTasks} nhiệm vụ, {skill.completedCourses} khóa hoàn thành trong lộ trình</p>
          <div role="progressbar" aria-label={`Tiến độ học ${skill.skillName}`} aria-valuemin={0}
            aria-valuemax={skill.totalTasks} aria-valuenow={skill.completedTasks}>
            <Bar percent={percentOf(skill.completedTasks, skill.totalTasks)} />
          </div>
          {skill.lastCompletedAt && <p className="ui-hint">Hoàn thành gần nhất: {date(skill.lastCompletedAt)}</p>}
        </Entry>;
      })}</div>}
    <p className="ui-hint progress-footnote">Tiến độ dựa trên nhiệm vụ bạn đánh dấu hoàn thành.</p>
  </SectionCard>;
}

function AssessmentSection({ assessment }) {
  return <SectionCard icon={Gauge} title="Điểm đánh giá kỹ năng mới nhất"
    action={<SectionLink to={ROUTES.SELF_DISCOVERY}>Mở trang đánh giá</SectionLink>}>
    {assessment.attempts === 0
      ? <EmptyState icon={ClipboardCheck} title="Chưa có bài đánh giá kỹ năng"
        hint="Làm bài đánh giá kỹ năng để tạo mốc theo dõi đầu tiên."
        action={<Link className="ui-link" to={ROUTES.SELF_DISCOVERY}>Làm bài đánh giá</Link>} />
      : <>
        <p className="ui-hint">Ngày đánh giá: {date(assessment.latestAt)}</p>
        <div className="ui-cols-2">{assessment.changes.map((skill) => <Entry key={skill.label} title={skill.label}
          subtitle={<Badge tone="info">{skill.latest}/100</Badge>}>
          <p>Lần đầu: {skill.baseline}/100, lần trước: {skill.previous}/100</p>
          {assessment.attempts > 1 && <p>So với lần đầu: {delta(skill.fromBaseline)} điểm. So với lần trước: {delta(skill.fromPrevious)} điểm.</p>}
          <div role="progressbar" aria-label={`Điểm đánh giá ${skill.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.latest}>
            <Bar percent={skill.latest} />
          </div>
        </Entry>)}</div>
        <p className="ui-hint progress-footnote">Điểm từ bài tình huống ngắn, 3 câu nền mỗi kỹ năng; có thể chịu ảnh hưởng ghi nhớ khi làm lại.</p>
      </>}
  </SectionCard>;
}

/** Roadmap, weekly-task and skill-assessment progress, split out of the profile page. */
export default function ProgressPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(false);
  const revision = useRef(0);

  const load = useCallback(async () => {
    const current = ++revision.current;
    try {
      const data = await userProfileService.getProgress();
      if (current !== revision.current) return;
      setProgress(data);
      setError(false);
    } catch {
      if (current === revision.current) setError(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const requests = revision;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; requests.current++; };
  }, [load]);
  useProfileRefresh(authUser?.id, load);

  const loading = !progress && !error;

  return <UserLayout>
    <Page>
      <PageHeader
        title="Tiến bộ của bạn"
        description="Theo dõi nhiệm vụ lộ trình, công việc cá nhân và điểm đánh giá kỹ năng theo thời gian."
        actions={<Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(ROUTES.PROFILE)}>Hồ sơ của tôi</Button>}
      />

      {error && !progress
        ? <EmptyState icon={TrendingUp} title="Chưa tải được tiến độ"
          hint="Kiểm tra kết nối rồi thử lại."
          action={<Button variant="secondary" icon={RefreshCw} onClick={load}>Thử lại</Button>} />
        : <>
          {error && <div className="ui-inline progress-stale" role="status">
            <p>Chưa tải được tiến độ mới nhất.</p>
            <Button size="sm" variant="secondary" onClick={load}>Thử lại</Button>
          </div>}
          <div className="ui-stats">
            <StatCard title="Nhiệm vụ lộ trình" icon={Map} loading={loading}
              value={progress?.roadmap.percent} unit="%"
              note={progress && `${progress.roadmap.completed}/${progress.roadmap.total} đã hoàn thành`} />
            <StatCard title="Công việc cá nhân" icon={ListChecks} loading={loading}
              value={progress?.weekly.percent} unit="%"
              note={progress && `${progress.weekly.completed}/${progress.weekly.total} đã hoàn thành`} />
            <StatCard title="Lần đánh giá kỹ năng" icon={ClipboardCheck} loading={loading}
              value={progress?.assessment.attempts}
              note={progress?.assessment.latestAt && `Gần nhất ${date(progress.assessment.latestAt)}`} />
          </div>
          {loading
            ? <div className="progress-skeleton" role="status" aria-label="Đang tải tiến độ">
              <span className="ui-skel" /><span className="ui-skel" />
            </div>
            : <>
              <SkillsSection skills={progress.learningSkills} />
              <AssessmentSection assessment={progress.assessment} />
            </>}
        </>}
    </Page>
  </UserLayout>;
}
