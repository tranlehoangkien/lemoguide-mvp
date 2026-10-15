package lemonadex.lemoguide.lemoguide_mvp.network;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;

/**
 * Admin console for LemoNetwork: activity overview, members (suspend/restore), posts and comments (hide/restore),
 * cohorts and mentoring sessions. Admins only restore content they hid themselves ({@code hidden_by_admin}); a post
 * or comment its author deleted stays deleted.
 */
@Service
@RequiredArgsConstructor
@Transactional
@PreAuthorize("hasRole('ADMIN')")
public class NetworkAdminService {
    static final int MAX_SIZE = 50;
    private static final String MEMBER_FROM = " FROM network_profile n JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE a.deleted_at IS NULL AND u.deleted_at IS NULL";
    private static final String POST_FROM = " FROM network_post p JOIN user_information u ON u.account_id=p.author_id LEFT JOIN network_profile n ON n.account_id=p.author_id WHERE 1=1";
    private final NetworkAccess access;

    @Transactional(readOnly = true)
    public Map<String,Object> overview() {
        var r = new LinkedHashMap<String,Object>();
        r.put("members", access.count("SELECT COUNT(*)" + MEMBER_FROM + " AND n.published=TRUE AND n.suspended=FALSE"));
        r.put("suspended", access.count("SELECT COUNT(*) FROM network_profile WHERE suspended=TRUE"));
        r.put("mentors", access.count("SELECT COUNT(*)" + MEMBER_FROM + " AND n.published=TRUE AND n.suspended=FALSE AND n.available_to_help=TRUE"));
        r.put("posts", access.count("SELECT COUNT(*) FROM network_post WHERE hidden=FALSE"));
        r.put("posts_week", access.count("SELECT COUNT(*) FROM network_post WHERE hidden=FALSE AND created_at>TIMESTAMPADD(DAY,-7,CURRENT_TIMESTAMP)"));
        r.put("comments_week", access.count("SELECT COUNT(*) FROM network_comment WHERE hidden=FALSE AND created_at>TIMESTAMPADD(DAY,-7,CURRENT_TIMESTAMP)"));
        r.put("unanswered", access.count("SELECT COUNT(*) FROM network_post p WHERE p.kind='QUESTION' AND p.hidden=FALSE AND NOT EXISTS (SELECT 1 FROM network_comment c WHERE c.post_id=p.id AND c.hidden=FALSE)"));
        r.put("connections", access.count("SELECT COUNT(*) FROM network_connection WHERE status='ACCEPTED'"));
        r.put("messages_week", access.count("SELECT COUNT(*) FROM network_message WHERE created_at>TIMESTAMPADD(DAY,-7,CURRENT_TIMESTAMP)"));
        r.put("open_reports", access.count("SELECT COUNT(*) FROM network_report WHERE status='OPEN'"));
        r.put("cohorts", access.count("SELECT COUNT(*) FROM network_cohort"));
        r.put("cohort_members", access.count("SELECT COUNT(*) FROM network_cohort_member"));
        r.put("buddies", access.count("SELECT COUNT(*) FROM network_buddy WHERE status='ACCEPTED'"));
        r.put("mentoring_pending", access.count("SELECT COUNT(*) FROM network_mentor_request WHERE status='PENDING'"));
        r.put("mentoring_scheduled", access.count("SELECT COUNT(*) FROM network_mentor_request WHERE status='ACCEPTED'"));
        r.put("mentoring_completed", access.count("SELECT COUNT(*) FROM network_mentor_request WHERE status='COMPLETED'"));
        Object rating = access.db.queryForObject("SELECT AVG(rating) FROM network_mentor_request WHERE status='COMPLETED'", Object.class);
        r.put("mentoring_rating", rating == null ? null : Math.round(((Number) rating).doubleValue() * 10) / 10.0);
        r.put("challenges_open", access.count("SELECT COUNT(*) FROM network_challenge WHERE starts_on<=CURRENT_DATE AND ends_on>=CURRENT_DATE"));
        r.put("challenge_entries", access.count("SELECT COUNT(*) FROM network_challenge_entry WHERE hidden=FALSE"));
        r.put("activity", activity(14));
        return r;
    }

