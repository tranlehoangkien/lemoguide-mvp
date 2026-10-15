package lemonadex.lemoguide.lemoguide_mvp.cvtemplate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Covers the admin CV-template endpoints: create/list with a validated
 * layout_config, the usage-count-aware delete guard, the deactivate-instead
 * status toggle, and the thumbnail upload endpoint.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@org.springframework.test.context.jdbc.Sql("/plan-fixture.sql")
@Transactional
class CvTemplateManagementTest {

    /** Pre-escaped so it can be embedded as the value of the JSON "layoutConfig" string field below. */
    private static final String VALID_LAYOUT_CONFIG_ESCAPED =
            "{\\\"columns\\\":2,\\\"spacing\\\":\\\"normal\\\",\\\"sections_order\\\":[\\\"header\\\",\\\"experience\\\",\\\"education\\\",\\\"skills\\\"],\\\"header_style\\\":\\\"sidebar-photo\\\"}";

    @Autowired
    private MockMvc mockMvc;

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = register("/api/auth/register-admin", "boss@example.com", "password123", "Boss");
        userToken = register("/api/auth/register", "member@example.com", "password123", "Member One");
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

    /** {@code layoutConfigEscaped} must already be escaped for embedding as a JSON string value, or {@code null} to omit it. */
    private long createTemplate(String name, String layoutConfigEscaped) throws Exception {
        String layoutField = layoutConfigEscaped == null ? "" : ",\"layoutConfig\":\"" + layoutConfigEscaped + "\"";
        String body = mockMvc.perform(post("/api/admin/cv-templates").headers(bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"category\":\"IT\",\"isPremium\":false,\"isActive\":true"
                                + layoutField + "}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.data.id")).longValue();
    }

    @Test
    void adminCreatesAndListsTemplateWithZeroUsageCount() throws Exception {
        long id = createTemplate("Modern Sidebar", VALID_LAYOUT_CONFIG_ESCAPED);

        mockMvc.perform(get("/api/admin/cv-templates").headers(bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(id))
                .andExpect(jsonPath("$.data.content[0].usageCount").value(0));
    }

    @Test
    void createRejectsInvalidLayoutConfigColumns() throws Exception {
        mockMvc.perform(post("/api/admin/cv-templates").headers(bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Bad Layout","layoutConfig":"{\\"columns\\":3,\\"spacing\\":\\"normal\\",\\"sections_order\\":[\\"header\\"],\\"header_style\\":\\"single\\"}","isPremium":false,"isActive":true}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void deleteIsBlockedWhileInUse_thenDeactivateWorksInstead() throws Exception {
        long templateId = createTemplate("In Use Template", VALID_LAYOUT_CONFIG_ESCAPED);

        mockMvc.perform(post("/api/me/cv-profiles").headers(bearer(userToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"My CV","targetMode":"FULLSTACK","publishMode":"PUBLIC_LINK","templateId":%d,"isActive":true}
                                """.formatted(templateId)))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/admin/cv-templates/" + templateId).headers(bearer(adminToken)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(patch("/api/admin/cv-templates/" + templateId + "/status").headers(bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"isActive\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isActive").value(false))
                .andExpect(jsonPath("$.data.usageCount").value(1));
    }

    @Test
    void deleteSucceedsWhenTemplateIsUnused() throws Exception {
        long templateId = createTemplate("Unused Template", null);

        mockMvc.perform(delete("/api/admin/cv-templates/" + templateId).headers(bearer(adminToken)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/cv-templates/" + templateId).headers(bearer(adminToken)))
                .andExpect(status().isNotFound());
    }

    @Test
    void uploadThumbnailReturnsUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "thumb.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3, 4});

        mockMvc.perform(multipart("/api/admin/cv-templates/upload-thumbnail")
                        .file(file)
                        .headers(bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.thumbnailUrl").isNotEmpty());
    }

    @Test
    void nonAdminCannotReachTemplateEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/cv-templates").headers(bearer(userToken)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }
}
