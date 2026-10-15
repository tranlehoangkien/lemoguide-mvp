package lemonadex.lemoguide.lemoguide_mvp.profile;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.hasSize;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.discovery.DiscoveryBank;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service.ProfileSnapshotBuilder;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkill;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkillSource;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import tools.jackson.databind.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
@Sql("/plan-fixture.sql") @Transactional
class DynamicProfileFlowTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired AccountRepository accounts;
    @Autowired UserInformationRepository profiles;
    @Autowired CareerPlanRepository plans;
    @Autowired CareerTaskRepository tasks;
    @Autowired CourseRepository courses;
    @Autowired CourseSkillRepository courseSkills;
    @Autowired CourseTechnologyRepository courseTechnologies;
    @Autowired TechnologyRepository technologies;
    @Autowired SkillRepository skills;
    @Autowired UserSkillRepository userSkills;
    @Autowired DiscoveryBank bank;
    @Autowired ProfileSnapshotBuilder snapshots;
    String user, other;
    Long owner;
    static final String URL = "/api/me/profile-progress";

    @BeforeEach void setup() throws Exception {
        user = register("dynamic@example.com");
        other = register("dynamic-other@example.com");
        owner = accounts.findByEmail("dynamic@example.com").orElseThrow().getId();
    }

    String register(String email) throws Exception {
        var body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", email, "password", "Password123!", "fullName", "Dynamic User"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return "Bearer " + mapper.readTree(body).path("data").path("accessToken").asText();
    }
    JsonNode write(String path, Object body) throws Exception {
        return mapper.readTree(mvc.perform(post(path).header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("data");
    }
    JsonNode read() throws Exception {
        return mapper.readTree(mvc.perform(get(URL).header("Authorization", user)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).path("data");
    }
    CareerPlan plan() {
        return plans.saveAndFlush(CareerPlan.builder().accountId(owner).intent("goal").targetRole("Java Developer")
                .hoursPerWeek(5).durationWeeks(4).useProfile(true).contextText("Java").analysisJson("{}").build());
    }
    CareerTask task(CareerPlan plan, Long courseId, int week) {
        return tasks.saveAndFlush(CareerTask.builder().planId(plan.getId()).courseId(courseId).weekNumber(week)
                .title("Practice Java " + week).action("Build an API").successCriteria("Tests pass").estimatedHours(5).build());
    }
    void complete(CareerTask task, boolean completed) throws Exception {
        mvc.perform(patch("/api/me/career-plans/" + task.getPlanId() + "/tasks/" + task.getId())
                .header("Authorization", user).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("completed", completed, "notes", "Practice evidence"))))
                .andExpect(status().isOk());
    }
    Course technologyCourse(String name) {
        var technology = technologies.saveAndFlush(Technology.builder().name(name).build());
        var course = courses.saveAndFlush(Course.builder().title(name + " practice").level(CourseLevel.BEGINNER)
                .isFree(true).isActive(true).build());
        courseTechnologies.saveAndFlush(CourseTechnology.builder().courseId(course.getId()).technologyId(technology.getId()).build());
        return course;
    }
    List<UserSkill> assigned() {
        return userSkills.findByUserInformationIdOrderByCreatedAtDesc(profiles.findByAccountId(owner).orElseThrow().getId());
    }

    @Test void completedTechnologyCoursesAddJavaAndSpringWithNoInventedRatingAndUndoRemovesOnlyTheirEvidence() throws Exception {
        var java = technologyCourse("Java");
        var spring = technologyCourse("Spring Boot");
        var plan = plan();
        var first = task(plan, java.getId(), 1);
        var second = task(plan, java.getId(), 2);
        var third = task(plan, spring.getId(), 3);
        task(plan, null, 4); // A pending capstone does not prevent completed course skills being added.
        assertTrue(assigned().isEmpty());
        assertEquals(2, read().path("learningSkills").size());
        complete(first, true);
        assertTrue(assigned().isEmpty());
        complete(second, true);
        var javaSkill = skills.findByNameIgnoreCaseAndType("Java", SkillType.hard).orElseThrow();
        assertEquals(1, assigned().size());
        assertEquals(javaSkill.getId(), assigned().getFirst().getSkillId());
        assertEquals(UserSkillSource.CAREER_PLAN, assigned().getFirst().getSource());
        assertNull(assigned().getFirst().getProficiencyLevel());
        mvc.perform(get("/api/me/skills/" + assigned().getFirst().getId()).header("Authorization", user))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.source").value("CAREER_PLAN"))
                .andExpect(jsonPath("$.data.proficiencyLevel").doesNotExist());
        var context = snapshots.build(profiles.findByAccountId(owner).orElseThrow()).text();
        assertTrue(context.contains("nguồn: từ lộ trình học"));
        assertTrue(context.contains("mức thành thạo chưa đánh giá"));
        complete(third, true);
        complete(third, true);
        assertEquals(2, assigned().size());
        assertTrue(assigned().stream().allMatch(s -> s.getProficiencyLevel() == null && s.getSource() == UserSkillSource.CAREER_PLAN));
        complete(first, false);
        assertEquals(1, assigned().size());
        assertEquals(skills.findByNameIgnoreCaseAndType("Spring Boot", SkillType.hard).orElseThrow().getId(), assigned().getFirst().getSkillId());
        mvc.perform(patch("/api/me/career-plans/" + plan.getId() + "/tasks/" + first.getId())
                .header("Authorization", other).contentType(MediaType.APPLICATION_JSON).content("{\"completed\":true}"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/me/skills").header("Authorization", other))
                .andExpect(jsonPath("$.data.content", hasSize(0)));
        mvc.perform(delete("/api/me/career-plans/" + plan.getId()).header("Authorization", user)).andExpect(status().isOk());
        assertTrue(assigned().isEmpty());
    }

    @Test void manualConfirmationPreservesLearnedSkillEvenWhenItsRoadmapIsUndoneOrDeleted() throws Exception {
        var java = technologyCourse("Java");
        var plan = plan();
        var task = task(plan, java.getId(), 1);
        complete(task, true);
        var learned = assigned().getFirst();
        mvc.perform(put("/api/me/skills/" + learned.getId()).header("Authorization", user)
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(Map.of("skillId", learned.getSkillId()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.source").value("MANUAL"));
        complete(task, false);
        assertEquals(1, assigned().size());
        assertNull(assigned().getFirst().getProficiencyLevel());
        mvc.perform(delete("/api/me/career-plans/" + plan.getId()).header("Authorization", user)).andExpect(status().isOk());
        assertEquals(learned.getId(), assigned().getFirst().getId());
    }

    @Test void sharedSkillsRequireEveryRelatedCourseAndDuplicateCatalogTagsDoNotCountTwice() throws Exception {
        var skill = skills.saveAndFlush(Skill.builder().name("JAVA").type(SkillType.hard).build());
        var firstCourse = technologyCourse("Java");
        var secondCourse = courses.saveAndFlush(Course.builder().title("Advanced Java").level(CourseLevel.BEGINNER)
                .isFree(true).isActive(true).build());
        courseSkills.saveAndFlush(CourseSkill.builder().courseId(firstCourse.getId()).skillId(skill.getId()).build());
        courseSkills.saveAndFlush(CourseSkill.builder().courseId(secondCourse.getId()).skillId(skill.getId()).build());
        var plan = plan();
        var first = task(plan, firstCourse.getId(), 1);
        var second = task(plan, secondCourse.getId(), 2);
        assertEquals(1, read().path("learningSkills").size());
        assertEquals(2, read().path("learningSkills").get(0).path("totalTasks").asInt());
        complete(first, true);
        assertTrue(assigned().isEmpty());
        complete(second, true);
        assertEquals(1, assigned().size());
        assertEquals(skill.getId(), assigned().getFirst().getSkillId());
        assertEquals(1, skills.findByTypeAndNamesIgnoreCase(SkillType.hard, List.of("java")).size());
    }
    JsonNode assessment(boolean correct) throws Exception {
        var attempt = write("/api/me/discovery/attempts", Map.of("kind", "skills"));
        while (!attempt.path("question").isNull()) {
            String id = attempt.path("question").path("id").asText();
            var question = bank.get("skills").questions().stream().filter(q -> q.id().equals(id)).findFirst().orElseThrow();
            attempt = write("/api/me/discovery/attempts/" + attempt.path("id").asLong() + "/answers",
                    Map.of("questionId", id, "option", correct ? question.correct() : (question.correct() + 1) % 4));
        }
        return attempt;
    }

    @Test void authenticatesAndScopesProgressToTheCaller() throws Exception {
        mvc.perform(get(URL)).andExpect(status().isUnauthorized());
        var plan = plan();
        task(plan, null, 1);
        write("/api/me/workspace/tasks", Map.of("title", "Private activity", "dueDate", LocalDate.now(), "completed", true));
        mvc.perform(get(URL).header("Authorization", other).param("accountId", owner.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.roadmap.total").value(0))
                .andExpect(jsonPath("$.data.weekly.total").value(0)).andExpect(jsonPath("$.data.assessment.attempts").value(0));
        var progress = read();
        assertEquals(1, progress.path("weekly").path("completed").asInt());
        assertEquals(1, progress.path("roadmap").path("total").asInt());
    }

    @Test void learningProgressHandlesRetryUndoDeletionAndSharedCourseSkillsWithoutChangingSelfRatings() throws Exception {
        var skill = skills.saveAndFlush(Skill.builder().name("Dynamic Java").type(SkillType.hard).build());
        var course = courses.saveAndFlush(Course.builder().title("Java practice").level(CourseLevel.BEGINNER)
                .isFree(true).isActive(true).build());
        courseSkills.saveAndFlush(CourseSkill.builder().courseId(course.getId()).skillId(skill.getId()).build());
        var profile = profiles.findByAccountId(owner).orElseThrow();
        var selfRated = userSkills.saveAndFlush(UserSkill.builder().userInformationId(profile.getId())
                .skillId(skill.getId()).proficiencyLevel(40).build());
        var plan = plan();
        var first = task(plan, course.getId(), 1);
        var second = task(plan, course.getId(), 2);
        task(plan, null, 3);
        String before = snapshots.build(profile).text();
        complete(first, true);
        complete(first, true);
        var progress = read();
        assertEquals(1, progress.path("roadmap").path("completed").asInt());
        assertEquals(33, progress.path("roadmap").path("percent").asInt());
        var learning = progress.path("learningSkills").get(0);
        assertEquals(1, learning.path("completedTasks").asInt());
        assertEquals(2, learning.path("totalTasks").asInt());
        assertEquals(0, learning.path("completedCourses").asInt());
        assertNotEquals(before, snapshots.build(profile).text());
        complete(second, true);
        assertEquals(1, read().path("learningSkills").get(0).path("completedCourses").asInt());
        complete(first, false);
        assertEquals(0, read().path("learningSkills").get(0).path("completedCourses").asInt());
        complete(second, false);
        assertEquals(before, snapshots.build(profile).text());
        assertEquals(40, userSkills.findById(selfRated.getId()).orElseThrow().getProficiencyLevel());
        tasks.deleteAll(tasks.findByPlanIdOrderByWeekNumberAsc(plan.getId()));
        plans.delete(plan); plans.flush();
        mvc.perform(get(URL).header("Authorization", user)).andExpect(jsonPath("$.data.learningSkills", hasSize(0)))
                .andExpect(jsonPath("$.data.roadmap.total").value(0));
    }

    @Test void onlyCompletedAssessmentsUpdateTheProfileAndLatestScoresCanGoDown() throws Exception {
        var profile = profiles.findByAccountId(owner).orElseThrow();
        assertTrue(snapshots.build(profile).empty());
        write("/api/me/discovery/attempts", Map.of("kind", "skills"));
        assertEquals(0, read().path("assessment").path("attempts").asInt());
        assessment(true);
        var initial = read().path("assessment");
        assertEquals(100, initial.path("changes").get(0).path("latest").asInt());
        String first = snapshots.build(profile).text();
        assertFalse(snapshots.build(profile).empty());
        assertTrue(first.contains("ĐÁNH GIÁ KỸ NĂNG"));
        assessment(false);
        var latest = read().path("assessment");
        assertEquals(2, latest.path("attempts").asInt());
        assertEquals(0, latest.path("changes").get(0).path("latest").asInt());
        assertEquals(-100, latest.path("changes").get(0).path("fromPrevious").asInt());
        assertNotEquals(first, snapshots.build(profile).text());
        mvc.perform(get(URL).header("Authorization", other)).andExpect(jsonPath("$.data.assessment.attempts").value(0));
        assertTrue(userSkills.findByUserInformationIdOrderByCreatedAtDesc(profile.getId()).isEmpty());
    }
}
