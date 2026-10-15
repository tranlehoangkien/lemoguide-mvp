package lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity;

/**
 * Which AI-assisted action a prompt/log entry is for. Persisted lowercase to
 * match the {@code ai_prompt_template.action_type} /
 * {@code ai_generation_log.action_type} MySQL ENUM ('generate','optimize',
 * 'match_jd','translate','grammar_check','chat','chat_cv_coach',
 * 'chat_interview_coach','chat_career_coach','chat_job_search_coach',
 * 'analyze_job','cv_review','cv_suggest','cover_letter','interview_questions',
 * 'interview_evaluate','interview_report') via
 * {@link ActionTypeConverter}. Shared with {@code lemoguide_mvp.aigenerationlog},
 * whose log rows record which action a given prompt template run performed.
 *
 * <p>The {@code CHAT_*} values let the "AI Coach" chat feature use a
 * different, more specialized system prompt per {@code
 * lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.ConversationCategory}
 * instead of a single generic one for every topic - see {@code
 * MyAiConversationService#resolveChatActionType}. Plain {@link #CHAT} stays
 * the catch-all used when no specific topic is selected and as the fallback
 * when a model has no specialized template configured yet.
 */
public enum ActionType {
    GENERATE,
    OPTIMIZE,
    MATCH_JD,
    TRANSLATE,
    GRAMMAR_CHECK,
    CHAT,
    CHAT_CV_COACH,
    CHAT_INTERVIEW_COACH,
    CHAT_CAREER_COACH,
    CHAT_JOB_SEARCH_COACH,
    /** "Phan tich viec lam voi Ho so" - structured JSON gap analysis, see {@code lemoguide_mvp.jobanalysis}. */
    ANALYZE_JOB,
    /** ATS-style review of one CV (optionally against a target job) - see {@code lemoguide_mvp.cvoptimizer}. */
    CV_REVIEW,
    /** Section rewrite suggestions the user can accept one by one. */
    CV_SUGGEST,
    COVER_LETTER,
    /** Interview Studio: the question set of one practice session - see {@code lemoguide_mvp.interviewpractice}. */
    INTERVIEW_QUESTIONS,
    /** Interview Studio: scoring and feedback for one answer. */
    INTERVIEW_EVALUATE,
    /** Interview Studio: the end-of-session report. */
    INTERVIEW_REPORT,
    /** Interview Studio: a sample answer requested before submitting. */
    INTERVIEW_HINT,
    /** Structured career analysis and weekly action plan. */
    CAREER_PLAN,
    COMPARE_PROFILE,
    /** LemoNetwork Q&A help: draft answer, discussion summary and topic suggestions - see {@code lemoguide_mvp.network}. */
    NETWORK_ASSIST,
    /** "Trắc nghiệm với AI": feedback, scenario questions and closing narrative of the adaptive Holland test - see {@code lemoguide_mvp.discovery}. */
    HOLLAND_ADAPTIVE
}
