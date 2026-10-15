package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.dto.CareerPlanResponse;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerCoursePlanner.Segment;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerRecommendationService.CourseCandidate;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;

class CareerCoursePlannerTest {

    private static CourseCandidate course(long id, CourseLevel level, Integer hours, String... skills) {
        return new CourseCandidate(Course.builder().id(id).title("Course " + id).level(level).durationHours(hours).build(),
                List.of(skills));
    }

    @Test void splitsWeeksByCourseEasiestFirstAndEndsWithACapstone() {
        var segments = CareerCoursePlanner.allocate(List.of(
                course(1, CourseLevel.ADVANCED, 30, "Docker"),
                course(2, CourseLevel.BEGINNER, 24, "Java"),
                course(3, CourseLevel.INTERMEDIATE, 40, "Spring Boot", "Java")), 12, 15);

        assertEquals(List.of(2L, 3L, 1L), segments.stream().limit(3).map(Segment::courseId).toList());
        // 24h / 15h = 2 weeks, 40h = 3 weeks, 30h = 2 weeks, then the rest is the capstone.
        assertEquals(List.of(1, 3, 6, 8), segments.stream().map(Segment::fromWeek).toList());
        assertEquals(List.of(2, 5, 7, 12), segments.stream().map(Segment::toWeek).toList());
        assertNull(segments.getLast().courseId());
    }

    @Test void skipsCoursesThatNoLongerFitAndCapsLongOnes() {
        var segments = CareerCoursePlanner.allocate(List.of(
                course(1, CourseLevel.BEGINNER, 200, "Java"),       // capped at half of 8 weeks = 4
                course(2, CourseLevel.INTERMEDIATE, 60, "SQL"),     // 3 weeks: would end at week 7 > budget 7? fits exactly
                course(3, CourseLevel.ADVANCED, 10, "Git")), 8, 20);

        assertEquals(4, segments.getFirst().toWeek());
        assertEquals(List.of(1L, 2L), segments.stream().map(Segment::courseId).filter(java.util.Objects::nonNull).toList());
        assertEquals(8, segments.getLast().toWeek());
        assertEquals(1, segments.stream().filter(s -> s.courseId() == null).count());
    }

    @Test void withoutMatchingCoursesTheWholePlanIsOneSelfStudySegment() {
        var segments = CareerCoursePlanner.allocate(List.of(), 6, 10);
        assertEquals(1, segments.size());
        assertNull(segments.getFirst().courseId());
        assertEquals(1, segments.getFirst().fromWeek());
        assertEquals(6, segments.getFirst().toWeek());
    }

    @Test void unknownDurationGetsDefaultWeeks() {
        var segments = CareerCoursePlanner.allocate(List.of(course(1, CourseLevel.BEGINNER, null, "Java")), 10, 10);
        assertEquals(CareerCoursePlanner.DEFAULT_COURSE_WEEKS, segments.getFirst().toWeek());
    }

    @Test void responseGroupsWeeksIntoCourseSegmentsWithProgress() {
        var task = (java.util.function.BiFunction<Integer, String, CareerPlanResponse.Task>) (week, title) ->
                new CareerPlanResponse.Task((long) week, week, title == null ? null : 1L, title, "t", "a", "s", 5,
                        List.of(), List.of(), week <= 2, null, null);
        var segments = CareerPlanResponse.Segment.of(List.of(task.apply(3, "B"), task.apply(1, "A"), task.apply(2, "A"),
                task.apply(4, null)));
        assertEquals(3, segments.size());
        assertTrue(segments.getFirst().completed());
        assertEquals(2, segments.getFirst().totalWeeks());
        assertFalse(segments.get(1).completed());
        assertNull(segments.get(2).courseTitle());
        // Roadmaps created before course segments have no course on any week.
        assertTrue(CareerPlanResponse.Segment.of(List.of(task.apply(1, null))).isEmpty());
    }
}
