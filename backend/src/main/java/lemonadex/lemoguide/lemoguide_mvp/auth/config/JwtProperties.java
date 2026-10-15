package lemonadex.lemoguide.lemoguide_mvp.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code app.jwt.*} in application.yaml.
 *
 * @param secret       HS256 signing key; must be at least 32 bytes (256 bits)
 * @param expirationMs access-token lifetime in milliseconds
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, long expirationMs) {

    public JwtProperties {
        if (secret == null || secret.getBytes().length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret must be set and at least 32 bytes long (set JWT_SECRET)");
        }
        if (expirationMs <= 0) {
            expirationMs = 86_400_000L; // 24h fallback
        }
    }
}
