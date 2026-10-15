package lemonadex.lemoguide.lemoguide_mvp.careerplan.service;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class CareerPlanParserTest {
    private final JsonMapper mapper = JsonMapper.builder().build();

    private String reply(int count, int hours) {
        return mapper.writeValueAsString(Map.of("goal", "Backend", "summary", "Build on Java", "successCriteria", "Working API",
                "tasks", IntStream.rangeClosed(1, count).mapToObj(w -> Map.of("week", w, "title", "Task " + w,
                        "action", "Build API", "successCriteria", "Tests pass", "estimatedHours", hours,
                        "checkpoints", List.of("Read the docs", "Write the code"))).toList()));
    }

    @Test void acceptsFencedJsonAndEmptyStrengthsWithoutInventingEvidence() {
        var plan = CareerPlanParser.parse(mapper, "```json\n" + reply(4, 3) + "\n```", 4, 6);
        assertEquals(4, plan.tasks().size());
        assertTrue(plan.analysis().strengths().isEmpty());
        assertEquals(1, plan.tasks().getFirst().week());
    }

    @Test void rejectsIncompleteDuplicateAndOutOfRangeWeeks() {
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parse(mapper, reply(3, 3), 4, 6));
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parse(mapper, reply(5, 3), 4, 6));
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parse(mapper, reply(4, 3).replace("\"week\":2", "\"week\":1"), 4, 6));
    }

    @Test void rejectsOverBudgetAndFractionalHoursAndEmptyCriteria() {
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parse(mapper, reply(4, 7), 4, 6));
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parse(mapper, reply(4, 3).replace("\"estimatedHours\":3", "\"estimatedHours\":1.5"), 4, 6));
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parse(mapper, reply(4, 3).replace("Tests pass", " "), 4, 6));
    }

    @Test void rejectsTasksWithFewerThanTwoCheckpoints() {
        assertThrows(IllegalArgumentException.class,
                () -> CareerPlanParser.parse(mapper, reply(4, 3).replace("\"checkpoints\":[\"Read the docs\",\"Write the code\"]", "\"checkpoints\":[\"Read the docs\"]"), 4, 6));
    }

    @Test void rejectsUnsupportedGapStatus() {
        var tree = mapper.readTree(reply(4, 3));
        var root = (tools.jackson.databind.node.ObjectNode) tree;
        root.set("gaps", mapper.valueToTree(List.of(Map.of("skill", "Java", "status", "guessed", "reason", "No evidence"))));
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parse(mapper, mapper.writeValueAsString(root), 4, 6));
    }

    @Test void parsesLaterBatchesWithGlobalWeekNumbersAndRejectsMissingWeeks() {
        String later = reply(3, 4).replace("\"week\":1", "\"week\":13")
                .replace("\"week\":2", "\"week\":14").replace("\"week\":3", "\"week\":15");
        var batch = CareerPlanParser.parseRange(mapper, later, 13, 15, 6);
        assertEquals(13, batch.tasks().getFirst().week());
        assertEquals(15, batch.tasks().getLast().week());
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parseRange(mapper, later, 13, 16, 6));
        assertThrows(IllegalArgumentException.class, () -> CareerPlanParser.parseRange(mapper, reply(3, 4), 13, 15, 6));
    }
}
