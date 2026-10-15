package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import java.net.URI;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Component;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.*;
import lombok.RequiredArgsConstructor;

/** Shared access rules: every social surface applies opt-in publication and bidirectional blocks. */
@Component
@RequiredArgsConstructor
public class NetworkAccess {
    final JdbcTemplate db;
    /** Optional so the plain `new NetworkAccess(db)` used by the H2 tests keeps working without streams. */
    private NetworkEvents events;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    void setEvents(NetworkEvents events) { this.events = events; }
    static final java.util.regex.Pattern MENTION = java.util.regex.Pattern.compile("(?<![\\w@])@([a-z0-9][a-z0-9_-]{2,39})(?![\\w-])");
    static final String PERSON = "SELECT n.account_id, n.handle, n.bio, n.topics, n.available_to_help, n.allow_compare, n.mentor_topics, "
            + "u.full_name, u.avatar_url, u.current_title, CASE WHEN n.show_goals THEN u.short_term_goal ELSE NULL END AS goal "
            + "FROM network_profile n JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id ";
    static final String PUBLIC = "n.published=TRUE AND n.suspended=FALSE AND a.status='active' AND a.deleted_at IS NULL AND u.deleted_at IS NULL";
    static final String UNBLOCKED = "NOT EXISTS (SELECT 1 FROM network_block b WHERE (b.blocker_id=? AND b.blocked_id=n.account_id) OR (b.blocked_id=? AND b.blocker_id=n.account_id))";

    long me() {
        long id = SecurityUtils.currentAccountId();
        if (count("SELECT COUNT(*) FROM account a JOIN user_information u ON u.account_id=a.id WHERE a.id=? AND a.status='active' AND a.deleted_at IS NULL AND u.deleted_at IS NULL", id) == 0)
            throw denied("Tài khoản không thể sử dụng cộng đồng.");
        return id;
    }

    Map<String,Object> settings(long id) {
        db.update("INSERT IGNORE INTO network_profile(account_id,handle) VALUES (?,?)", id, "member-" + id);
        return db.queryForMap("SELECT * FROM network_profile WHERE account_id=?", id);
    }

    void member(long id) {
        Map<String,Object> s = settings(id);
        if (!bool(s,"published") || bool(s,"suspended")) throw denied("Hãy bật hồ sơ cộng đồng trước khi tương tác. Hồ sơ bị tạm ẩn không thể tương tác.");
    }

    Map<String,Object> person(long id, long viewer) {
        var people = db.queryForList(PERSON + "WHERE " + PUBLIC + " AND n.account_id=? AND " + UNBLOCKED, id, viewer, viewer);
        if (people.isEmpty()) throw missing();
        return people.getFirst();
    }

    void pair(long me, long other) {
        if (me == other) throw bad("Thao tác cần một người dùng khác.");
        person(other, me);
        member(me);
    }

    boolean blocked(long a, long b) {
        return count("SELECT COUNT(*) FROM network_block WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)", a,b,b,a) > 0;
    }

    boolean connected(long a, long b) {
        return count("SELECT COUNT(*) FROM network_connection WHERE low_id=? AND high_id=? AND status='ACCEPTED'", Math.min(a,b),Math.max(a,b)) > 0;
    }

    List<Map<String,Object>> items(long owner, boolean publicOnly) {
        // Explicit allowlist: no contact, date of birth, private CV, address or private notes.
        List<Map<String,Object>> result = new ArrayList<>();
        String[] kinds = {"SKILL", "PROJECT", "EXPERIENCE", "CERTIFICATE"};
        String[] sources = {
            "SELECT x.id, s.name AS title, CONCAT('Tự khai báo', CASE WHEN x.proficiency_level IS NULL THEN '' ELSE CONCAT(' · ', x.proficiency_level, '/100') END) AS description, NULL AS url, 'SELF_REPORTED' AS evidence FROM user_skill x JOIN skill s ON s.id=x.skill_id ",
            "SELECT x.id, x.name AS title, x.description, x.demo_url AS url, CASE WHEN x.demo_url IS NOT NULL OR x.github_url IS NOT NULL THEN 'LINKED_ARTIFACT' ELSE 'SELF_REPORTED' END AS evidence, x.github_url FROM project x ",
            "SELECT x.id, x.job_title AS title, x.description, NULL AS url, 'SELF_REPORTED' AS evidence, x.company_name FROM experience x ",
            "SELECT x.id, x.name AS title, x.description, x.credential_url AS url, CASE WHEN x.credential_url IS NULL THEN 'SELF_REPORTED' ELSE 'LINKED_ARTIFACT' END AS evidence, x.issued_by FROM certificate x "
        };
        for (int i=0;i<kinds.length;i++) {
            String visibility = publicOnly ? " AND EXISTS (SELECT 1 FROM network_shared_item si WHERE si.account_id=? AND si.kind=? AND si.item_id=x.id)" : "";
            Object[] args = publicOnly ? new Object[]{owner,owner,kinds[i]} : new Object[]{owner};
            var rows = db.queryForList(sources[i] + "JOIN user_information u ON u.id=x.user_information_id WHERE u.account_id=?" + visibility + " ORDER BY x.id DESC LIMIT 100", args);
            for (var row: rows) {
                row.put("kind", kinds[i]); row.put("url", safeUrl((String)row.get("url")));
                if (row.containsKey("github_url")) row.put("github_url",safeUrl((String)row.get("github_url")));
                row.put("evidence",row.get("url")!=null || row.get("github_url")!=null ? "LINKED_ARTIFACT" : "SELF_REPORTED");
                if(kinds[i].equals("PROJECT") || kinds[i].equals("EXPERIENCE")) {
                    String source=kinds[i].equals("PROJECT")?"project":"experience";
                    row.put("technologies",db.queryForList("SELECT t.name FROM technology t JOIN "+source+"_technology x ON x.technology_id=t.id WHERE x."+source+"_id=? ORDER BY t.name",String.class,row.get("id")));
                }
            }
            result.addAll(rows);
        }
        return result;
    }

