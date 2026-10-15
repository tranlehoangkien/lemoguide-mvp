package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DuplicateKeyException;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;

@Service
@RequiredArgsConstructor
@Transactional
public class NetworkProfileService {
    /** How long a declined requester waits before inviting the same person again. */
    static final int DECLINE_COOLDOWN_DAYS = 7;
    private final NetworkAccess access;
    private final NetworkReputationService reputation;

    public Map<String,Object> mine() {
        long me=access.me();
        var result=new LinkedHashMap<String,Object>(access.settings(me));
        result.put("items",access.items(me,false));
        result.put("shared",access.db.queryForList("SELECT kind,item_id FROM network_shared_item WHERE account_id=?",me));
        result.put("milestones",access.db.queryForList("SELECT t.id,t.title,t.week_number FROM career_task t JOIN career_plan p ON p.id=t.plan_id WHERE p.account_id=? AND t.completed=TRUE ORDER BY t.id DESC LIMIT 100",me));
        return result;
    }

    public Map<String,Object> save(Settings request) {
        long me=access.me(); access.settings(me);
        if (request.handle().matches("member-[0-9]+") && !request.handle().equals("member-"+me)) throw bad("Tên đường dẫn này được dành cho tài khoản khác.");
        Set<String> owned=new HashSet<>();
        access.items(me,false).forEach(item->owned.add(item.get("kind")+":"+item.get("id")));
        for (var item:request.shared()) if (!owned.contains(item.kind()+":"+item.itemId())) throw bad("Chỉ chia sẻ các mục thuộc hồ sơ của bạn.");
        try {
            access.db.update("UPDATE network_profile SET handle=?,published=?,bio=?,topics=?,show_goals=?,allow_compare=?,allow_requests=?,available_to_help=? WHERE account_id=?",
                    request.handle(),request.published(),clean(request.bio()),clean(request.topics()),request.showGoals(),request.allowCompare(),request.allowRequests(),request.availableToHelp(),me);
            // Older clients omit the field: keep the stored choice instead of silently turning it off.
            if(request.autoShareMilestones()!=null) access.db.update("UPDATE network_profile SET auto_share_milestones=? WHERE account_id=?",request.autoShareMilestones(),me);
            if(request.mentorTopics()!=null) access.db.update("UPDATE network_profile SET mentor_topics=? WHERE account_id=?",clean(request.mentorTopics()),me);
        } catch (DuplicateKeyException ex) { throw bad("Tên đường dẫn đã được sử dụng."); }
        access.db.update("DELETE FROM network_shared_item WHERE account_id=?",me);
        request.shared().stream().distinct().forEach(item->access.db.update("INSERT INTO network_shared_item(account_id,kind,item_id) VALUES (?,?,?)",me,item.kind(),item.itemId()));
        return mine();
    }

    @Transactional(readOnly=true)
    public Map<String,Object> profile(String handle) {
        long me=access.me();
        var ids=access.db.queryForList("SELECT account_id FROM network_profile WHERE handle=?",Long.class,handle);
        if (ids.isEmpty()) throw missing();
        long id=ids.getFirst();
        var result=access.publicProfile(id,me);
        result.put("mine",id==me);
        result.put("following",access.count("SELECT COUNT(*) FROM network_follow WHERE follower_id=? AND following_id=?",me,id)>0);
        var relation=access.db.queryForList("SELECT requester_id,status FROM network_connection WHERE low_id=? AND high_id=?",Math.min(me,id),Math.max(me,id));
        result.put("connection",relation.isEmpty()?null:relation.getFirst());
        @SuppressWarnings("unchecked") var items=(List<Map<String,Object>>)result.get("items");
        reputation.decorate(id,me,items);
        result.put("contributions",reputation.contributions(id));
        // The viewer's open mentoring request with this member, so the profile shows its state instead of a second form.
        var open=access.db.queryForList("SELECT id,status FROM network_mentor_request WHERE mentee_id=? AND mentor_id=? AND status IN ('PENDING','ACCEPTED')",me,id);
        result.put("mentor_request",open.isEmpty()?null:open.getFirst());
        // The CV the member chose to show, only while it is still shareable.
        var featured=access.db.queryForList("SELECT featured_cv_id FROM network_profile WHERE account_id=? AND featured_cv_id IS NOT NULL",Long.class,id);
        result.put("featured_cv",featured.isEmpty()?null:access.cvCard(featured.getFirst(),id));
        return result;
    }

