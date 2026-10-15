package lemonadex.lemoguide.lemoguide_mvp.discovery;

import java.util.*;

/**
 * Adaptive Holland test: the scoring, the choice of what to ask next and the stopping rule live here, in code;
 * the model only phrases feedback and the scenario questions. Every answer is evidence in [0, 1] for one or two
 * types; a type's estimate is the smoothed mean of its evidence. The test asks about the types whose rank is
 * least certain (mostly the 3rd/4th boundary that decides the code) and stops once that boundary is clear.
 */
public final class HollandAdaptive {
    public static final String KIND = "holland-ai";
    public static final String VERSION = "holland-ai-v1";
    public static final int MIN_TURNS = 12, MAX_TURNS = 30;
    /** Standardized gap between the 3rd and 4th type needed to stop before the maximum. */
    static final double CLEAR_GAP = 1.3;
    static final List<String> CHOICE_TAIL = List.of("Cả hai đều hấp dẫn", "Không cái nào hợp với tôi");
    /** Opening sweep: hexagon-opposite pairs cover all six types in three questions and separate them best. */
    private static final String[][] SWEEP = {{"R", "S"}, {"I", "E"}, {"A", "C"}};

    /**
     * One question and, once answered, the answer. {@code source} is "choice" (model-written scenario between two
     * types, options in {@code types} order followed by {@link #CHOICE_TAIL}) or "bank" (a Holland inventory item).
     */
    public record Turn(int n, String source, String itemId, List<String> types, String bridge, String prompt,
                       List<String> options, Integer answer, String note, String feedback, boolean fallback) {
        Turn answered(int option, String note) { return new Turn(n, source, itemId, types, bridge, prompt, options, option, note, feedback, fallback); }
        Turn withFeedback(String text) { return new Turn(n, source, itemId, types, bridge, prompt, options, answer, note, text, fallback); }
    }
    public record State(String greeting, List<Turn> turns, String narrative, List<String> highlights, boolean aiUnavailable) {
        static State empty() { return new State(null, List.of(), null, List.of(), false); }
        List<Turn> answered() { return turns.stream().filter(t -> t.answer() != null).toList(); }
        Optional<Turn> current() { return turns.isEmpty() || turns.getLast().answer() != null ? Optional.empty() : Optional.of(turns.getLast()); }
    }
    /** What to ask next: a scenario between two types, or a given inventory item. */
    public record Plan(String source, List<String> types, DiscoveryBank.Question item) {}
    record Estimate(String code, double value, double se, int count) {}

    /** Evidence per type contributed by one answered turn. */
    static Map<String, Double> evidence(Turn t) {
        var out = new LinkedHashMap<String, Double>();
        if (t.answer() == null) return out;
        if (t.source().equals("choice")) {
            int a = t.answer();
            out.put(t.types().get(0), a == 0 || a == 2 ? 1.0 : 0.0);
            out.put(t.types().get(1), a == 1 || a == 2 ? 1.0 : 0.0);
        } else {
            boolean self = t.itemId().startsWith("self-");
            out.put(t.types().getFirst(), self ? t.answer() / 6.0 : t.answer() == 0 ? 1.0 : 0.0);
        }
        return out;
    }

    /** Estimates in hexagon order: mean of the evidence with one pseudo-observation at 0.5. */
    static List<Estimate> estimates(List<Turn> turns) {
        var sum = new HashMap<String, Double>(); var count = new HashMap<String, Integer>();
        for (var t : turns) evidence(t).forEach((k, v) -> { sum.merge(k, v, Double::sum); count.merge(k, 1, Integer::sum); });
        var out = new ArrayList<Estimate>();
        for (char c : HollandBank.ORDER.toCharArray()) {
            String k = String.valueOf(c);
            int n = count.getOrDefault(k, 0);
            double e = (sum.getOrDefault(k, 0.0) + 0.5) / (n + 1);
            out.add(new Estimate(k, e, Math.sqrt(Math.max(e * (1 - e), 0.04) / (n + 1)), n));
        }
        return out;
    }
    static List<Estimate> ranked(List<Turn> turns) {
        var list = new ArrayList<>(estimates(turns));
        list.sort(Comparator.comparingDouble(Estimate::value).reversed());
        return list;
    }
    static double gap(Estimate a, Estimate b) { return (a.value() - b.value()) / Math.sqrt(a.se() * a.se() + b.se() * b.se()); }
    /** How clearly the three letters of the code are separated from the rest. */
    static double boundary(List<Turn> turns) { var r = ranked(turns); return gap(r.get(2), r.get(3)); }

