package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;

/**
 * "Thống kê & Báo cáo": technology and skill popularity from user profiles, the CV target-mode split and the most
 * viewed public CVs. Counts only use data of accounts that are not deleted.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReportService {
    static final int MAX_LIMIT = 50;
    private static final Set<String> TARGET_MODES = Set.of("frontend", "backend", "fullstack");
    private static final String LIVE_USER = " JOIN user_information u ON u.id=%s AND u.deleted_at IS NULL JOIN account a ON a.id=u.account_id AND a.deleted_at IS NULL ";
    private final JdbcTemplate db;

    /** Technologies ranked by how many people list them in an experience or a project. */
    public Map<String,Object> technologies(String category, int limit) {
        List<Object> args = new ArrayList<>();
        String filter = "";
        if (category != null && !category.isBlank()) { filter = " WHERE t.category=?"; args.add(category); }
        args.add(Math.clamp(limit, 1, MAX_LIMIT));
        String uses = "SELECT et.technology_id,'E' AS src,e.user_information_id AS owner FROM experience_technology et JOIN experience e ON e.id=et.experience_id" + LIVE_USER.formatted("e.user_information_id")
                + " UNION ALL SELECT pt.technology_id,'P',p.user_information_id FROM project_technology pt JOIN project p ON p.id=pt.project_id" + LIVE_USER.formatted("p.user_information_id");
        var rows = db.queryForList("SELECT t.id,t.name,t.category,COUNT(DISTINCT x.owner) AS users,SUM(CASE WHEN x.src='E' THEN 1 ELSE 0 END) AS experiences,"
                + "SUM(CASE WHEN x.src='P' THEN 1 ELSE 0 END) AS projects FROM technology t JOIN (" + uses + ") x ON x.technology_id=t.id" + filter
                + " GROUP BY t.id,t.name,t.category ORDER BY users DESC,experiences+projects DESC,t.name LIMIT ?", args.toArray());
        var result = new LinkedHashMap<String,Object>();
        result.put("items", rows);
        result.put("people", db.queryForObject("SELECT COUNT(DISTINCT owner) FROM (" + uses + ") x", Long.class));
        result.put("usedTechnologies", db.queryForObject("SELECT COUNT(DISTINCT technology_id) FROM (" + uses + ") x", Long.class));
        result.put("categories", db.queryForList("SELECT DISTINCT category FROM technology WHERE category IS NOT NULL AND category<>'' ORDER BY category", String.class));
        return result;
    }

    /** Skills ranked by how many people declared them, with the average self-rated level (0-100) where given. */
    public Map<String,Object> skills(String type, int limit) {
        List<Object> args = new ArrayList<>();
        String filter = "";
        if (type != null && !type.isBlank()) {
            if (!Set.of("hard", "soft", "language").contains(type)) throw new AppException(ErrorCode.BAD_REQUEST, "Loại kỹ năng không hợp lệ.");
            filter = " WHERE s.type=?"; args.add(type);
        }
        args.add(Math.clamp(limit, 1, MAX_LIMIT));
        String from = " FROM user_skill us JOIN skill s ON s.id=us.skill_id" + LIVE_USER.formatted("us.user_information_id");
        var rows = db.queryForList("SELECT s.id,s.name,s.type,COUNT(DISTINCT us.user_information_id) AS users,ROUND(AVG(us.proficiency_level)) AS avg_level"
                + from + filter + " GROUP BY s.id,s.name,s.type ORDER BY users DESC,s.name LIMIT ?", args.toArray());
        Map<String,Long> byType = new LinkedHashMap<>(Map.of("hard", 0L, "soft", 0L, "language", 0L));
        db.queryForList("SELECT s.type,COUNT(*) AS c" + from + " GROUP BY s.type").forEach(r -> byType.put(String.valueOf(r.get("type")), ((Number) r.get("c")).longValue()));
        var result = new LinkedHashMap<String,Object>();
        result.put("items", rows);
        result.put("byType", byType);
        result.put("people", db.queryForObject("SELECT COUNT(DISTINCT us.user_information_id)" + from, Long.class));
        return result;
    }

    /** CVs per target mode (with public count and views) and the split for each of the last 6 months. */
    public Map<String,Object> targetModes() {
        Map<String,Map<String,Object>> modes = new LinkedHashMap<>();
        for (String m : List.of("frontend", "backend", "fullstack")) modes.put(m, new LinkedHashMap<>(Map.of("mode", m, "total", 0L, "publicCount", 0L, "views", 0L, "owners", 0L)));
        db.queryForList("SELECT c.target_mode,COUNT(*) AS total,SUM(CASE WHEN c.publish_mode='public_link' AND c.is_active=TRUE THEN 1 ELSE 0 END) AS public_count,"
                + "COALESCE(SUM(c.view_count),0) AS views,COUNT(DISTINCT c.user_information_id) AS owners FROM cv_profile c" + LIVE_USER.formatted("c.user_information_id") + "GROUP BY c.target_mode")
                .forEach(r -> {
                    var m = modes.get(String.valueOf(r.get("target_mode")).toLowerCase(Locale.ROOT));
                    if (m == null) return;
                    m.put("total", ((Number) r.get("total")).longValue());
                    m.put("publicCount", ((Number) r.get("public_count")).longValue());
                    m.put("views", ((Number) r.get("views")).longValue());
                    m.put("owners", ((Number) r.get("owners")).longValue());
                });
        LocalDate firstMonth = LocalDate.now().withDayOfMonth(1).minusMonths(5);
        Map<String,Map<String,Long>> months = new LinkedHashMap<>();
        DateTimeFormatter ym = DateTimeFormatter.ofPattern("yyyy-MM");
        for (int i = 0; i < 6; i++) months.put(firstMonth.plusMonths(i).format(ym), new LinkedHashMap<>(Map.of("frontend", 0L, "backend", 0L, "fullstack", 0L)));
        db.queryForList("SELECT YEAR(c.created_at) AS y,MONTH(c.created_at) AS m,c.target_mode,COUNT(*) AS n FROM cv_profile c" + LIVE_USER.formatted("c.user_information_id")
                + "WHERE c.created_at>=? GROUP BY YEAR(c.created_at),MONTH(c.created_at),c.target_mode", firstMonth.atStartOfDay())
                .forEach(r -> {
                    String key = "%04d-%02d".formatted(((Number) r.get("y")).intValue(), ((Number) r.get("m")).intValue());
                    var bucket = months.get(key);
                    if (bucket != null) bucket.put(String.valueOf(r.get("target_mode")).toLowerCase(Locale.ROOT), ((Number) r.get("n")).longValue());
                });
        List<Map<String,Object>> monthly = new ArrayList<>();
        months.forEach((k, v) -> { var row = new LinkedHashMap<String,Object>(v); row.put("month", k); monthly.add(row); });
        return Map.of("modes", new ArrayList<>(modes.values()), "monthly", monthly);
    }

    /** Active public-link CVs ranked by view count. */
    public Map<String,Object> publicCvs(String query, String targetMode, int page, int size) {
        List<Object> args = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE c.publish_mode='public_link' AND c.is_active=TRUE");
        if (targetMode != null && !targetMode.isBlank()) {
            String mode = targetMode.toLowerCase(Locale.ROOT);
            if (!TARGET_MODES.contains(mode)) throw new AppException(ErrorCode.BAD_REQUEST, "Target mode không hợp lệ.");
            where.append(" AND c.target_mode=?"); args.add(mode);
        }
        if (query != null && !query.isBlank()) {
            String like = "%" + query.trim().toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
            where.append(" AND (LOWER(c.name) LIKE ? ESCAPE '!' OR LOWER(u.full_name) LIKE ? ESCAPE '!' OR LOWER(a.email) LIKE ? ESCAPE '!')");
            args.add(like); args.add(like); args.add(like);
        }
        String from = " FROM cv_profile c" + LIVE_USER.formatted("c.user_information_id") + "LEFT JOIN cv_template t ON t.id=c.template_id" + where;
        int safeSize = Math.clamp(size, 1, MAX_LIMIT), safePage = Math.max(page, 0);
        long total = db.queryForObject("SELECT COUNT(*)" + from, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(safeSize); pageArgs.add((long) safePage * safeSize);
        var content = db.queryForList("SELECT c.id,c.name,c.target_mode,c.view_count,c.public_slug,c.share_expires_at,c.share_password_hash IS NOT NULL AS password_protected,"
                + "c.created_at,c.updated_at,u.full_name AS owner_name,a.email AS owner_email,t.name AS template_name" + from + " ORDER BY c.view_count DESC,c.id DESC LIMIT ? OFFSET ?", pageArgs.toArray());
        int pages = (int) Math.max(1, (total + safeSize - 1) / safeSize);
        var result = new LinkedHashMap<String,Object>();
        result.put("content", content); result.put("page", safePage); result.put("size", safeSize);
        result.put("totalElements", total); result.put("totalPages", pages);
        result.put("first", safePage == 0); result.put("last", safePage >= pages - 1);
        result.put("totalViews", db.queryForObject("SELECT COALESCE(SUM(c.view_count),0)" + from, Long.class, args.toArray()));
        return result;
    }
}
