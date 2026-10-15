package lemonadex.lemoguide.lemoguide_mvp.auth.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lemonadex.lemoguide.lemoguide_mvp.auth.config.JwtProperties;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;

/**
 * Issues and verifies the HS256 access tokens used for stateless authentication.
 * The token subject is the account id; {@code email} and {@code role} travel as
 * custom claims so the {@link JwtAuthenticationFilter} can build an
 * {@code Authentication} without a database round-trip.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(JwtProperties properties) {
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.expirationMs = properties.expirationMs();
    }

    public String generateToken(Account account) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(account.getId()))
                .claim("email", account.getEmail())
                .claim("role", account.getRole().getName().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }

    public long getExpirationMs() {
        return expirationMs;
    }
}
