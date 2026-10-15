package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;

/**
 * Study cohorts derived from roadmaps: one per catalog course in a roadmap (kind COURSE) and one per target role
 * (kind ROLE). Joining is opt-in and only allowed for a course or role in the caller's own roadmap; members see each
 * other's roadmap progress inside the cohort, which the join screen states up front.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NetworkCohortService {
    private final NetworkAccess access;
    private static final String MEMBERS_PUBLIC = " JOIN network_profile n ON n.account_id=cm.account_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE cm.cohort_id=? AND " + PUBLIC;

    /** Cohort key for a target role; wording and seniority variants share one key (see CareerRoleNormalizer). */
    static String roleKey(String role) {
        return CareerRoleNormalizer.normalize(role).key();
    }

    /** The caller's joinable cohorts (from their roadmap) and the cohorts they already belong to. */
    @Transactional(readOnly = true)
    public Map<String,Object> overview() {
        long me = access.me();
        List<Map<String,Object>> candidates = new ArrayList<>();
        for (var c : eligible(me)) candidates.add(candidate(c.get("kind").toString(), c.get("ref_key").toString(), c.get("title").toString(), me));
        var joined = access.db.queryForList("SELECT c.id,c.kind,c.ref_key,c.title,cm.last_read_id FROM network_cohort c JOIN network_cohort_member cm ON cm.cohort_id=c.id WHERE cm.account_id=? ORDER BY cm.joined_at", me);
        for (var row : joined) {
            long id = number(row, "id");
            row.put("members", access.count("SELECT COUNT(*) FROM network_cohort_member cm" + MEMBERS_PUBLIC, id));
            row.put("unread", access.count("SELECT COUNT(*) FROM network_cohort_message WHERE cohort_id=? AND id>? AND sender_id<>? AND hidden=FALSE", id, number(row, "last_read_id"), me));
            row.remove("last_read_id");
        }
        var result = new LinkedHashMap<String,Object>();
        result.put("hasPlan", access.count("SELECT COUNT(*) FROM career_plan WHERE account_id=?", me) > 0);
        result.put("candidates", candidates);
        result.put("joined", joined);
        return result;
    }

    /** Course cohorts in roadmap week order, then the role cohort. */
    private List<Map<String,Object>> eligible(long me) {
        List<Map<String,Object>> list = new ArrayList<>();
        var plans = access.db.queryForList("SELECT id,target_role FROM career_plan WHERE account_id=? ORDER BY id DESC LIMIT 1", me);
        if (plans.isEmpty()) return list;
        long plan = number(plans.getFirst(), "id");
        for (var c : access.db.queryForList("SELECT course_id,MAX(course_title) AS title,MIN(week_number) AS first_week FROM career_task WHERE plan_id=? AND course_id IS NOT NULL GROUP BY course_id ORDER BY first_week", plan)) {
            list.add(Map.of("kind", "COURSE", "ref_key", String.valueOf(number(c, "course_id")), "title", Objects.toString(c.get("title"), "Khóa học")));
        }
        var role = CareerRoleNormalizer.normalize((String) plans.getFirst().get("target_role"));
        if (!role.key().isEmpty()) list.add(Map.of("kind", "ROLE", "ref_key", role.key(), "title", role.title()));
        return list;
    }

    private Map<String,Object> candidate(String kind, String key, String title, long me) {
        var row = new LinkedHashMap<String,Object>();
        row.put("kind", kind); row.put("ref_key", key); row.put("title", title);
        var ids = access.db.queryForList("SELECT id FROM network_cohort WHERE kind=? AND ref_key=?", Long.class, kind, key);
        Long id = ids.isEmpty() ? null : ids.getFirst();
        row.put("id", id);
        row.put("members", id == null ? 0 : access.count("SELECT COUNT(*) FROM network_cohort_member cm" + MEMBERS_PUBLIC, id));
        row.put("joined", id != null && access.count("SELECT COUNT(*) FROM network_cohort_member WHERE cohort_id=? AND account_id=?", id, me) > 0);
        return row;
    }

    public Map<String,Object> join(String kind, String refKey) {
        long me = access.me(); access.member(me);
        var match = eligible(me).stream().filter(c -> c.get("kind").equals(kind) && c.get("ref_key").equals(refKey)).findFirst()
                .orElseThrow(() -> bad("Bạn chỉ tham gia được nhóm của khóa học hoặc vị trí trong lộ trình của mình."));
        access.db.update("INSERT IGNORE INTO network_cohort(kind,ref_key,title) VALUES (?,?,?)", kind, refKey, match.get("title"));
        long id = access.db.queryForObject("SELECT id FROM network_cohort WHERE kind=? AND ref_key=?", Long.class, kind, refKey);
        // Start "read" at the current tail so a new member does not see the whole backlog as unread.
        long tail = access.count("SELECT COALESCE(MAX(id),0) FROM network_cohort_message WHERE cohort_id=?", id);
        access.db.update("INSERT IGNORE INTO network_cohort_member(cohort_id,account_id,last_read_id) VALUES (?,?,?)", id, me, tail);
        return get(id, 0);
    }

    public void leave(long id) {
        access.db.update("DELETE FROM network_cohort_member WHERE cohort_id=? AND account_id=?", id, access.me());
    }

    Map<String,Object> requireMember(long id, long me) {
        var rows = access.db.queryForList("SELECT c.id,c.kind,c.ref_key,c.title FROM network_cohort c JOIN network_cohort_member cm ON cm.cohort_id=c.id WHERE c.id=? AND cm.account_id=?", id, me);
        if (rows.isEmpty()) throw missing();
        return rows.getFirst();
    }

    @Transactional(readOnly = true)
    public Map<String,Object> get(long id, long before) {
        long me = access.me();
        var cohort = requireMember(id, me);
        Long course = courseOf(cohort);
        var members = access.db.queryForList(PERSON + "JOIN network_cohort_member cm ON cm.account_id=n.account_id AND cm.cohort_id=? WHERE " + PUBLIC + " AND " + UNBLOCKED + " ORDER BY cm.joined_at LIMIT 200", id, me, me);
        var progress = access.progress(members.stream().map(m -> number(m, "account_id")).toList(), course);
        members.forEach(m -> { m.put("progress", progress.get(number(m, "account_id"))); m.put("mine", number(m, "account_id") == me); });
        var rows = access.db.queryForList("SELECT m.id,m.sender_id,m.kind,m.content,m.hidden,m.created_at,u.full_name,n.handle,u.avatar_url,u.current_title FROM network_cohort_message m JOIN network_profile n ON n.account_id=m.sender_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE m.cohort_id=? AND " + PUBLIC + " AND " + UNBLOCKED + " AND (?=0 OR m.id<?) ORDER BY m.id DESC LIMIT 51", id, me, me, before, before);
        var visible = rows.stream().limit(50).toList();
        visible.forEach(m -> { if (bool(m, "hidden")) m.put("content", "Tin nhắn đã được ẩn."); });
        var result = new LinkedHashMap<String,Object>();
        result.put("cohort", cohort); result.put("members", members); result.put("messages", visible);
        result.put("nextCursor", rows.size() > 50 ? number(visible.getLast(), "id") : null);
        result.put("mine", me);
        return result;
    }

    private static Long courseOf(Map<String,Object> cohort) {
        return "COURSE".equals(cohort.get("kind")) ? Long.valueOf(cohort.get("ref_key").toString()) : null;
    }

    public void send(long id, String content) {
        long me = access.me(); access.member(me); requireMember(id, me);
        access.throttle(60, "Bạn gửi quá nhiều tin nhắn trong nhóm. Hãy thử lại sau.", "SELECT COUNT(*) FROM network_cohort_message WHERE sender_id=? AND created_at>TIMESTAMPADD(HOUR,-1,CURRENT_TIMESTAMP)", me);
        long message = access.insert("INSERT INTO network_cohort_message(cohort_id,sender_id,kind,content) VALUES (?,?,'TEXT',?)", id, me, content.trim());
        markRead(id, me, message);
        signalMembers(id, me);
    }

    /** Posts the caller's roadmap progress (for a course cohort: progress in that course) plus an optional note. */
    public void checkin(long id, String note) {
        long me = access.me(); access.member(me);
        var cohort = requireMember(id, me);
        access.throttle(1, "Bạn đã điểm danh trong nhóm này hôm nay.", "SELECT COUNT(*) FROM network_cohort_message WHERE cohort_id=? AND sender_id=? AND kind='CHECKIN' AND created_at>TIMESTAMPADD(HOUR,-20,CURRENT_TIMESTAMP)", id, me);
        var p = access.progress(List.of(me), courseOf(cohort)).get(me);
        StringBuilder text = new StringBuilder();
        if (((Number) p.get("total")).intValue() == 0) text.append("Điểm danh tuần này.");
        else {
            text.append("Điểm danh: đã xong ").append(p.get("done")).append('/').append(p.get("total")).append(" tuần (").append(p.get("percent")).append("%).");
            if (p.get("next_week") != null) text.append(" Đang học tuần ").append(p.get("next_week")).append(" · ").append(p.get("next_title")).append('.');
            int streak = ((Number) p.get("streak")).intValue();
            if (streak > 1) text.append(" Chuỗi ").append(streak).append(" tuần liên tiếp.");
        }
        if (!clean(note).isEmpty()) text.append('\n').append(clean(note));
        long message = access.insert("INSERT INTO network_cohort_message(cohort_id,sender_id,kind,content) VALUES (?,?,'CHECKIN',?)", id, me, text.length() > 3000 ? text.substring(0, 3000) : text.toString());
        markRead(id, me, message);
        signalMembers(id, me);
    }

    public void read(long id, long lastId) {
        long me = access.me(); requireMember(id, me);
        markRead(id, me, lastId);
    }

    private void markRead(long id, long me, long lastId) {
        access.db.update("UPDATE network_cohort_member SET last_read_id=GREATEST(last_read_id,?) WHERE cohort_id=? AND account_id=?", lastId, id, me);
    }

    private void signalMembers(long id, long me) {
        access.signal(access.db.queryForList("SELECT account_id FROM network_cohort_member WHERE cohort_id=? AND account_id<>?", Long.class, id, me), "cohort", id);
    }
}
