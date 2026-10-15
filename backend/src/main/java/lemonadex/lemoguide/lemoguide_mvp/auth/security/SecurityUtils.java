package lemonadex.lemoguide.lemoguide_mvp.auth.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;

/**
 * Reads the current caller's account id from the {@link SecurityContextHolder}.
 * {@link JwtAuthenticationFilter} stores the account id as the authentication
 * name, so no database lookup is needed here.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Long currentAccountId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "No authenticated account in context");
        }
        try {
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException ex) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Malformed authentication principal");
        }
    }
}
