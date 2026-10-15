package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cheap guard against invented figures: lists the numbers in a piece of AI-written text that appear
 * nowhere in the source material it was allowed to use. The model is told never to make numbers up;
 * this is the check that catches it when it does anyway, so the UI can warn the user.
 */
public final class NumberGuard {

    private static final Pattern NUMBER = Pattern.compile("\\d+(?:[.,]\\d+)?\\s?%?");

    private NumberGuard() {
    }

    /** Numbers in {@code written} that do not occur in any of {@code sources} (compared as digits plus optional %). */
    public static List<String> unverified(String written, String... sources) {
        if (written == null || written.isBlank()) {
            return List.of();
        }
        String haystack = String.join("\n", sources).toLowerCase(Locale.ROOT);
        Set<String> found = new LinkedHashSet<>();
        Matcher matcher = NUMBER.matcher(written);
        while (matcher.find()) {
            String token = matcher.group().replace(" ", "").toLowerCase(Locale.ROOT);
            String digitsOnly = token.endsWith("%") ? token.substring(0, token.length() - 1) : token;
            if (!containsNumber(haystack, digitsOnly)) {
                found.add(token);
            }
        }
        return new ArrayList<>(found);
    }

    /** True when {@code digits} occurs as a whole number, so "3" is not "found" inside "2023". */
    private static boolean containsNumber(String haystack, String digits) {
        return Pattern.compile("(?<![\\d.,])" + Pattern.quote(digits) + "(?![\\d])").matcher(haystack).find();
    }
}
