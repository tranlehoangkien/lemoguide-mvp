package lemonadex.lemoguide.lemoguide_mvp.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * End-to-end check of the register / login flow against the H2 test database.
 * Roles are seeded by {@code RoleInitializer} at context start.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registerThenLoginReturnsToken() throws Exception {
        String body = """
                {"email":"alice@example.com","password":"password123","fullName":"Alice Nguyen"}
                """;

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.account.role").value("USER"));

        String login = """
                {"email":"alice@example.com","password":"password123"}
                """;

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String body = """
                {"email":"bob@example.com","password":"password123","fullName":"Bob Tran"}
                """;

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void loginWithWrongPasswordIsUnauthorized() throws Exception {
        String body = """
                {"email":"carol@example.com","password":"password123","fullName":"Carol Le"}
                """;
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        String login = """
                {"email":"carol@example.com","password":"wrong-password"}
                """;
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerAdminCreatesAdminAccount() throws Exception {
        String body = """
                {"email":"root@example.com","password":"password123","fullName":"Root Admin"}
                """;
        mockMvc.perform(post("/api/auth/register-admin").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.account.role").value("ADMIN"));
    }

    @Test
    void protectedRouteWithoutTokenIsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/whatever").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
