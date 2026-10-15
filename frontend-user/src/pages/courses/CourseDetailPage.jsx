import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, Building2, Clock, ExternalLink, GraduationCap, Layers, Share2, Sparkles, User } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { Page, PageHeader, Card, SectionCard, Badge, Button, EmptyState, Toast, useToast } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { courseService, COURSE_LEVEL_LABELS, courseExternalUrl, formatCourseDuration, formatCoursePrice } from '@/services/courseService';
import CourseCard, { CourseArtwork } from './CourseCard';
import './Courses.css';

function CourseTags({ items, type, emptyLabel }) {
  return items?.length ? <div className="ui-chip-row">{items.map((tag) => (
    <Link key={tag.id} className="course-tag-link" to={`${ROUTES.COURSES}?${type}=${tag.id}`} title={`Tìm khóa học về ${tag.name}`}>
      <Badge>{tag.name}</Badge>
    </Link>
  ))}</div> : <p className="ui-hint">{emptyLabel}</p>;
}

export function CourseDetails({ course }) {
  const url = courseExternalUrl(course.url);
  return (
    <>
      <Card>
        <div className="ui-hero course-detail-hero">
          <div className="ui-hero__who"><CourseArtwork course={course} compact />
            <div className="course-hero-content">
              <div className="ui-hero__name"><h2>{course.title}</h2></div>
              <p className="ui-hero__role">{course.provider || 'Chưa cập nhật nhà cung cấp'}</p>
              <div className="ui-hero__meta"><span><Clock size={14} />{formatCourseDuration(course.durationHours)}</span>
                <span><Layers size={14} />{COURSE_LEVEL_LABELS[course.level] || 'Chưa cập nhật cấp độ'}</span>
                {course.updatedAt && <span>Cập nhật {new Date(course.updatedAt).toLocaleDateString('vi-VN')}</span>}
              </div>
              <div className="ui-chip-row course-hero-price"><strong>{formatCoursePrice(course)}</strong>
                <Badge tone={course.isFree ? 'success' : 'neutral'}>{course.isFree ? 'Khóa học miễn phí' : 'Khóa học có học phí'}</Badge>
              </div>
            </div>
          </div>
          <div className="course-enroll">
            {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="ui-btn ui-btn--primary"><span>Xem tại nhà cung cấp</span><ExternalLink size={16} /></a>
              : <Button disabled icon={ExternalLink}>Chưa có liên kết khóa học</Button>}
            <p className="ui-hint">{url ? 'Mở trong tab mới. Kiểm tra học phí và điều kiện tại nhà cung cấp trước khi đăng ký.' : 'Nhà cung cấp chưa cập nhật địa chỉ học hoặc đăng ký cho khóa học này.'}</p>
          </div>
        </div>
      </Card>
      <SectionCard icon={Sparkles} title="Kỹ năng và công nghệ trong khóa học">
        <div className="ui-detail-section" style={{ marginTop: 0 }}><h4>Kỹ năng được đề cập</h4>
          <CourseTags items={course.skills} type="skillId" emptyLabel="Khóa học chưa gắn kỹ năng cụ thể." />
        </div>
        <div className="ui-detail-section" style={{ marginTop: 0 }}><h4>Công nghệ được đề cập</h4>
          <CourseTags items={course.technologies} type="technologyId" emptyLabel="Khóa học chưa gắn công nghệ cụ thể." />
        </div>
        <div className="ui-callout course-profile-callout"><div><strong>Gắn việc học với mục tiêu nghề nghiệp</strong>
          <p>Đối chiếu nội dung khóa học với hồ sơ và yêu cầu công việc. Sau khi thực hành, cập nhật kỹ năng và dự án đã hoàn thành.</p></div>
          <div className="course-actions"><Link className="ui-btn ui-btn--secondary ui-btn--sm" to={ROUTES.PROFILE}><User size={15} /> Xem hồ sơ</Link>
            <Link className="ui-btn ui-btn--secondary ui-btn--sm" to={`${ROUTES.JOB_MATCHING}?view=list`}>Khám phá việc làm</Link></div>
        </div>
      </SectionCard>
      <SectionCard icon={BookOpen} title="Giới thiệu khóa học">
        <div className="ui-detail-section" style={{ marginTop: 0 }}><h4>Nội dung</h4>
          <p>{course.description || 'Nhà cung cấp chưa bổ sung mô tả chi tiết cho khóa học này.'}</p>
        </div>
      </SectionCard>
      <SectionCard icon={Building2} title="Thông tin khóa học">
        <dl className="course-facts">
          <div><dt>Nhà cung cấp</dt><dd>{course.provider || 'Chưa cập nhật'}</dd></div>
          <div><dt>Cấp độ</dt><dd>{COURSE_LEVEL_LABELS[course.level] || 'Chưa cập nhật'}</dd></div>
          <div><dt>Thời lượng</dt><dd>{formatCourseDuration(course.durationHours)}</dd></div>
          <div><dt>Học phí tham khảo</dt><dd>{formatCoursePrice(course)}</dd></div>
        </dl>
      </SectionCard>
    </>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [relatedResult, setRelatedResult] = useState(null);
  const [copying, setCopying] = useState(false);
  const topRef = useRef(null);
  const { toast, showToast } = useToast();
  const key = `${id}:${refresh}`;
  const loading = result?.key !== key;
  const course = loading ? null : result?.course;
  const error = loading ? '' : result?.error;
  const relatedLoading = relatedResult?.key !== key;
  const related = relatedLoading ? [] : relatedResult?.courses || [];
  const returnSearch = typeof location.state?.courseListSearch === 'string' && location.state.courseListSearch.startsWith('?') ? location.state.courseListSearch : '';

  useEffect(() => { topRef.current?.scrollIntoView({ block: 'start' }); }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    courseService.get(id, { signal: controller.signal })
      .then((loaded) => { if (!controller.signal.aborted) setResult({ key, course: loaded }); })
      .catch((err) => { if (!controller.signal.aborted) setResult({ key, error: err.message || 'Không tải được khóa học.', status: err.status }); });
    courseService.related(id, { signal: controller.signal })
      .then((loaded) => { if (!controller.signal.aborted) setRelatedResult({ key, courses: loaded }); })
      .catch(() => { if (!controller.signal.aborted) setRelatedResult({ key, error: true }); });
    return () => controller.abort();
  }, [id, key]);

  const share = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${ROUTES.COURSES}/${id}`);
      showToast('Đã sao chép liên kết khóa học.');
    } catch { showToast('Không thể sao chép tự động. Bạn có thể sao chép liên kết trên thanh địa chỉ.', 'error'); }
    finally { setCopying(false); }
  };

  return (
    <UserLayout>
      <Page className="courses-page">
        <div ref={topRef} className="course-detail-top" />
        <PageHeader title="Chi tiết khóa học" actions={<div className="course-actions">
          {course && <Button variant="secondary" icon={Share2} loading={copying} onClick={share}>Chia sẻ</Button>}
          <Link className="ui-btn ui-btn--secondary" to={`${ROUTES.COURSES}${returnSearch}`}><ArrowLeft size={16} /> Danh sách khóa học</Link>
        </div>} />
        {loading ? <Card><div role="status"><EmptyState icon={GraduationCap} title="Đang tải chi tiết khóa học…" /></div></Card>
          : error || !course ? <Card><div role="alert"><EmptyState icon={AlertCircle} title={result?.status === 404 ? 'Khóa học không còn hiển thị' : 'Không thể tải khóa học này'}
            hint={error || 'Khóa học không tồn tại hoặc đã ngừng hiển thị.'}
            action={<Button onClick={() => setRefresh((v) => v + 1)}>Thử lại</Button>} /></div></Card>
            : <>
              <CourseDetails course={course} />
              <section className="course-related" aria-label="Khóa học cùng chủ đề">
                <div className="course-results-heading"><h2>Khóa học cùng chủ đề</h2><Link to={ROUTES.COURSES}>Xem tất cả</Link></div>
                <p className="ui-hint course-related-hint">Các khóa học có kỹ năng hoặc công nghệ chung với nội dung bạn đang xem.</p>
                {relatedLoading ? <p role="status" className="ui-hint">Đang tìm khóa học liên quan…</p>
                  : relatedResult?.error ? <Card padded><p role="status">Chưa tải được khóa học liên quan.</p><Button size="sm" variant="secondary" onClick={() => setRefresh((v) => v + 1)}>Thử lại</Button></Card>
                    : related.length ? <div className="course-grid">{related.map((item) => <CourseCard key={item.id} course={item} returnSearch={returnSearch} />)}</div>
                      : <Card><EmptyState icon={BookOpen} title="Chưa có khóa học cùng chủ đề" hint="Bạn có thể khám phá những nội dung khác trong danh mục khóa học." /></Card>}
              </section>
            </>}
      </Page>
      <Toast toast={toast} />
    </UserLayout>
  );
}