    Map<String,Object> publicProfile(long owner, long viewer) {
        var profile = person(owner, viewer);
        profile.put("items", items(owner,true));
        return profile;
    }

    Map<String,Object> post(long id, long viewer) {
        var rows = db.queryForList("SELECT p.* FROM network_post p JOIN network_profile n ON n.account_id=p.author_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE p.id=? AND p.hidden=FALSE AND " + PUBLIC + " AND " + UNBLOCKED, id,viewer,viewer);
        if (rows.isEmpty()) throw missing();
        return rows.getFirst();
    }

    void notify(long recipient, long actor, String kind, long ref) {
        if (recipient == actor) return;
        db.update("INSERT INTO network_notification(recipient_id,actor_id,kind,ref_id) VALUES (?,?,?,?)",recipient,actor,kind,ref);
        signal(recipient,"notification",ref);
    }

    /** Pushes a "refetch" hint to open streams after commit; no-op when streaming is not wired (tests). */
    void signal(long recipient, String type, Object ref) { if (events != null) events.publish(recipient,type,ref); }
    void signal(Collection<Long> recipients, String type, Object ref) { if (events != null && !recipients.isEmpty()) events.publish(recipients,type,ref); }

    /**
     * Roadmap progress for each account: done/total weeks (limited to one course when `courseId` is set), percent,
     * the next unfinished week, and the streak of consecutive ISO weeks with at least one completed week.
     * Only called for people who opted into a cohort or an accepted buddy pair.
     */
    Map<Long,Map<String,Object>> progress(Collection<Long> accounts, Long courseId) {
        Map<Long,Map<String,Object>> result = new HashMap<>();
        if (accounts.isEmpty()) return result;
        String marks = String.join(",", Collections.nCopies(accounts.size(), "?"));
        List<Object> args = new ArrayList<>(accounts);
        String course = courseId == null ? "" : " AND t.course_id=?";
        if (courseId != null) args.add(courseId);
        var rows = db.queryForList("SELECT p.account_id,t.week_number,t.title,t.completed,t.completed_at FROM career_task t JOIN career_plan p ON p.id=t.plan_id WHERE p.account_id IN (" + marks + ")" + course + " ORDER BY t.week_number", args.toArray());
        Map<Long,List<Map<String,Object>>> byAccount = new HashMap<>();
        rows.forEach(r -> byAccount.computeIfAbsent(number(r,"account_id"), k -> new ArrayList<>()).add(r));
        for (long id : accounts) {
            var tasks = byAccount.getOrDefault(id, List.of());
            long done = tasks.stream().filter(t -> bool(t,"completed")).count();
            var next = tasks.stream().filter(t -> !bool(t,"completed")).findFirst().orElse(null);
            Set<Long> weeks = new HashSet<>();
            tasks.stream().filter(t -> bool(t,"completed") && t.get("completed_at") != null).forEach(t -> weeks.add(weekKey(toDate(t.get("completed_at")))));
            var p = new LinkedHashMap<String,Object>();
            p.put("done", done); p.put("total", tasks.size());
            p.put("percent", tasks.isEmpty() ? 0 : Math.round(done * 100.0 / tasks.size()));
            p.put("next_week", next == null ? null : next.get("week_number"));
            p.put("next_title", next == null ? null : next.get("title"));
            p.put("streak", streak(weeks, java.time.LocalDate.now()));
            result.put(id, p);
        }
        return result;
    }

    /** Consecutive ISO weeks with activity, counting back from this week (or last week if this one is still empty). */
    static int streak(Set<Long> weeks, java.time.LocalDate today) {
        var cursor = today;
        if (!weeks.contains(weekKey(cursor))) cursor = cursor.minusWeeks(1);
        int count = 0;
        while (weeks.contains(weekKey(cursor))) { count++; cursor = cursor.minusWeeks(1); }
        return count;
    }

