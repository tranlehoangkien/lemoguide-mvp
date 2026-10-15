package lemonadex.lemoguide.lemoguide_mvp.jobposting.dto;

/** One required/nice-to-have technology on a job posting, flagged against the caller's own experience/projects. */
public record RequiredTechnologyView(
        Long technologyId,
        String name,
        boolean required,
        boolean matched
) {
}
