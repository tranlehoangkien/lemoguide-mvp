package lemonadex.lemoguide.lemoguide_mvp.careerplan.dto;

import java.time.LocalDateTime;
import java.util.List;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerTask;
import tools.jackson.databind.ObjectMapper;

public record CareerPlanResponse(Long id, String intent, String targetRole, Integer hoursPerWeek,
        Integer durationWeeks, Boolean useProfile, Long cvProfileId, String background, String constraints,
        CareerAnalysis analysis, List<Task> tasks, int completedCount, int totalCount, int progress,
        LocalDateTime createdAt, LocalDateTime updatedAt,
        lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerRecommendationService.Recommendations recommendations,
        List<Segment> segments) {
    public record Task(Long id, Integer weekNumber, Long courseId, String courseTitle, String title, String action,
            String successCriteria, Integer estimatedHours, List<String> checkpoints, List<String> resources,
            Boolean completed, String notes, LocalDateTime completedAt) {
        public static Task from(ObjectMapper mapper, CareerTask t) {
            return new Task(t.getId(), t.getWeekNumber(), t.getCourseId(), t.getCourseTitle(), t.getTitle(), t.getAction(),
                    t.getSuccessCriteria(), t.getEstimatedHours(), readList(mapper, t.getCheckpointsJson()),
                    readList(mapper, t.getResourcesJson()), t.getCompleted(), t.getNotes(), t.getCompletedAt());
        }
        private static List<String> readList(ObjectMapper mapper, String json) {
            if (json == null || json.isBlank()) return List.of();
            return List.of(mapper.readValue(json, String[].class));
        }
    }
    /**
     * Consecutive weeks studying the same course (or, with a null course title, self-study / capstone weeks).
     * A course counts as finished when all of its weeks are completed. Empty for roadmaps made before
     * course segments existed (no week has a course).
     */
    public record Segment(Long courseId, String courseTitle, int fromWeek, int toWeek, int completedWeeks,
            int totalWeeks, boolean completed) {
        public static List<Segment> of(List<Task> tasks) {
            if (tasks.stream().allMatch(t -> t.courseTitle() == null)) return List.of();
            List<Segment> segments = new java.util.ArrayList<>();
            List<Task> current = new java.util.ArrayList<>();
            for (Task t : tasks.stream().sorted(java.util.Comparator.comparing(Task::weekNumber)).toList()) {
                if (!current.isEmpty() && !java.util.Objects.equals(current.getFirst().courseTitle(), t.courseTitle())) {
                    segments.add(build(current));
                    current = new java.util.ArrayList<>();
                }
                current.add(t);
            }
            if (!current.isEmpty()) segments.add(build(current));
            return segments;
        }

        private static Segment build(List<Task> weeks) {
            int done = (int) weeks.stream().filter(t -> Boolean.TRUE.equals(t.completed())).count();
            Task first = weeks.getFirst();
            return new Segment(first.courseId(), first.courseTitle(), first.weekNumber(), weeks.getLast().weekNumber(),
                    done, weeks.size(), done == weeks.size());
        }
    }
    public record Summary(Long id, String targetRole, String intent, int durationWeeks, int hoursPerWeek,
            int completedCount, int totalCount, int progress, LocalDateTime updatedAt) { }
}