    /** Posts and comments per day for the last `days` days, oldest first, zero-filled. */
    private List<Map<String,Object>> activity(int days) {
        Map<String,long[]> byDay = new LinkedHashMap<>();
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        for (int i = days - 1; i >= 0; i--) byDay.put(today.minusDays(i).toString(), new long[2]);
        String[] tables = {"network_post", "network_comment"};
        for (int t = 0; t < 2; t++) {
            int slot = t;
            access.db.queryForList("SELECT CAST(created_at AS DATE) AS d,COUNT(*) AS c FROM " + tables[t] + " WHERE created_at>=? GROUP BY CAST(created_at AS DATE)", today.minusDays(days - 1L))
                    .forEach(row -> { var bucket = byDay.get(row.get("d").toString().substring(0, 10)); if (bucket != null) bucket[slot] = number(row, "c"); });
        }
        List<Map<String,Object>> list = new ArrayList<>();
        byDay.forEach((day, c) -> list.add(Map.of("day", day, "posts", c[0], "comments", c[1])));
        return list;
    }

    @Transactional(readOnly = true)
    public Map<String,Object> members(String query, String status, int page, int size) {
        List<Object> args = new ArrayList<>();
        String where = switch (status) {
            case "published" -> " AND n.published=TRUE AND n.suspended=FALSE";
            case "private" -> " AND n.published=FALSE AND n.suspended=FALSE";
            case "suspended" -> " AND n.suspended=TRUE";
            case "mentor" -> " AND n.available_to_help=TRUE AND n.published=TRUE";
            case "all" -> "";
            default -> throw bad("Bộ lọc không hợp lệ.");
        };
        where += like(query, args, "u.full_name", "n.handle", "a.email", "u.current_title");
        String select = "SELECT n.account_id,n.handle,n.published,n.suspended,n.available_to_help,u.full_name,u.avatar_url,u.current_title,a.email,a.status AS account_status,"
                + "(SELECT COUNT(*) FROM network_post p WHERE p.author_id=n.account_id AND p.hidden=FALSE) AS posts,"
                + "(SELECT COUNT(*) FROM network_connection c WHERE (c.low_id=n.account_id OR c.high_id=n.account_id) AND c.status='ACCEPTED') AS connections,"
                + "(SELECT COUNT(*) FROM network_report r WHERE r.kind='PROFILE' AND r.target_id=n.account_id AND r.status='OPEN') AS open_reports";
        return page(select + MEMBER_FROM + where + " ORDER BY n.account_id DESC", "SELECT COUNT(*)" + MEMBER_FROM + where, args, page, size);
    }

    @Transactional(readOnly = true)
    public Map<String,Object> member(long id) {
        var rows = access.db.queryForList("SELECT n.*,u.full_name,u.avatar_url,u.current_title,a.email,a.status AS account_status,a.created_at AS joined_at" + MEMBER_FROM + " AND n.account_id=?", id);
        if (rows.isEmpty()) throw missing();
        var m = rows.getFirst();
        m.put("stats", Map.of(
                "posts", access.count("SELECT COUNT(*) FROM network_post WHERE author_id=? AND hidden=FALSE", id),
                "comments", access.count("SELECT COUNT(*) FROM network_comment WHERE author_id=? AND hidden=FALSE", id),
                "connections", access.count("SELECT COUNT(*) FROM network_connection WHERE (low_id=? OR high_id=?) AND status='ACCEPTED'", id, id),
                "followers", access.count("SELECT COUNT(*) FROM network_follow WHERE following_id=?", id),
                "mentor_sessions", access.count("SELECT COUNT(*) FROM network_mentor_request WHERE mentor_id=? AND status='COMPLETED'", id),
                "hidden_content", access.count("SELECT COUNT(*) FROM network_post WHERE author_id=? AND hidden_by_admin=TRUE", id)
                        + access.count("SELECT COUNT(*) FROM network_comment WHERE author_id=? AND hidden_by_admin=TRUE", id),
                "blocked_by", access.count("SELECT COUNT(*) FROM network_block WHERE blocked_id=?", id)));
        // Reports about the member or anything they wrote, newest first.
        m.put("reports", access.db.queryForList("SELECT r.id,r.kind,r.target_id,r.reason,r.status,r.created_at FROM network_report r WHERE (r.kind='PROFILE' AND r.target_id=?)"
                + " OR (r.kind='POST' AND r.target_id IN (SELECT id FROM network_post WHERE author_id=?))"
                + " OR (r.kind='COMMENT' AND r.target_id IN (SELECT id FROM network_comment WHERE author_id=?))"
                + " OR (r.kind='MESSAGE' AND r.target_id IN (SELECT id FROM network_message WHERE sender_id=?))"
                + " ORDER BY r.id DESC LIMIT 20", id, id, id, id));
        m.put("recent_posts", access.db.queryForList("SELECT id,kind,content,hidden,hidden_by_admin,created_at FROM network_post WHERE author_id=? ORDER BY id DESC LIMIT 5", id));
        return m;
    }

