package lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity;

/**
 * Outcome of one AI call. Persisted lowercase to match the
 * {@code ai_generation_log.status} MySQL ENUM ('success','failed','timeout') via
 * {@link GenerationStatusConverter}.
 */
public enum GenerationStatus {
    SUCCESS,
    FAILED,
    TIMEOUT
}
