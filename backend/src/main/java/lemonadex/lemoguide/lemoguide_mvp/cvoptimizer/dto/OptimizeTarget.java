package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto;

/**
 * What a CV is being optimized for: a job posting from the system, or a job
 * description the user pasted. Both empty means "no specific target". A job id wins
 * when both are given.
 */
public record OptimizeTarget(Long jobPostingId, String jdText) {
}