    @Transactional(readOnly=true)
    public Slice people(String query,String mode,long page) {
        long me=access.me();
        if (page<0 || page>10000 || !Set.of("discover","suggested","following","connections","requests","sent").contains(mode)) throw bad("Bộ lọc không hợp lệ.");
        List<Object> args=new ArrayList<>(List.of(me,me,me));
        String filter="n.account_id<>? AND "+PUBLIC+" AND "+UNBLOCKED;
        if (!clean(query).isEmpty()) {
            String like="%"+clean(query).toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%";
            filter+=" AND (LOWER(u.full_name) LIKE ? ESCAPE '!' OR LOWER(u.current_title) LIKE ? ESCAPE '!' OR LOWER(n.topics) LIKE ? ESCAPE '!' OR (n.show_goals=TRUE AND LOWER(u.short_term_goal) LIKE ? ESCAPE '!') OR EXISTS (SELECT 1 FROM network_shared_item si JOIN user_skill us ON us.id=si.item_id JOIN skill s ON s.id=us.skill_id WHERE si.account_id=n.account_id AND si.kind='SKILL' AND LOWER(s.name) LIKE ? ESCAPE '!'))";
            for(int i=0;i<5;i++) args.add(like);
        }
        if (mode.equals("following")) { filter+=" AND EXISTS (SELECT 1 FROM network_follow f WHERE f.follower_id=? AND f.following_id=n.account_id)"; args.add(me); }
        if (mode.equals("connections") || mode.equals("requests") || mode.equals("sent")) {
            filter+=" AND EXISTS (SELECT 1 FROM network_connection c WHERE ((c.low_id=? AND c.high_id=n.account_id) OR (c.high_id=? AND c.low_id=n.account_id)) AND c.status=?";
            args.add(me);args.add(me);args.add(mode.equals("connections")?"ACCEPTED":"PENDING");
            if(mode.equals("requests")){filter+=" AND c.requester_id<>?";args.add(me);}
            if(mode.equals("sent")){filter+=" AND c.requester_id=?";args.add(me);}
            filter+=")";
        }
        String ordering="n.account_id DESC";
        if(mode.equals("suggested")) {
            ordering="CASE WHEN n.show_goals=TRUE AND NULLIF(TRIM(u.short_term_goal),'')=(SELECT NULLIF(TRIM(own.short_term_goal),'') FROM user_information own WHERE own.account_id=?) THEN 0 ELSE 1 END,n.available_to_help DESC,n.account_id DESC";
            args.add(me);
        }
        args.add(page*20);
        var rows=access.db.queryForList(PERSON+"WHERE "+filter+" ORDER BY "+ordering+" LIMIT 21 OFFSET ?",args.toArray());
        var visible=rows.stream().limit(20).toList();
        withRelations(me,visible);
        return new Slice(visible,rows.size()>20?page+1:null);
    }

    /** Adds `connection` ({requester_id,status} or null) and `following` to each person so cards can act without opening the profile. */
    private void withRelations(long me,List<Map<String,Object>> people) {
        if(people.isEmpty()) return;
        String marks=String.join(",",Collections.nCopies(people.size(),"?"));
        List<Object> ids=people.stream().map(p->(Object)number(p,"account_id")).toList();
        List<Object> args=new ArrayList<>(List.of(me,me,me));args.addAll(ids);args.addAll(ids);
        Map<Long,Map<String,Object>> relations=new HashMap<>();
        access.db.queryForList("SELECT CASE WHEN low_id=? THEN high_id ELSE low_id END AS other_id,requester_id,status FROM network_connection WHERE (low_id=? OR high_id=?) AND (low_id IN ("+marks+") OR high_id IN ("+marks+"))",args.toArray())
                .forEach(r->{long other=number(r,"other_id");if(other!=me){var rel=new LinkedHashMap<String,Object>();rel.put("requester_id",r.get("requester_id"));rel.put("status",r.get("status"));relations.put(other,rel);}});
        List<Object> followArgs=new ArrayList<>(List.of(me));followArgs.addAll(ids);
        Set<Long> following=new HashSet<>(access.db.queryForList("SELECT following_id FROM network_follow WHERE follower_id=? AND following_id IN ("+marks+")",Long.class,followArgs.toArray()));
        for(var p:people){long id=number(p,"account_id");p.put("connection",relations.get(id));p.put("following",following.contains(id));}
    }

    public void follow(long other,boolean enabled) {
        long me=access.me();
        if (!enabled) {access.db.update("DELETE FROM network_follow WHERE follower_id=? AND following_id=?",me,other);return;}
        access.pair(me,other);
        if(access.db.update("INSERT IGNORE INTO network_follow(follower_id,following_id) VALUES (?,?)",me,other)>0) access.notify(other,me,"FOLLOW",me);
    }