    /** Suspends or restores a community profile; suspended members cannot interact and are hidden everywhere. */
    public void suspend(long id, boolean suspended) {
        if (access.db.update("UPDATE network_profile SET suspended=? WHERE account_id=?", suspended, id) == 0) throw missing();
        if (suspended) closeReports("PROFILE", id);
    }

    @Transactional(readOnly = true)
    public Map<String,Object> posts(String query, String kind, String status, int page, int size) {
        List<Object> args = new ArrayList<>();
        String where = switch (status) {
            case "visible" -> " AND p.hidden=FALSE";
            case "hidden" -> " AND p.hidden_by_admin=TRUE";
            case "deleted" -> " AND p.hidden=TRUE AND p.hidden_by_admin=FALSE";
            case "reported" -> " AND EXISTS (SELECT 1 FROM network_report r WHERE r.kind='POST' AND r.target_id=p.id AND r.status='OPEN')";
            case "all" -> "";
            default -> throw bad("Bộ lọc không hợp lệ.");
        };
        if (!clean(kind).isEmpty()) {
            if (!Set.of("KNOWLEDGE", "QUESTION", "PROJECT", "FEEDBACK", "MILESTONE").contains(kind)) throw bad("Loại bài viết không hợp lệ.");
            where += " AND p.kind=?"; args.add(kind);
        }
        where += like(query, args, "p.content", "p.tags", "u.full_name", "n.handle");
        String select = "SELECT p.id,p.kind,p.content,p.tags,p.hidden,p.hidden_by_admin,p.created_at,p.edited_at,p.author_id,u.full_name,u.avatar_url,n.handle,"
                + "(SELECT COUNT(*) FROM network_reaction x WHERE x.post_id=p.id AND x.kind='LIKE') AS likes,"
                + "(SELECT COUNT(*) FROM network_comment c WHERE c.post_id=p.id AND c.hidden=FALSE) AS comments,"
                + "(SELECT COUNT(*) FROM network_report r WHERE r.kind='POST' AND r.target_id=p.id AND r.status='OPEN') AS open_reports";
        return page(select + POST_FROM + where + " ORDER BY p.id DESC", "SELECT COUNT(*)" + POST_FROM + where, args, page, size);
    }

    /** One post with every comment, including hidden and deleted ones, for moderation. */
    @Transactional(readOnly = true)
    public Map<String,Object> post(long id) {
        var rows = access.db.queryForList("SELECT p.*,u.full_name,u.avatar_url,n.handle" + POST_FROM + " AND p.id=?", id);
        if (rows.isEmpty()) throw missing();
        var post = rows.getFirst();
        post.put("comments", access.db.queryForList("SELECT c.id,c.parent_id,c.author_id,c.content,c.accepted,c.helpful,c.hidden,c.hidden_by_admin,c.created_at,c.edited_at,u.full_name,n.handle,"
                + "(SELECT COUNT(*) FROM network_report r WHERE r.kind='COMMENT' AND r.target_id=c.id AND r.status='OPEN') AS open_reports"
                + " FROM network_comment c JOIN user_information u ON u.account_id=c.author_id LEFT JOIN network_profile n ON n.account_id=c.author_id WHERE c.post_id=? ORDER BY c.id LIMIT 500", id));
        return post;
    }

    public void hidePost(long id, boolean hidden) { moderate("network_post", "POST", id, hidden, ""); }
    public void hideComment(long id, boolean hidden) { moderate("network_comment", "COMMENT", id, hidden, ",accepted=FALSE"); }

    private void moderate(String table, String kind, long id, boolean hidden, String extra) {
        var rows = access.db.queryForList("SELECT hidden,hidden_by_admin FROM " + table + " WHERE id=? FOR UPDATE", id);
        if (rows.isEmpty()) throw missing();
        var row = rows.getFirst();
        if (bool(row, "hidden") && !bool(row, "hidden_by_admin")) throw bad("Nội dung đã được tác giả xóa, không thể ẩn hoặc khôi phục.");
        if (hidden) {
            access.db.update("UPDATE " + table + " SET hidden=TRUE,hidden_by_admin=TRUE" + extra + " WHERE id=?", id);
            closeReports(kind, id);
        } else {
            if (!bool(row, "hidden_by_admin")) throw bad("Nội dung đang hiển thị.");
            access.db.update("UPDATE " + table + " SET hidden=FALSE,hidden_by_admin=FALSE WHERE id=?", id);
        }
    }

    /** Hiding something directly settles its open reports with the same outcome. */
    private void closeReports(String kind, long target) {
        access.db.update("UPDATE network_report SET status='HIDE',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE kind=? AND target_id=? AND status='OPEN'",
                SecurityUtils.currentAccountId(), kind, target);
    }

