package lemonadex.lemoguide.lemoguide_mvp.careerplan.dto;

import java.util.List;

public record CareerAnalysis(String goal, String summary, String successCriteria,
        List<String> strengths, List<Gap> gaps, List<Direction> directions, String nextSteps,
        List<CareerProposal.Outcome> outcomes, String level) {
    public record Gap(String skill, String status, String reason) { }
    public record Direction(String role, String reason) { }
}
