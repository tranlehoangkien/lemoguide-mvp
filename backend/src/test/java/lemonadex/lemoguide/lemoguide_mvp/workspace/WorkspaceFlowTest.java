package lemonadex.lemoguide.lemoguide_mvp.workspace;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import java.util.*;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.*;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.*;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
@Sql("/plan-fixture.sql") @Transactional
class WorkspaceFlowTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired AccountRepository accounts;
    @Autowired WeeklyTaskRepository tasks;
    @Autowired jakarta.persistence.EntityManager em;
    @Autowired lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.CareerPlanRepository plans;
    @Autowired lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.CareerTaskRepository careerTasks;
    private final JsonMapper json = JsonMapper.builder().build();
    String user, other;
    Long owner;
    LocalDate monday = LocalDate.now().with(DayOfWeek.MONDAY);
    @BeforeEach void setup() throws Exception {
        user = register("workspace-user@example.com"); other = register("workspace-other@example.com");
        owner = accounts.findByEmail("workspace-user@example.com").orElseThrow().getId();
    }
    String register(String email) throws Exception {
        return JsonPath.read(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email", email, "password", "Password123!", "fullName", "Workspace User")))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.data.accessToken");
    }
    String url = "/api/me/workspace";
    org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder auth(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder r, String token) { return r.header(HttpHeaders.AUTHORIZATION, "Bearer " + token).contentType(MediaType.APPLICATION_JSON); }
    Map<String,Object> task(String title, LocalDate due, boolean done) { return new HashMap<>(Map.of("title",title,"dueDate",due.toString(),"completed",done)); }
    Map<String,Object> app(String title) { return new HashMap<>(Map.of("title",title,"company","Lemonade","status","SAVED")); }
    Map<String,Object> create(String path, Map<String,Object> body) throws Exception { return JsonPath.read(mvc.perform(auth(post(url+path), user).content(json.writeValueAsString(body))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "$.data"); }

    @Test void requiresAuthenticationAndIsolatesEveryResource() throws Exception {
        mvc.perform(get(url)).andExpect(status().isUnauthorized());
        var t = create("/tasks", task("Private task", monday, false));
        var a = create("/applications", app("Private role"));
        mvc.perform(auth(get(url), other)).andExpect(status().isOk()).andExpect(jsonPath("$.data.tasks", hasSize(0)));
        mvc.perform(auth(put(url+"/tasks/"+t.get("id")), other).content(json.writeValueAsString(t))).andExpect(status().isNotFound());
        mvc.perform(auth(delete(url+"/tasks/"+t.get("id")), other)).andExpect(status().isNotFound());
        for (String suffix : List.of("", "/history")) mvc.perform(auth(get(url+"/applications/"+a.get("id")+suffix), other)).andExpect(status().isNotFound());
        mvc.perform(auth(put(url+"/applications/"+a.get("id")), other).content(json.writeValueAsString(a))).andExpect(status().isNotFound());
        mvc.perform(auth(delete(url+"/applications/"+a.get("id")), other)).andExpect(status().isNotFound());
    }

    @Test void weeklySummaryUsesCompletionTimeAndHalfOpenWeekBoundaries() throws Exception {
        var previous = create("/tasks", task("Finished last week", monday.minusWeeks(2), true));
        var boundary = create("/tasks", task("Finished Monday", monday.minusWeeks(1), true));
        tasks.findById(((Number)previous.get("id")).longValue()).orElseThrow().setCompletedAt(monday.minusDays(1).atTime(23,59));
        tasks.findById(((Number)boundary.get("id")).longValue()).orElseThrow().setCompletedAt(monday.atStartOfDay());
        em.flush();
        em.clear();
        create("/tasks", task("Sunday plan", monday.plusDays(6), false));
        create("/tasks", task("Next Monday", monday.plusWeeks(1), false));
        create("/tasks", task("Overdue", monday.minusDays(1), false));
        mvc.perform(auth(get(url).param("week",monday.plusDays(3).toString()), user)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.weekStart").value(monday.toString()))
            .andExpect(jsonPath("$.data.tasks",hasSize(1))).andExpect(jsonPath("$.data.tasks[0].title").value("Sunday plan"))
            .andExpect(jsonPath("$.data.previousCompleted[0].title").value("Finished last week"))
            .andExpect(jsonPath("$.data.completed[0].title").value("Finished Monday"))
            .andExpect(jsonPath("$.data.overdueCount").value(1));
    }

    @Test void taskCompletionIsIdempotentAndStaleEditsAreRejected() throws Exception {
        var t = create("/tasks",task("Build project",monday,false));
        var stale = new HashMap<>(t); t.put("completed",true);
        String endpoint=url+"/tasks/"+t.get("id");
        String result=mvc.perform(auth(put(endpoint),user).content(json.writeValueAsString(t))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Map<String,Object> done=JsonPath.read(result,"$.data");
        mvc.perform(auth(put(endpoint),user).content(json.writeValueAsString(done))).andExpect(status().isOk()).andExpect(jsonPath("$.data.completedAt").value(done.get("completedAt")));
        mvc.perform(auth(put(endpoint),user).content(json.writeValueAsString(stale))).andExpect(status().isConflict());
        done.put("completed",false);
        mvc.perform(auth(put(endpoint),user).content(json.writeValueAsString(done))).andExpect(status().isOk()).andExpect(jsonPath("$.data.completedAt").doesNotExist());
    }

    @Test void applicationLifecycleHistoryFiltersAndDelete() throws Exception {
        var a=create("/applications",app("Java 100% Developer"));
        String endpoint=url+"/applications/"+a.get("id");
        a.put("status","INTERVIEW"); a.put("nextAction","Technical interview"); a.put("nextActionAt",monday.plusDays(5).atTime(10,0).toString());
        Map<String,Object> saved=JsonPath.read(mvc.perform(auth(put(endpoint),user).content(json.writeValueAsString(a))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString(),"$.data");
        mvc.perform(auth(put(endpoint),user).content(json.writeValueAsString(saved))).andExpect(status().isOk());
        mvc.perform(auth(get(endpoint+"/history"),user)).andExpect(jsonPath("$.data",hasSize(2))).andExpect(jsonPath("$.data[0].status").value("INTERVIEW"));
        mvc.perform(auth(get(url+"/applications").param("query","100%"),user)).andExpect(jsonPath("$.data.totalElements").value(1));
        mvc.perform(auth(get(url+"/applications").param("status","SAVED"),user)).andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(auth(get(url+"/applications/counts"),user)).andExpect(jsonPath("$.data.INTERVIEW").value(1));
        mvc.perform(auth(get(url),user)).andExpect(jsonPath("$.data.upcoming[0].nextAction").value("Technical interview"));
        mvc.perform(auth(delete(endpoint),user)).andExpect(status().isOk());
        mvc.perform(auth(get(endpoint),user)).andExpect(status().isNotFound());
        assertEquals(0,jdbc.queryForObject("select count(*) from application_event where application_id=?",Integer.class,a.get("id")));
    }

    @Test void validatesInputs() throws Exception {
        var a=app("Unsafe link"); a.put("sourceUrl","javascript:alert(1)");
        mvc.perform(auth(post(url+"/applications"),user).content(json.writeValueAsString(a))).andExpect(status().isBadRequest());
        a.remove("sourceUrl"); a.put("appliedDate",LocalDate.now().plusDays(1).toString());
        mvc.perform(auth(post(url+"/applications"),user).content(json.writeValueAsString(a))).andExpect(status().isBadRequest());
        mvc.perform(auth(post(url+"/tasks"),user).content(json.writeValueAsString(task(" ",monday,false)))).andExpect(status().isBadRequest());
        mvc.perform(auth(get(url+"/applications").param("page","-1"),user)).andExpect(status().isBadRequest());
        mvc.perform(auth(get(url).param("week","bad-date"),user)).andExpect(status().isBadRequest());
    }

    @Test void includesOwnedRoadmapTasksAndRejectsAnotherUsersCv() throws Exception {
        var plan=plans.saveAndFlush(lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerPlan.builder()
            .accountId(owner).intent("goal").targetRole("Java Developer").hoursPerWeek(5).durationWeeks(4)
            .useProfile(true).contextText("Java").analysisJson("{}").build());
        careerTasks.saveAndFlush(lemonadex.lemoguide.lemoguide_mvp.careerplan.entity.CareerTask.builder()
            .planId(plan.getId()).weekNumber(1).title("Roadmap project").action("Build an API").successCriteria("Tests pass").estimatedHours(5).build());
        mvc.perform(auth(get(url),user)).andExpect(status().isOk()).andExpect(jsonPath("$.data.tasks[0].planId").value(plan.getId()))
            .andExpect(jsonPath("$.data.tasks[0].dueDate").value(monday.plusDays(6).toString()));
        mvc.perform(auth(get(url),other)).andExpect(jsonPath("$.data.tasks",hasSize(0)));
        String cv=mvc.perform(auth(post("/api/me/cv-profiles"),other).content(json.writeValueAsString(Map.of("name","Private CV","targetMode","BACKEND","publishMode","PDF","isActive",true))))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        var body=app("CV isolation"); body.put("cvProfileId",JsonPath.read(cv,"$.data.id"));
        mvc.perform(auth(post(url+"/applications"),user).content(json.writeValueAsString(body))).andExpect(status().isNotFound());
    }

    @Test void recommendationsOnlyIncludeNewPublishedMatchingContentAndJobSaveIsIdempotent() throws Exception {
        Long profileId=jdbc.queryForObject("select id from user_information where account_id=?",Long.class,owner);
        jdbc.update("insert into skill(name,type) values ('Workspace Java','hard')");
        Long skill=jdbc.queryForObject("select id from skill where name='Workspace Java'",Long.class);
        jdbc.update("insert into user_skill(user_information_id,skill_id) values (?,?)",profileId,skill);
        // Native fixtures use the same UTC JDBC representation as Hibernate.
        LocalDateTime now=LocalDateTime.now().minusMinutes(1).atZone(ZoneId.systemDefault()).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
        for (int i=0;i<4;i++) {
            jdbc.update("insert into course(title,level,is_free,is_active,created_at) values (?,?,?,?,?)", "Workspace course "+i,"beginner",true,i!=1,i==2?monday.minusWeeks(1).atStartOfDay():now);
            Long course=jdbc.queryForObject("select id from course where title=?",Long.class,"Workspace course "+i);
            if(i!=3) jdbc.update("insert into course_skill(course_id,skill_id) values (?,?)",course,skill);
        }
        for (int i=0;i<4;i++) {
            jdbc.update("insert into job_posting(source,company_name,title,description,employment_type,experience_level,salary_currency,is_salary_negotiable,status,posted_at,expires_at) values (?,?,?,?,?,?,?,?,?,?,?)",
                "crawled","Workspace Co","Workspace job "+i,"Java","full_time","junior","VND",true,i==1?"closed":"active",i==2?monday.minusWeeks(1).atStartOfDay():now,i==3?now.minusDays(1):now.plusWeeks(2));
            Long job=jdbc.queryForObject("select id from job_posting where title=?",Long.class,"Workspace job "+i);
            jdbc.update("insert into job_posting_skill(job_posting_id,skill_id,is_required) values (?,?,?)",job,skill,true);
        }
        mvc.perform(auth(get(url),user)).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.jobs",hasSize(1))).andExpect(jsonPath("$.data.jobs[0].title").value("Workspace job 0"))
            .andExpect(jsonPath("$.data.courses",hasSize(1))).andExpect(jsonPath("$.data.courses[0].title").value("Workspace course 0"))
            .andExpect(jsonPath("$.data.courses[0].reasons[0]").value("Workspace Java"));
        mvc.perform(auth(get(url),other)).andExpect(jsonPath("$.data.jobs",hasSize(0))).andExpect(jsonPath("$.data.courses",hasSize(0)));
        Long job=jdbc.queryForObject("select id from job_posting where title='Workspace job 0'",Long.class);
        var body=app("Client title ignored"); body.put("jobPostingId",job);
        var first=create("/applications",body); var second=create("/applications",body);
        assertEquals(first.get("id"),second.get("id")); assertEquals("Workspace job 0",first.get("title"));
        assertEquals(1,jdbc.queryForObject("select count(*) from application_event where application_id=?",Integer.class,first.get("id")));
    }
}
