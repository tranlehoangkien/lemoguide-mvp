package lemonadex.lemoguide.lemoguide_mvp.network;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;

/**
 * Mentoring on top of the "available to help" flag: a mentee sends a topic and a message, the mentor schedules a time
 * (which also opens their chat) or declines, either side may cancel, and the mentee rates the session once it happened.
 * Only COMPLETED sessions count towards a mentor's stats.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NetworkMentorService {
    /** Open (PENDING) requests one mentee may have at a time, across all mentors. */
    static final int MAX_PENDING = 3;
    private static final String OPEN = "('PENDING','ACCEPTED')";
    private final NetworkAccess access;

    /** Members who opted in as mentors; people whose topics or skills match the viewer's interests come first. */
    @Transactional(readOnly = true)
    public List<Map<String,Object>> mentors(String query) {
        long me = access.me();
        List<Object> args = new ArrayList<>(List.of(me, me, me));
        String filter = "n.account_id<>? AND n.available_to_help=TRUE AND " + PUBLIC + " AND " + UNBLOCKED;
        if (!clean(query).isEmpty()) {
            String like = "%" + clean(query).toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
            filter += " AND (LOWER(n.mentor_topics) LIKE ? ESCAPE '!' OR LOWER(n.topics) LIKE ? ESCAPE '!' OR LOWER(u.current_title) LIKE ? ESCAPE '!' OR LOWER(u.full_name) LIKE ? ESCAPE '!'"
                    + " OR EXISTS (SELECT 1 FROM network_shared_item si JOIN user_skill us ON us.id=si.item_id JOIN skill s ON s.id=us.skill_id WHERE si.account_id=n.account_id AND si.kind='SKILL' AND LOWER(s.name) LIKE ? ESCAPE '!'))";
            for (int i = 0; i < 5; i++) args.add(like);
        }
        var rows = access.db.queryForList(PERSON + "WHERE " + filter + " ORDER BY n.account_id DESC LIMIT 60", args.toArray());
        if (rows.isEmpty()) return rows;
        List<Long> ids = rows.stream().map(r -> number(r, "account_id")).toList();
        String marks = String.join(",", Collections.nCopies(ids.size(), "?"));
        Map<Long,List<String>> skills = new HashMap<>();
        access.db.queryForList("SELECT si.account_id,s.name FROM network_shared_item si JOIN user_skill us ON us.id=si.item_id JOIN skill s ON s.id=us.skill_id WHERE si.kind='SKILL' AND si.account_id IN (" + marks + ") ORDER BY s.name", ids.toArray())
                .forEach(r -> skills.computeIfAbsent(number(r, "account_id"), k -> new ArrayList<>()).add((String) r.get("name")));
        var stats = stats(ids);
        List<Object> openArgs = new ArrayList<>(List.of(me)); openArgs.addAll(ids);
        Map<Long,Map<String,Object>> open = new HashMap<>();
        access.db.queryForList("SELECT id,mentor_id,status FROM network_mentor_request WHERE mentee_id=? AND status IN " + OPEN + " AND mentor_id IN (" + marks + ")", openArgs.toArray())
                .forEach(r -> open.put(number(r, "mentor_id"), Map.of("id", r.get("id"), "status", r.get("status"))));
        Set<String> interests = terms(access.db.queryForList("SELECT topics FROM network_profile WHERE account_id=?", String.class, me).stream().findFirst().orElse(""));
        for (var row : rows) {
            long id = number(row, "account_id");
            var own = skills.getOrDefault(id, List.of());
            row.put("skills", own.stream().limit(8).toList());
            row.put("stats", stats.get(id));
            row.put("open_request", open.get(id));
            List<String> offered = new ArrayList<>(terms(Objects.toString(row.get("mentor_topics"), "")).stream().toList());
            offered.addAll(terms(Objects.toString(row.get("topics"), "")));
            own.forEach(s -> offered.add(s.toLowerCase(Locale.ROOT)));
            row.put("matched", offered.stream().filter(interests::contains).distinct().limit(3).toList());
        }
        rows.sort(Comparator.<Map<String,Object>>comparingInt(r -> -((List<?>) r.get("matched")).size())
                .thenComparingLong(r -> -number(stats.get(number(r, "account_id")), "sessions")));
        return rows.stream().limit(30).toList();
    }

    /** Completed sessions and average rating (null until rated) per mentor. */
    Map<Long,Map<String,Object>> stats(Collection<Long> mentors) {
        Map<Long,Map<String,Object>> result = new HashMap<>();
        for (long id : mentors) result.put(id, new LinkedHashMap<>(Map.of("sessions", 0L)));
        if (mentors.isEmpty()) return result;
        String marks = String.join(",", Collections.nCopies(mentors.size(), "?"));
        access.db.queryForList("SELECT mentor_id,COUNT(*) AS sessions,AVG(rating) AS rating FROM network_mentor_request WHERE status='COMPLETED' AND mentor_id IN (" + marks + ") GROUP BY mentor_id", mentors.toArray())
                .forEach(r -> {
                    var s = result.get(number(r, "mentor_id"));
                    s.put("sessions", number(r, "sessions"));
                    s.put("rating", r.get("rating") == null ? null : Math.round(((Number) r.get("rating")).doubleValue() * 10) / 10.0);
                });
        return result;
    }

    /** The viewer's sessions as mentor (incoming) and as mentee (outgoing): open ones first, newest first. */
    @Transactional(readOnly = true)
    public Map<String,Object> overview() {
        long me = access.me();
        var result = new LinkedHashMap<String,Object>();
        result.put("incoming", sessions(me, "mentor_id", "mentee_id"));
        result.put("outgoing", sessions(me, "mentee_id", "mentor_id"));
        result.put("stats", stats(List.of(me)).get(me));
        // Plain read: access.settings() lazily INSERTs the profile row, which MySQL rejects in a read-only transaction.
        result.put("available", access.db.queryForList("SELECT available_to_help FROM network_profile WHERE account_id=?", Boolean.class, me)
                .stream().findFirst().orElse(false));
        return result;
    }

    private List<Map<String,Object>> sessions(long me, String mine, String theirs) {
        var rows = access.db.queryForList("SELECT id," + theirs + " AS other_id,topic,message,status,scheduled_at,meeting_url,mentor_note,rating,feedback,created_at FROM network_mentor_request WHERE " + mine + "=?"
                + " ORDER BY CASE status WHEN 'PENDING' THEN 0 WHEN 'ACCEPTED' THEN 1 ELSE 2 END,id DESC LIMIT 50", me);
        List<Map<String,Object>> visible = new ArrayList<>();
        var now = LocalDateTime.now();
        for (var row : rows) {
            try { row.put("other", access.person(number(row, "other_id"), me)); } catch (RuntimeException hidden) { continue; }
            var at = toDateTime(row.get("scheduled_at"));
            row.put("scheduled_at", at == null ? null : at.atZone(ZoneId.systemDefault()).toInstant().toString());
            row.put("due", "ACCEPTED".equals(row.get("status")) && at != null && !at.isAfter(now));
            visible.add(row);
        }
        return visible;
    }

    public Map<String,Object> request(long mentor, MentorRequestInput input) {
        long me = access.me();
        access.pair(me, mentor);
        if (!bool(access.settings(mentor), "available_to_help")) throw bad("Người này hiện chưa nhận hỗ trợ.");
        // Serialize concurrent requests from the same mentee so the limits below hold.
        access.db.queryForList("SELECT account_id FROM network_profile WHERE account_id=? FOR UPDATE", me);
        if (access.count("SELECT COUNT(*) FROM network_mentor_request WHERE mentee_id=? AND mentor_id=? AND status IN " + OPEN, me, mentor) > 0)
            throw bad("Bạn đã có một yêu cầu hỗ trợ đang mở với người này.");
        if (access.count("SELECT COUNT(*) FROM network_mentor_request WHERE mentee_id=? AND status='PENDING'", me) >= MAX_PENDING)
            throw bad("Bạn đang có " + MAX_PENDING + " yêu cầu chờ phản hồi. Hãy đợi phản hồi hoặc hủy bớt trước khi gửi thêm.");
        access.throttle(5, "Bạn đã gửi 5 yêu cầu hỗ trợ hôm nay. Hãy thử lại vào ngày mai.",
                "SELECT COUNT(*) FROM network_mentor_request WHERE mentee_id=? AND created_at>TIMESTAMPADD(DAY,-1,CURRENT_TIMESTAMP)", me);
        long id = access.insert("INSERT INTO network_mentor_request(mentee_id,mentor_id,topic,message) VALUES (?,?,?,?)", me, mentor, input.topic().trim(), input.message().trim());
        access.notify(mentor, me, "MENTOR_REQUEST", id);
        return Map.of("id", id);
    }

    /** Mentor accepts a pending request with a time, or moves the time of an accepted one. Opens their chat. */
    public void schedule(long id, MentorSchedule input) {
        long me = access.me();
        var row = lock(id, "mentor_id", me, "Không có yêu cầu hỗ trợ cần hẹn lịch.");
        String status = (String) row.get("status");
        if (!Set.of("PENDING", "ACCEPTED").contains(status)) throw bad("Yêu cầu này đã kết thúc.");
        long mentee = number(row, "mentee_id");
        access.pair(me, mentee);
        var at = input.scheduledAt().atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        if (at.isBefore(LocalDateTime.now())) throw bad("Hãy chọn thời gian trong tương lai.");
        if (at.isAfter(LocalDateTime.now().plusDays(90))) throw bad("Chỉ hẹn lịch trong vòng 90 ngày tới.");
        requireUrl(input.meetingUrl());
        access.db.update("UPDATE network_mentor_request SET status='ACCEPTED',scheduled_at=?,meeting_url=?,mentor_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                at, safeUrl(input.meetingUrl()), clean(input.note()), id);
        long low = Math.min(me, mentee), high = Math.max(me, mentee);
        if (access.db.update("UPDATE network_thread SET status='ACCEPTED' WHERE low_id=? AND high_id=?", low, high) == 0)
            access.db.update("INSERT INTO network_thread(low_id,high_id,requester_id,status) VALUES (?,?,?,'ACCEPTED')", low, high, mentee);
        access.notify(mentee, me, status.equals("PENDING") ? "MENTOR_ACCEPTED" : "MENTOR_UPDATED", id);
    }

    public void decline(long id, String note) {
        long me = access.me();
        var row = lock(id, "mentor_id", me, "Không có yêu cầu hỗ trợ cần phản hồi.");
        if (!"PENDING".equals(row.get("status"))) throw bad("Chỉ từ chối được yêu cầu đang chờ.");
        access.db.update("UPDATE network_mentor_request SET status='DECLINED',mentor_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", clean(note), id);
        access.notify(number(row, "mentee_id"), me, "MENTOR_DECLINED", id);
    }

    /** Either side can call off an open request, even if the other has since hidden their profile. */
    public void cancel(long id) {
        long me = access.me();
        var rows = access.db.queryForList("SELECT * FROM network_mentor_request WHERE id=? AND (mentee_id=? OR mentor_id=?) FOR UPDATE", id, me, me);
        if (rows.isEmpty()) throw missing();
        var row = rows.getFirst();
        if (!Set.of("PENDING", "ACCEPTED").contains(row.get("status"))) throw bad("Yêu cầu này đã kết thúc.");
        access.db.update("UPDATE network_mentor_request SET status='CANCELLED',updated_at=CURRENT_TIMESTAMP WHERE id=?", id);
        long other = number(row, "mentee_id") == me ? number(row, "mentor_id") : number(row, "mentee_id");
        if (!access.blocked(me, other)) access.notify(other, me, "MENTOR_CANCELLED", id);
    }

    /** The mentee confirms the session happened and rates it (1-5); only possible once the scheduled time has passed. */
    public void complete(long id, MentorComplete input) {
        long me = access.me();
        var row = lock(id, "mentee_id", me, "Không có buổi hỗ trợ cần đánh giá.");
        if (!"ACCEPTED".equals(row.get("status"))) throw bad("Chỉ đánh giá được buổi hỗ trợ đã hẹn lịch.");
        var at = toDateTime(row.get("scheduled_at"));
        if (at == null || at.isAfter(LocalDateTime.now())) throw bad("Bạn có thể đánh giá sau thời gian đã hẹn.");
        access.db.update("UPDATE network_mentor_request SET status='COMPLETED',rating=?,feedback=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", input.rating(), clean(input.feedback()), id);
        long mentor = number(row, "mentor_id");
        if (!access.blocked(me, mentor)) access.notify(mentor, me, "MENTOR_COMPLETED", id);
    }

    private Map<String,Object> lock(long id, String role, long me, String message) {
        var rows = access.db.queryForList("SELECT * FROM network_mentor_request WHERE id=? AND " + role + "=? FOR UPDATE", id, me);
        if (rows.isEmpty()) throw bad(message);
        return rows.getFirst();
    }

    private static Set<String> terms(String csv) {
        Set<String> result = new LinkedHashSet<>();
        for (String part : Objects.toString(csv, "").split(",")) if (!part.isBlank()) result.add(part.trim().toLowerCase(Locale.ROOT));
        return result;
    }

    static LocalDateTime toDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDateTime dt) return dt;
        if (value instanceof java.sql.Timestamp ts) return ts.toLocalDateTime();
        if (value instanceof java.time.OffsetDateTime odt) return odt.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
        return LocalDateTime.parse(value.toString().replace(' ', 'T'));
    }
}
