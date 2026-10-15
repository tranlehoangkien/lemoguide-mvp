/**
 * A roadmap is split into course segments by the backend (`plan.segments`): consecutive weeks studying one
 * catalog course, plus self-study / capstone weeks with no course. Roadmaps created before segments existed
 * have an empty list, and callers fall back to the plain week list.
 */
export const segmentLabel = (segment) => segment?.courseTitle || 'Dự án tổng hợp';

export const weekRange = (segment) =>
  segment.fromWeek === segment.toWeek ? `Tuần ${segment.fromWeek}` : `Tuần ${segment.fromWeek}–${segment.toWeek}`;

export const segmentOfWeek = (segments, week) =>
  (segments || []).find((s) => week >= s.fromWeek && week <= s.toWeek) || null;

/** The course that the latest save finished (all its weeks now done), for a "course completed" notice. */
export const justCompletedCourse = (before, after, week) => {
  const next = segmentOfWeek(after?.segments, week);
  const prev = segmentOfWeek(before?.segments, week);
  return next?.courseTitle && next.completed && !prev?.completed ? next : null;
};
