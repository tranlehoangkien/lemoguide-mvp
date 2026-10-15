package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.dto.JobAnalysisResult;
import tools.jackson.databind.json.JsonMapper;

/** Model replies are messy; the parser must normalize the usable ones and reject the rest. */
class JobAnalysisParserTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void parsesFencedJsonAndNormalizesLooseValues() {
        String reply = """
                Đây là phân tích của tôi:
                ```json
                {
                  "overallScore": "72%",
                  "verdict": "phù hợp",
                  "summary": "Ứng viên khá phù hợp.",
                  "strengths": [
                    { "item": "React", "evidence": "Dự án Shop dùng React 2 năm", "importance": "Required" },
                    { "item": "  ", "evidence": "bị bỏ vì thiếu tên" }
                  ],
                  "gaps": [
                    { "item": "Docker", "severity": "Nice-To-Have", "why": "JD nhắc tới", "howToClose": ["Học Docker cơ bản"] },
                    { "item": "React Native", "severity": "CRITICAL", "why": "Yêu cầu 2 năm",
                      "howToClose": ["Làm app nhỏ", "Đưa lên GitHub"], "estimatedEffort": "4-6 tuần" },
                    { "item": "TypeScript", "severity": "quan trọng" }
                  ],
                  "cvTips": ["Nêu rõ dự án mobile"],
                  "interviewFocus": [],
                  "actionPlan": [ "Tuần 1: học RN", { "title": "Tuần 2", "detail": "Làm app", "timeframe": "Tuần 2" } ]
                }
                ```
                Chúc bạn may mắn!
                """;

        JobAnalysisResult result = JobAnalysisParser.parse(mapper, reply);

        assertThat(result.overallScore()).isEqualTo(72);
        assertThat(result.verdict()).isEqualTo("Phù hợp");
        assertThat(result.strengths()).hasSize(1);
        assertThat(result.strengths().get(0).importance()).isEqualTo("required");
        // Most severe first; unknown severity falls back to "important".
        assertThat(result.gaps()).extracting(JobAnalysisResult.Gap::item)
                .containsExactly("React Native", "TypeScript", "Docker");
        assertThat(result.gaps()).extracting(JobAnalysisResult.Gap::severity)
                .containsExactly("critical", "important", "nice_to_have");
        assertThat(result.gaps().get(0).howToClose()).containsExactly("Làm app nhỏ", "Đưa lên GitHub");
        assertThat(result.actionPlan()).hasSize(2);
        assertThat(result.actionPlan().get(0).title()).isEqualTo("Tuần 1: học RN");
        assertThat(result.actionPlan().get(1).timeframe()).isEqualTo("Tuần 2");
    }

    @Test
    void findsBareJsonInsideProse() {
        JobAnalysisResult result = JobAnalysisParser.parse(mapper,
                "Kết quả: {\"summary\":\"Tạm ổn\",\"gaps\":[{\"item\":\"AWS\"}]} hết.");

        assertThat(result.summary()).isEqualTo("Tạm ổn");
        assertThat(result.gaps()).hasSize(1);
        assertThat(result.overallScore()).isNull();
        assertThat(result.verdict()).isNull();
    }

    @Test
    void clampsScoreDerivesVerdictAndCapsLists() {
        StringBuilder gaps = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            gaps.append(i > 0 ? "," : "").append("{\"item\":\"Skill").append(i).append("\"}");
        }
        JobAnalysisResult result = JobAnalysisParser.parse(mapper,
                "{\"overallScore\":150,\"summary\":\"x\",\"gaps\":[" + gaps + "]}");

        assertThat(result.overallScore()).isEqualTo(100);
        assertThat(result.verdict()).isEqualTo("Rất phù hợp");
        assertThat(result.gaps()).hasSize(JobAnalysisParser.MAX_GAPS);
    }

    @Test
    void lowScoreWithoutVerdictIsNotSuitable() {
        JobAnalysisResult result = JobAnalysisParser.parse(mapper, "{\"overallScore\":10,\"summary\":\"Thiếu nhiều\"}");

        assertThat(result.verdict()).isEqualTo("Chưa phù hợp");
    }

    @Test
    void rejectsRepliesWithoutAnAnalysis() {
        assertThatThrownBy(() -> JobAnalysisParser.parse(mapper, "Xin lỗi, tôi không thể giúp việc này."))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> JobAnalysisParser.parse(mapper, "{}")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> JobAnalysisParser.parse(mapper, "[1,2,3]")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> JobAnalysisParser.parse(mapper, null)).isInstanceOf(IllegalArgumentException.class);
    }
}
