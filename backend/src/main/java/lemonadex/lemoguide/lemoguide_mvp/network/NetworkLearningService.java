package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.*;
import lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service.ProfileSnapshotBuilder;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerPlanService;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.dto.*;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerRecommendationService;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;
import lemonadex.lemoguide.lemoguide_mvp.network.NetworkDtos.*;

@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor=AppException.class)
public class NetworkLearningService {
    private final NetworkAccess access;
    private final ObjectMapper mapper;
    private final CvAiTaskRunner runner;
    private final ProfileSnapshotBuilder snapshots;
    private final UserInformationRepository profiles;
    private final CareerPlanService plans;
    private final CareerRecommendationService recommendations;

    public record Difference(String skill,String mine,String reference,String evidence,String action) { }
    public record Analysis(String summary,List<Difference> differences) { }

    private Map<String,Object> reference(long id,long me) {
        access.pair(me,id);var p=access.publicProfile(id,me);
        if(!bool(p,"allow_compare"))throw denied("Người này chưa cho phép phân tích học tập từ hồ sơ.");
        // Only opted-in professional data is sent to AI, never identity or contact information.
        var result=new LinkedHashMap<String,Object>();
        result.put("title",p.get("current_title"));result.put("goal",p.get("goal"));
        result.put("items",access.items(id,true).stream().map(item->{var copy=new LinkedHashMap<String,Object>();
            for(String key:List.of("kind","title","description","evidence","technologies"))copy.put(key,item.get(key));return copy;}).toList());
        return result;
    }

    public Map<String,Object> compare(long other,CompareInput request) {
        long me=access.me();var ref=reference(other,me);
        if(((List<?>)ref.get("items")).isEmpty())throw bad("Hồ sơ tham khảo chưa chia sẻ đủ dữ liệu để phân tích.");
        var own=profiles.findByAccountId(me).orElseThrow(NetworkAccess::missing);
        var snapshot=snapshots.build(own);
        if(snapshot.empty())throw bad("Hãy bổ sung kỹ năng hoặc dự án vào Profile trước khi so sánh.");
        String prompt="Mục tiêu người học (dữ liệu): "+mapper.writeValueAsString(request.goal())
                +"\nHồ sơ người học: "+snapshot.text()+"\nHồ sơ tham khảo được phép chia sẻ: "+mapper.writeValueAsString(ref)
                +"\nChỉ JSON: {summary:string,differences:[{skill:string,mine:string,reference:string,evidence:string,action:string}]}. "
                +"Từ 1 đến 8 khác biệt hữu ích. mine nêu bằng chứng hoặc 'Chưa thấy bằng chứng'; evidence nêu nguồn là mục công khai nào. "
                +"action chỉ là mục tiêu học hoặc sản phẩm cần tự thực hành, không chép kinh nghiệm/chứng chỉ. Không cho điểm xếp hạng con người.";
        var output=runner.run(ActionType.COMPARE_PROFILE,request.modelId(),me,null,prompt,"Học từ hồ sơ cộng đồng",raw->parse(mapper,raw));
        // Check consent again before saving a result after a potentially slow provider call.
        String original=hash(mapper.writeValueAsString(ref));
        if(!original.equals(hash(mapper.writeValueAsString(reference(other,me)))))throw bad("Hồ sơ tham khảo đã thay đổi. Vui lòng phân tích lại.");
        long id=access.insert("INSERT INTO network_comparison(account_id,reference_id,reference_hash,result_json) VALUES (?,?,?,?)",me,other,original,mapper.writeValueAsString(output.value()));
        var result=new LinkedHashMap<String,Object>();result.put("id",id);result.put("analysis",output.value());
        var outcomes=output.value().differences().stream().map(d->new CareerProposal.Outcome(d.skill(),d.action())).toList();
        result.put("courses",recommendations.forPlan(new CareerAnalysis("","","",List.of(),List.of(),List.of(),"",outcomes,null)).courses());
        return result;
    }

    public Map<String,Object> preview(long id,ApplyInput request) {
        long me=access.me();
        var rows=access.db.queryForList("SELECT * FROM network_comparison WHERE id=? AND account_id=?",id,me);
        if(rows.isEmpty())throw missing();var row=rows.getFirst();
        var ref=reference(number(row,"reference_id"),me);
        if(!hash(mapper.writeValueAsString(ref)).equals(row.get("reference_hash")))throw bad("Hồ sơ tham khảo đã thay đổi quyền chia sẻ hoặc nội dung. Hãy phân tích lại.");
        var analysis=mapper.readValue(row.get("result_json").toString(),Analysis.class);
        var indices=request.selections().stream().distinct().toList();
        if(indices.isEmpty() || indices.stream().anyMatch(i->i<0 || i>=analysis.differences().size()))throw bad("Hãy chọn đề xuất hợp lệ.");
        String goals="Mục tiêu học tham khảo từ cộng đồng; CHƯA phải kỹ năng hay thành tích đã có:\n"+String.join("\n",indices.stream().map(i->{var d=analysis.differences().get(i);return "- "+d.skill()+": "+d.action();}).toList());
        var existing=plans.list(org.springframework.data.domain.PageRequest.of(0,1));
        var seed=new LinkedHashMap<String,Object>();
        if(!existing.isEmpty()) {
            var plan=plans.get(existing.getContent().getFirst().id());
            seed.put("id",plan.id());seed.put("intent",plan.intent());seed.put("targetRole",plan.targetRole());seed.put("hoursPerWeek",plan.hoursPerWeek());
            seed.put("useProfile",plan.useProfile());seed.put("cvProfileId",plan.cvProfileId());seed.put("background",plan.background());
            String combined=clean(plan.constraints())+"\n\n"+goals;
            if(combined.length()>1500)throw bad("Các mục tiêu vượt giới hạn ghi chú lộ trình. Hãy chọn ít đề xuất hơn.");
            seed.put("constraints",combined.trim());
        } else {seed.put("intent","target");seed.put("targetRole",Objects.toString(ref.get("title"),""));seed.put("useProfile",true);seed.put("constraints",goals);}
        if(goals.length()>1500)throw bad("Hãy chọn ít đề xuất hơn để đưa vào lộ trình.");
        return seed; // No Profile or CareerPlan mutation; the existing setup requires review and creation.
    }

    static Analysis parse(ObjectMapper mapper,String raw) {
        var root=AiReplies.jsonObject(mapper,raw);
        String summary=AiReplies.text(root,"summary",1500);
        var list=new ArrayList<Difference>();
        for(var item:AiReplies.array(root,"differences")) {
            String skill=AiReplies.text(item,"skill",150), mine=AiReplies.text(item,"mine",500),reference=AiReplies.text(item,"reference",500),evidence=AiReplies.text(item,"evidence",500),action=AiReplies.text(item,"action",400);
            if(skill==null||mine==null||reference==null||evidence==null||action==null)throw new IllegalArgumentException("Incomplete comparison evidence");
            list.add(new Difference(skill,mine,reference,evidence,action));
        }
        if(summary==null||list.isEmpty()||list.size()>8)throw new IllegalArgumentException("Incomplete comparison");
        return new Analysis(summary,list);
    }
    private static String hash(String value) {
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException ex){throw new IllegalStateException(ex);}
    }
}
