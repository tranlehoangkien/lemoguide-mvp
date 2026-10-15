package lemonadex.lemoguide.lemoguide_mvp.profile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerTask;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.CareerTaskRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.discovery.DiscoveryService;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.workspace.WeeklyTaskRepository;
import lombok.RequiredArgsConstructor;

/** A live projection of stored evidence. Undo/delete immediately reverses progress;
 * retries cannot award points twice. Learning activity never overwrites self-rated proficiency. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DynamicProfileService {
    private final CareerTaskRepository careerTasks;
    private final WeeklyTaskRepository weeklyTasks;
    private final CourseSkillRepository courseSkills;
    private final SkillRepository skills;
    private final CourseTechnologyRepository courseTechnologies;
    private final TechnologyRepository technologies;
    private final DiscoveryService discovery;

    public record TaskProgress(long completed, long total, int percent, LocalDateTime lastCompletedAt) { }
    public record LearningSkill(Long skillId, String skillName, long completedTasks, long totalTasks,
                                long completedCourses, LocalDateTime lastCompletedAt, Long technologyId) { }
    public record Progress(TaskProgress roadmap, TaskProgress weekly, List<LearningSkill> learningSkills,
                           DiscoveryService.Progress assessment) { }

    public Progress read(Long accountId) {
        var tasks = careerTasks.findOwnedTasks(accountId);
        long completed = tasks.stream().filter(DynamicProfileService::completed).count();
        var roadmap = progress(completed, tasks.size(), tasks.stream().filter(DynamicProfileService::completed)
                .map(CareerTask::getCompletedAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null));
        var weekly = progress(weeklyTasks.countByAccountIdAndCompletedTrue(accountId),
                weeklyTasks.countByAccountId(accountId), weeklyTasks
                        .findFirstByAccountIdAndCompletedTrueOrderByCompletedAtDescIdDesc(accountId)
                        .map(t -> t.getCompletedAt()).orElse(null));

        return new Progress(roadmap, weekly, learningSkills(tasks), discovery.progress(accountId));
    }

    public List<LearningSkill> learningSkills(Long accountId) {
        return learningSkills(careerTasks.findOwnedTasks(accountId));
    }

    private record LearningTarget(Long skillId, Long technologyId, String name) { }

    private List<LearningSkill> learningSkills(List<CareerTask> tasks) {
        var byCourse = tasks.stream().filter(t -> t.getCourseId() != null)
                .collect(Collectors.groupingBy(CareerTask::getCourseId));
        Map<LearningTarget, Set<Long>> coursesBySkill = new HashMap<>();
        if (!byCourse.isEmpty()) {
            var tags = courseSkills.findByCourseIdIn(byCourse.keySet());
            // Read-only associations on freshly saved junction rows may still be null in the persistence context.
            var catalog = skills.findAllById(tags.stream().map(tag -> tag.getSkillId()).distinct().toList()).stream()
                    .collect(Collectors.toMap(skill -> skill.getId(), skill -> skill));
            for (var tag : tags) {
                var skill = catalog.get(tag.getSkillId());
                if (skill != null) coursesBySkill.computeIfAbsent(new LearningTarget(skill.getId(), null, skill.getName()),
                        ignored -> new HashSet<>()).add(tag.getCourseId());
            }
            var techTags = courseTechnologies.findByCourseIdIn(byCourse.keySet());
            var techs = technologies.findAllById(techTags.stream().map(tag -> tag.getTechnologyId()).distinct().toList()).stream()
                    .collect(Collectors.toMap(tech -> tech.getId(), tech -> tech));
            var names = techs.values().stream().map(tech -> tech.getName().toLowerCase(Locale.ROOT)).distinct().toList();
            var hardSkills = names.isEmpty() ? Map.<String, lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill>of()
                    : skills.findByTypeAndNamesIgnoreCase(SkillType.hard, names).stream()
                        .collect(Collectors.toMap(skill -> skill.getName().toLowerCase(Locale.ROOT), skill -> skill));
            for (var tag : techTags) {
                var tech = techs.get(tag.getTechnologyId());
                if (tech == null) continue;
                var skill = hardSkills.get(tech.getName().toLowerCase(Locale.ROOT));
                var target = skill == null ? new LearningTarget(null, tech.getId(), tech.getName())
                        : new LearningTarget(skill.getId(), null, skill.getName());
                coursesBySkill.computeIfAbsent(target, ignored -> new HashSet<>()).add(tag.getCourseId());
            }
        }
        return coursesBySkill.entrySet().stream().map(entry -> {
            var skillTasks = entry.getValue().stream().flatMap(id -> byCourse.get(id).stream()).toList();
            long done = skillTasks.stream().filter(DynamicProfileService::completed).count();
            long doneCourses = entry.getValue().stream()
                    .filter(id -> byCourse.get(id).stream().allMatch(DynamicProfileService::completed)).count();
            var last = skillTasks.stream().filter(DynamicProfileService::completed).map(CareerTask::getCompletedAt)
                    .filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
            var target = entry.getKey();
            return new LearningSkill(target.skillId(), target.name(), done, skillTasks.size(), doneCourses, last, target.technologyId());
        }).sorted(Comparator.comparing(LearningSkill::skillName)
                .thenComparing(LearningSkill::skillId, Comparator.nullsLast(Comparator.naturalOrder()))).toList();
    }

    /** Stable text for AI snapshots/cache keys. Counts are activity, assessment scores are short-test evidence. */
    public String context(Long accountId) {
        var data = read(accountId);
        var out = new StringBuilder();
        if (data.roadmap().completed() > 0 || data.weekly().completed() > 0) {
            out.append("\nTIẾN ĐỘ HỌC TẬP (người dùng tự đánh dấu; chưa xác nhận thành thạo):\n")
                    .append("- Nhiệm vụ lộ trình: ").append(data.roadmap().completed()).append('/').append(data.roadmap().total()).append('\n')
                    .append("- Công việc cá nhân: ").append(data.weekly().completed()).append('/').append(data.weekly().total()).append('\n');
            data.learningSkills().stream().filter(s -> s.completedTasks() > 0).limit(10).forEach(s -> out
                    .append("- ").append(s.skillName()).append(": ").append(s.completedTasks()).append('/').append(s.totalTasks())
                    .append(" nhiệm vụ; ").append(s.completedCourses()).append(" khóa hoàn thành trong lộ trình\n"));
        }
        if (data.assessment().attempts() > 0) {
            out.append("\nĐÁNH GIÁ KỸ NĂNG (bài tình huống ngắn, 3 câu nền mỗi kỹ năng; không phải chứng nhận năng lực):\n")
                    .append("- Lần đánh giá mới nhất: ").append(data.assessment().latestAt()).append('\n');
            data.assessment().changes().forEach(s -> out.append("- ").append(s.label()).append(": ")
                    .append(s.latest()).append("/100; thay đổi so với lần đầu: ").append(s.fromBaseline()).append('\n'));
        }
        return out.toString();
    }

    private static boolean completed(CareerTask task) { return Boolean.TRUE.equals(task.getCompleted()); }
    private static TaskProgress progress(long completed, long total, LocalDateTime last) {
        return new TaskProgress(completed, total, total == 0 ? 0 : (int) Math.round(100.0 * completed / total), last);
    }
}
