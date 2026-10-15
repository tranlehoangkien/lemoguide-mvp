package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;

/** "Nhật ký hoạt động": filtered, paged reads of admin_activity_log (written by {@link AdminAccessInterceptor}). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminActivityService {
    private static final Pattern NUMBER = Pattern.compile("^\\d+$");
    private final JdbcTemplate db;

    /** Module key for a path: the owning permission, or the first segment after /api/admin. */
    static String moduleOf(String path) {
        return AdminPermission.forPath(path).map(Enum::name).orElseGet(() -> {
            String rest = path.startsWith("/api/admin/") ? path.substring("/api/admin/".length()) : path;
            String first = rest.split("/")[0];
            return first.isBlank() ? "OTHER" : first.toUpperCase(Locale.ROOT).replace('-', '_');
        });
    }

    /** First numeric path segment, e.g. /api/admin/users/42/skills/7 -> 42. */
    static Long targetOf(String path) {
        for (String part : path.split("/")) if (NUMBER.matcher(part).matches() && part.length() < 19) return Long.parseLong(part);
        return null;
    }

    public Map<String,Object> list(String query, String module, String method, String outcome, LocalDate from, LocalDate to, int page, int size) {
        List<Object> args = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        if (query != null && !query.isBlank()) {
            String like = "%" + query.trim().toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
            where.append(" AND (LOWER(l.actor_email) LIKE ? ESCAPE '!' OR LOWER(l.path) LIKE ? ESCAPE '!')");
            args.add(like); args.add(like);
        }
        if (module != null && !module.isBlank()) { where.append(" AND l.module=?"); args.add(module); }
        if (method != null && !method.isBlank()) {
            if (!Set.of("POST", "PUT", "PATCH", "DELETE").contains(method)) throw new AppException(ErrorCode.BAD_REQUEST, "Phương thức không hợp lệ.");
            where.append(" AND l.method=?"); args.add(method);
        }
        if ("success".equals(outcome)) where.append(" AND l.status<400");
        else if ("failed".equals(outcome)) where.append(" AND l.status>=400");
        if (from != null) { where.append(" AND l.created_at>=?"); args.add(from.atStartOfDay()); }
        if (to != null) { where.append(" AND l.created_at<?"); args.add(to.plusDays(1).atStartOfDay()); }
        int safeSize = Math.clamp(size, 1, 100), safePage = Math.max(page, 0);
        long total = db.queryForObject("SELECT COUNT(*) FROM admin_activity_log l" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(safeSize); pageArgs.add((long) safePage * safeSize);
        var content = db.queryForList("SELECT l.id,l.actor_id,l.actor_email,ai.full_name AS actor_name,l.method,l.path,l.module,l.target_id,l.status,l.duration_ms,l.ip,l.created_at"
                + " FROM admin_activity_log l LEFT JOIN admin_information ai ON ai.account_id=l.actor_id" + where + " ORDER BY l.id DESC LIMIT ? OFFSET ?", pageArgs.toArray());
        int pages = (int) Math.max(1, (total + safeSize - 1) / safeSize);
        var result = new LinkedHashMap<String,Object>();
        result.put("content", content); result.put("page", safePage); result.put("size", safeSize);
        result.put("totalElements", total); result.put("totalPages", pages);
        result.put("first", safePage == 0); result.put("last", safePage >= pages - 1);
        return result;
    }

    /** Distinct modules present in the log, for the filter dropdown. */
    public List<String> modules() {
        return db.queryForList("SELECT DISTINCT module FROM admin_activity_log ORDER BY module", String.class);
    }
}
