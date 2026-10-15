package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.dto.*;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.*;
import lombok.RequiredArgsConstructor;

/** Catalog-backed suggestions. No AI-generated job IDs, URLs or match percentages. */
@Service
@RequiredArgsConstructor
public class CareerRecommendationService {
    private final CourseRepository courses;
    private final CourseSkillRepository courseSkills;
    private final CourseTechnologyRepository courseTechnologies;
    private final JobPostingRepository jobs;
    private final JobPostingSkillRepository jobSkills;
    private final JobPostingTechnologyRepository jobTechnologies;

    public record CourseMatch(Long id, String title, String provider, Integer durationHours, List<String> skills) { }
    public record JobMatch(Long id, String title, String company, double score, List<String> matchedSkills, List<String> missingSkills) { }
    public record Recommendations(List<CourseMatch> courses, List<JobMatch> jobs) { }
    record Requirement(String name, boolean required) { }

    /**
     * "&", ",", ";", " và ", " and ", " / " and parentheses. A bare "/" and "+" stay, so "CI/CD" and "C++" are one term.
     */
    private static final java.util.regex.Pattern TERM_SEPARATORS = java.util.regex.Pattern.compile(
            "\\s*(?:&|,|;|\\s/\\s|\\(|\\)|\\svà\\s|\\sand\\s)\\s*", java.util.regex.Pattern.CASE_INSENSITIVE);

    public Recommendations forPlan(CareerAnalysis analysis) {
        if (analysis.outcomes() == null || analysis.outcomes().isEmpty()) return new Recommendations(List.of(), List.of());
        // The AI names outcomes like "Spring Boot & Java": match each part, and keep the whole phrase too.
        Map<String, String> outcomeTerms = terms(analysis.outcomes().stream().map(CareerProposal.Outcome::skill).toList());
        Set<String> projected = outcomeTerms.keySet();
        // Courses may also cover what the plan says to learn first.
        List<String> learning = new ArrayList<>(analysis.outcomes().stream().map(CareerProposal.Outcome::skill).toList());
        if (analysis.gaps() != null) analysis.gaps().forEach(g -> { if (g != null && g.skill() != null) learning.add(g.skill()); });
        List<CourseMatch> courseMatches = courseCandidates(learning).stream()
                .map(c -> new CourseMatch(c.course().getId(), c.course().getTitle(), c.course().getProvider(),
                        c.course().getDurationHours(), c.skills()))
                .toList();
        List<JobMatch> jobMatches = new ArrayList<>();
        ExperienceLevel level;
        try { level = ExperienceLevel.valueOf(analysis.level()); }
        catch (Exception ex) { return new Recommendations(topCourses(courseMatches), List.of()); }
        LocalDateTime now = LocalDateTime.now();
        for (int page = 0; ; page++) {
            var batch = jobs.findAll((root, query, cb) -> cb.and(
                    cb.equal(root.get("status"), JobPostingStatus.ACTIVE),
                    cb.lessThanOrEqualTo(root.get("postedAt"), now),
                    cb.or(cb.isNull(root.get("expiresAt")), cb.greaterThan(root.get("expiresAt"), now))),
                    PageRequest.of(page, 200, org.springframework.data.domain.Sort.by("id")));
            List<Long> ids = batch.map(JobPosting::getId).getContent();
            if (ids.isEmpty()) break;
            Map<Long, List<Requirement>> tags = new HashMap<>();
            jobSkills.findByJobPostingIdInWithSkill(ids).forEach(t -> tags.computeIfAbsent(t.getJobPostingId(), k -> new ArrayList<>())
                    .add(new Requirement(t.getSkill().getName(), Boolean.TRUE.equals(t.getIsRequired()))));
            jobTechnologies.findByJobPostingIdInWithTechnology(ids).forEach(t -> tags.computeIfAbsent(t.getJobPostingId(), k -> new ArrayList<>())
                    .add(new Requirement(t.getTechnology().getName(), Boolean.TRUE.equals(t.getIsRequired()))));
            for (var j : batch) {
                if (j.getExperienceLevel() == null || j.getExperienceLevel().ordinal() > level.ordinal()) continue;
                JobMatch match = match(j, tags.getOrDefault(j.getId(), List.of()), projected);
                if (match != null) jobMatches.add(match);
            }
            if (!batch.hasNext()) break;
        }
        return new Recommendations(topCourses(courseMatches), jobMatches.stream()
                .sorted(Comparator.comparingDouble(JobMatch::score).reversed().thenComparing(JobMatch::id)).limit(3).toList());
    }

    /** An active catalog course and the learning terms (display text) it covers. */
    public record CourseCandidate(Course course, List<String> skills) { }

