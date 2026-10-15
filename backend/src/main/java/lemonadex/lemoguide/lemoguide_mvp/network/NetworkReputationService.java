package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;

/**
 * Peer signals on a profile: endorsements of shared skills/projects by connections (peer vouching, never "verified")
 * and contribution points earned by helping others (accepted answers, helpful feedback, mentoring, challenges).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NetworkReputationService {
    static final Set<String> ENDORSABLE = Set.of("SKILL", "PROJECT");
    /** Points per contribution; shown with the breakdown so the number is explainable. */
    static final int ANSWER = 10, FEEDBACK = 5, SESSION = 15, CHALLENGE = 3, HIGHLIGHT = 10;
    private final NetworkAccess access;

    /** Toggles the viewer's endorsement of one shared SKILL or PROJECT; only accepted connections may endorse. */
    public void endorse(long owner, String kind, long itemId, boolean enabled) {
        long me = access.me();
        if (!ENDORSABLE.contains(kind)) throw bad("Chỉ xác nhận được kỹ năng hoặc dự án.");
        if (!enabled) {
            access.db.update("DELETE FROM network_endorsement WHERE endorser_id=? AND kind=? AND item_id=?", me, kind, itemId);
            return;
        }
        access.pair(me, owner);
        if (!access.connected(me, owner)) throw denied("Chỉ người đã kết nối mới có thể xác nhận kỹ năng hoặc dự án.");
        if (access.items(owner, true).stream().noneMatch(i -> kind.equals(i.get("kind")) && number(i, "id") == itemId)) throw missing();
        access.throttle(30, "Bạn đã xác nhận nhiều mục hôm nay. Hãy thử lại vào ngày mai.",
                "SELECT COUNT(*) FROM network_endorsement WHERE endorser_id=? AND created_at>TIMESTAMPADD(DAY,-1,CURRENT_TIMESTAMP)", me);
        if (access.db.update("INSERT IGNORE INTO network_endorsement(endorser_id,owner_id,kind,item_id) VALUES (?,?,?,?)", me, owner, kind, itemId) > 0)
            access.notify(owner, me, "ENDORSE", itemId);
    }

    /**
     * Adds to each shared skill/project: `endorsement_count` (visible endorsers only), up to three `endorsers`,
     * whether the viewer already `endorsed` it and whether they `can_endorse` (connected, not the owner).
     */
    public void decorate(long owner, long viewer, List<Map<String,Object>> items) {
        boolean can = owner != viewer && access.connected(owner, viewer);
        Map<String,List<Map<String,Object>>> byItem = new HashMap<>();
        access.db.queryForList("SELECT e.kind,e.item_id,e.endorser_id,u.full_name,n.handle FROM network_endorsement e JOIN network_profile n ON n.account_id=e.endorser_id"
                + " JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE e.owner_id=? AND " + PUBLIC + " AND " + UNBLOCKED
                + " ORDER BY e.created_at DESC", owner, viewer, viewer)
                .forEach(r -> byItem.computeIfAbsent(r.get("kind") + ":" + number(r, "item_id"), k -> new ArrayList<>()).add(r));
        for (var item : items) {
            if (!ENDORSABLE.contains(item.get("kind"))) continue;
            var list = byItem.getOrDefault(item.get("kind") + ":" + number(item, "id"), List.of());
            item.put("endorsement_count", list.size());
            item.put("endorsers", list.stream().limit(3).map(r -> Map.of("full_name", r.get("full_name"), "handle", r.get("handle"))).toList());
            item.put("endorsed", list.stream().anyMatch(r -> number(r, "endorser_id") == viewer));
            item.put("can_endorse", can);
        }
    }

    /** Contribution breakdown and total points for one member. */
    @Transactional(readOnly = true)
    public Map<String,Object> contributions(long owner) {
        String helped = "SELECT COUNT(*) FROM network_comment c JOIN network_post p ON p.id=c.post_id WHERE c.author_id=? AND c.hidden=FALSE AND p.hidden=FALSE AND p.author_id<>c.author_id AND ";
        long answers = access.count(helped + "c.accepted=TRUE", owner);
        long feedback = access.count(helped + "c.helpful=TRUE", owner);
        var mentor = access.db.queryForMap("SELECT COUNT(*) AS sessions,AVG(rating) AS rating FROM network_mentor_request WHERE mentor_id=? AND status='COMPLETED'", owner);
        long sessions = number(mentor, "sessions");
        long challenges = access.count("SELECT COUNT(*) FROM network_challenge_entry WHERE account_id=? AND hidden=FALSE", owner);
        long highlights = access.count("SELECT COUNT(*) FROM network_challenge_entry e JOIN network_challenge c ON c.id=e.challenge_id WHERE e.account_id=? AND e.hidden=FALSE AND c.ends_on<CURRENT_DATE AND "
                + NetworkChallengeService.VOTES + ">0 AND " + NetworkChallengeService.VOTES + ">=ALL (SELECT COUNT(v2.entry_id) FROM network_challenge_entry e2 LEFT JOIN network_challenge_vote v2 ON v2.entry_id=e2.id WHERE e2.challenge_id=c.id AND e2.hidden=FALSE GROUP BY e2.id)", owner);
        var result = new LinkedHashMap<String,Object>();
        result.put("accepted_answers", answers);
        result.put("helpful_feedback", feedback);
        result.put("mentor_sessions", sessions);
        result.put("mentor_rating", mentor.get("rating") == null ? null : Math.round(((Number) mentor.get("rating")).doubleValue() * 10) / 10.0);
        result.put("challenges", challenges);
        result.put("challenge_highlights", highlights);
        result.put("points", answers * ANSWER + feedback * FEEDBACK + sessions * SESSION + challenges * CHALLENGE + highlights * HIGHLIGHT);
        return result;
    }
}
