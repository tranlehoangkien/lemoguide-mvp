package lemonadex.lemoguide.lemoguide_mvp.common.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Forces one real round-trip to the database at startup so a wrong URL, bad
 * credential, or unreachable server fails loudly here instead of surfacing later
 * on the first user request.
 *
 * <p>Uses only JDBC {@link DatabaseMetaData}, so it works against MySQL in
 * production and the in-memory H2 used by tests without any dialect-specific SQL.
 */
@Slf4j
@Component
@Order(0)
@RequiredArgsConstructor
public class DatabaseConnectionVerifier implements ApplicationRunner {

    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData meta = connection.getMetaData();
            log.info("Database connection OK -> {} {} @ {} (catalog '{}', user '{}')",
                    meta.getDatabaseProductName(),
                    meta.getDatabaseProductVersion(),
                    meta.getURL(),
                    connection.getCatalog(),
                    meta.getUserName());
        } catch (SQLException e) {
            throw new IllegalStateException(
                    "Cannot connect to the database. Check DB_URL / DB_USERNAME / DB_PASSWORD "
                            + "and that the MySQL server is running.", e);
        }
    }
}
