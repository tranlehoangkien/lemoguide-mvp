package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class NetworkModerationService {
    private final NetworkAccess access;
    private final NetworkMessageService messages;

    public void report(ReportInput request) {
        long me=access.me();String evidence;
        switch(request.kind()) {
            case "POST" -> evidence=access.post(request.targetId(),me).get("content").toString();
            case "PROFILE" -> evidence=access.person(request.targetId(),me).toString();
            case "COMMENT" -> {
                var rows=access.db.queryForList("SELECT post_id,author_id,content FROM network_comment WHERE id=? AND hidden=FALSE",request.targetId());
                if(rows.isEmpty())throw missing();var row=rows.getFirst();access.post(number(row,"post_id"),me);access.person(number(row,"author_id"),me);evidence=row.get("content").toString();
            }
            case "MESSAGE" -> {
                var rows=access.db.queryForList("SELECT thread_id,content FROM network_message WHERE id=? AND hidden=FALSE",request.targetId());
                if(rows.isEmpty())throw missing();var row=rows.getFirst();messages.requireThread(number(row,"thread_id"),me,false);evidence=row.get("content").toString();
            }
            case "COHORT_MESSAGE" -> {
                var rows=access.db.queryForList("SELECT m.content FROM network_cohort_message m JOIN network_cohort_member cm ON cm.cohort_id=m.cohort_id AND cm.account_id=? WHERE m.id=? AND m.hidden=FALSE",me,request.targetId());
                if(rows.isEmpty())throw missing();evidence=rows.getFirst().get("content").toString();
            }
            case "CHALLENGE_ENTRY" -> {
                var rows=access.db.queryForList("SELECT account_id,content,url FROM network_challenge_entry WHERE id=? AND hidden=FALSE",request.targetId());
                if(rows.isEmpty())throw missing();var row=rows.getFirst();access.person(number(row,"account_id"),me);
                evidence=row.get("content")+(row.get("url")==null?"":" · "+row.get("url"));
            }
            default -> throw bad("Loại báo cáo không hợp lệ.");
        }
        access.db.update("INSERT IGNORE INTO network_report(reporter_id,kind,target_id,reason,evidence) VALUES (?,?,?,?,?)",me,request.kind(),request.targetId(),request.reason().trim(),evidence);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly=true)
    public List<Map<String,Object>> reports() {
        return access.db.queryForList("SELECT r.id,r.kind,r.target_id,r.reason,r.evidence,r.status,r.created_at,r.reviewed_at,u.full_name AS reporter_name FROM network_report r LEFT JOIN user_information u ON u.account_id=r.reporter_id ORDER BY CASE WHEN r.status='OPEN' THEN 0 ELSE 1 END,r.id DESC LIMIT 500");
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void decide(long id,String action) {
        if(!Set.of("DISMISS","HIDE").contains(action))throw bad("Thao tác không hợp lệ.");
        var rows=access.db.queryForList("SELECT * FROM network_report WHERE id=? FOR UPDATE",id);
        if(rows.isEmpty())throw missing();var r=rows.getFirst();
        if(!r.get("status").equals("OPEN"))throw bad("Báo cáo đã được xử lý.");
        if(action.equals("HIDE")) {
            String sql=switch(r.get("kind").toString()) {
                case "POST" -> "UPDATE network_post SET hidden=TRUE,hidden_by_admin=TRUE WHERE id=?";
                case "COMMENT" -> "UPDATE network_comment SET hidden=TRUE,hidden_by_admin=TRUE,accepted=FALSE WHERE id=?";
                case "PROFILE" -> "UPDATE network_profile SET suspended=TRUE WHERE account_id=?";
                case "MESSAGE" -> "UPDATE network_message SET hidden=TRUE WHERE id=?";
                case "COHORT_MESSAGE" -> "UPDATE network_cohort_message SET hidden=TRUE WHERE id=?";
                case "CHALLENGE_ENTRY" -> "UPDATE network_challenge_entry SET hidden=TRUE WHERE id=?";
                default -> throw bad("Loại báo cáo không hợp lệ.");
            };
            access.db.update(sql,number(r,"target_id"));
        }
        access.db.update("UPDATE network_report SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?",action,SecurityUtils.currentAccountId(),id);
    }
}
