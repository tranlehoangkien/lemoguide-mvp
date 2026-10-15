package lemonadex.lemoguide.lemoguide_mvp.profile;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Covers admin major CRUD + search, and self-service contact / education with Specification filters. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProfileResourcesTest {

    @Autowired
    private MockMvc mockMvc;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = token("/api/auth/register-admin", "admin@ex.com", "Admin");
        userToken = token("/api/auth/register", "user@ex.com", "Learner");
    }

    private String token(String path, String email, String name) throws Exception {
        String body = mockMvc.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"password123\",\"fullName\":\"%s\"}".formatted(email, name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.accessToken");
    }

    private HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private long createMajor(String name) throws Exception {
        String body = mockMvc.perform(post("/api/admin/majors").headers(bearer(adminToken))
                        .content("{\"name\":\"%s\",\"description\":\"%s desc\"}".formatted(name, name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.data.id")).longValue();
    }

    @Test
    void adminCrudsMajorsWithKeywordSearch() throws Exception {
        createMajor("Software Engineering");
        long dsId = createMajor("Data Science");

        mockMvc.perform(get("/api/admin/majors").param("keyword", "data").headers(bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Data Science"));

        mockMvc.perform(put("/api/admin/majors/" + dsId).headers(bearer(adminToken))
                        .content("{\"name\":\"Data Science & AI\",\"description\":\"updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Data Science & AI"));

        mockMvc.perform(delete("/api/admin/majors/" + dsId).headers(bearer(adminToken)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/majors").headers(bearer(adminToken)))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void nonAdminCannotReachMajorEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/majors").headers(bearer(userToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void userManagesOwnContactsWithFilters() throws Exception {
        mockMvc.perform(post("/api/me/contacts").headers(bearer(userToken))
                        .content("{\"type\":\"EMAIL\",\"value\":\"me@ex.com\",\"primary\":true}"))
                .andExpect(status().isCreated());
        String phone = mockMvc.perform(post("/api/me/contacts").headers(bearer(userToken))
                        .content("{\"type\":\"PHONE\",\"value\":\"0900000000\",\"primary\":true}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long phoneId = ((Number) JsonPath.read(phone, "$.data.id")).longValue();

        // Setting the phone as primary must have cleared the e-mail's primary flag.
        mockMvc.perform(get("/api/me/contacts").param("primary", "true").headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].type").value("PHONE"));

        mockMvc.perform(get("/api/me/contacts").param("type", "EMAIL").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        mockMvc.perform(put("/api/me/contacts/" + phoneId).headers(bearer(userToken))
                        .content("{\"type\":\"PHONE\",\"value\":\"0911111111\",\"primary\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.value").value("0911111111"));

        mockMvc.perform(delete("/api/me/contacts/" + phoneId).headers(bearer(userToken)))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/me/contacts").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    void userManagesEducationLinkedToMajor() throws Exception {
        long majorId = createMajor("Computer Science");

        String created = mockMvc.perform(post("/api/me/education").headers(bearer(userToken))
                        .content("""
                                {"majorId":%d,"schoolName":"Bach Khoa University","startDate":"2019-09-01",
                                 "endDate":"2023-06-30","gpa":3.55,"classification":"Good"}
                                """.formatted(majorId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.majorName").value("Computer Science"))
                .andReturn().getResponse().getContentAsString();
        long eduId = ((Number) JsonPath.read(created, "$.data.id")).longValue();

        mockMvc.perform(get("/api/me/education").param("school", "bach khoa").headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));
        mockMvc.perform(get("/api/me/education").param("minGpa", "3.80").headers(bearer(userToken)))
                .andExpect(jsonPath("$.data.totalElements").value(0));

        mockMvc.perform(post("/api/me/education").headers(bearer(userToken))
                        .content("{\"majorId\":99999,\"schoolName\":\"X\",\"startDate\":\"2020-01-01\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/me/education/" + eduId).headers(bearer(userToken))
                        .content("{\"schoolName\":\"BK University\",\"startDate\":\"2019-09-01\",\"gpa\":3.70}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.majorId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.data.schoolName").value("BK University"));

        mockMvc.perform(delete("/api/me/education/" + eduId).headers(bearer(userToken)))
                .andExpect(status().isOk());
    }

    @Test
    void userCanListEducationWithoutMajor() throws Exception {
        String created = mockMvc.perform(post("/api/me/education").headers(bearer(userToken))
                        .content("""
                                {"schoolName":"Hanoi University","startDate":"2018-09-01",
                                 "endDate":"2022-06-30","gpa":3.60}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.majorId").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.data.majorName").value(org.hamcrest.Matchers.nullValue()))
                .andReturn().getResponse().getContentAsString();
        long eduId = ((Number) JsonPath.read(created, "$.data.id")).longValue();

        mockMvc.perform(get("/api/me/education").headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].schoolName").value("Hanoi University"))
                .andExpect(jsonPath("$.data.content[0].majorName").value(org.hamcrest.Matchers.nullValue()));

        mockMvc.perform(delete("/api/me/education/" + eduId).headers(bearer(userToken)))
                .andExpect(status().isOk());
    }
}
