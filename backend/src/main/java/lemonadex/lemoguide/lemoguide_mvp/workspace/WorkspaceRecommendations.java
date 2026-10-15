package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.workspace.WorkspaceDtos.*;

/** Deterministic tag overlap, not an AI probability. Only new, currently published catalog entries. */
@Service @RequiredArgsConstructor
public class WorkspaceRecommendations {
    private final NamedParameterJdbcTemplate jdbc;
    private final lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingRepository jobRepository;
    private final lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseRepository courseRepository;

    public List<Recommendation> find(Long owner, LocalDate start, boolean jobs) {
        // Identifiers below are constants, never request input.
        String table = jobs ? "job_posting" : "course";
        LocalDateTime now = LocalDateTime.now();
        // Read timestamps through Hibernate, like the catalog APIs, to honor its JDBC timezone.
        List<Recommendation> candidates;
        if (jobs) {
            candidates = jobRepository.findAll((root, query, cb) -> cb.and(
                cb.equal(root.get("status"), lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingStatus.ACTIVE),
                cb.greaterThanOrEqualTo(root.get("postedAt"), start.atStartOfDay()),
                cb.lessThan(root.get("postedAt"), start.plusWeeks(1).atStartOfDay()),
                cb.lessThanOrEqualTo(root.get("postedAt"), now),
                cb.or(cb.isNull(root.get("expiresAt")), cb.greaterThan(root.get("expiresAt"), now))))
                .stream().map(j -> new Recommendation(j.getId(), j.getTitle(), j.getCompanyName(), j.getPostedAt(), new ArrayList<>())).toList();
        } else {
            candidates = courseRepository.findAll((root, query, cb) -> cb.and(cb.isTrue(root.get("isActive")),
                cb.greaterThanOrEqualTo(root.get("createdAt"), start.atStartOfDay()),
                cb.lessThan(root.get("createdAt"), start.plusWeeks(1).atStartOfDay()),
                cb.lessThanOrEqualTo(root.get("createdAt"), now)))
                .stream().map(c -> new Recommendation(c.getId(), c.getTitle(), c.getProvider(), c.getCreatedAt(), new ArrayList<>())).toList();
        }
        if (candidates.isEmpty()) return List.of();
        String ownSkills = "select us.skill_id from user_skill us join user_information ui on ui.id=us.user_information_id where ui.account_id=:owner";
        String ownTech = "select et.technology_id from experience_technology et join experience e on e.id=et.experience_id join user_information ui on ui.id=e.user_information_id where ui.account_id=:owner "
                + "union select pt.technology_id from project_technology pt join project p on p.id=pt.project_id join user_information ui on ui.id=p.user_information_id where ui.account_id=:owner";
        // Courses may also teach tags in the user's selected roadmap courses.
        String planSkills = jobs ? "" : " union select cs.skill_id from course_skill cs join career_task ct on ct.course_id=cs.course_id join career_plan cp on cp.id=ct.plan_id where cp.account_id=:owner";
        String planTech = jobs ? "" : " union select ctg.technology_id from course_technology ctg join career_task ct on ct.course_id=ctg.course_id join career_plan cp on cp.id=ct.plan_id where cp.account_id=:owner";
        String sql = "select tags." + table + "_id as id, s.name as reason from " + table + "_skill tags join skill s on s.id=tags.skill_id where tags." + table + "_id in (:ids) and tags.skill_id in (" + ownSkills + planSkills + ")"
                + " union select tags." + table + "_id, t.name from " + table + "_technology tags join technology t on t.id=tags.technology_id where tags." + table + "_id in (:ids) and tags.technology_id in (" + ownTech + planTech + ")";
        Map<Long, Recommendation> found = new LinkedHashMap<>();
        candidates.forEach(c -> found.put(c.id(), c));
        jdbc.query(sql, Map.of("owner", owner, "ids", candidates.stream().map(Recommendation::id).toList()), rs -> {
            Long id = rs.getLong("id");
            Recommendation entry = found.get(id);
            if (!entry.reasons().contains(rs.getString("reason"))) entry.reasons().add(rs.getString("reason"));
        });
        return found.values().stream().filter(c -> !c.reasons().isEmpty())
            .sorted(Comparator.comparing(Recommendation::publishedAt).reversed().thenComparing(Recommendation::id, Comparator.reverseOrder())).limit(6).toList();
    }
}
