package lemonadex.lemoguide.lemoguide_mvp.common.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bound from {@code app.cors.*} in application.yaml. Lets each environment set the
 * exact browser origins allowed to call the API without touching code.
 *
 * @param allowedOrigins exact origins (scheme + host + port) permitted by CORS
 * @param allowedMethods HTTP methods the browser may use for cross-origin calls
 * @param allowCredentials whether the browser may send cookies / auth headers
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(
        List<String> allowedOrigins,
        List<String> allowedMethods,
        boolean allowCredentials
) {

    public CorsProperties {
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            allowedOrigins = List.of("http://localhost:5173", "http://localhost:5174");
        }
        if (allowedMethods == null || allowedMethods.isEmpty()) {
            allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        }
    }
}
