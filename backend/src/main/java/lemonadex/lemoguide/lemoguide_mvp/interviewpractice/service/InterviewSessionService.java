package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.AiReplies;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvAiTaskRunner;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvGroundingService;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvGroundingService.Grounding;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.NumberGuard;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewAnswerRequest;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewEvaluation;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewReport;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewSessionRequest;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewSessionResponse;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewSessionSummary;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.entity.InterviewQuestion;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.entity.InterviewSession;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.repository.InterviewQuestionRepository;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.repository.InterviewSessionRepository;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service.AnswerMetrics.Metrics;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service.InterviewQuestionParser.Generated;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Interview Studio: a practice session is a fixed set of questions written from the user's CV and a
 * target job, answered one by one (typed or spoken), each answer graded by the model, then closed with a
 * report. The CV and job text are snapshotted when the session starts, and every score the user sees is
 * computed here from the per-criterion grades. Unmetered like every AI Coach feature; each model call is
 * logged to {@code ai_generation_log}.
 *
 * <p>{@code noRollbackFor}: the FAILED log row written before an {@link AppException} must survive it.
 */
@Service
@Transactional(noRollbackFor = AppException.class)
@RequiredArgsConstructor
public class InterviewSessionService {

    private static final Set<String> LEVELS = Set.of("fresher", "junior", "middle", "senior");
    private static final Set<String> TYPES = Set.of("behavioral", "technical", "mixed");
    private static final Set<String> SOURCES = Set.of("typed", "voice");
    private static final int DEFAULT_QUESTIONS = 8;
    private static final int HISTORY_LIMIT = 30;
    private static final int ANSWER_EXCERPT = 500;

    private final CvGroundingService groundingService;
    private final CvAiTaskRunner taskRunner;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final AiModelRepository aiModelRepository;
    private final ObjectMapper objectMapper;

    // ------------------------------------------------------------------ create

    public InterviewSessionResponse create(InterviewSessionRequest request) {
        Long accountId = SecurityUtils.currentAccountId();
        Grounding grounding = groundingService.ground(request.cvProfileId(), request.target());

        String position = firstNonBlank(request.positionTitle(), grounding.targetTitle(), grounding.cvTitle());
        if (position == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Hãy nhập vị trí ứng tuyển để AI soạn câu hỏi phù hợp.");
        }
        position = AiReplies.clip(position, 200);
        String level = request.level() != null && LEVELS.contains(request.level()) ? request.level() : "junior";
        String type = request.interviewType() != null && TYPES.contains(request.interviewType()) ? request.interviewType() : "mixed";
        int count = request.questionCount() != null ? request.questionCount() : DEFAULT_QUESTIONS;

        String context = contextText(grounding);
        String message = context + "[YÊU CẦU BUỔI PHỎNG VẤN]\n"
                + "Vị trí: " + position + "\n"
                + "Cấp độ: " + levelLabel(level) + "\n"
                + "Loại buổi phỏng vấn: " + typeLabel(type) + "\n"
                + "Số câu: " + count + "\n"
                + "[HẾT YÊU CẦU BUỔI PHỎNG VẤN]\n\n"
                + "Giữ câu trả lời NGẮN để không bị cắt giữa chừng: mỗi câu hỏi tối đa 30 từ, \"intent\" tối đa 15 từ, "
                + "\"hint\" tối đa 25 từ. Chỉ trả về JSON, không giải thích thêm.\n"
                + "Hãy soạn bộ câu hỏi và trả về JSON đúng schema.";

        CvAiTaskRunner.Outcome<List<Generated>> outcome = taskRunner.run(ActionType.INTERVIEW_QUESTIONS, request.modelId(),
                accountId, request.cvProfileId(), message, "Soan cau hoi phong van - " + position + " (" + level + ", " + type + ")",
                raw -> InterviewQuestionParser.parse(objectMapper, raw, count));

        Long jobId = grounding.targetKey().startsWith("job-") ? request.target().jobPostingId() : null;
        InterviewSession session = sessionRepository.save(InterviewSession.builder()
                .accountId(accountId)
                .cvProfileId(request.cvProfileId())
                .jobPostingId(jobId)
                .targetKey(grounding.targetKey())
                .targetLabel(grounding.targetLabel())
                .positionTitle(position)
                .level(level)
                .interviewType(type)
                .questionCount(outcome.value().size())
                .modelId(outcome.model().getId())
                .contextText(context)
                .build());

        List<InterviewQuestion> questions = new ArrayList<>();
        int seq = 1;
        for (Generated generated : outcome.value()) {
            questions.add(questionRepository.save(InterviewQuestion.builder()
                    .sessionId(session.getId())
                    .seq(seq++)
                    .category(generated.category())
                    .question(generated.question())
                    .intent(generated.intent())
                    .hint(generated.hint())
                    .generationLogId(outcome.logId())
                    .build()));
        }
        return toResponse(session, questions);
    }

