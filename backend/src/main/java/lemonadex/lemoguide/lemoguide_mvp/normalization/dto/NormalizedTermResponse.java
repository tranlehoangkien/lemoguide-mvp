package lemonadex.lemoguide.lemoguide_mvp.normalization.dto;

/**
 * One AI-suggested normalization result for a raw term. This endpoint only
 * suggests - it never writes to {@code skill}/{@code technology} itself; an
 * admin reviews the suggestion and creates it via the existing master-data
 * CRUD ({@code SkillController}/{@code TechnologyController}) if they agree.
 *
 * @param category SKILL | TECHNOLOGY | UNKNOWN
 * @param matched whether the term already exists (by meaning, not exact string) in the lookup table
 * @param matchedId id of the existing row when {@code matched} is true
 * @param matchedName canonical name of the existing row when {@code matched} is true
 * @param suggestedName AI-cleaned standardized name to use when creating a new row
 * @param suggestedSkillType hard | soft | language - only set when category = SKILL and not matched
 * @param suggestedTechnologyCategory only set when category = TECHNOLOGY and not matched
 */
public record NormalizedTermResponse(
        String rawTerm,
        String category,
        boolean matched,
        Long matchedId,
        String matchedName,
        String suggestedName,
        String suggestedSkillType,
        String suggestedTechnologyCategory
) {
}