    /**
     * Every active course covering at least one of the given skill names (split and matched like
     * {@link #courseMatches}). Scans every catalog page; the caller ranks and trims.
     */
    public List<CourseCandidate> courseCandidates(List<String> skillNames) {
        Map<String, String> courseTerms = terms(skillNames);
        List<CourseCandidate> candidates = new ArrayList<>();
        if (courseTerms.isEmpty()) return candidates;
        for (int page = 0; ; page++) {
            var batch = courses.findAll((root, query, cb) -> cb.isTrue(root.get("isActive")), PageRequest.of(page, 200,
                    org.springframework.data.domain.Sort.by("id")));
            List<Long> ids = batch.map(Course::getId).getContent();
            if (ids.isEmpty()) break;
            Map<Long, Set<String>> tags = new HashMap<>();
            courseSkills.findByCourseIdInWithSkill(ids).forEach(t -> tags.computeIfAbsent(t.getCourseId(), k -> new TreeSet<>()).add(t.getSkill().getName()));
            courseTechnologies.findByCourseIdInWithTechnology(ids).forEach(t -> tags.computeIfAbsent(t.getCourseId(), k -> new TreeSet<>()).add(t.getTechnology().getName()));
            for (var c : batch) {
                List<String> matched = courseMatches(c.getTitle(), tags.getOrDefault(c.getId(), Set.of()), courseTerms);
                if (!matched.isEmpty()) candidates.add(new CourseCandidate(c, matched));
            }
            if (!batch.hasNext()) break;
        }
        return candidates;
    }

    private static List<CourseMatch> topCourses(List<CourseMatch> matches) {
        return matches.stream().sorted(Comparator.<CourseMatch>comparingInt(c -> c.skills().size()).reversed()
                .thenComparing(CourseMatch::id)).limit(6).toList();
    }

    static JobMatch match(JobPosting job, List<Requirement> requirements, Set<String> projected) {
        // Duplicate skill/technology tags count once; required tags carry twice the weight.
        Map<String, Requirement> unique = new TreeMap<>();
        requirements.forEach(r -> unique.merge(normalize(r.name()), r, (a, b) -> a.required() ? a : b));
        int total = 0, matchedWeight = 0;
        List<String> matched = new ArrayList<>(), missing = new ArrayList<>();
        for (var entry : unique.entrySet()) {
            var r = entry.getValue();
            int weight = r.required() ? 2 : 1;
            total += weight;
            if (projected.contains(entry.getKey())) { matchedWeight += weight; matched.add(r.name()); }
            else missing.add(r.name());
        }
        // Apply the strict threshold to the unrounded score.
        double score = total == 0 ? 0 : 100.0 * matchedWeight / total;
        if (score <= 60) return null;
        return new JobMatch(job.getId(), job.getTitle(), job.getCompanyName(), score, matched, missing);
    }

    /** Normalized term -> display text: every whole name plus each part of a combined one ("Docker & CI/CD"). */
    static Map<String, String> terms(List<String> names) {
        Map<String, String> terms = new LinkedHashMap<>();
        for (String name : names) {
            if (name == null || name.isBlank()) continue;
            terms.putIfAbsent(normalize(name), name.trim());
            for (String part : TERM_SEPARATORS.split(name)) {
                String display = part.replaceAll("[()]", "").trim();
                if (!display.isEmpty()) terms.putIfAbsent(normalize(display), display);
            }
        }
        return terms;
    }

    /**
     * Terms (by display text) a course covers: equal to one of its skill/technology tags, or, for terms of
     * three or more characters, appearing as a whole word in its title or tags ("Spring Boot" in
     * "Xây dựng REST API với Spring Boot", "CI/CD" in "CI/CD Pipeline Design"). Whole words only, so
     * "Java" does not match "JavaScript".
     */
    static List<String> courseMatches(String title, Collection<String> tags, Map<String, String> terms) {
        Set<String> normalizedTags = tags.stream().map(CareerRecommendationService::normalize).collect(Collectors.toSet());
        String text = normalize(Objects.toString(title, "") + " | " + String.join(" | ", tags));
        Set<String> matched = new LinkedHashSet<>();
        terms.forEach((term, display) -> {
            if (normalizedTags.contains(term) || (term.length() >= 3 && containsWord(text, term))) matched.add(display);
        });
        // "Spring Boot & Java" and its parts would all match the same course: keep the most specific names.
        matched.removeIf(d -> TERM_SEPARATORS.matcher(d).find() && matched.stream().anyMatch(o -> !o.equals(d) && d.contains(o)));
        return List.copyOf(matched);
    }

    private static boolean containsWord(String text, String term) {
        return java.util.regex.Pattern.compile("(^|[^a-z0-9+#])" + java.util.regex.Pattern.quote(term) + "($|[^a-z0-9+#])")
                .matcher(text).find();
    }

    static String normalize(String s) {
        String value = Normalizer.normalize(s.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").replace('đ', 'd').replaceAll("\\s+", " ");
        return switch (value) {
            case "reactjs", "react.js" -> "react";
            case "nodejs", "node.js" -> "node";
            case "js" -> "javascript";
            case "ts" -> "typescript";
            case "postgres" -> "postgresql";
            default -> value;
        };
    }
}
