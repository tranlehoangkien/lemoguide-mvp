package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

/** Published when a roadmap week goes from not done to done; other modules react after the transaction commits. */
public record CareerTaskCompletedEvent(long accountId, long taskId) { }
