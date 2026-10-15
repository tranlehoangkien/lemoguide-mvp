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
public class NetworkPostService {
    private final NetworkAccess access;
    /** What a FEEDBACK post can ask reviewers to look at. */
    static final List<String> ASPECTS = List.of("CODE","UI","README","ARCHITECTURE","TESTING","IDEA");

    @Transactional(readOnly=true)
    public Slice feed(String mode,String tag,Long author,long before) {
        long me=access.me();
        if(!Set.of("recommended","all","following","saved").contains(mode) || before<0) throw bad("Bộ lọc không hợp lệ.");
        List<Object> args=new ArrayList<>(List.of(me,me));
        String filter="p.hidden=FALSE AND "+PUBLIC+" AND "+UNBLOCKED;
        boolean community=false;
        if(mode.equals("recommended") && author==null) {
            var preferences=access.db.queryForList("SELECT topics FROM network_profile WHERE account_id=?",String.class,me);
            var topics=preferences.stream().filter(Objects::nonNull).flatMap(s->Arrays.stream(s.split(","))).map(String::trim).filter(s->!s.isEmpty()).distinct().limit(10).toList();
            String preferred="EXISTS (SELECT 1 FROM network_follow f WHERE f.follower_id=? AND f.following_id=p.author_id)";
            List<Object> preferenceArgs=new ArrayList<>(List.of(me));
            for(String topic:topics) {
                preferred+=" OR LOWER(CONCAT(',',REPLACE(p.tags,', ',','),',')) LIKE ? ESCAPE '!'";
                preferenceArgs.add("%,"+topic.toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+",%");
            }
            var countArgs=new ArrayList<>(args);countArgs.addAll(preferenceArgs);
            // Decide the source independently of the cursor so pagination never switches datasets.
            community=access.count("SELECT COUNT(*) FROM network_post p JOIN network_profile n ON n.account_id=p.author_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE "+filter+" AND ("+preferred+")",countArgs.toArray())==0;
            if(!community){filter+=" AND ("+preferred+")";args.addAll(preferenceArgs);}
        }
        if(before>0){filter+=" AND p.id<?";args.add(before);}
        if(author!=null){access.person(author,me);filter+=" AND p.author_id=?";args.add(author);}
        if(mode.equals("following")){filter+=" AND EXISTS (SELECT 1 FROM network_follow f WHERE f.follower_id=? AND f.following_id=p.author_id)";args.add(me);}
        if(mode.equals("saved")){filter+=" AND EXISTS (SELECT 1 FROM network_reaction r WHERE r.account_id=? AND r.post_id=p.id AND r.kind='SAVE')";args.add(me);}
        if(!clean(tag).isEmpty()){filter+=" AND LOWER(p.tags) LIKE ? ESCAPE '!'";args.add("%"+clean(tag).toLowerCase(Locale.ROOT).replace("!","!!").replace("%","!%").replace("_","!_")+"%");}
        var rows=access.db.queryForList("SELECT p.* FROM network_post p JOIN network_profile n ON n.account_id=p.author_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE "+filter+" ORDER BY p.id DESC LIMIT 21",args.toArray());
        var shown=rows.stream().limit(20).map(row->enrich(row,me)).toList();
        for(var row:shown)row.put("feed_source",mode.equals("recommended") ? community ? "COMMUNITY" : "PERSONALIZED" : "COMMUNITY");
        return new Slice(shown,rows.size()>20?number(shown.getLast(),"id"):null);
    }

    @Transactional(readOnly=true)
    public Map<String,Object> get(long id) {long me=access.me();return enrich(access.post(id,me),me);}

