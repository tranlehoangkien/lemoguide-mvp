package lemonadex.lemoguide.lemoguide_mvp.interviewpractice.dto;

import java.util.List;

/** The AI's end-of-session write-up. The numbers of the session are computed in code, not here. */
public record InterviewReport(String summary, List<String> strengths, List<String> weaknesses, List<Priority> priorities) {

    public record Priority(String title, String action) {
    }
}
