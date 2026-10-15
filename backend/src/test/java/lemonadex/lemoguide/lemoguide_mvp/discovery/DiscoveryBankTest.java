package lemonadex.lemoguide.lemoguide_mvp.discovery;

import static org.junit.jupiter.api.Assertions.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class DiscoveryBankTest {
    private final DiscoveryBank bank = new DiscoveryBank();
    private final DiscoveryService service = new DiscoveryService(null, bank, null, null);

    @Test void everyPathCompletesWithUniqueQuestionsAndBoundedScores() {
        for (var d : bank.all()) if (!d.questions().isEmpty()) for (int seed = 0; seed < 50; seed++) {
            var random = new Random(seed);
            var answers = new LinkedHashMap<String, Integer>();
            while (answers.size() < d.total()) {
                var q = bank.sequence(d.kind(), answers).stream().filter(x -> !answers.containsKey(x.id())).findFirst().orElseThrow();
                answers.put(q.id(), random.nextInt(q.options().size()));
            }
            var sequence = bank.sequence(d.kind(), answers);
            assertEquals(d.total(), sequence.size());
            assertEquals(d.total(), sequence.stream().map(DiscoveryBank.Question::id).distinct().count());
            var result = service.score(d.kind(), answers);
            assertEquals(d.dimensions().size(), result.scores().size());
            assertTrue(result.scores().stream().allMatch(s -> s.score() >= 0 && s.score() <= 100));
        }
    }
    @Test void skillFollowupsAdaptWithoutChangingComparableAnchorScores() {
        for (boolean correct : List.of(true, false)) {
            var answers = new LinkedHashMap<String, Integer>();
            bank.get("skills").questions().stream().filter(DiscoveryBank.Question::anchor)
                .forEach(q -> answers.put(q.id(), correct ? q.correct() : (q.correct() + 1) % 4));
            var sequence = bank.sequence("skills", answers);
            assertEquals(3, sequence.stream().filter(q -> !q.anchor()).count());
            assertTrue(sequence.stream().filter(q -> !q.anchor()).allMatch(q -> q.id().endsWith(correct ? "advanced" : "practice")));
            sequence.stream().filter(q -> !q.anchor()).forEach(q -> answers.put(q.id(), q.correct()));
            var before = service.score("skills", answers).scores();
            sequence.stream().filter(q -> !q.anchor()).forEach(q -> answers.put(q.id(), (q.correct() + 1) % 4));
            assertEquals(before, service.score("skills", answers).scores());
            assertTrue(before.stream().allMatch(s -> s.score() == (correct ? 100 : 0)));
        }
    }
    @Test void hollandSumsSectionsIntoTheSdsStyleProfile() {
        var d = bank.get("holland");
        assertEquals(156, d.total());
        assertEquals("holland-v1", d.version());
        // Consecutive items rotate through the six types so the scoring key is not obvious.
        assertEquals(List.of("R", "I", "A", "S", "E", "C"), d.questions().subList(0, 6).stream().map(DiscoveryBank.Question::dimension).toList());
        var answers = new LinkedHashMap<String, Integer>();
        // I and A like everything and rate themselves 7; S likes everything and rates 4; others dislike and rate 1.
        for (var q : d.questions()) {
            boolean self = q.section().equals("self");
            int option = switch (q.dimension()) {
                case "I", "A" -> self ? 6 : 0;
                case "S" -> self ? 3 : 0;
                default -> self ? 0 : 1;
            };
            answers.put(q.id(), option);
        }
        var result = service.score("holland", answers);
        var p = result.holland();
        assertEquals(38, p.types().stream().filter(t -> t.code().equals("I")).findFirst().orElseThrow().raw());
        assertEquals(32, p.types().stream().filter(t -> t.code().equals("S")).findFirst().orElseThrow().raw());
        assertEquals(2, p.types().stream().filter(t -> t.code().equals("R")).findFirst().orElseThrow().raw());
        assertEquals(List.of("IAS", "AIS"), p.alternatives());
        assertEquals("IAS", p.code());
        assertEquals(36, p.differentiation());
        assertEquals("Cao", p.consistencyLevel());
        assertTrue(result.summary().contains("IAS") && result.summary().contains("AIS"));
        assertFalse(p.careers().isEmpty());
        assertTrue(p.careers().getFirst().fit() >= p.careers().getLast().fit());
        assertTrue(p.careers().stream().anyMatch(c -> c.code().startsWith("I") || c.code().startsWith("A")));
        assertEquals(100, result.scores().stream().filter(s -> s.dimension().equals("I")).findFirst().orElseThrow().score());
    }
    @Test void hollandHelpersFollowTheHexagon() {
        assertEquals(1, HollandBank.hexDistance('R', 'C'));
        assertEquals(2, HollandBank.hexDistance('R', 'A'));
        assertEquals(3, HollandBank.hexDistance('I', 'E'));
        assertEquals(28, HollandBank.iachan("SEC", "SEC"));
        assertEquals(21, HollandBank.iachan("SEC", "ESC"));
        assertEquals(0, HollandBank.iachan("RIC", "SEA"));
        assertEquals(6, HollandBank.codes(HollandBank.TYPES.values().stream()
            .map(t -> new HollandBank.TypeScore(t.code(), t.name(), 10, 38, 0, 0, 0, 0)).toList()).size());
    }
    @Test void reflectionExploresUncertainDimensionsAndPreservesAllSix() {
        var answers = new LinkedHashMap<String, Integer>();
        bank.get("interests").questions().stream().filter(DiscoveryBank.Question::anchor)
            .forEach(q -> answers.put(q.id(), q.dimension().equals("S") || q.dimension().equals("E") ? 2 : 4));
        var extra = bank.sequence("interests", answers).stream().filter(q -> !q.anchor()).toList();
        assertEquals(Set.of("S", "E"), new HashSet<>(extra.stream().map(DiscoveryBank.Question::dimension).toList()));
        extra.forEach(q -> answers.put(q.id(), 2));
        var scores = service.score("interests", answers).scores();
        assertEquals(6, scores.size());
        assertEquals(50, scores.stream().filter(s -> s.dimension().equals("S")).findFirst().orElseThrow().score());
    }
}
