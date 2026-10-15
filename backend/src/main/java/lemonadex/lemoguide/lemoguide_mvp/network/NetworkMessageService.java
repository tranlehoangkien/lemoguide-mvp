package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;

@Service
@RequiredArgsConstructor
@Transactional
public class NetworkMessageService {
    private final NetworkAccess access;

    private Map<String,Object> sharedProfile(long owner,Long project,long viewer) {
        var person=access.person(owner,viewer);
        var shared=new LinkedHashMap<String,Object>();
        shared.put("handle",person.get("handle"));shared.put("title",person.get("full_name"));
        if(project!=null) {
            var item=access.items(owner,true).stream().filter(i->i.get("kind").equals("PROJECT") && number(i,"id")==project).findFirst().orElseThrow(NetworkAccess::missing);
            shared.put("projectId",project);shared.put("title",item.get("title"));
        }
        return shared;
    }

    Map<String,Object> requireThread(long id,long me,boolean lock) {
        var rows=access.db.queryForList("SELECT * FROM network_thread WHERE id=? AND (low_id=? OR high_id=?)"+(lock?" FOR UPDATE":""),id,me,me);
        if(rows.isEmpty()) throw missing();var t=rows.getFirst();
        long other=number(t,"low_id")==me?number(t,"high_id"):number(t,"low_id");
        if(access.blocked(me,other)) throw missing();
        access.person(other,me);
        t.put("other",access.person(other,me));t.put("mine",me);t.put("incoming",number(t,"requester_id")!=me);
        return t;
    }

    public Map<String,Object> open(long other) {
        long me=access.me();access.pair(me,other);
        long low=Math.min(me,other),high=Math.max(me,other);
        access.db.queryForList("SELECT account_id FROM network_profile WHERE account_id IN (?,?) ORDER BY account_id FOR UPDATE",low,high);
        var existing=access.db.queryForList("SELECT id FROM network_thread WHERE low_id=? AND high_id=?",low,high);
        if(!existing.isEmpty()) return requireThread(number(existing.getFirst(),"id"),me,false);
        boolean connected=access.connected(me,other);
        if(!connected && !bool(access.settings(other),"allow_requests")) throw denied("Người này chỉ nhận tin nhắn từ kết nối.");
        long id=access.insert("INSERT INTO network_thread(low_id,high_id,requester_id,status) VALUES (?,?,?,?)",low,high,me,connected?"ACCEPTED":"PENDING");
        return requireThread(id,me,false);
    }

    @Transactional(readOnly=true)
    public List<Map<String,Object>> threads() {
        long me=access.me();
        var ids=access.db.queryForList("SELECT t.id FROM network_thread t JOIN network_profile n ON n.account_id=CASE WHEN t.low_id=? THEN t.high_id ELSE t.low_id END JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE (t.low_id=? OR t.high_id=?) AND "+PUBLIC+" AND "+UNBLOCKED+" ORDER BY t.updated_at DESC,t.id DESC LIMIT 100",me,me,me,me,me);
        return ids.stream().map(row->{var t=requireThread(number(row,"id"),me,false);long read=number(t,number(t,"low_id")==me?"low_read_id":"high_read_id");
            t.put("unread",access.count("SELECT COUNT(*) FROM network_message WHERE thread_id=? AND sender_id<>? AND id>? AND hidden=FALSE",number(t,"id"),me,read));return t;}).toList();
    }

    @Transactional(readOnly=true)
    public Map<String,Object> get(long id,long before) {
        long me=access.me();var t=requireThread(id,me,false);
        var rows=access.db.queryForList("SELECT id,sender_id,content,shared_post_id,shared_profile_id,shared_project_id,shared_cv_id,hidden,created_at FROM network_message WHERE thread_id=? AND (?=0 OR id<?) ORDER BY id DESC LIMIT 51",id,before,before);
        var visible=rows.stream().limit(50).toList();
        for(var row:visible){
            Object profile=row.remove("shared_profile_id"),project=row.remove("shared_project_id"),cv=row.remove("shared_cv_id");
            // A CV card only while the sender keeps that CV shareable; otherwise the attachment silently disappears.
            if(!bool(row,"hidden") && cv instanceof Number cvId) row.put("shared_cv",access.cvCard(cvId.longValue(),number(row,"sender_id")));
            if(!bool(row,"hidden") && profile instanceof Number owner) {
                try {row.put("shared_profile",sharedProfile(owner.longValue(),project instanceof Number p?p.longValue():null,me));}
                catch(lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException ex){row.put("shared_profile",null);}
            }
            if(bool(row,"hidden")){row.put("content","Tin nhắn đã được ẩn.");row.put("shared_post_id",null);}
            else if(row.get("shared_post_id")!=null){
                try{var p=access.post(number(row,"shared_post_id"),me);row.put("shared_post_title",p.get("content").toString().substring(0,Math.min(120,p.get("content").toString().length())));}
                catch(lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException ex){row.put("shared_post_id",null);}
            }
        }
        t.put("messages",visible);t.put("nextCursor",rows.size()>50?number(visible.getLast(),"id"):null);
        return t;
    }

