package lemonadex.lemoguide.lemoguide_mvp.profileimport.dto;

import java.util.List;
import java.util.Map;

/**
 * Result of applying a Profile patch: how many rows were created per section,
 * and a human-readable reason for each item that was skipped (unparseable
 * date, unknown skill not yet in the master catalog, etc.) so the caller can
 * see what needs manual follow-up.
 */
public record ProfileApplyResponse(Map<String, Integer> created, List<String> skipped) {
}
