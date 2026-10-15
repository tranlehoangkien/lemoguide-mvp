package lemonadex.lemoguide.lemoguide_mvp.course;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.course.entity.Course;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseSkill;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseTechnology;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.course.repository.CourseTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourseCatalogFlowTest {
    @Autowired private MockMvc mvc;
    @Autowired private CourseRepository courses;
    @Autowired private CourseSkillRepository courseSkills;
    @Autowired private CourseTechnologyRepository courseTechnologies;
    @Autowired private SkillRepository skills;
    @Autowired private TechnologyRepository technologies;
    @Autowired private EntityManager em;
    private Long starter;
    private Long advanced;
    private Long hidden;
    private Long skillId;
    private Long technologyId;

    @BeforeEach void setup() {
        skillId = skills.save(Skill.builder().name("API Design").type(SkillType.hard).build()).getId();
        Long hiddenSkill = skills.save(Skill.builder().name("Private Skill").type(SkillType.hard).build()).getId();
        technologyId = technologies.save(Technology.builder().name("Java").build()).getId();
        starter = course("Java Starter", "Academy", CourseLevel.BEGINNER, true, true, "900", 6);
        advanced = course("Java Pro", "Academy", CourseLevel.ADVANCED, false, true, "500", 20);
        course("Design 100%", "Design School", CourseLevel.INTERMEDIATE, false, true, "250", null);
        course("Unknown price", "Academy", CourseLevel.BEGINNER, false, true, null, 8);
        hidden = course("Java Private", "Private Provider", CourseLevel.BEGINNER, true, false, "0", 1);
        for (Long id : new Long[]{starter, advanced, hidden}) {
            courseSkills.save(CourseSkill.builder().courseId(id).skillId(skillId).build());
            courseTechnologies.save(CourseTechnology.builder().courseId(id).technologyId(technologyId).build());
        }
        courseSkills.save(CourseSkill.builder().courseId(hidden).skillId(hiddenSkill).build());
        em.flush();
        em.clear();
    }

    @Test @WithMockUser(roles = "USER")
    void listsAndReadsOnlyPublishedCoursesAndDoesNotExposeAdminAccess() throws Exception {
        mvc.perform(get("/api/me/courses").param("isActive", "false"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(4));
        mvc.perform(get("/api/me/courses/" + starter)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Java Starter"))
                .andExpect(jsonPath("$.data.skills[0].name").value("API Design"))
                .andExpect(jsonPath("$.data.technologies[0].name").value("Java"));
        mvc.perform(get("/api/me/courses/" + hidden)).andExpect(status().isNotFound());
        mvc.perform(get("/api/me/courses/" + hidden + "/related")).andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/courses")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "USER")
    void combinesFiltersAndReturnsExactPagination() throws Exception {
        mvc.perform(get("/api/me/courses").param("keyword", " java ").param("level", "beginner")
                .param("provider", "Academy").param("isFree", "true")
                .param("skillId", skillId.toString()).param("technologyId", technologyId.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(starter));
        mvc.perform(get("/api/me/courses").param("size", "2").param("page", "1").param("order", "title_asc"))
                .andExpect(jsonPath("$.data.totalElements").value(4)).andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.content", hasSize(2))).andExpect(jsonPath("$.data.last").value(true));
        mvc.perform(get("/api/me/courses").param("page", "99"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.content", hasSize(0)));
    }

    @Test @WithMockUser(roles = "USER")
    void sortsFreeFirstAndUnknownPriceLast() throws Exception {
        mvc.perform(get("/api/me/courses").param("order", "price_asc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.content[0].id").value(starter))
                .andExpect(jsonPath("$.data.content[1].title").value("Design 100%"))
                .andExpect(jsonPath("$.data.content[3].title").value("Unknown price"));
        mvc.perform(get("/api/me/courses").param("order", "duration_asc"))
                .andExpect(jsonPath("$.data.content[0].id").value(starter))
                .andExpect(jsonPath("$.data.content[3].title").value("Design 100%"));
    }

    @Test @WithMockUser(roles = "USER")
    void filterOptionsNeverRevealUnpublishedCourses() throws Exception {
        mvc.perform(get("/api/me/courses/filters")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.providers", hasSize(2)))
                .andExpect(jsonPath("$.data.skills", hasSize(1)))
                .andExpect(jsonPath("$.data.skills[0].name").value("API Design"))
                .andExpect(jsonPath("$.data.technologies[0].name").value("Java"));
    }

    @Test @WithMockUser(roles = "USER")
    void relatedUsesSharedTagsExcludesCurrentAndHiddenAndDoesNotDuplicate() throws Exception {
        mvc.perform(get("/api/me/courses/" + starter + "/related")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1))).andExpect(jsonPath("$.data[0].id").value(advanced));
    }

    @Test @WithMockUser(roles = "USER")
    void searchesLiteralWildcardsAndValidatesParameters() throws Exception {
        mvc.perform(get("/api/me/courses").param("keyword", "%"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        for (String[] invalid : new String[][]{{"page", "-1"}, {"size", "51"}, {"size", "oops"},
                {"level", "expert"}, {"order", "price;drop"}, {"skillId", "0"}, {"keyword", "a".repeat(201)}}) {
            mvc.perform(get("/api/me/courses").param(invalid[0], invalid[1])).andExpect(status().isBadRequest());
        }
    }

    @Test void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/me/courses")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me/courses/filters")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/me/courses/" + starter)).andExpect(status().isUnauthorized());
    }

    private Long course(String title, String provider, CourseLevel level, boolean free, boolean active, String price, Integer hours) {
        return courses.save(Course.builder().title(title).provider(provider).level(level).isFree(free).isActive(active)
                .price(price == null ? null : new BigDecimal(price)).durationHours(hours).description("Course description").build()).getId();
    }
}
