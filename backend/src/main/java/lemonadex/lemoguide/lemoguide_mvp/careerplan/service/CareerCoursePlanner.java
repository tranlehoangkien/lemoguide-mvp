package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerRecommendationService.CourseCandidate;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;

/**
 * Splits a roadmap's weeks into course segments: weeks 1-2 study course A, weeks 3-5 course B, and the
 * last weeks are a capstone with no course. Done in code, not by the model, so every stored week points
 * at a real catalog course and course usage/completion can be counted reliably.
 *
 * <p>Order: easier courses first (BEGINNER, INTERMEDIATE, ADVANCED), then courses covering more of the
 * plan's skills. A course takes ceil(durationHours / hoursPerWeek) weeks (2 when its duration is
 * unknown), capped at half the plan so one long course cannot swallow it. A course that no longer fits
 * is skipped for a shorter one.
 */
final class CareerCoursePlanner {

    /** Weeks a course with no stated duration is given. */
    static final int DEFAULT_COURSE_WEEKS = 2;
    static final int MAX_COURSES = 8;

    /** Weeks {@code fromWeek..toWeek}; {@code courseId == null} marks self-study / capstone weeks. */
    record Segment(Long courseId, String courseTitle, List<String> skills, int fromWeek, int toWeek) {
        boolean covers(int week) {
            return week >= fromWeek && week <= toWeek;
        }
    }

    private CareerCoursePlanner() { }

    static List<Segment> allocate(List<CourseCandidate> candidates, int durationWeeks, int hoursPerWeek) {
        List<Segment> segments = new ArrayList<>();
        if (durationWeeks < 1) return segments;
        // Keep the last ~15% (at least one week once the plan has 4+) for a capstone that joins the courses up.
        int reserve = durationWeeks >= 4 ? Math.max(1, Math.round(durationWeeks * 0.15f)) : 0;
        int budget = durationWeeks - reserve;
        int maxCourseWeeks = Math.max(1, durationWeeks / 2);
        int week = 1;
        for (CourseCandidate candidate : ranked(candidates)) {
            if (segments.size() >= MAX_COURSES) break;
            int weeks = Math.min(weeksFor(candidate.course(), hoursPerWeek), maxCourseWeeks);
            if (week + weeks - 1 > budget) continue;
            segments.add(new Segment(candidate.course().getId(), candidate.course().getTitle(), candidate.skills(),
                    week, week + weeks - 1));
            week += weeks;
        }
        if (week <= durationWeeks) segments.add(new Segment(null, null, List.of(), week, durationWeeks));
        return segments;
    }

    static int weeksFor(Course course, int hoursPerWeek) {
        Integer hours = course.getDurationHours();
        if (hours == null || hours < 1 || hoursPerWeek < 1) return DEFAULT_COURSE_WEEKS;
        return Math.max(1, (int) Math.ceil((double) hours / hoursPerWeek));
    }

    private static List<CourseCandidate> ranked(List<CourseCandidate> candidates) {
        return candidates.stream()
                .sorted(Comparator.<CourseCandidate>comparingInt(c -> levelRank(c.course().getLevel()))
                        .thenComparing(Comparator.<CourseCandidate>comparingInt(c -> c.skills().size()).reversed())
                        .thenComparing(c -> c.course().getId()))
                .toList();
    }

    private static int levelRank(CourseLevel level) {
        return level == null ? 1 : level.ordinal();
    }

    static Segment segmentOf(List<Segment> segments, int week) {
        return segments.stream().filter(s -> s.covers(week)).findFirst().orElse(null);
    }

    /** Prompt lines telling the model which course each week of {@code from..to} belongs to. */
    static String describe(List<Segment> segments, int from, int to) {
        StringBuilder text = new StringBuilder();
        for (Segment s : segments) {
            if (s.toWeek() < from || s.fromWeek() > to) continue;
            String range = s.fromWeek() == s.toWeek() ? "Tuần " + s.fromWeek() : "Tuần " + s.fromWeek() + "-" + s.toWeek();
            if (s.courseId() == null) {
                text.append("- ").append(range).append(": dự án tổng hợp / tự thực hành, không thuộc khóa học nào; "
                        + "vận dụng kiến thức các khóa trước vào một sản phẩm kiểm chứng.\n");
            } else {
                text.append("- ").append(range).append(": học và thực hành theo khóa học \"").append(s.courseTitle())
                        .append("\" (kỹ năng: ").append(String.join(", ", s.skills())).append("). ");
                text.append("Các tuần của khóa đi theo thứ tự nội dung khóa, tuần cuối của khóa có bài tập tổng kết khóa.\n");
            }
        }
        return text.toString();
    }
}