    static boolean done(List<Turn> answered) {
        if (answered.size() >= MAX_TURNS) return true;
        if (answered.size() < MIN_TURNS) return false;
        return estimates(answered).stream().allMatch(e -> e.count() >= 2) && boundary(answered) >= CLEAR_GAP;
    }
    static String confidence(List<Turn> answered) {
        double g = boundary(answered);
        return g >= CLEAR_GAP ? "Cao" : g >= 0.5 ? "Trung bình" : "Thấp";
    }
    /** 0–100 for the progress bar: the larger of questions used and how settled the code is. */
    static int progress(List<Turn> answered) {
        double byCount = answered.size() / (double) MAX_TURNS;
        double settled = Math.min(1, answered.size() / (double) MIN_TURNS) * Math.min(1, Math.max(0, boundary(answered)) / CLEAR_GAP);
        return (int) Math.round(100 * Math.min(0.97, Math.max(byCount, settled * 0.95)));
    }

    static Plan next(List<Turn> answered) {
        int n = answered.size();
        if (n < SWEEP.length) return new Plan("choice", List.of(SWEEP[n]), null);
        var est = estimates(answered);
        // Every type needs two observations before its rank means anything.
        var thin = est.stream().filter(e -> e.count() < 2).min(Comparator.comparingInt(Estimate::count));
        if (thin.isPresent() && n % 2 == 1) return bank(answered, thin.get().code());
        var r = ranked(answered);
        // The adjacent pair in the ranking whose order is least certain; the 3rd/4th boundary decides the code.
        int[][] pairs = {{2, 3}, {1, 2}, {0, 1}};
        String lastPair = answered.stream().filter(t -> t.source().equals("choice")).reduce((a, b) -> b)
            .map(t -> String.join("", t.types())).orElse("");
        int[] best = null; double bestGap = Double.MAX_VALUE;
        for (int[] p : pairs) {
            double g = Math.abs(gap(r.get(p[0]), r.get(p[1]))) * (p[0] == 2 ? 0.8 : 1.0);
            String key = r.get(p[0]).code() + r.get(p[1]).code(), rev = r.get(p[1]).code() + r.get(p[0]).code();
            if (n % 2 == 0 && (key.equals(lastPair) || rev.equals(lastPair))) continue;
            if (g < bestGap) { bestGap = g; best = p; }
        }
        if (best == null) best = pairs[0];
        var a = r.get(best[0]); var b = r.get(best[1]);
        if (n % 2 == 0) return new Plan("choice", List.of(a.code(), b.code()), null);
        return bank(answered, a.se() >= b.se() ? a.code() : b.code());
    }

    /** An unused inventory item for the type, rotating activities → competencies → occupations → self-estimate. */
    static Plan bank(List<Turn> answered, String type) {
        var used = new HashSet<String>();
        answered.forEach(t -> { if (t.itemId() != null) used.add(t.itemId()); });
        long asked = answered.stream().filter(t -> t.source().equals("bank") && t.types().getFirst().equals(type)).count();
        var sections = HollandBank.SECTIONS.stream().map(HollandBank.Section::id).toList();
        var items = HollandBank.questions().stream().filter(q -> q.dimension().equals(type) && !used.contains(q.id())).toList();
        for (int i = 0; i < sections.size(); i++) {
            String section = sections.get((int) ((asked + i) % sections.size()));
            var pick = items.stream().filter(q -> q.section().equals(section)).findFirst();
            if (pick.isPresent()) return new Plan("bank", List.of(type), pick.get());
        }
        // All of this type's items are used (cannot happen within 30 turns); fall back to a scenario.
        return new Plan("choice", List.of(type, ranked(answered).stream().map(Estimate::code).filter(c -> !c.equals(type)).findFirst().orElseThrow()), null);
    }

    /** Type scores on a 0–100 scale for the shared Holland reading; the section parts do not apply here. */
    static List<HollandBank.TypeScore> scores(List<Turn> answered) {
        return estimates(answered).stream().map(e -> new HollandBank.TypeScore(e.code(), HollandBank.TYPES.get(e.code()).name(),
            (int) Math.round(e.value() * 100), 100, 0, 0, 0, 0)).toList();
    }
    private HollandAdaptive() {}
}