    @Transactional(readOnly = true)
    public Map<String,Object> cohorts(String query, String kind, int page, int size) {
        List<Object> args = new ArrayList<>();
        String where = "";
        if (!clean(kind).isEmpty()) {
            if (!Set.of("COURSE", "ROLE").contains(kind)) throw bad("Loại nhóm không hợp lệ.");
            where += " AND c.kind=?"; args.add(kind);
        }
        where += like(query, args, "c.title");
        String from = " FROM network_cohort c WHERE 1=1" + where;
        String select = "SELECT c.id,c.kind,c.ref_key,c.title,c.created_at,"
                + "(SELECT COUNT(*) FROM network_cohort_member m WHERE m.cohort_id=c.id) AS members,"
                + "(SELECT COUNT(*) FROM network_cohort_message m WHERE m.cohort_id=c.id AND m.hidden=FALSE) AS messages,"
                + "(SELECT COUNT(*) FROM network_cohort_message m WHERE m.cohort_id=c.id AND m.kind='CHECKIN' AND m.created_at>TIMESTAMPADD(DAY,-7,CURRENT_TIMESTAMP)) AS checkins_week,"
                + "(SELECT MAX(m.created_at) FROM network_cohort_message m WHERE m.cohort_id=c.id) AS last_activity";
        return page(select + from + " ORDER BY members DESC,c.id DESC", "SELECT COUNT(*)" + from, args, page, size);
    }

    /** Removes a cohort with its chat; members can join again from their roadmap if it is still relevant. */
    public void deleteCohort(long id) {
        if (access.db.update("DELETE FROM network_cohort WHERE id=?", id) == 0) throw missing();
    }

    @Transactional(readOnly = true)
    public Map<String,Object> mentoring(String query, String status, int page, int size) {
        List<Object> args = new ArrayList<>();
        String where = "";
        if (!clean(status).isEmpty()) {
            if (!Set.of("PENDING", "ACCEPTED", "COMPLETED", "DECLINED", "CANCELLED").contains(status)) throw bad("Trạng thái không hợp lệ.");
            where += " AND r.status=?"; args.add(status);
        }
        where += like(query, args, "r.topic", "me.full_name", "mo.full_name");
        String from = " FROM network_mentor_request r JOIN user_information me ON me.account_id=r.mentee_id JOIN user_information mo ON mo.account_id=r.mentor_id WHERE 1=1" + where;
        String select = "SELECT r.id,r.topic,r.message,r.status,r.scheduled_at,r.rating,r.feedback,r.mentor_note,r.created_at,r.mentee_id,r.mentor_id,me.full_name AS mentee_name,mo.full_name AS mentor_name";
        var result = page(select + from + " ORDER BY r.id DESC", "SELECT COUNT(*)" + from, args, page, size);
        @SuppressWarnings("unchecked") var content = (List<Map<String,Object>>) result.get("content");
        for (var row : content) {
            var at = NetworkMentorService.toDateTime(row.get("scheduled_at"));
            row.put("scheduled_at", at == null ? null : at.atZone(ZoneId.systemDefault()).toInstant().toString());
        }
        return result;
    }

    /** " AND (a LIKE ? OR b LIKE ?)" for a non-blank query, case-insensitive; adds the arguments. */
    private static String like(String query, List<Object> args, String... columns) {
        if (clean(query).isEmpty()) return "";
        String value = "%" + clean(query).toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
        List<String> parts = new ArrayList<>();
        for (String column : columns) { parts.add("LOWER(" + column + ") LIKE ? ESCAPE '!'"); args.add(value); }
        return " AND (" + String.join(" OR ", parts) + ")";
    }

    /** Same shape as common PageResponse (content, page, size, totalElements, totalPages, first, last). */
    private Map<String,Object> page(String select, String count, List<Object> args, int page, int size) {
        int safeSize = Math.clamp(size, 1, MAX_SIZE), safePage = Math.max(page, 0);
        long total = access.count(count, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(safeSize); pageArgs.add((long) safePage * safeSize);
        var content = access.db.queryForList(select + " LIMIT ? OFFSET ?", pageArgs.toArray());
        int pages = (int) Math.max(1, (total + safeSize - 1) / safeSize);
        var result = new LinkedHashMap<String,Object>();
        result.put("content", content); result.put("page", safePage); result.put("size", safeSize);
        result.put("totalElements", total); result.put("totalPages", pages);
        result.put("first", safePage == 0); result.put("last", safePage >= pages - 1);
        return result;
    }
}