    // ------------------------------------------------------------------ read

    @Transactional(readOnly = true)
    public List<InterviewSessionSummary> list() {
        List<InterviewSession> sessions = sessionRepository.findByAccountIdOrderByUpdatedAtDesc(
                SecurityUtils.currentAccountId(), PageRequest.of(0, HISTORY_LIMIT));
        if (sessions.isEmpty()) {
            return List.of();
        }
        Map<Long, Integer> answered = new HashMap<>();
        for (Object[] row : questionRepository.countAnsweredBySession(sessions.stream().map(InterviewSession::getId).toList())) {
            answered.put((Long) row[0], ((Number) row[1]).intValue());
        }
        return sessions.stream()
                .map(s -> InterviewSessionSummary.from(s, answered.getOrDefault(s.getId(), 0), readCriteria(s.getCriteriaJson())))
                .toList();
    }

    @Transactional(readOnly = true)
    public InterviewSessionResponse get(Long id) {
        InterviewSession session = require(id);
        return toResponse(session, questionRepository.findBySessionIdOrderBySeqAsc(id));
    }

    // ------------------------------------------------------------------ answer / skip

    public Map<String, String> suggestAnswer(Long sessionId, Long questionId) {
        InterviewSession session = requireOpen(sessionId);
        InterviewQuestion question = requireQuestion(session, questionId);
        if (question.getSuggestedAnswer() != null) {
            return Map.of("answer", question.getSuggestedAnswer());
        }
        String message = sessionHeader(session) + "\n"
                + (session.getContextText() == null ? "" : session.getContextText())
                + "\n[CÂU HỎI]\n" + question.getQuestion() + "\n[HẾT CÂU HỎI]\n"
                + "Ý định: " + (question.getIntent() == null ? "" : question.getIntent()) + "\n"
                + "Hướng trả lời: " + (question.getHint() == null ? "" : question.getHint()) + "\n"
                + "Viết câu trả lời tham khảo tối đa 180 từ. Chỉ trả JSON {\"answer\":\"...\"}.";
        CvAiTaskRunner.Outcome<String> outcome = taskRunner.run(ActionType.INTERVIEW_HINT,
                preferredModelId(session), session.getAccountId(), session.getCvProfileId(), message,
                "Goi y tra loi phong van #" + sessionId + "/" + question.getSeq(), raw -> {
                    JsonNode root = AiReplies.jsonObject(objectMapper, raw);
                    if (!root.path("answer").isTextual()) {
                        throw new IllegalArgumentException("Missing sample answer");
                    }
                    String answer = AiReplies.text(root, "answer", 4000);
                    if (answer == null) {
                        throw new IllegalArgumentException("Empty sample answer");
                    }
                    return answer;
                });
        question.setSuggestedAnswer(outcome.value());
        return Map.of("answer", outcome.value());
    }

