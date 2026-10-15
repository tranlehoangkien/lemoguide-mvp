package lemonadex.lemoguide.lemoguide_mvp.account;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Covers the admin account-management endpoints, role listing, and /api/me self-service. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccountManagementTest {

    @Autowired
    private MockMvc mockMvc;

    private String adminToken;
    private String userToken;
    private long userAccountId;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = register("/api/auth/register-admin", "boss@example.com", "password123", "Boss");
        String userBody = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"member@example.com","password":"password123","fullName":"Member One"}
                                """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        userToken = JsonPath.read(userBody, "$.data.accessToken");
        userAccountId = ((Number) JsonPath.read(userBody, "$.data.account.id")).longValue();
    }

    private String register(String path, String email, String password, String name) throws Exception {
        String body = mockMvc.perform(post(path).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\",\"fullName\":\"%s\"}".formatted(email, password, name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.accessToken");
    }

    private HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return headers;
    }

    @Test
    void adminListsAndReadsUserAccounts() throws Exception {
        mockMvc.perform(get("/api/admin/users").headers(bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].email").value("member@example.com"))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        mockMvc.perform(get("/api/admin/users/" + userAccountId).headers(bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.profile.fullName").value("Member One"));
    }

    @Test
    void adminUpdatesStatusThenSoftDeletesAndRestores() throws Exception {
        mockMvc.perform(patch("/api/admin/users/" + userAccountId).headers(bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));

        mockMvc.perform(delete("/api/admin/users/" + userAccountId).headers(bearer(adminToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/users").headers(bearer(adminToken)))
                .andExpect(jsonPath("$.data.totalElements").value(0));
        mockMvc.perform(get("/api/admin/users").param("includeDeleted", "true").headers(bearer(adminToken)))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        mockMvc.perform(post("/api/admin/users/" + userAccountId + "/restore").headers(bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.deletedAt").doesNotExist());
    }

    @Test
    void adminCreatesUserAccount() throws Exception {
        mockMvc.perform(post("/api/admin/users").headers(bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"created@example.com","password":"password123","fullName":"Created User"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("USER"))
                .andExpect(jsonPath("$.data.profile.fullName").value("Created User"));
    }

    @Test
    void nonAdminCannotReachManagementEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/users").headers(bearer(userToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void rolesAreListedWithCounts() throws Exception {
        mockMvc.perform(get("/api/admin/roles").headers(bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[?(@.name == 'USER')].accountCount").value(org.hamcrest.Matchers.hasItem(1)));
    }

    @Test
    void meReturnsAndUpdatesOwnProfileAndPassword() throws Exception {
        mockMvc.perform(get("/api/me").headers(bearer(userToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("member@example.com"))
                .andExpect(jsonPath("$.data.profile.fullName").value("Member One"));

        mockMvc.perform(patch("/api/me").headers(bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"city\":\"Da Nang\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profile.city").value("Da Nang"));

        mockMvc.perform(patch("/api/me/password").headers(bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"password123","newPassword":"newpassword456"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"member@example.com","password":"newpassword456"}
                                """))
                .andExpect(status().isOk());
    }
}