    public void connect(long other,String action) {
        long me=access.me();
        if (me==other) throw bad("Thao tác cần một người dùng khác.");
        long low=Math.min(me,other),high=Math.max(me,other);
        if(action.equals("remove")) {
            // No pair() check: a request or connection must stay removable even after either side hid their profile.
            var rows=access.db.queryForList("SELECT requester_id,status FROM network_connection WHERE low_id=? AND high_id=? FOR UPDATE",low,high);
            if(rows.isEmpty()) return;
            var row=rows.getFirst();
            access.db.update("DELETE FROM network_connection WHERE low_id=? AND high_id=?",low,high);
            // Declining someone else's request starts the cooldown before they may ask again.
            if("PENDING".equals(row.get("status")) && number(row,"requester_id")!=me)
                access.db.update("INSERT INTO network_connection_decline(requester_id,recipient_id) VALUES (?,?) ON DUPLICATE KEY UPDATE declined_at=CURRENT_TIMESTAMP",other,me);
            return;
        }
        access.pair(me,other);
        // Lock both accounts in canonical order to serialize simultaneous cross-invitations.
        access.db.queryForList("SELECT account_id FROM network_profile WHERE account_id IN (?,?) ORDER BY account_id FOR UPDATE",low,high);
        if(action.equals("request")) {
            if(access.count("SELECT COUNT(*) FROM network_connection_decline WHERE requester_id=? AND recipient_id=? AND declined_at>TIMESTAMPADD(DAY,-"+DECLINE_COOLDOWN_DAYS+",CURRENT_TIMESTAMP)",me,other)>0)
                throw bad("Người này đã từ chối lời mời gần đây. Bạn có thể gửi lại sau "+DECLINE_COOLDOWN_DAYS+" ngày.");
            // Re-sending after a cancel must not stack notifications the recipient has not read yet.
            if(access.db.update("INSERT IGNORE INTO network_connection(low_id,high_id,requester_id,status) VALUES (?,?,?,'PENDING')",low,high,me)>0
                    && access.count("SELECT COUNT(*) FROM network_notification WHERE recipient_id=? AND actor_id=? AND kind='CONNECTION' AND is_read=FALSE",other,me)==0)
                access.notify(other,me,"CONNECTION",me);
        } else if(action.equals("accept")) {
            if(access.db.update("UPDATE network_connection SET status='ACCEPTED' WHERE low_id=? AND high_id=? AND requester_id=? AND status='PENDING'",low,high,other)==0) throw bad("Không có lời mời cần chấp nhận.");
            access.db.update("UPDATE network_thread SET status='ACCEPTED' WHERE low_id=? AND high_id=?",low,high);
            access.db.update("DELETE FROM network_connection_decline WHERE (requester_id=? AND recipient_id=?) OR (requester_id=? AND recipient_id=?)",me,other,other,me);
            access.notify(other,me,"CONNECTED",me);
        } else throw bad("Thao tác kết nối không hợp lệ.");
    }

    /** One-click opt-in from the roadmap page: publish with the defaults (handle, nothing shared yet). */
    public Map<String,Object> publish(boolean autoShareMilestones) {
        long me=access.me();
        if(bool(access.settings(me),"suspended")) throw denied("Hồ sơ cộng đồng đang bị tạm ẩn bởi quản trị viên.");
        access.db.update("UPDATE network_profile SET published=TRUE,auto_share_milestones=? WHERE account_id=?",autoShareMilestones,me);
        return mine();
    }

    /** Published members who shared a job at `company` (either name containing the other), for the job detail page. */
    @Transactional(readOnly=true)
    public List<Map<String,Object>> companyPeople(String company) {
        long me=access.me();
        String key=companyKey(company);
        if(key.length()<3) return List.of();
        String like="%"+key.replace("!","!!").replace("%","!%").replace("_","!_")+"%";
        var rows=access.db.queryForList(PERSON+"WHERE n.account_id<>? AND "+PUBLIC+" AND "+UNBLOCKED
                +" AND EXISTS (SELECT 1 FROM network_shared_item si JOIN experience e ON e.id=si.item_id JOIN user_information ei ON ei.id=e.user_information_id AND ei.account_id=n.account_id"
                +" WHERE si.account_id=n.account_id AND si.kind='EXPERIENCE' AND CHAR_LENGTH(TRIM(e.company_name))>=3"
                +" AND (LOWER(e.company_name) LIKE ? ESCAPE '!' OR ? LIKE CONCAT('%',LOWER(TRIM(e.company_name)),'%')))"
                +" ORDER BY n.account_id DESC LIMIT 6",me,me,me,like,key);
        withRelations(me,rows);
        return rows;
    }

