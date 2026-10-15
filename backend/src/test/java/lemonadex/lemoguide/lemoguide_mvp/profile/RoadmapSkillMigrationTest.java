package lemonadex.lemoguide.lemoguide_mvp.profile;

import static org.junit.jupiter.api.Assertions.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

class RoadmapSkillMigrationTest {
    @Test void backfillsCompletedRoadmapsWithoutChangingExistingRatingsOrPartialLearning() throws Exception {
        var jdbc = new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", ""));
        jdbc.execute("CREATE TABLE skill(id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), type VARCHAR(20), UNIQUE(name,type))");
        jdbc.execute("CREATE TABLE technology(id BIGINT PRIMARY KEY, name VARCHAR(100))");
        jdbc.execute("CREATE TABLE course_technology(course_id BIGINT, technology_id BIGINT)");
        jdbc.execute("CREATE TABLE course_skill(course_id BIGINT, skill_id BIGINT)");
        jdbc.execute("CREATE TABLE user_information(id BIGINT PRIMARY KEY, account_id BIGINT)");
        jdbc.execute("CREATE TABLE career_plan(id BIGINT PRIMARY KEY, account_id BIGINT)");
        jdbc.execute("CREATE TABLE career_task(id BIGINT PRIMARY KEY, plan_id BIGINT, course_id BIGINT, completed BOOLEAN)");
        jdbc.execute("CREATE TABLE user_skill(id BIGINT AUTO_INCREMENT PRIMARY KEY, user_information_id BIGINT, skill_id BIGINT, proficiency_level INT, UNIQUE(user_information_id,skill_id))");
        jdbc.update("INSERT INTO skill(name,type) VALUES ('Java','hard')");
        jdbc.update("INSERT INTO technology VALUES (1,'Java'),(2,'Spring Boot')");
        jdbc.update("INSERT INTO course_technology VALUES (10,1),(20,2)");
        jdbc.update("INSERT INTO course_skill VALUES (10,1)"); // Java has tags through both catalogs.
        jdbc.update("INSERT INTO user_information VALUES (1,1),(2,2),(3,3)");
        jdbc.update("INSERT INTO career_plan VALUES (1,1),(2,2),(3,3)");
        jdbc.update("INSERT INTO career_task VALUES (1,1,10,TRUE),(2,1,10,TRUE),(3,1,20,TRUE),(4,1,NULL,FALSE),"
                + "(5,2,10,TRUE),(6,2,10,FALSE),(7,2,20,FALSE),(8,3,10,TRUE),(9,3,20,TRUE)");
        jdbc.update("INSERT INTO user_skill(user_information_id,skill_id,proficiency_level) VALUES(3,1,70)");
        try (var connection = jdbc.getDataSource().getConnection()) {
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/migration/V54__roadmap_profile_skills.sql"));
        }
        assertEquals(2, jdbc.queryForObject("SELECT COUNT(*) FROM skill", Integer.class));
        assertEquals(2, jdbc.queryForObject("SELECT COUNT(*) FROM user_skill WHERE user_information_id=1 AND source='CAREER_PLAN' AND proficiency_level IS NULL", Integer.class));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM user_skill WHERE user_information_id=2", Integer.class));
        assertEquals(70, jdbc.queryForObject("SELECT proficiency_level FROM user_skill WHERE user_information_id=3 AND skill_id=1", Integer.class));
        assertEquals("MANUAL", jdbc.queryForObject("SELECT source FROM user_skill WHERE user_information_id=3 AND skill_id=1", String.class));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM user_skill WHERE user_information_id=3 AND source='CAREER_PLAN'", Integer.class));
    }
}
