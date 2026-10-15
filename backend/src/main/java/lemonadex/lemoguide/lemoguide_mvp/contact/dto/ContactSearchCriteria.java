package lemonadex.lemoguide.lemoguide_mvp.contact.dto;

import lemonadex.lemoguide.lemoguide_mvp.contact.entity.ContactType;

/** Filters for {@code GET /api/me/contacts}. Any {@code null} field is ignored. */
public record ContactSearchCriteria(ContactType type, Boolean primary, String search) {
}
