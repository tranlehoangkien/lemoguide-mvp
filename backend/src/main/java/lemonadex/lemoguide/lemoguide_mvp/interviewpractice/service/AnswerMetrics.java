package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.service;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Plain statistics of an answer: word count, filler words and, for a spoken answer, the speaking pace.
 * Speech recognition tends to drop fillers, so the filler count of a voice answer is a lower bound.
 */
final class AnswerMetrics {

    /** Below this many words an answer is not enough to earn a good score, whatever the model says. */
    static final int MIN_WORDS_FOR_FULL_SCORE = 8;
    static final int SHORT_ANSWER_SCORE_CAP = 40;

    private static final int MIN_SECONDS_FOR_PACE = 10;
    private static final int MIN_WORDS_FOR_PACE = 10;

    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{N}]+");
    private static final Pattern FILLER = Pattern.compile(
            "(?<![\\p{L}\\p{N}])(ờm|ờ|ừm|ừ|ơ|à|um|uhm|uh|kiểu như|kiểu là|thì là|đại loại|you know)(?![\\p{L}\\p{N}])");

    /** @param wordsPerMinute {@code null} unless the answer was spoken and long enough to measure */
    record Metrics(int words, int fillers, Integer wordsPerMinute) {
    }

    private AnswerMetrics() {
    }

    static Metrics of(String answer, Integer durationSeconds, boolean spoken) {
        String text = answer == null ? "" : answer.trim();
        int words = 0;
        Matcher word = WORD.matcher(text);
        while (word.find()) {
            words++;
        }
        int fillers = 0;
        Matcher filler = FILLER.matcher(text.toLowerCase(Locale.ROOT));
        while (filler.find()) {
            fillers++;
        }
        Integer pace = null;
        if (spoken && durationSeconds != null && durationSeconds >= MIN_SECONDS_FOR_PACE && words >= MIN_WORDS_FOR_PACE) {
            pace = (int) Math.round(words * 60.0 / durationSeconds);
        }
        return new Metrics(words, fillers, pace);
    }
}