    /** Lower-cased company name without Vietnamese/English legal-form words, so "Công ty CP ABC" matches "ABC". */
    static String companyKey(String company) {
        String key=clean(company).toLowerCase(Locale.ROOT)
                .replaceAll("(?U)\\b(công ty|cổ phần|trách nhiệm hữu hạn|tnhh|cp|jsc|co\\.?,? ?ltd\\.?|ltd\\.?|inc\\.?|corporation|corp\\.?|company|group|tập đoàn)\\b","")
                .replaceAll("[^\\p{L}\\p{N} &.-]"," ").replaceAll("\\s+"," ").trim();
        return key;
    }

    /** Badge counts for the sidebar and the LemoNetwork header: incoming requests, unread messages and notifications. */
    @Transactional(readOnly=true)
    public Map<String,Object> summary() {
        long me=access.me();
        String people=" JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id ";
        long requests=access.count("SELECT COUNT(*) FROM network_connection c JOIN network_profile n ON n.account_id=c.requester_id"+people
                +"WHERE (c.low_id=? OR c.high_id=?) AND c.status='PENDING' AND c.requester_id<>? AND "+PUBLIC+" AND "+UNBLOCKED,me,me,me,me,me);
        long messages=access.count("SELECT COUNT(*) FROM network_message m JOIN network_thread t ON t.id=m.thread_id JOIN network_profile n ON n.account_id=CASE WHEN t.low_id=? THEN t.high_id ELSE t.low_id END"+people
                +"WHERE (t.low_id=? OR t.high_id=?) AND m.sender_id<>? AND m.hidden=FALSE AND m.id>CASE WHEN t.low_id=? THEN t.low_read_id ELSE t.high_read_id END AND "+PUBLIC+" AND "+UNBLOCKED,me,me,me,me,me,me,me);
        long cohorts=access.count("SELECT COUNT(*) FROM network_cohort_message m JOIN network_cohort_member cm ON cm.cohort_id=m.cohort_id AND cm.account_id=? WHERE m.id>cm.last_read_id AND m.sender_id<>? AND m.hidden=FALSE",me,me);
        long notifications=access.count("SELECT COUNT(*) FROM network_notification z JOIN network_profile n ON n.account_id=z.actor_id"+people
                +"WHERE z.recipient_id=? AND z.is_read=FALSE AND "+PUBLIC+" AND "+UNBLOCKED,me,me,me);
        var result=new LinkedHashMap<String,Object>();
        long mentoring=access.count("SELECT COUNT(*) FROM network_mentor_request r JOIN network_profile n ON n.account_id=r.mentee_id"+people
                +"WHERE r.mentor_id=? AND r.status='PENDING' AND "+PUBLIC+" AND "+UNBLOCKED,me,me,me);
        result.put("requests",requests);result.put("messages",messages);result.put("notifications",notifications);result.put("cohorts",cohorts);result.put("mentoring",mentoring);
        return result;
    }

    public void block(long other,boolean enabled) {
        long me=access.me();
        if(me==other) throw bad("Không thể chặn chính mình.");
        if(!enabled) {access.db.update("DELETE FROM network_block WHERE blocker_id=? AND blocked_id=?",me,other);return;}
        access.pair(me,other);
        access.db.update("INSERT IGNORE INTO network_block(blocker_id,blocked_id) VALUES (?,?)",me,other);
        access.db.update("DELETE FROM network_follow WHERE (follower_id=? AND following_id=?) OR (follower_id=? AND following_id=?)",me,other,other,me);
        access.db.update("DELETE FROM network_connection WHERE low_id=? AND high_id=?",Math.min(me,other),Math.max(me,other));
        access.db.update("UPDATE network_thread SET status='DECLINED' WHERE low_id=? AND high_id=?",Math.min(me,other),Math.max(me,other));
    }

    @Transactional(readOnly=true)
    public List<Map<String,Object>> blocked() {
        return access.db.queryForList("SELECT b.blocked_id,u.full_name FROM network_block b JOIN user_information u ON u.account_id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.blocked_id LIMIT 200",access.me());
    }

    @Transactional(readOnly=true)
    public List<Map<String,Object>> notifications() {
        long me=access.me();
        return access.db.queryForList("SELECT z.id,z.kind,z.ref_id,z.is_read,z.created_at,u.full_name,u.avatar_url,n.handle FROM network_notification z JOIN network_profile n ON n.account_id=z.actor_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE z.recipient_id=? AND "+PUBLIC+" AND "+UNBLOCKED+" ORDER BY z.id DESC LIMIT 50",me,me,me);
    }
    public void readNotifications(long lastId) { access.db.update("UPDATE network_notification SET is_read=TRUE WHERE recipient_id=? AND id<=?",access.me(),lastId); }
}
