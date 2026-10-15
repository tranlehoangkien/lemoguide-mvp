package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;

import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResult;
import tools.jackson.databind.json.JsonMapper;

/** Model replies are messy: the parsers must normalize the usable ones and reject the rest. */
class CvOptimizerParsersTest {

    private final JsonMapper mapper = JsonMapper.builder().build();
    private final Map<String, String> labels = Map.of("profile", "Thông tin chung", "experiences:12", "Backend tại KeySoft");

    @Test
    void reviewIsNormalizedAndOnlyPointsAtRealItems() {
        String reply = """
                Kết quả:
                ```json
                {
                  "overallScore": "58%",
                  "verdict": "cần cải thiện",
                  "summary": "CV thiếu số liệu.",
                  "criteria": [
                    { "key": "IMPACT", "score": 35, "finding": "Không có số liệu", "fix": "Thêm kết quả đo được" },
                    { "key": "structure", "score": 80, "finding": "Đủ mục" },
                    { "key": "structure", "score": 10 },
                    { "key": "unknown", "score": 50 },
                    { "key": "clarity" }
                  ],
                  "sectionFindings": [
                    { "ref": "experiences:99", "severity": "LOW", "issue": "Mục đã bị xóa", "suggestion": "x" },
                    { "ref": "experiences:12", "severity": "high", "issue": "Mô tả chung chung", "suggestion": "Dùng STAR" },
                    { "ref": "profile", "severity": "weird", "issue": "Mục tiêu dài dòng" },
                    { "issue": "" }
                  ],
                  "keywordCoverage": [
                    { "keyword": "React Native", "status": "MISSING", "where": "Dự án" },
                    { "keyword": "React", "status": "present" }
                  ],
                  "missingFacts": ["Quy mô người dùng?"]
                }
                ```
                """;

        CvReviewResult review = CvReviewParser.parse(mapper, reply, labels);

        assertThat(review.overallScore()).isEqualTo(58);
        assertThat(review.verdict()).isEqualTo("Cần cải thiện");
        // Fixed order (structure before impact), duplicates and unknown / score-less criteria dropped.
        assertThat(review.criteria()).extracting(CvReviewResult.Criterion::key).containsExactly("structure", "impact");
        assertThat(review.criteria().get(0).score()).isEqualTo(80);
        assertThat(review.criteria().get(0).label()).isEqualTo("Bố cục và đầy đủ");
        // High first; an unknown ref becomes a whole-CV finding, a known one keeps its label.
        assertThat(review.sectionFindings()).extracting(CvReviewResult.Finding::severity)
                .containsExactly("high", "medium", "low");
        assertThat(review.sectionFindings().get(0).ref()).isEqualTo("experiences:12");
        assertThat(review.sectionFindings().get(0).itemLabel()).isEqualTo("Backend tại KeySoft");
        assertThat(review.sectionFindings().get(2).ref()).isNull();
        assertThat(review.sectionFindings().get(2).itemLabel()).isEqualTo("Toàn bộ CV");
        assertThat(review.keywordCoverage()).extracting(CvReviewResult.KeywordStatus::status)
                .containsExactly("missing", "present");
        assertThat(review.missingFacts()).containsExactly("Quy mô người dùng?");
    }

    @Test
    void reviewScoreFallsBackToTheCriteriaAverage() {
        CvReviewResult review = CvReviewParser.parse(mapper,
                "{\"criteria\":[{\"key\":\"structure\",\"score\":60},{\"key\":\"impact\",\"score\":40}]}", labels);

        assertThat(review.overallScore()).isEqualTo(50);
        assertThat(review.verdict()).isEqualTo("Cần cải thiện");
    }

    @Test
    void reviewWithoutContentIsRejected() {
        assertThatThrownBy(() -> CvReviewParser.parse(mapper, "Xin lỗi, tôi không thể.", labels))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CvReviewParser.parse(mapper, "{}", labels)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CvReviewParser.parse(mapper, "[1]", labels)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void suggestionsAreReadAndCapped() {
        StringBuilder items = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            items.append(i > 0 ? "," : "")
                    .append("{\"ref\":\"experiences:").append(i).append("\",\"field\":\"description\",\"after\":\"- ý ")
                    .append(i).append("\"}");
        }
        CvSuggestionParser.Parsed parsed = CvSuggestionParser.parse(mapper, "{\"suggestions\":[" + items
                + ",{\"ref\":\"x\"}],\"questions\":[\"Quy mô?\",\"\"]}");

        assertThat(parsed.suggestions()).hasSize(CvSuggestionParser.MAX_SUGGESTIONS);
        assertThat(parsed.questions()).containsExactly("Quy mô?");
    }

    @Test
    void suggestionReplyMustHaveTheExpectedShape() {
        assertThat(CvSuggestionParser.parse(mapper, "{\"suggestions\":[]}").suggestions()).isEmpty();
        assertThatThrownBy(() -> CvSuggestionParser.parse(mapper, "{\"foo\":1}")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CvSuggestionParser.parse(mapper, "không phải json")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void numbersNotInTheSourceAreFlagged() {
        String cv = "Phát triển API cho KeySoft từ 2022 đến 2024, tăng tốc 2 lần.";

        assertThat(NumberGuard.unverified("- Tăng hiệu suất 40% cho 3 dịch vụ (2022-2024)", cv))
                .containsExactly("40%", "3");
        assertThat(NumberGuard.unverified("- Tăng tốc 2 lần trong 2024", cv)).isEmpty();
        // "3" is not "found" inside 2023, and a decimal is one number.
        assertThat(NumberGuard.unverified("năm 2023, đạt 4.5 điểm", "năm 2023")).containsExactly("4.5");
        assertThat(NumberGuard.unverified("", cv)).isEmpty();
    }

    @Test
    void coverLetterIsUnfencedAndMustNotBeTiny() {
        String letter = "Kính gửi [Tên người nhận],\n\nTôi viết thư này để ứng tuyển vị trí Mobile Developer tại quý công ty. "
                + "Với kinh nghiệm phát triển ứng dụng và niềm yêu thích công nghệ, tôi tin mình phù hợp với vị trí này.";

        assertThat(CoverLetterService.cleanLetter("```text\n" + letter + "\n```")).isEqualTo(letter);
        assertThatThrownBy(() -> CoverLetterService.cleanLetter("Ok")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> CoverLetterService.cleanLetter(null)).isInstanceOf(IllegalArgumentException.class);
    }
}
