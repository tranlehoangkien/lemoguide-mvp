package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;

/**
 * Accountability buddy: one accepted partner per person. Partners see each other's roadmap progress and streak and
 * can send one nudge a day. Suggestions come from the caller's cohorts, closest progress first.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NetworkBuddyService {
    private final NetworkAccess access;

    @Transactional(readOnly = true)
    public Map<String,Object> overview() {
        long me = access.me();
        var result = new LinkedHashMap<String,Object>();
        var progress = access.progress(List.of(me), null);
        result.put("me", progress.get(me));
        var rows = access.db.queryForList("SELECT CASE WHEN low_id=? THEN high_id ELSE low_id END AS other_id,requester_id,status FROM network_buddy WHERE low_id=? OR high_id=?", me, me, me);
        Map<String,Object> current = null;
        List<Map<String,Object>> incoming = new ArrayList<>(), outgoing = new ArrayList<>();
        for (var r : rows) {
            long other = number(r, "other_id");
            Map<String,Object> person;
            try { person = access.person(other, me); } catch (RuntimeException hidden) { continue; }
            if ("ACCEPTED".equals(r.get("status"))) {
                person.put("progress", access.progress(List.of(other), null).get(other));
                person.put("nudged_today", access.count("SELECT COUNT(*) FROM network_notification WHERE actor_id=? AND recipient_id=? AND kind='NUDGE' AND created_at>TIMESTAMPADD(HOUR,-20,CURRENT_TIMESTAMP)", me, other) > 0);
                current = person;
            } else if (number(r, "requester_id") == me) outgoing.add(person);
            else incoming.add(person);
        }
        result.put("buddy", current);
        result.put("incoming", incoming);
        result.put("outgoing", outgoing);
        var suggested = current == null ? suggestions(me, rows) : List.<Map<String,Object>>of();
        for (var p : incoming) p.put("shared_cohort", sharedCohort(me, number(p, "account_id")));
        for (var p : suggested) p.put("shared_cohort", sharedCohort(me, number(p, "account_id")));
        result.put("suggestions", suggested);
        return result;
    }

    /** Title of one cohort both people belong to, so the UI can say why someone is suggested ("Cùng nhóm …"). */
    private String sharedCohort(long me, long other) {
        var titles = access.db.queryForList("SELECT c.title FROM network_cohort c JOIN network_cohort_member a ON a.cohort_id=c.id AND a.account_id=? JOIN network_cohort_member b ON b.cohort_id=c.id AND b.account_id=? ORDER BY c.kind,c.id LIMIT 1", String.class, me, other);
        return titles.isEmpty() ? null : titles.getFirst();
    }

    /** Fellow cohort members without a buddy and without a pending request with me, closest roadmap progress first. */
    private List<Map<String,Object>> suggestions(long me, List<Map<String,Object>> relations) {
        Set<Long> related = new HashSet<>();
        relations.forEach(r -> related.add(number(r, "other_id")));
        var people = access.db.queryForList(PERSON + "WHERE n.account_id<>? AND " + PUBLIC + " AND " + UNBLOCKED
                + " AND EXISTS (SELECT 1 FROM network_cohort_member mine JOIN network_cohort_member theirs ON theirs.cohort_id=mine.cohort_id WHERE mine.account_id=? AND theirs.account_id=n.account_id)"
                + " AND NOT EXISTS (SELECT 1 FROM network_buddy b WHERE (b.low_id=n.account_id OR b.high_id=n.account_id) AND b.status='ACCEPTED') ORDER BY n.account_id DESC LIMIT 50", me, me, me, me);
        people.removeIf(p -> related.contains(number(p, "account_id")));
        List<Long> ids = new ArrayList<>(people.stream().map(p -> number(p, "account_id")).toList());
        ids.add(me);
        var progress = access.progress(ids, null);
        long mine = ((Number) progress.get(me).get("percent")).longValue();
        people.forEach(p -> p.put("progress", progress.get(number(p, "account_id"))));
        people.sort(Comparator.comparingLong(p -> Math.abs(((Number) ((Map<?,?>) p.get("progress")).get("percent")).longValue() - mine)));
        return people.stream().limit(5).toList();
    }

    public void act(long other, String action) {
        long me = access.me();
        if (me == other) throw bad("Thao tác cần một người dùng khác.");
        long low = Math.min(me, other), high = Math.max(me, other);
        if (action.equals("remove")) {
            // Always allowed, even if the other side has since hidden their profile.
            access.db.update("DELETE FROM network_buddy WHERE low_id=? AND high_id=?", low, high);
            return;
        }
        access.pair(me, other);
        access.db.queryForList("SELECT account_id FROM network_profile WHERE account_id IN (?,?) ORDER BY account_id FOR UPDATE", low, high);
        if (action.equals("request")) {
            requireFree(me, "Bạn đã có bạn đồng hành. Hãy kết thúc trước khi mời người khác.");
            requireFree(other, "Người này đã có bạn đồng hành.");
            access.throttle(10, "Bạn đã gửi nhiều lời mời đồng hành hôm nay. Hãy thử lại vào ngày mai.", "SELECT COUNT(*) FROM network_buddy WHERE requester_id=? AND created_at>TIMESTAMPADD(DAY,-1,CURRENT_TIMESTAMP)", me);
            if (access.db.update("INSERT IGNORE INTO network_buddy(low_id,high_id,requester_id,status) VALUES (?,?,?,'PENDING')", low, high, me) > 0)
                access.notify(other, me, "BUDDY_REQUEST", me);
        } else if (action.equals("accept")) {
            requireFree(me, "Bạn đã có bạn đồng hành.");
            requireFree(other, "Người này đã có bạn đồng hành.");
            if (access.db.update("UPDATE network_buddy SET status='ACCEPTED' WHERE low_id=? AND high_id=? AND requester_id=? AND status='PENDING'", low, high, other) == 0)
                throw bad("Không có lời mời đồng hành cần chấp nhận.");
            // A pair is exclusive: drop both people's other pending invitations.
            access.db.update("DELETE FROM network_buddy WHERE status='PENDING' AND (low_id IN (?,?) OR high_id IN (?,?))", me, other, me, other);
            access.notify(other, me, "BUDDY_ACCEPTED", me);
        } else throw bad("Thao tác không hợp lệ.");
    }

    public void nudge() {
        long me = access.me(); access.member(me);
        long buddy = buddyOf(me).orElseThrow(() -> bad("Bạn chưa có bạn đồng hành."));
        access.throttle(1, "Bạn đã nhắc bạn đồng hành hôm nay.", "SELECT COUNT(*) FROM network_notification WHERE actor_id=? AND recipient_id=? AND kind='NUDGE' AND created_at>TIMESTAMPADD(HOUR,-20,CURRENT_TIMESTAMP)", me, buddy);
        access.notify(buddy, me, "NUDGE", me);
    }

    Optional<Long> buddyOf(long me) {
        var ids = access.db.queryForList("SELECT CASE WHEN low_id=? THEN high_id ELSE low_id END FROM network_buddy WHERE (low_id=? OR high_id=?) AND status='ACCEPTED'", Long.class, me, me, me);
        return ids.stream().findFirst();
    }

    private void requireFree(long account, String message) {
        if (buddyOf(account).isPresent()) throw bad(message);
    }
}
