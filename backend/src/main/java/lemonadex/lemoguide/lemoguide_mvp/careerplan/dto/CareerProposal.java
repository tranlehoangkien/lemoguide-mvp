package lemonadex.lemoguide.lemoguide_mvp.careerplan.dto;

import java.util.List;

public record CareerProposal(String id, String goal, String rationale, int minimumHours,
        List<Option> options, List<Outcome> outcomes, String level) {
    public record Option(int weeks, String reason) { }
    public record Outcome(String skill, String achievement) { }
}
