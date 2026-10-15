package lemonadex.lemoguide.lemoguide_mvp.auth.dto;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;

/** Public view of an {@link Account} returned alongside a freshly issued token. */
public record AccountResponse(Long id, String email, String role, String status) {

    public static AccountResponse from(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getEmail(),
                account.getRole().getName().name(),
                account.getStatus().name());
    }
}
