package lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity;

/**
 * Which AI Coach tab an {@code ai_conversation} belongs to. Persisted
 * lowercase to match the {@code ai_conversation.category} MySQL ENUM
 * ('cv_optimization','interview_practice','career_roadmap',
 * 'job_search_negotiation','general') via {@link ConversationCategoryConverter}.
 */
public enum ConversationCategory {
    CV_OPTIMIZATION,
    INTERVIEW_PRACTICE,
    CAREER_ROADMAP,
    JOB_SEARCH_NEGOTIATION,
    GENERAL
}