    private Map<String,Object> enrich(Map<String,Object> row,long me) {
        long id=number(row,"id"),author=number(row,"author_id");
        row.put("author",access.person(author,me)); row.put("mine",author==me);
        row.put("likes",access.count("SELECT COUNT(*) FROM network_reaction WHERE post_id=? AND kind='LIKE'",id));
        row.put("liked",access.count("SELECT COUNT(*) FROM network_reaction WHERE post_id=? AND kind='LIKE' AND account_id=?",id,me)>0);
        row.put("saved",access.count("SELECT COUNT(*) FROM network_reaction WHERE post_id=? AND kind='SAVE' AND account_id=?",id,me)>0);
        row.put("comment_count",access.count("SELECT COUNT(*) FROM network_comment c JOIN network_profile n ON n.account_id=c.author_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE c.post_id=? AND c.hidden=FALSE AND "+PUBLIC+" AND "+UNBLOCKED,id,me,me));
        Object project=row.remove("project_id");
        row.put("project",project==null?null:access.items(author,true).stream().filter(item->item.get("kind").equals("PROJECT") && number(item,"id")==((Number)project).longValue()).findFirst().orElse(null));
        Object task=row.remove("task_id");
        var milestones=task==null?List.<Map<String,Object>>of():access.db.queryForList("SELECT t.id,t.title,t.success_criteria,t.week_number FROM career_task t JOIN career_plan p ON p.id=t.plan_id WHERE t.id=? AND p.account_id=? AND t.completed=TRUE",task,author);
        row.put("milestone",milestones.isEmpty()?null:milestones.getFirst());
        return row;
    }

    public Map<String,Object> create(PostInput request) {
        long me=access.me();access.member(me);
        access.throttle(10,"Bạn đã đăng 10 bài trong một giờ. Hãy thử lại sau.","SELECT COUNT(*) FROM network_post WHERE author_id=? AND created_at>TIMESTAMPADD(HOUR,-1,CURRENT_TIMESTAMP)",me);
        String image=imageUrl(request.imageUrl());requireUrl(request.resourceUrl());
        boolean project=request.kind().equals("PROJECT") || request.kind().equals("FEEDBACK");
        if(project && request.projectId()==null) throw bad("Hãy chọn dự án công khai của bạn.");
        String aspects=request.kind().equals("FEEDBACK")?aspects(request.feedbackAspects()):null;
        if(request.kind().equals("MILESTONE") && request.taskId()==null) throw bad("Hãy chọn cột mốc đã hoàn thành.");
        if(request.projectId()!=null && access.items(me,true).stream().noneMatch(item->item.get("kind").equals("PROJECT") && number(item,"id")==request.projectId())) throw bad("Dự án phải thuộc hồ sơ của bạn và được chọn chia sẻ.");
        if(request.taskId()!=null && access.count("SELECT COUNT(*) FROM career_task t JOIN career_plan p ON p.id=t.plan_id WHERE t.id=? AND p.account_id=? AND t.completed=TRUE",request.taskId(),me)==0) throw bad("Chỉ chia sẻ cột mốc bạn đã hoàn thành.");
        long id=access.insert("INSERT INTO network_post(author_id,kind,content,tags,image_url,resource_url,project_id,task_id,feedback_aspects) VALUES (?,?,?,?,?,?,?,?,?)",
                me,request.kind(),request.content().trim(),clean(request.tags()),image,safeUrl(request.resourceUrl()),request.projectId(),request.taskId(),aspects);
        access.mentions(request.content(),null,me,id);
        return get(id);
    }

    /** Normalized comma list of known aspects in canonical order; at least one is required. */
    static String aspects(String raw) {
        Set<String> picked=new HashSet<>();
        for(String part:clean(raw).toUpperCase(Locale.ROOT).split(",")) if(!part.isBlank()) picked.add(part.trim());
        if(picked.isEmpty()) throw bad("Hãy chọn ít nhất một khía cạnh cần góp ý.");
        if(!ASPECTS.containsAll(picked)) throw bad("Khía cạnh góp ý không hợp lệ.");
        return String.join(",",ASPECTS.stream().filter(picked::contains).toList());
    }