    public InterviewSessionResponse answer(Long sessionId, Long questionId, InterviewAnswerRequest request) {
        InterviewSession session = requireOpen(sessionId);
        InterviewQuestion question = requireQuestion(session, questionId);

        String answer = request.answer().trim();
        boolean spoken = "voice".equals(request.source());
        Metrics metrics = AnswerMetrics.of(answer, request.durationSeconds(), spoken);

        StringBuilder message = new StringBuilder(sessionHeader(session)).append('\n')
                .append(session.getContextText() == null ? "" : session.getContextText())
                .append("[CÂU HỎI]\n(").append(InterviewScoring.categoryLabel(question.getCategory())).append(") ")
                .append(question.getQuestion()).append('\n');
        if (question.getIntent() != null) {
            message.append("Nhà tuyển dụng muốn kiểm tra: ").append(question.getIntent()).append('\n');
        }
        message.append("[HẾT CÂU HỎI]\n\n[CÂU TRẢ LỜI]\n").append(answer).append("\n[HẾT CÂU TRẢ LỜI]\n\n");
        if (spoken) {
            message.append("[THỐNG KÊ NÓI]\nCâu trả lời được chuyển từ giọng nói. Số từ: ").append(metrics.words());
            if (request.durationSeconds() != null) {
                message.append(". Thời lượng: ").append(request.durationSeconds()).append(" giây");
            }
            message.append(".\n[HẾT THỐNG KÊ NÓI]\n\n");
        }
        message.append("Giữ nhận xét NGẮN để không bị cắt giữa chừng: mỗi \"comment\" tối đa 20 từ, mỗi ý trong \"strengths\" ")
                .append("và \"improvements\" tối đa 30 từ, \"sampleAnswer\" tối đa 120 từ. Chỉ trả về JSON.\n")
                .append("Hãy chấm câu trả lời và trả về JSON đúng schema.");

        CvAiTaskRunner.Outcome<InterviewEvaluation> outcome = taskRunner.run(ActionType.INTERVIEW_EVALUATE,
                preferredModelId(session), session.getAccountId(), session.getCvProfileId(), message.toString(),
                "Cham cau tra loi phong van #" + session.getId() + "/" + question.getSeq(),
                raw -> InterviewEvaluationParser.parse(objectMapper, raw));

        InterviewEvaluation parsed = outcome.value();
        int score = parsed.score();
        String note = null;
        if (metrics.words() < AnswerMetrics.MIN_WORDS_FOR_FULL_SCORE && score > AnswerMetrics.SHORT_ANSWER_SCORE_CAP) {
            score = AnswerMetrics.SHORT_ANSWER_SCORE_CAP;
            note = "Câu trả lời quá ngắn nên điểm bị giới hạn. Hãy trình bày đầy đủ hơn với một ví dụ cụ thể.";
        }
        List<String> unverified = NumberGuard.unverified(parsed.sampleAnswer(),
                session.getContextText() == null ? "" : session.getContextText(), answer);
        InterviewEvaluation evaluation = new InterviewEvaluation(score, parsed.criteria(), parsed.strengths(),
                parsed.improvements(), parsed.sampleAnswer(), parsed.followUp(), unverified, note);

        question.setPreviousScore(question.isAnswered() ? question.getScore() : question.getPreviousScore());
        question.setAttemptCount(question.getAttemptCount() + 1);
        question.setStatus(InterviewQuestion.ANSWERED);
        question.setAnswerText(answer);
        question.setAnswerSource(request.source() != null && SOURCES.contains(request.source()) ? request.source() : "typed");
        question.setDurationSeconds(request.durationSeconds());
        question.setWordCount(metrics.words());
        question.setFillerCount(metrics.fillers());
        question.setScore(score);
        question.setEvaluationJson(objectMapper.writeValueAsString(evaluation));
        question.setGenerationLogId(outcome.logId());
        question.setAnsweredAt(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());

        return toResponse(session, questionRepository.findBySessionIdOrderBySeqAsc(sessionId));
    }