    static long weekKey(java.time.LocalDate d) {
        return d.get(java.time.temporal.IsoFields.WEEK_BASED_YEAR) * 100L + d.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR);
    }

    private static java.time.LocalDate toDate(Object value) {
        if (value instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toLocalDate();
        if (value instanceof java.time.LocalDateTime dt) return dt.toLocalDate();
        if (value instanceof java.sql.Date d) return d.toLocalDate();
        return java.time.LocalDate.parse(value.toString().substring(0, 10));
    }

    static Set<String> handles(String text) {
        // Case-sensitive on purpose: handles are lowercase, so "@ParameterizedTest" in a code snippet is not a mention.
        var matcher = MENTION.matcher(text == null ? "" : text);
        Set<String> handles = new LinkedHashSet<>();
        while (matcher.find() && handles.size() < 5) handles.add(matcher.group(1));
        return handles;
    }

    /** Images are either an http(s) URL or a file this module stored under /uploads/network/. */
    static String imageUrl(String s) {
        if (s == null || s.isBlank()) return null;
        if (s.trim().matches("/uploads/network/[0-9a-f-]{36}\\.(jpg|png|webp)")) return s.trim();
        requireUrl(s);
        return safeUrl(s);
    }

    /** Rejects the action when `sql` (a COUNT over the caller's recent rows) already reached `limit`. */
    void throttle(long limit, String message, String sql, Object... args) {
        if (count(sql,args) >= limit) throw new AppException(ErrorCode.RATE_LIMITED, message);
    }

    /** Notifies up to five published, unblocked members mentioned as @handle in `text` (never the author). */
    void mentions(String text, String previous, long author, long postId) {
        Set<String> handles = handles(text);
        handles.removeAll(handles(previous));
        for (String handle : handles) {
            var ids = db.queryForList("SELECT n.account_id FROM network_profile n JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE n.handle=? AND " + PUBLIC + " AND " + UNBLOCKED, Long.class, handle, author, author);
            if (!ids.isEmpty() && ids.getFirst() != author) notify(ids.getFirst(), author, "MENTION", postId);
        }
    }

    /**
     * A CV may be shown inside LemoNetwork only while its owner keeps it publicly shareable: active, publish mode
     * "public_link", no share password and not expired. Alias {@code c} = cv_profile.
     */
    static final String SHAREABLE_CV = "c.is_active=TRUE AND c.publish_mode='public_link' AND c.share_password_hash IS NULL AND (c.share_expires_at IS NULL OR c.share_expires_at>CURRENT_TIMESTAMP)"
            // Admin switch "cv.public_link_enabled" (V50) turns every shared CV off at once.
            + " AND NOT EXISTS (SELECT 1 FROM system_setting ss WHERE ss.setting_key='cv.public_link_enabled' AND ss.setting_value='false')";

    /** Name/target/updated date of `owner`'s CV if it is currently shareable, otherwise null (revoked or never allowed). */
    Map<String,Object> cvCard(long cvId, long owner) {
        var rows = db.queryForList("SELECT c.id,c.name,c.target_mode,c.updated_at FROM cv_profile c JOIN user_information u ON u.id=c.user_information_id WHERE c.id=? AND u.account_id=? AND " + SHAREABLE_CV, cvId, owner);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    long insert(String sql, Object... args) {
        var keys = new GeneratedKeyHolder();
        db.update(connection -> {
            var statement = connection.prepareStatement(sql, new String[]{"id"});
            for (int i=0;i<args.length;i++) statement.setObject(i+1,args[i]);
            return statement;
        }, keys);
        return Objects.requireNonNull(keys.getKey()).longValue();
    }

    long count(String sql,Object... args) { return Objects.requireNonNull(db.queryForObject(sql,Long.class,args)); }
    static long number(Map<String,Object> row,String key) { return ((Number)row.get(key)).longValue(); }
    static boolean bool(Map<String,Object> row,String key) { Object v=row.get(key); return Boolean.TRUE.equals(v) || v instanceof Number n && n.intValue()!=0; }
    static String clean(String s) { return s==null ? "" : s.trim(); }
    static String safeUrl(String s) {
        if (s==null || s.isBlank()) return null;
        try { URI uri=URI.create(s.trim()); return Set.of("http","https").contains(Objects.toString(uri.getScheme(),"").toLowerCase(Locale.ROOT)) && uri.getHost()!=null && uri.getUserInfo()==null ? uri.toString() : null; }
        catch (IllegalArgumentException ex) { return null; }
    }
    static void requireUrl(String s) { if (s!=null && !s.isBlank() && safeUrl(s)==null) throw bad("Liên kết phải là URL http hoặc https hợp lệ."); }
    static AppException missing() { return new AppException(ErrorCode.RESOURCE_NOT_FOUND,"Nội dung không tồn tại hoặc không còn được chia sẻ."); }
    static AppException denied(String text) { return new AppException(ErrorCode.ACCESS_DENIED,text); }
    static AppException bad(String text) { return new AppException(ErrorCode.BAD_REQUEST,text); }
}
