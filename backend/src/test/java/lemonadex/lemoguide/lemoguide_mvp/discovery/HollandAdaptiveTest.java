package lemonadex.lemoguide.lemoguide_mvp.discovery;

import static org.junit.jupiter.api.Assertions.*;
import java.util.*;
import org.junit.jupiter.api.Test;

/** The adaptive engine against simulated respondents whose true interests are known. */
class HollandAdaptiveTest {

    /** Answers every question from a fixed preference per type, the way a consistent person would. */
    private static List<HollandAdaptive.Turn> simulate(Map<String, Double> pref) {
        var turns = new ArrayList<HollandAdaptive.Turn>();
        while (!HollandAdaptive.done(turns)) {
            var plan = HollandAdaptive.next(turns);
            int n = turns.size() + 1, answer;
            HollandAdaptive.Turn t;
            if (plan.source().equals("choice")) {
                double a = pref.get(plan.types().get(0)), b = pref.get(plan.types().get(1));
                answer = a >= 0.6 && b >= 0.6 && Math.abs(a - b) < 0.1 ? 2 : a < 0.35 && b < 0.35 ? 3 : a >= b ? 0 : 1;
                var options = new ArrayList<>(List.of("a", "b")); options.addAll(HollandAdaptive.CHOICE_TAIL);
                t = new HollandAdaptive.Turn(n, "choice", null, plan.types(), null, "?", options, null, null, null, false);
            } else {
                var q = plan.item();
                double p = pref.get(q.dimension());
                answer = q.section().equals("self") ? (int) Math.round(p * 6) : p >= 0.5 ? 0 : 1;
                t = new HollandAdaptive.Turn(n, "bank", q.id(), List.of(q.dimension()), null, q.prompt(), q.options(), null, null, null, false);
            }
            turns.add(t.answered(answer, null));
            assertTrue(turns.size() <= HollandAdaptive.MAX_TURNS);
        }
        return turns;
    }

    @Test void clearProfileIsFoundWellBeforeTheFullInventory() {
        var turns = simulate(Map.of("R", 0.1, "I", 0.9, "A", 0.75, "S", 0.65, "E", 0.3, "C", 0.2));
        var profile = HollandBank.profile(HollandAdaptive.scores(turns));
        assertEquals(Set.of('I', 'A', 'S'), new HashSet<>(profile.code().chars().mapToObj(c -> (char) c).toList()));
        assertEquals('I', profile.code().charAt(0));
        assertTrue(turns.size() >= HollandAdaptive.MIN_TURNS && turns.size() < HollandAdaptive.MAX_TURNS, "stopped after " + turns.size());
        assertEquals("Cao", HollandAdaptive.confidence(turns));
        // No inventory item is asked twice.
        var items = turns.stream().map(HollandAdaptive.Turn::itemId).filter(Objects::nonNull).toList();
        assertEquals(items.size(), new HashSet<>(items).size());
    }

    @Test void otherCodesAreRecoveredToo() {
        for (var pref : List.of(
                Map.of("R", 0.85, "I", 0.2, "A", 0.1, "S", 0.25, "E", 0.7, "C", 0.9),
                Map.of("R", 0.2, "I", 0.3, "A", 0.15, "S", 0.9, "E", 0.8, "C", 0.65))) {
            var turns = simulate(pref);
            String code = HollandBank.profile(HollandAdaptive.scores(turns)).code();
            var expected = pref.entrySet().stream().sorted(Map.Entry.<String, Double>comparingByValue().reversed()).limit(3).map(Map.Entry::getKey).toList();
            assertEquals(new HashSet<>(expected), new HashSet<>(code.chars().mapToObj(c -> String.valueOf((char) c)).toList()), "code " + code);
        }
    }

    @Test void flatProfileRunsToTheMaximumWithLowConfidence() {
        // Likes everything equally: "both" on every scenario, "yes" on every item.
        var turns = simulate(Map.of("R", 0.7, "I", 0.7, "A", 0.7, "S", 0.7, "E", 0.7, "C", 0.7));
        assertEquals(HollandAdaptive.MAX_TURNS, turns.size());
        assertNotEquals("Cao", HollandAdaptive.confidence(turns));
    }

    @Test void opensWithOppositePairsAndScoresChoicesPerType() {
        var turns = new ArrayList<HollandAdaptive.Turn>();
        assertEquals(List.of("R", "S"), HollandAdaptive.next(turns).types());
        var options = List.of("a", "b", HollandAdaptive.CHOICE_TAIL.get(0), HollandAdaptive.CHOICE_TAIL.get(1));
        var both = new HollandAdaptive.Turn(1, "choice", null, List.of("R", "S"), null, "?", options, 2, null, null, false);
        assertEquals(Map.of("R", 1.0, "S", 1.0), HollandAdaptive.evidence(both));
        var none = new HollandAdaptive.Turn(1, "choice", null, List.of("R", "S"), null, "?", options, 3, null, null, false);
        assertEquals(Map.of("R", 0.0, "S", 0.0), HollandAdaptive.evidence(none));
        turns.add(both);
        assertEquals(List.of("I", "E"), HollandAdaptive.next(turns).types());
    }
}
