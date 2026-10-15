package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewEvaluation;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto.InterviewReport;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service.AnswerMetrics.Metrics;
import lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service.InterviewQuestionParser.Generated;
import tools.jackson.databind.json.JsonMapper;

/** Model replies are messy: the parsers must normalize the usable ones and reject the rest. */
class InterviewParsersTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void questionsAreCappedDedupedAndCategoriesWhitelisted() {
        String reply = """
                Đây là bộ câu hỏi:
                { "questions": [
                    { "category": "INTRO", "question": "Giới thiệu về bạn?", "hint": "Ngắn gọn" },
                    { "category": "nonsense", "question": "Kể về một thất bại." },
                    { "category": "technical", "question": "giới thiệu về bạn?" },
                    { "category": "technical", "question": "" },
                    { "category": "technical", "question": "Index hoạt động thế nào?" },
                    { "category": "technical", "question": "Câu vượt quá số lượng" }
                ] }
                """;
        List<Generated> questions = InterviewQuestionParser.parse(mapper, reply, 3);
        assertThat(questions).extracting(Generated::question)
                .containsExactly("Giới thiệu về bạn?", "Kể về một thất bại.", "Index hoạt động thế nào?");
        assertThat(questions).extracting(Generated::category).containsExactly("intro", "behavioral", "technical");
    }

    @Test
    void aReplyCutOffAtTheTokenLimitKeepsItsFinishedQuestions() {
        String truncated = """
                ```json
                { "questions": [
                    { "category": "intro", "question": "Giới thiệu về bạn {ngắn gọn}?", "hint": "Ngắn \\"gọn\\"" },
                    { "category": "technical", "question": "Index hoạt động thế nào?" },
                    { "category": "behavioral", "question": "Kể về một thất bại." },
                    { "category": "technical", "question": "Câu bị cắt giữa chừng và không có dấu đó""";
        List<Generated> questions = InterviewQuestionParser.parse(mapper, truncated, 8);
        assertThat(questions).extracting(Generated::question)
                .containsExactly("Giới thiệu về bạn {ngắn gọn}?", "Index hoạt động thế nào?", "Kể về một thất bại.");
        // Only two finished questions is too few to run a session on.
        assertThatThrownBy(() -> InterviewQuestionParser.parse(mapper,
                "{ \"questions\": [ {\"question\":\"A?\"}, {\"question\":\"B?\"}, {\"question\":\"cắt", 8))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void tooFewQuestionsAreRejectedSoTheRunnerCanRetry() {
        assertThatThrownBy(() -> InterviewQuestionParser.parse(mapper, "{\"questions\":[{\"question\":\"Một câu?\"}]}", 8))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> InterviewQuestionParser.parse(mapper, "không phải json", 8))
                .isInstanceOf(IllegalArgumentException.class);
        // Asking for two questions is satisfied by two.
        assertThat(InterviewQuestionParser.parse(mapper, "{\"questions\":[{\"question\":\"A?\"},{\"question\":\"B?\"}]}", 2)).hasSize(2);
    }

    @Test
    void evaluationScoreIsTheMeanOfTheCriteria() {
        String reply = """
                ```json
                { "score": 99,
                  "criteria": [
                    { "key": "Clarity", "score": "90%", "comment": "Rõ" },
                    { "key": "relevance", "score": 70 },
                    { "key": "structure", "score": 50 },
                    { "key": "depth", "score": 60 },
                    { "key": "relevance", "score": 5 },
                    { "key": "other", "score": 100 }
                  ],
                  "strengths": ["a", "b", "c", "d"], "improvements": ["x"], "sampleAnswer": "Mẫu", "followUp": "null" }
                ```
                """;
        InterviewEvaluation evaluation = InterviewEvaluationParser.parse(mapper, reply);
        assertThat(evaluation.criteria()).extracting(InterviewEvaluation.Criterion::key)
                .containsExactly("relevance", "structure", "depth", "clarity");
        assertThat(evaluation.score()).isEqualTo(68); // (70 + 50 + 60 + 90) / 4, not the model's own 99
        assertThat(evaluation.strengths()).hasSize(3);
        assertThat(evaluation.followUp()).isNull();
    }

    @Test
    void evaluationFallsBackToTheModelScoreWhenCriteriaAreIncompleteAndRejectsEmptyReplies() {
        InterviewEvaluation partial = InterviewEvaluationParser.parse(mapper,
                "{\"score\": 61, \"criteria\": [{\"key\":\"depth\",\"score\":40}], \"strengths\": [\"ok\"]}");
        assertThat(partial.score()).isEqualTo(61);

        assertThatThrownBy(() -> InterviewEvaluationParser.parse(mapper, "{\"strengths\": [\"ok\"]}"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> InterviewEvaluationParser.parse(mapper, "{\"criteria\": [{\"key\":\"depth\",\"score\":40}]}"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void reportKeepsUsableParts() {
        InterviewReport report = InterviewReportParser.parse(mapper, """
                { "summary": "Tổng quan", "strengths": ["a"], "weaknesses": [],
                  "priorities": [ { "title": "Luyện STAR", "action": "Viết 3 câu" }, { "action": "Chỉ có hành động" }, {}, { "title": "T4" }, { "title": "T5" } ] }
                """);
        assertThat(report.summary()).isEqualTo("Tổng quan");
        assertThat(report.priorities()).extracting(InterviewReport.Priority::title)
                .containsExactly("Luyện STAR", "Chỉ có hành động", "T4");
        assertThatThrownBy(() -> InterviewReportParser.parse(mapper, "{}")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void answerMetricsCountWordsFillersAndPace() {
        Metrics typed = AnswerMetrics.of("Tôi làm API, à ừm tối ưu truy vấn.", 30, false);
        assertThat(typed.words()).isEqualTo(9);
        assertThat(typed.fillers()).isEqualTo(2);
        assertThat(typed.wordsPerMinute()).isNull();

        String spoken = "một hai ba bốn năm sáu bảy tám chín mười mười một mười hai";
        assertThat(AnswerMetrics.of(spoken, 12, true).wordsPerMinute()).isEqualTo(70); // 14 words in 12 seconds
        assertThat(AnswerMetrics.of(spoken, 5, true).wordsPerMinute()).isNull(); // too short to measure
        assertThat(AnswerMetrics.of("ngắn quá", 60, true).wordsPerMinute()).isNull();
        // "à" inside a word is not a filler; "thì là" is.
        assertThat(AnswerMetrics.of("cà phê và thì là rau", 20, false).fillers()).isEqualTo(1);
    }

    @Test
    void sessionScoringHelpers() {
        assertThat(InterviewScoring.verdict(80)).isEqualTo("Rất tốt");
        assertThat(InterviewScoring.verdict(65)).isEqualTo("Khá tốt");
        assertThat(InterviewScoring.verdict(45)).isEqualTo("Cần cải thiện");
        assertThat(InterviewScoring.verdict(44)).isEqualTo("Yếu");
        assertThat(InterviewScoring.verdict(null)).isNull();
        assertThat(InterviewScoring.average(List.of())).isNull();
        assertThat(InterviewScoring.average(List.of(70, 71))).isEqualTo(71);
    }
}