    public InterviewSessionResponse skip(Long sessionId, Long questionId) {
        InterviewSession session = requireOpen(sessionId);
        InterviewQuestion question = requireQuestion(session, questionId);
        if (question.isAnswered()) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Câu hỏi này đã được trả lời.");
        }
        question.setStatus(InterviewQuestion.SKIPPED);
        session.setUpdatedAt(LocalDateTime.now());
        return toResponse(session, questionRepository.findBySessionIdOrderBySeqAsc(sessionId));
    }

    // ------------------------------------------------------------------ finish

    /** Closes the session: scores it in code, then asks the model for the write-up. Finishing twice is harmless. */
    public InterviewSessionResponse finish(Long sessionId) {
        InterviewSession session = require(sessionId);
        List<InterviewQuestion> questions = questionRepository.findBySessionIdOrderBySeqAsc(sessionId);
        if (session.isCompleted()) {
            return toResponse(session, questions);
        }
        List<InterviewQuestion> answered = questions.stream().filter(InterviewQuestion::isAnswered).toList();
        if (answered.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Hãy trả lời ít nhất một câu hỏi trước khi kết thúc buổi phỏng vấn.");
        }

        Integer overall = InterviewScoring.average(answered.stream().map(InterviewQuestion::getScore).toList());
        Map<String, Integer> criteria = InterviewScoring.criteriaAverages(
                answered.stream().map(this::readEvaluation).toList());

        CvAiTaskRunner.Outcome<InterviewReport> outcome = taskRunner.run(ActionType.INTERVIEW_REPORT,
                preferredModelId(session), session.getAccountId(), session.getCvProfileId(),
                reportMessage(session, questions, overall, criteria),
                "Tong ket buoi phong van #" + session.getId(),
                raw -> InterviewReportParser.parse(objectMapper, raw));

        for (InterviewQuestion question : questions) {
            if (InterviewQuestion.PENDING.equals(question.getStatus())) {
                question.setStatus(InterviewQuestion.SKIPPED);
            }
        }
        session.setStatus(InterviewSession.COMPLETED);
        session.setOverallScore(overall);
        session.setCriteriaJson(objectMapper.writeValueAsString(criteria));
        session.setReportJson(objectMapper.writeValueAsString(outcome.value()));
        session.setReportLogId(outcome.logId());
        session.setCompletedAt(LocalDateTime.now());
        return toResponse(session, questions);
    }

    public void delete(Long id) {
        InterviewSession session = require(id);
        questionRepository.deleteBySessionId(id);
        sessionRepository.delete(session);
    }

    // ------------------------------------------------------------------ helpers

    private InterviewSession require(Long id) {
        return sessionRepository.findByIdAndAccountId(id, SecurityUtils.currentAccountId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Interview session not found"));
    }

    private InterviewSession requireOpen(Long id) {
        InterviewSession session = require(id);
        if (session.isCompleted()) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT,
                    "Buổi phỏng vấn này đã kết thúc. Hãy bắt đầu một buổi mới để luyện tiếp.");
        }
        return session;
    }

    private InterviewQuestion requireQuestion(InterviewSession session, Long questionId) {
        return questionRepository.findByIdAndSessionId(questionId, session.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Interview question not found"));
    }

    /** The model the session started with while it is still active, otherwise let the runner pick one. */
    private Long preferredModelId(InterviewSession session) {
        if (session.getModelId() == null) {
            return null;
        }
        return aiModelRepository.findById(session.getModelId()).filter(AiModel::getIsActive).map(AiModel::getId).orElse(null);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static String contextText(Grounding grounding) {
        StringBuilder sb = new StringBuilder();
        if (!grounding.cvText().isEmpty()) {
            sb.append("[CV]\n").append(grounding.cvText()).append("\n[HẾT CV]\n\n");
        }
        if (!grounding.targetText().isEmpty()) {
            sb.append("[MỤC TIÊU]\n").append(grounding.targetText()).append("\n[HẾT MỤC TIÊU]\n\n");
        }
        if (sb.length() == 0) {
            sb.append("Không có CV hoặc mục tiêu cụ thể: hãy hỏi những câu phổ biến, phù hợp với vị trí và cấp độ.\n\n");
        }
        return sb.toString();
    }

    private static String sessionHeader(InterviewSession session) {
        return "[BUỔI PHỎNG VẤN]\nVị trí: " + session.getPositionTitle() + "\nCấp độ: " + levelLabel(session.getLevel())
                + "\nLoại buổi phỏng vấn: " + typeLabel(session.getInterviewType()) + "\n[HẾT BUỔI PHỎNG VẤN]\n";
    }

    private String reportMessage(InterviewSession session, List<InterviewQuestion> questions, Integer overall,
            Map<String, Integer> criteria) {
        long answered = questions.stream().filter(InterviewQuestion::isAnswered).count();
        StringBuilder sb = new StringBuilder("[BUỔI PHỎNG VẤN]\n")
                .append("Vị trí: ").append(session.getPositionTitle()).append('\n')
                .append("Cấp độ: ").append(levelLabel(session.getLevel())).append('\n')
                .append("Loại buổi phỏng vấn: ").append(typeLabel(session.getInterviewType())).append('\n')
                .append("Mục tiêu: ").append(session.getTargetLabel()).append('\n')
                .append("Đã trả lời ").append(answered).append("/").append(questions.size()).append(" câu\n")
                .append("Điểm tổng (do hệ thống tính): ").append(overall).append("/100\n");
        criteria.forEach((key, value) -> sb.append("Điểm trung bình - ").append(InterviewScoring.CRITERIA.get(key))
                .append(": ").append(value).append('\n'));
        sb.append("[HẾT BUỔI PHỎNG VẤN]\n\n[KẾT QUẢ TỪNG CÂU]\n");
        for (InterviewQuestion q : questions) {
            sb.append("Câu ").append(q.getSeq()).append(" (").append(InterviewScoring.categoryLabel(q.getCategory())).append(")");
            if (!q.isAnswered()) {
                sb.append(" - chưa trả lời\nHỏi: ").append(q.getQuestion()).append("\n\n");
                continue;
            }
            InterviewEvaluation evaluation = readEvaluation(q);
            sb.append(" - điểm ").append(q.getScore());
            if ("voice".equals(q.getAnswerSource())) {
                sb.append(" - trả lời bằng giọng nói");
            }
            sb.append("\nHỏi: ").append(q.getQuestion()).append("\nTrả lời (rút gọn): ")
                    .append(AiReplies.clip(q.getAnswerText(), ANSWER_EXCERPT)).append('\n');
            if (!evaluation.strengths().isEmpty()) {
                sb.append("Điểm mạnh: ").append(String.join("; ", evaluation.strengths())).append('\n');
            }
            if (!evaluation.improvements().isEmpty()) {
                sb.append("Cần cải thiện: ").append(String.join("; ", evaluation.improvements())).append('\n');
            }
            sb.append('\n');
        }
        return sb.append("[HẾT KẾT QUẢ TỪNG CÂU]\n\nGiữ báo cáo NGẮN để không bị cắt giữa chừng: \"summary\" tối đa 70 từ, mỗi ý trong ")
                .append("\"strengths\" và \"weaknesses\" tối đa 30 từ, mỗi \"action\" tối đa 40 từ. Chỉ trả về JSON.\n")
                .append("Hãy tổng kết buổi phỏng vấn và trả về JSON đúng schema.").toString();
    }

    private InterviewEvaluation readEvaluation(InterviewQuestion question) {
        return objectMapper.readValue(question.getEvaluationJson(), InterviewEvaluation.class);
    }

    private Map<String, Integer> readCriteria(String json) {
        Map<String, Integer> out = new LinkedHashMap<>();
        if (json == null || json.isBlank()) {
            return out;
        }
        JsonNode root = objectMapper.readTree(json);
        InterviewScoring.CRITERIA.keySet().forEach(key -> {
            if (root.path(key).isNumber()) {
                out.put(key, root.path(key).asInt());
            }
        });
        return out;
    }

    private InterviewSessionResponse toResponse(InterviewSession session, List<InterviewQuestion> questions) {
        List<InterviewSessionResponse.Question> views = new ArrayList<>();
        List<InterviewEvaluation> evaluations = new ArrayList<>();
        List<Integer> scores = new ArrayList<>();
        List<Integer> paces = new ArrayList<>();
        int skipped = 0;
        int seconds = 0;
        int fillers = 0;
        for (InterviewQuestion q : questions) {
            InterviewEvaluation evaluation = null;
            Integer pace = null;
            if (q.isAnswered()) {
                evaluation = readEvaluation(q);
                evaluations.add(evaluation);
                scores.add(q.getScore());
                seconds += q.getDurationSeconds() != null ? q.getDurationSeconds() : 0;
                fillers += q.getFillerCount() != null ? q.getFillerCount() : 0;
                if ("voice".equals(q.getAnswerSource())) {
                    pace = AnswerMetrics.of(q.getAnswerText(), q.getDurationSeconds(), true).wordsPerMinute();
                    if (pace != null) {
                        paces.add(pace);
                    }
                }
            } else if (InterviewQuestion.SKIPPED.equals(q.getStatus())) {
                skipped++;
            }
            views.add(new InterviewSessionResponse.Question(q.getId(), q.getSeq(), q.getCategory(),
                    InterviewScoring.categoryLabel(q.getCategory()), q.getQuestion(), q.getIntent(), q.getHint(),
                    q.getStatus(), q.getAnswerText(), q.getAnswerSource(), q.getDurationSeconds(), q.getWordCount(),
                    q.getFillerCount(), pace, q.getScore(), q.getAttemptCount(), q.getPreviousScore(), evaluation));
        }

        InterviewReport report = session.getReportJson() == null ? null
                : objectMapper.readValue(session.getReportJson(), InterviewReport.class);
        String modelName = session.getModelId() == null ? null
                : aiModelRepository.findById(session.getModelId()).map(AiModel::getModelName).orElse(null);
        return new InterviewSessionResponse(session.getId(), session.getCvProfileId(), session.getJobPostingId(),
                session.getPositionTitle(), session.getLevel(), session.getInterviewType(), session.getTargetKey(),
                session.getTargetLabel(), session.getQuestionCount(), session.getStatus(), session.getOverallScore(),
                InterviewScoring.verdict(session.getOverallScore()), InterviewScoring.criteriaAverages(evaluations),
                session.getCreatedAt(), session.getCompletedAt(), modelName, views,
                new InterviewSessionResponse.Stats(scores.size(), skipped, questions.size(),
                        InterviewScoring.average(scores), seconds, InterviewScoring.average(paces), fillers),
                report);
    }

    static String levelLabel(String level) {
        return switch (level) {
            case "fresher" -> "Fresher (mới ra trường)";
            case "middle" -> "Middle";
            case "senior" -> "Senior";
            default -> "Junior";
        };
    }

    static String typeLabel(String type) {
        return switch (type) {
            case "behavioral" -> "hành vi (behavioral)";
            case "technical" -> "chuyên môn (technical)";
            default -> "hỗn hợp (hành vi và chuyên môn)";
        };
    }
}