    /** Authors can fix text, topics and links; the kind and its attached project or milestone stay fixed. */
    public Map<String,Object> edit(long id,PostEdit request) {
        long me=access.me();access.member(me);
        var rows=access.db.queryForList("SELECT content FROM network_post WHERE id=? AND author_id=? AND hidden=FALSE FOR UPDATE",id,me);
        if(rows.isEmpty()) throw missing();
        String image=imageUrl(request.imageUrl());requireUrl(request.resourceUrl());
        access.db.update("UPDATE network_post SET content=?,tags=?,image_url=?,resource_url=?,edited_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                request.content().trim(),clean(request.tags()),image,safeUrl(request.resourceUrl()),id);
        access.mentions(request.content(),(String)rows.getFirst().get("content"),me,id);
        return get(id);
    }

    public void remove(long id) {
        if(access.db.update("UPDATE network_post SET hidden=TRUE,updated_at=CURRENT_TIMESTAMP WHERE id=? AND author_id=?",id,access.me())==0) throw missing();
    }

    public void react(long id,String kind,boolean enabled) {
        long me=access.me();
        if(!Set.of("LIKE","SAVE").contains(kind)) throw bad("Tương tác không hợp lệ.");
        if(!enabled){access.db.update("DELETE FROM network_reaction WHERE post_id=? AND account_id=? AND kind=?",id,me,kind);return;}
        access.member(me);var post=access.post(id,me);
        if(access.db.update("INSERT IGNORE INTO network_reaction(post_id,account_id,kind) VALUES (?,?,?)",id,me,kind)>0 && kind.equals("LIKE")) access.notify(number(post,"author_id"),me,"LIKE",id);
    }

    private static final String COMMENT_ROW="SELECT c.id,c.parent_id,c.author_id,c.content,c.accepted,c.helpful,c.created_at,c.edited_at,u.full_name,n.handle,u.avatar_url FROM network_comment c JOIN network_profile n ON n.account_id=c.author_id JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE c.post_id=? AND c.hidden=FALSE AND "+PUBLIC+" AND "+UNBLOCKED;

    /** A page of top-level comments (newest first), each with all of its visible replies (oldest first). */
    @Transactional(readOnly=true)
    public Slice comments(long id,long before) {
        long me=access.me();access.post(id,me);
        var rows=access.db.queryForList(COMMENT_ROW+" AND c.parent_id IS NULL AND (?=0 OR c.id<?) ORDER BY c.id DESC LIMIT 21",id,me,me,before,before);
        var shown=rows.stream().limit(20).toList();
        Map<Long,List<Map<String,Object>>> replies=new HashMap<>();
        if(!shown.isEmpty()) {
            String marks=String.join(",",Collections.nCopies(shown.size(),"?"));
            List<Object> args=new ArrayList<>(List.of(id,me,me));shown.forEach(r->args.add(number(r,"id")));
            access.db.queryForList(COMMENT_ROW+" AND c.parent_id IN ("+marks+") ORDER BY c.id",args.toArray())
                    .forEach(r->{r.put("mine",number(r,"author_id")==me);replies.computeIfAbsent(number(r,"parent_id"),k->new ArrayList<>()).add(r);});
        }
        shown.forEach(row->{row.put("mine",number(row,"author_id")==me);row.put("replies",replies.getOrDefault(number(row,"id"),List.of()));});
        return new Slice(shown,rows.size()>20?number(rows.get(19),"id"):null);
    }

    public void comment(long id,CommentInput request) {
        long me=access.me();access.member(me);var post=access.post(id,me);
        access.throttle(30,"Bạn bình luận quá nhanh. Hãy thử lại sau ít phút.","SELECT COUNT(*) FROM network_comment WHERE author_id=? AND created_at>TIMESTAMPADD(MINUTE,-10,CURRENT_TIMESTAMP)",me);
        Long parent=null;long parentAuthor=0;
        if(request.parentId()!=null) {
            var rows=access.db.queryForList("SELECT id,parent_id,author_id FROM network_comment WHERE id=? AND post_id=? AND hidden=FALSE",request.parentId(),id);
            if(rows.isEmpty()) throw missing();
            var row=rows.getFirst();
            // Replying to a reply attaches to the same top-level comment: threads stay one level deep.
            parent=row.get("parent_id")==null?number(row,"id"):number(row,"parent_id");
            parentAuthor=number(row,"author_id");access.person(parentAuthor==me?me:parentAuthor,me);
        }
        access.db.update("INSERT INTO network_comment(post_id,author_id,content,parent_id) VALUES (?,?,?,?)",id,me,request.content().trim(),parent);
        long postAuthor=number(post,"author_id");
        if(parent!=null && parentAuthor!=postAuthor) access.notify(parentAuthor,me,"REPLY",id);
        access.notify(postAuthor,me,parent!=null && parentAuthor==postAuthor?"REPLY":"COMMENT",id);
        access.mentions(request.content(),null,me,id);
    }

    public void editComment(long id,long commentId,String content) {
        long me=access.me();access.member(me);access.post(id,me);
        var rows=access.db.queryForList("SELECT content FROM network_comment WHERE id=? AND post_id=? AND author_id=? AND hidden=FALSE FOR UPDATE",commentId,id,me);
        if(rows.isEmpty()) throw missing();
        access.db.update("UPDATE network_comment SET content=?,edited_at=CURRENT_TIMESTAMP WHERE id=?",content.trim(),commentId);
        access.mentions(content,(String)rows.getFirst().get("content"),me,id);
    }

    public void removeComment(long id,long commentId) {
        if(access.db.update("UPDATE network_comment SET hidden=TRUE,accepted=FALSE WHERE id=? AND post_id=? AND author_id=?",commentId,id,access.me())==0) throw missing();
    }

    public void accept(long id,long commentId,boolean enabled) {
        long me=access.me();var post=access.post(id,me);
        if(number(post,"author_id")!=me || !post.get("kind").equals("QUESTION")) throw denied("Chỉ tác giả câu hỏi được chọn lời giải.");
        access.db.queryForList("SELECT id FROM network_post WHERE id=? FOR UPDATE",id);
        var rows=access.db.queryForList("SELECT author_id FROM network_comment WHERE id=? AND post_id=? AND hidden=FALSE AND parent_id IS NULL",commentId,id);
        if(rows.isEmpty()) throw missing();access.person(number(rows.getFirst(),"author_id"),me);
        long answerer=number(rows.getFirst(),"author_id");
        boolean was=access.count("SELECT COUNT(*) FROM network_comment WHERE id=? AND accepted=TRUE",commentId)>0;
        access.db.update("UPDATE network_comment SET accepted=FALSE WHERE post_id=?",id);
        if(enabled) access.db.update("UPDATE network_comment SET accepted=TRUE WHERE id=?",commentId);
        if(enabled && !was) access.notify(answerer,me,"ANSWER_ACCEPTED",id);
    }

    /** On a FEEDBACK post the author marks any number of top-level comments by others as helpful feedback. */
    public void helpful(long id,long commentId,boolean enabled) {
        long me=access.me();var post=access.post(id,me);
        if(number(post,"author_id")!=me || !post.get("kind").equals("FEEDBACK")) throw denied("Chỉ tác giả bài nhờ góp ý được đánh dấu góp ý hữu ích.");
        var rows=access.db.queryForList("SELECT author_id,helpful FROM network_comment WHERE id=? AND post_id=? AND hidden=FALSE AND parent_id IS NULL FOR UPDATE",commentId,id);
        if(rows.isEmpty()) throw missing();
        long reviewer=number(rows.getFirst(),"author_id");
        if(reviewer==me) throw bad("Không thể tự đánh dấu góp ý của chính bạn.");
        access.person(reviewer,me);
        access.db.update("UPDATE network_comment SET helpful=? WHERE id=?",enabled,commentId);
        if(enabled && !bool(rows.getFirst(),"helpful")) access.notify(reviewer,me,"FEEDBACK_HELPFUL",id);
    }
}
