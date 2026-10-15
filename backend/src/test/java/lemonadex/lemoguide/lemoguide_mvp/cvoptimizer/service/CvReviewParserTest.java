package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatOptions;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CvReviewResult;
import tools.jackson.databind.ObjectMapper;

/** The overall score and verdict come from the criteria, never from the model's own headline number. */
class CvReviewParserTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static CvReviewResult parse(String json) {
        return CvReviewParser.parse(MAPPER, json, Map.of());
    }

    @Test
    void overallScoreIsTheWeightedMeanOfTheCriteriaAndIgnoresTheModelsOwn() {
        CvReviewResult result = parse("""
                { "overallScore": 95, "verdict": "Rất tốt", "summary": "x",
                  "criteria": [
                    { "key": "structure", "score": 80 }, { "key": "keywords", "score": 40 },
                    { "key": "impact", "score": 30 }, { "key": "clarity", "score": 60 },
                    { "key": "relevance", "score": 50 } ] }
                """);
        assertThat(result.overallScore()).isEqualTo(49); // 4850 / 100 = 48.5, rounded up
        assertThat(result.verdict()).isEqualTo("Cần cải thiện");
    }

    @Test
    void weightsAreRenormalizedOverTheCriteriaThatCameBack() {
        CvReviewResult result = parse("""
                { "summary": "x", "criteria": [ { "key": "keywords", "score": 60 }, { "key": "impact", "score": 80 } ] }
                """);
        assertThat(result.overallScore()).isEqualTo(70); // (25*60 + 25*80) / 50
        assertThat(result.verdict()).isEqualTo("Khá tốt");
    }

    @Test
    void sameCriteriaAlwaysGiveTheSameScoreWhateverTheModelSaysOverall() {
        String criteria = """
                "criteria": [ { "key": "structure", "score": 90 }, { "key": "keywords", "score": 90 },
                  { "key": "impact", "score": 90 }, { "key": "clarity", "score": 90 }, { "key": "relevance", "score": 90 } ]""";
        assertThat(parse("{ \"overallScore\": 40, \"summary\": \"x\", " + criteria + " }").overallScore())
                .isEqualTo(parse("{ \"overallScore\": 99, \"summary\": \"x\", " + criteria + " }").overallScore())
                .isEqualTo(90);
    }

    @Test
    void fallsBackToTheModelsOverallScoreOnlyWithoutAnyUsableCriterion() {
        CvReviewResult result = parse("""
                { "overallScore": "72%", "summary": "x", "criteria": [ { "key": "unknown", "score": 10 } ] }
                """);
        assertThat(result.overallScore()).isEqualTo(72);
        assertThat(result.verdict()).isEqualTo("Khá tốt");
    }

    @Test
    void onlyScoringTasksRunAtTheLowTemperature() {
        assertThat(CvAiTaskRunner.optionsFor(ActionType.CV_REVIEW)).isEqualTo(AiChatOptions.SCORING);
        assertThat(CvAiTaskRunner.optionsFor(ActionType.INTERVIEW_EVALUATE)).isEqualTo(AiChatOptions.SCORING);
        assertThat(CvAiTaskRunner.optionsFor(ActionType.INTERVIEW_REPORT)).isEqualTo(AiChatOptions.SCORING);
        assertThat(CvAiTaskRunner.optionsFor(ActionType.COVER_LETTER)).isEqualTo(AiChatOptions.DEFAULT);
        assertThat(CvAiTaskRunner.optionsFor(ActionType.CV_SUGGEST)).isEqualTo(AiChatOptions.DEFAULT);
    }
}
