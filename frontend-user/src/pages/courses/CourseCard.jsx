import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, Building2, Banknote } from 'lucide-react';
import { Badge, DetailLink } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { COURSE_LEVEL_LABELS, courseThumbnailUrl, formatCourseDuration, formatCoursePrice } from '@/services/courseService';

export function CourseArtwork({ course, compact = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const src = courseThumbnailUrl(course.thumbnailUrl);
  return (
    <div className={`course-art${compact ? ' course-art--compact' : ''}`} aria-hidden="true">
      {src && failedUrl !== src ? <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} /> : <GraduationCap size={compact ? 26 : 42} strokeWidth={1.4} />}
    </div>
  );
}

export default function CourseCard({ course, display = 'grid', returnSearch = '' }) {
  const tags = [...(course.skills || []), ...(course.technologies || [])];
  const path = `${ROUTES.COURSES}/${course.id}`;
  return (
    <article className={`ui-item-card ui-job-card course-card${display === 'list' ? ' ui-job-card--row' : ''}`}>
      <CourseArtwork course={course} compact={display === 'list'} />
      <div className="course-card__content">
        <h2><Link to={path} state={{ courseListSearch: returnSearch }}>{course.title}</Link></h2>
        <p className="course-card__provider"><Building2 size={14} />{course.provider || 'Chưa cập nhật nhà cung cấp'}</p>
        {display !== 'list' && <p className="course-card__description">{course.description || 'Nội dung chi tiết đang được cập nhật.'}</p>}
        <div className="ui-chip-row course-card__tags">
          <Badge>{COURSE_LEVEL_LABELS[course.level] || 'Chưa cập nhật cấp độ'}</Badge>
          {tags.slice(0, 3).map((tag, i) => <Badge key={`${tag.id}-${i}`}>{tag.name}</Badge>)}
          {tags.length > 3 && <span className="ui-hint">+{tags.length - 3}</span>}
        </div>
      </div>
      <div className="ui-job-card__side course-card__footer">
        <strong className="ui-job-card__salary"><Banknote size={16} aria-hidden="true" />{formatCoursePrice(course)}</strong>
        <span className="ui-inline"><Clock size={13} aria-hidden="true" />{formatCourseDuration(course.durationHours)}</span>
        <div className="course-card__actions">
          <DetailLink to={path} state={{ courseListSearch: returnSearch }} aria-label={`Xem chi tiết ${course.title}`} />
        </div>
      </div>
    </article>
  );
}
