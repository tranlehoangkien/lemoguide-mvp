package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPosting;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerRecommendationService.Requirement;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.dto.*;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

class CareerRecommendationServiceTest {
    private final JobPosting job = JobPosting.builder().id(1L).title("Backend Junior").companyName("Company").build();

    @Test void hidesExactlySixtyPercentAndJobsWithoutRequirements() {
        var tags = List.of(new Requirement("Java", true), new Requirement("SQL", true), new Requirement("Git", false));
        assertNull(CareerRecommendationService.match(job, tags, Set.of("java", "git")));
        assertNull(CareerRecommendationService.match(job, List.of(), Set.of("java")));
        assertNull(CareerRecommendationService.match(job, tags, Set.of()));
    }

    @Test void weightsRequiredSkillsAndListsMissingEvidence() {
        var tags = List.of(new Requirement("Java", true), new Requirement("SQL", true), new Requirement("Git", false));
        var result = CareerRecommendationService.match(job, tags, Set.of("java", "sql"));
        assertEquals(80, result.score());
        assertEquals(List.of("Git"), result.missingSkills());
        assertEquals(2, result.matchedSkills().size());
    }

    @Test void mergesSkillTechnologyDuplicatesAndRecognizesAliasesWithoutSubstringMatches() {
        var tags = List.of(new Requirement("React", false), new Requirement("React.js", true), new Requirement("SQL", true));
        assertEquals(100, CareerRecommendationService.match(job, tags, Set.of("react", "sql")).score());
        assertNull(CareerRecommendationService.match(job, tags, Set.of("react")));
        assertNotEquals(CareerRecommendationService.normalize("Java"), CareerRecommendationService.normalize("JavaScript"));
        assertEquals("react", CareerRecommendationService.normalize(" ReactJS "));
    }

    @Test void splitsCombinedOutcomeNamesButKeepsSlashAndPlusTerms() {
        var terms = CareerRecommendationService.terms(List.of("Spring Boot & Java", "Docker & CI/CD", "C++", "Redis (Caching)"));
        assertTrue(terms.keySet().containsAll(Set.of("spring boot & java", "spring boot", "java", "docker", "ci/cd", "c++", "redis", "caching")));
        assertFalse(terms.containsKey("ci"));
    }

    @Test void matchesCoursesByTagOrWholeWordInTitle() {
        var terms = CareerRecommendationService.terms(List.of("Spring Boot & Java", "Docker & CI/CD", "SQL & PostgreSQL"));
        assertEquals(List.of("Spring Boot"),
                CareerRecommendationService.courseMatches("Xây dựng REST API với Spring Boot", List.of("RESTful API Design"), terms));
        assertEquals(List.of("CI/CD"),
                CareerRecommendationService.courseMatches("Xây dựng pipeline CI/CD tự động", List.of("CI/CD Pipeline Design"), terms));
        assertEquals(List.of("SQL", "PostgreSQL"),
                CareerRecommendationService.courseMatches("Thiết kế cơ sở dữ liệu quan hệ", List.of("PostgreSQL", "SQL"), terms));
        // Whole words only: "Java" must not match a JavaScript course.
        assertEquals(List.of(), CareerRecommendationService.courseMatches("JavaScript cơ bản", List.of("JavaScript"), terms));
    }

    @Test void retainsFractionalScoresAboveSixtyBeforeDisplayRounding() {
        var tags = java.util.stream.IntStream.range(0, 33).mapToObj(i -> new Requirement("s" + i, true)).toList();
        var projected = java.util.stream.IntStream.range(0, 20).mapToObj(i -> "s" + i).collect(java.util.stream.Collectors.toSet());
        var result = CareerRecommendationService.match(job, tags, projected);
        assertTrue(result.score() > 60 && result.score() < 61);
    }

    @Test void ranksAllPagesAndReturnsOnlyTopThreeWithinProjectedLevel() {
        var courses = mock(CourseRepository.class);
        var jobs = mock(JobPostingRepository.class);
        var skills = mock(JobPostingSkillRepository.class);
        var technologies = mock(JobPostingTechnologyRepository.class);
        when(courses.findAll(org.mockito.ArgumentMatchers.<Specification<lemonadex.lemoguide.lemoguide_mvp.course.entity.Course>>any(), any(Pageable.class)))
                .thenReturn(Page.empty());
        var postings = java.util.stream.LongStream.rangeClosed(1, 5).mapToObj(id -> JobPosting.builder().id(id).title("Job " + id)
                .experienceLevel(id == 5 ? ExperienceLevel.SENIOR : ExperienceLevel.JUNIOR).build()).toList();
        when(jobs.findAll(org.mockito.ArgumentMatchers.<Specification<JobPosting>>any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(postings.subList(0, 2), PageRequest.of(0, 2), 5),
                        new PageImpl<>(postings.subList(2, 5), PageRequest.of(1, 3), 5));
        var javaSkill = Skill.builder().id(1L).name("Java").build();
        var sql = Skill.builder().id(2L).name("SQL").build();
        when(skills.findByJobPostingIdInWithSkill(any())).thenAnswer(invocation -> {
            java.util.Collection<Long> ids = invocation.getArgument(0);
            return ids.stream().flatMap(id -> {
                var matched = JobPostingSkill.builder().jobPostingId(id).skill(javaSkill).isRequired(true).build();
                return id == 1 ? java.util.stream.Stream.of(matched,
                        JobPostingSkill.builder().jobPostingId(id).skill(sql).isRequired(false).build()) : java.util.stream.Stream.of(matched);
            }).toList();
        });
        when(technologies.findByJobPostingIdInWithTechnology(any())).thenReturn(List.of());
        var service = new CareerRecommendationService(courses, mock(CourseSkillRepository.class), mock(CourseTechnologyRepository.class), jobs, skills, technologies);
        var analysis = new CareerAnalysis("Junior", "", "", List.of(), List.of(), List.of(), "",
                List.of(new CareerProposal.Outcome("Java", "Tested API")), "JUNIOR");
        assertEquals(List.of(2L, 3L, 4L), service.forPlan(analysis).jobs().stream().map(CareerRecommendationService.JobMatch::id).toList());
        verify(jobs, times(2)).findAll(org.mockito.ArgumentMatchers.<Specification<JobPosting>>any(), any(Pageable.class));
    }
}
