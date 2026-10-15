package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;

/**
 * Weekly challenges set by admins ("Tuần này: viết 5 unit test"). Members submit one entry each while the challenge is
 * open and vote for other people's entries; once it ends, the most-voted entries are highlighted on the author's profile.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NetworkChallengeService {
    /** Vote count of entry alias `e`; shared with the contribution query in NetworkReputationService. */
    static final String VOTES = "(SELECT COUNT(*) FROM network_challenge_vote v WHERE v.entry_id=e.id)";
    static final int MAX_DAYS = 31;
    private static final String STATE = "CASE WHEN c.starts_on>CURRENT_DATE THEN 'UPCOMING' WHEN c.ends_on<CURRENT_DATE THEN 'ENDED' ELSE 'OPEN' END";
    private static final String ENTRY_AUTHOR = " JOIN network_profile n ON n.account_id=e.account_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id ";
    private final NetworkAccess access;

    /** Open, upcoming and recently ended challenges with entry counts and whether the viewer took part. */
    @Transactional(readOnly = true)
    public Map<String,Object> list() {
        long me = access.me();
        var rows = access.db.queryForList("SELECT c.id,c.title,c.description,c.tags,c.starts_on,c.ends_on," + STATE + " AS state,"
                + "(SELECT COUNT(*) FROM network_challenge_entry e WHERE e.challenge_id=c.id AND e.hidden=FALSE) AS entries,"
                + "(SELECT COUNT(*) FROM network_challenge_entry e WHERE e.challenge_id=c.id AND e.account_id=? AND e.hidden=FALSE) AS joined"
                + " FROM network_challenge c ORDER BY c.ends_on DESC,c.id DESC LIMIT 40", me);
        var result = new LinkedHashMap<String,Object>();
        for (String state : List.of("OPEN", "UPCOMING", "ENDED")) result.put(state.toLowerCase(Locale.ROOT), new ArrayList<Map<String,Object>>());
        for (var row : rows) {
            dates(row);
            row.put("joined", number(row, "joined") > 0);
            @SuppressWarnings("unchecked") var bucket = (List<Map<String,Object>>) result.get(row.get("state").toString().toLowerCase(Locale.ROOT));
            bucket.add(row);
        }
        // Upcoming reads best soonest-first; the query order suits ended ones.
        @SuppressWarnings("unchecked") var upcoming = (List<Map<String,Object>>) result.get("upcoming");
        Collections.reverse(upcoming);
        return result;
    }

    /** One challenge with its visible entries: newest first while open, most-voted first once ended. */
    @Transactional(readOnly = true)
    public Map<String,Object> get(long id) {
        long me = access.me();
        var challenge = challenge(id);
        boolean ended = "ENDED".equals(challenge.get("state"));
        var entries = access.db.queryForList("SELECT e.id,e.account_id,e.content,e.url,e.created_at,e.edited_at," + VOTES + " AS votes,"
                + "(SELECT COUNT(*) FROM network_challenge_vote v WHERE v.entry_id=e.id AND v.account_id=?) AS voted FROM network_challenge_entry e" + ENTRY_AUTHOR
                + "WHERE e.challenge_id=? AND e.hidden=FALSE AND " + PUBLIC + " AND " + UNBLOCKED
                + " ORDER BY " + (ended ? "votes DESC,e.id" : "e.id DESC") + " LIMIT 200", me, id, me, me);
        long top = ended ? entries.stream().mapToLong(e -> number(e, "votes")).max().orElse(0) : 0;
        for (var e : entries) {
            long author = number(e, "account_id");
            e.put("author", access.person(author, me));
            e.put("mine", author == me);
            e.put("voted", number(e, "voted") > 0);
            e.put("url", safeUrl((String) e.get("url")));
            e.put("highlight", top > 0 && number(e, "votes") == top);
        }
        challenge.put("entries", entries);
        challenge.put("my_entry", entries.stream().filter(e -> Boolean.TRUE.equals(e.get("mine"))).findFirst().orElse(null));
        return challenge;
    }

    /** Adds or updates the viewer's single entry while the challenge is open. */
    public void submit(long id, EntryInput input) {
        long me = access.me(); access.member(me);
        requireOpen(challenge(id));
        requireUrl(input.url());
        var own = access.db.queryForList("SELECT id,hidden FROM network_challenge_entry WHERE challenge_id=? AND account_id=? FOR UPDATE", id, me);
        if (own.isEmpty()) {
            access.db.update("INSERT INTO network_challenge_entry(challenge_id,account_id,content,url) VALUES (?,?,?,?)", id, me, input.content().trim(), safeUrl(input.url()));
        } else {
            if (bool(own.getFirst(), "hidden")) throw denied("Bài tham gia của bạn đã bị ẩn bởi quản trị viên.");
            access.db.update("UPDATE network_challenge_entry SET content=?,url=?,edited_at=CURRENT_TIMESTAMP WHERE id=?", input.content().trim(), safeUrl(input.url()), own.getFirst().get("id"));
        }
    }

    /** Withdraws the viewer's entry; only while open, so ended results and highlights stay stable. */
    public void withdraw(long id) {
        long me = access.me();
        requireOpen(challenge(id));
        if (access.db.update("DELETE FROM network_challenge_entry WHERE challenge_id=? AND account_id=? AND hidden=FALSE", id, me) == 0) throw missing();
    }

    public void vote(long entryId, boolean enabled) {
        long me = access.me(); access.member(me);
        var rows = access.db.queryForList("SELECT challenge_id,account_id FROM network_challenge_entry WHERE id=? AND hidden=FALSE", entryId);
        if (rows.isEmpty()) throw missing();
        var entry = rows.getFirst();
        requireOpen(challenge(number(entry, "challenge_id")));
        if (number(entry, "account_id") == me) throw bad("Không thể bình chọn cho bài của chính bạn.");
        access.person(number(entry, "account_id"), me);
        if (enabled) access.db.update("INSERT IGNORE INTO network_challenge_vote(entry_id,account_id) VALUES (?,?)", entryId, me);
        else access.db.update("DELETE FROM network_challenge_vote WHERE entry_id=? AND account_id=?", entryId, me);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<Map<String,Object>> adminList() {
        var rows = access.db.queryForList("SELECT c.id,c.title,c.description,c.tags,c.starts_on,c.ends_on,c.created_at," + STATE + " AS state,"
                + "(SELECT COUNT(*) FROM network_challenge_entry e WHERE e.challenge_id=c.id AND e.hidden=FALSE) AS entries FROM network_challenge c ORDER BY c.starts_on DESC,c.id DESC LIMIT 500");
        rows.forEach(NetworkChallengeService::dates);
        return rows;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> create(ChallengeInput input) {
        validate(input);
        long id = access.insert("INSERT INTO network_challenge(title,description,tags,starts_on,ends_on,created_by) VALUES (?,?,?,?,?,?)",
                input.title().trim(), input.description().trim(), clean(input.tags()), input.startsOn(), input.endsOn(), SecurityUtils.currentAccountId());
        return Map.of("id", id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void update(long id, ChallengeInput input) {
        validate(input);
        if (access.db.update("UPDATE network_challenge SET title=?,description=?,tags=?,starts_on=?,ends_on=? WHERE id=?",
                input.title().trim(), input.description().trim(), clean(input.tags()), input.startsOn(), input.endsOn(), id) == 0) throw missing();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void delete(long id) {
        if (access.db.update("DELETE FROM network_challenge WHERE id=?", id) == 0) throw missing();
    }

    private Map<String,Object> challenge(long id) {
        var rows = access.db.queryForList("SELECT c.id,c.title,c.description,c.tags,c.starts_on,c.ends_on," + STATE + " AS state FROM network_challenge c WHERE c.id=?", id);
        if (rows.isEmpty()) throw missing();
        var row = rows.getFirst();
        dates(row);
        return row;
    }

    private static void requireOpen(Map<String,Object> challenge) {
        if (!"OPEN".equals(challenge.get("state"))) throw bad("Thử thách chưa mở hoặc đã kết thúc.");
    }

    private static void validate(ChallengeInput input) {
        if (input.endsOn().isBefore(input.startsOn())) throw bad("Ngày kết thúc phải sau ngày bắt đầu.");
        if (input.endsOn().isAfter(input.startsOn().plusDays(MAX_DAYS - 1))) throw bad("Một thử thách kéo dài tối đa " + MAX_DAYS + " ngày.");
    }

    /** DATE columns as ISO strings ("2026-09-28"), independent of the JDBC driver's date type. */
    private static void dates(Map<String,Object> row) {
        for (String key : List.of("starts_on", "ends_on")) if (row.get(key) != null) row.put(key, row.get(key).toString().substring(0, 10));
    }
}
