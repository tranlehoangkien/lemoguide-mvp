package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

/** One required/nice-to-have skill on a job posting, flagged against the caller's own skills. */
public record RequiredSkillView(
        Long skillId,
        String name,
        boolean required,
        boolean matched
) {
}
