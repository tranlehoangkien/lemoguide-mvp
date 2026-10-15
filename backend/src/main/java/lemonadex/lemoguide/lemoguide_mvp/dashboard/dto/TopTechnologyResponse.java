package lemonadex.lemoguide.lemoguide_mvp.dashboard.dto;

/**
 * One row of the dashboard's "Top Technology" ranking: how many CVs belong to
 * an owner who lists this technology in an experience or project, and that
 * count's share of every CV in the system.
 */
public record TopTechnologyResponse(
        String name,
        String category,
        long cvCount,
        double percent
) {
}
