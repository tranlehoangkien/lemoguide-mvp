package lemonadex.lemoguide.lemoguide_mvp.common.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Minimal {@code .env} loader. Reads {@code KEY=VALUE} lines from a {@code .env}
 * file in the process working directory and promotes each entry to a JVM system
 * property, so the {@code ${...}} placeholders in {@code application.yaml} can
 * resolve local secrets (DB credentials) without committing them.
 *
 * <p>Precedence is preserved: a real OS environment variable or a
 * {@code -Dkey=...} already set on the command line always wins over the file.
 * When {@code .env} is absent this is a no-op, so it stays safe in CI and
 * production where configuration comes from the real environment.
 *
 * <p>Called from {@code main()} before Spring starts — see
 * {@link lemonadex.lemoguide.lemoguide_mvp.LemoguideMvpApplication}.
 */
public final class EnvFileLoader {

    private EnvFileLoader() {
    }

    public static void load() {
        Path envFile = Path.of(".env");
        if (!Files.isRegularFile(envFile)) {
            return;
        }
        try {
            for (String raw : Files.readAllLines(envFile)) {
                String line = raw.strip();
                if (line.isEmpty() || line.startsWith("#")) {
                    continue;
                }
                int eq = line.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = line.substring(0, eq).strip();
                String value = line.substring(eq + 1).strip();
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            }
        } catch (IOException e) {
            System.err.println("Could not read .env file: " + e.getMessage());
        }
    }
}
