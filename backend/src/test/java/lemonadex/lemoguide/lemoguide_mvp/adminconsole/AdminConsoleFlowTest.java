package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import org.junit.jupiter.api.*;
import org.mockito.MockedStatic;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.PublishMode;

/** Admin console rules on an H2 (MySQL mode) copy of the V50 tables: permissions, CV publish settings, activity log. */
class AdminConsoleFlowTest {
    JdbcTemplate db;
    MockedStatic<SecurityUtils> security;
    long viewer = 1;

    @BeforeEach void setup() throws Exception {
        db = new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "sa", ""));
        db.execute("CREATE TABLE role(id BIGINT PRIMARY KEY,name VARCHAR(20))");
        db.execute("CREATE TABLE account(id BIGINT PRIMARY KEY,email VARCHAR(100),role_id BIGINT,status VARCHAR(20),last_login_at TIMESTAMP,deleted_at TIMESTAMP)");
        db.execute("CREATE TABLE admin_information(account_id BIGINT,full_name VARCHAR(100),current_title VARCHAR(100),avatar_url VARCHAR(200))");
        db.execute("CREATE TABLE cv_profile(id BIGINT PRIMARY KEY,publish_mode VARCHAR(20),is_active BOOLEAN)");
        db.update("INSERT INTO role VALUES (1,'ADMIN'),(2,'USER')");
        db.update("INSERT INTO account VALUES (1,'a1@x.vn',1,'active',NULL,NULL),(2,'a2@x.vn',1,'active',NULL,NULL),(3,'u@x.vn',2,'active',NULL,NULL)");
        String migration = Files.readString(Path.of("src/main/resources/db/migration/V50__admin_settings_audit_permissions.sql"))
                .replaceAll("(?m)^--.*$", "").replace("SET NAMES utf8mb4;", "").replaceAll("ENGINE=InnoDB[^;]*", "");
        for (String sql : migration.split(";")) if (!sql.isBlank()) db.execute(sql);
        security = mockStatic(SecurityUtils.class);
        security.when(SecurityUtils::currentAccountId).thenAnswer(call -> viewer);
    }

    @AfterEach void cleanup() { if (security != null) security.close(); db.execute("DROP ALL OBJECTS"); }

    @Test void pathsMapToTheModuleThatOwnsThem() {
        assertEquals(Optional.of(AdminPermission.AI), AdminPermission.forPath("/api/admin/ai-models/3"));
        assertEquals(Optional.of(AdminPermission.USERS), AdminPermission.forPath("/api/admin/users/4/skills/2"));
        assertEquals(Optional.of(AdminPermission.CAREER), AdminPermission.forPath("/api/admin/job-postings"));
        assertEquals(Optional.of(AdminPermission.SYSTEM), AdminPermission.forPath("/api/admin/permissions/2"));
        assertEquals(Optional.empty(), AdminPermission.forPath("/api/admin/me/permissions"), "an admin can always read their own permissions");
        assertEquals("MASTER_DATA", AdminActivityService.moduleOf("/api/admin/majors/3"));
        assertEquals(42L, AdminActivityService.targetOf("/api/admin/users/42/skills/7"));
    }

    @Test void existingAdminsKeepEverythingAndNobodyCanLockTheSystemOut() {
        var permissions = new AdminPermissionService(db);
        assertEquals(new HashSet<>(AdminPermission.names()), permissions.permissionsOf(1), "V50 grants every module to existing admins");
        assertEquals(Set.of(), permissions.permissionsOf(3), "users get nothing");
        db.update("INSERT INTO account VALUES (4,'new@x.vn',1,'active',NULL,NULL)");
        assertEquals(AdminPermission.names().size(), permissions.permissionsOf(4).size(), "a new admin starts with every module");

        permissions.update(2, List.of("REPORTS", "CV"));
        assertEquals(Set.of("REPORTS", "CV"), permissions.permissionsOf(2));
        assertThrows(AppException.class, () -> permissions.update(1, List.of("REPORTS")), "cannot remove SYSTEM from yourself");
        assertThrows(AppException.class, () -> permissions.update(2, List.of()), "at least one module");
        assertThrows(AppException.class, () -> permissions.update(2, List.of("ROOT")), "unknown module");
        assertThrows(AppException.class, () -> permissions.update(3, List.of("CV")), "only ADMIN accounts");
        viewer = 2;
        permissions.update(2, List.of("REPORTS", "CV", "SYSTEM"));
        viewer = 2;
        db.update("UPDATE account SET status='inactive' WHERE id IN (4)");
        permissions.update(4, List.of("CV"));
        permissions.update(1, List.of("CV"));
        viewer = 1; // admin 1 no longer holds SYSTEM; the service rule (not the HTTP guard) still protects admin 2
        assertThrows(AppException.class, () -> permissions.update(2, List.of("CV")), "the last active SYSTEM admin cannot drop it");
    }

    @Test void publishSettingsValidateAndDriveTheCvRules() {
        var settings = new SystemSettingService(db);
        assertEquals(new SystemSettingService.CvPublishSettings(PublishMode.PDF, true, 0), settings.cvPublish(), "V50 defaults keep current behaviour");
        assertNull(settings.defaultShareExpiry());
        settings.requirePublicLinkAllowed();

        settings.updateCvPublish(new SystemSettingService.CvPublishSettings(PublishMode.PUBLIC_LINK, true, 30));
        assertNotNull(settings.defaultShareExpiry());
        assertThrows(AppException.class, () -> settings.updateCvPublish(new SystemSettingService.CvPublishSettings(PublishMode.PUBLIC_LINK, false, 0)),
                "public default with public links off makes no sense");
        assertThrows(AppException.class, () -> settings.updateCvPublish(new SystemSettingService.CvPublishSettings(PublishMode.PDF, true, 400)));

        settings.updateCvPublish(new SystemSettingService.CvPublishSettings(PublishMode.ATS_TEXT, false, 0));
        assertThrows(AppException.class, settings::requirePublicLinkAllowed);
        assertEquals(1L, db.queryForObject("SELECT updated_by FROM system_setting WHERE setting_key='cv.public_link_enabled'", Long.class), "who changed it is kept");
    }

    @Test void activityLogFiltersByModuleMethodOutcomeAndText() {
        db.update("INSERT INTO admin_activity_log(actor_id,actor_email,method,path,module,target_id,status) VALUES (1,'a1@x.vn','PUT','/api/admin/majors/3','MASTER_DATA',3,200)");
        db.update("INSERT INTO admin_activity_log(actor_id,actor_email,method,path,module,target_id,status) VALUES (2,'a2@x.vn','DELETE','/api/admin/users/9','USERS',9,403)");
        var activity = new AdminActivityService(db);
        assertEquals(2L, activity.list("", "", "", "", null, null, 0, 20).get("totalElements"));
        assertEquals(1L, activity.list("a2@", "", "", "", null, null, 0, 20).get("totalElements"));
        assertEquals(1L, activity.list("", "USERS", "DELETE", "failed", null, null, 0, 20).get("totalElements"));
        assertEquals(0L, activity.list("", "MASTER_DATA", "", "failed", null, null, 0, 20).get("totalElements"));
        assertEquals(List.of("MASTER_DATA", "USERS"), activity.modules());
        assertThrows(AppException.class, () -> activity.list("", "", "GET", "", null, null, 0, 20));
    }
}