    public void send(long id,MessageInput request) {
        long me=access.me();access.member(me);var t=requireThread(id,me,true);
        access.throttle(120,"Bạn gửi quá nhiều tin nhắn trong một giờ. Hãy thử lại sau.","SELECT COUNT(*) FROM network_message WHERE sender_id=? AND created_at>TIMESTAMPADD(HOUR,-1,CURRENT_TIMESTAMP)",me);
        String status=t.get("status").toString();
        if(status.equals("DECLINED")) throw denied("Yêu cầu trò chuyện đã bị từ chối.");
        if(status.equals("PENDING") && (number(t,"requester_id")!=me || access.count("SELECT COUNT(*) FROM network_message WHERE thread_id=?",id)>0))
            throw denied("Chờ người nhận chấp nhận yêu cầu trước khi gửi thêm tin nhắn.");
        long other=number(t,"low_id")==me?number(t,"high_id"):number(t,"low_id");
        if(request.sharedPostId()!=null){access.post(request.sharedPostId(),me);access.post(request.sharedPostId(),other);}
        if(request.sharedProjectId()!=null && request.sharedProfileId()==null)throw bad("Dự án chia sẻ cần có hồ sơ tác giả.");
        if((request.sharedPostId()!=null?1:0)+(request.sharedProfileId()!=null?1:0)+(request.sharedCvId()!=null?1:0)>1)throw bad("Mỗi tin nhắn chỉ đính kèm một nội dung.");
        if(request.sharedCvId()!=null && access.cvCard(request.sharedCvId(),me)==null)
            throw bad("Chỉ đính kèm được CV của bạn đang ở chế độ Công khai, không đặt mật khẩu và chưa hết hạn.");
        if(request.sharedProfileId()!=null){sharedProfile(request.sharedProfileId(),request.sharedProjectId(),me);sharedProfile(request.sharedProfileId(),request.sharedProjectId(),other);}
        access.db.update("INSERT INTO network_message(thread_id,sender_id,content,shared_post_id,shared_profile_id,shared_project_id,shared_cv_id) VALUES (?,?,?,?,?,?,?)",id,me,request.content().trim(),request.sharedPostId(),request.sharedProfileId(),request.sharedProjectId(),request.sharedCvId());
        access.db.update("UPDATE network_thread SET updated_at=CURRENT_TIMESTAMP WHERE id=?",id);
        access.notify(other,me,"MESSAGE",id);
    }

    public void decide(long id,boolean accept) {
        long me=access.me();access.member(me);var t=requireThread(id,me,true);
        if(number(t,"requester_id")==me || !t.get("status").equals("PENDING")) throw denied("Chỉ người nhận được xử lý yêu cầu trò chuyện.");
        access.db.update("UPDATE network_thread SET status=? WHERE id=?",accept?"ACCEPTED":"DECLINED",id);
        access.signal(number(t,"requester_id"),"message",id);
    }

    public void read(long id,long lastId) {
        long me=access.me();var t=requireThread(id,me,true);
        if(lastId>0 && access.count("SELECT COUNT(*) FROM network_message WHERE thread_id=? AND id=?",id,lastId)==0) throw bad("Mốc đọc tin nhắn không hợp lệ.");
        String column=number(t,"low_id")==me?"low_read_id":"high_read_id";
        access.db.update("UPDATE network_thread SET "+column+"=GREATEST("+column+",?) WHERE id=?",lastId,id);
    }
}
