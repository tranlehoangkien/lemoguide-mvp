package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

/**
 * Result of a successful login or registration.
 *
 * @param tokenType   always {@code "Bearer"}
 * @param accessToken the signed JWT to send as {@code Authorization: Bearer ...}
 * @param expiresInMs token lifetime in milliseconds
 * @param account     who the token belongs to
 */
public record AuthResponse(
        String tokenType,
        String accessToken,
        long expiresInMs,
        AccountResponse account
) {

    public static AuthResponse of(String accessToken, long expiresInMs, AccountResponse account) {
        return new AuthResponse("Bearer", accessToken, expiresInMs, account);
    }
}
