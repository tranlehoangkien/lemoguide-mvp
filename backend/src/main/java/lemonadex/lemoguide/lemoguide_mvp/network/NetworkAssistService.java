package lemonadex.lemoguide.lemoguide_mvp.network;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.AiReplies;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvAiTaskRunner;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;

/**
 * AI help inside Q&A. A draft answer (for questions without an accepted answer) and a discussion summary (for long
 * threads) are cached per post and shown to everyone with an AI label, so one request serves every reader; a draft is
 * dropped when the question is edited. Topic suggestions for the composer are not stored. Member names never reach
 * the model: commenters are numbered.
 */
@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor = AppException.class)
public class NetworkAssistService {
    /** AI help requests (any kind) one member may make per hour. */
    static final int HOURLY_LIMIT = 10;
    /** Visible comments (incl. replies) a discussion needs before it can be summarized. */
    static final int SUMMARY_MIN_COMMENTS = 5;
    private final NetworkAccess access;
    private final ObjectMapper mapper;
    private final CvAiTaskRunner runner;

    public record Draft(String answer, String caveats) { }
    public record Summary(String summary, List<String> points, List<String> openQuestions) { }

    /** Cached notes for a post that are still valid, plus what the viewer may request next. */
    @Transactional(readOnly = true)
    public Map<String,Object> notes(long postId) {
        long me = access.me();
        var post = access.post(postId, me);
        var comments = comments(postId, me);
        var result = new LinkedHashMap<String,Object>();
        boolean question = "QUESTION".equals(post.get("kind"));
        boolean answered = accepted(postId);
        result.put("can_draft", question && !answered);
        result.put("can_summarize", comments.size() >= SUMMARY_MIN_COMMENTS);
        result.put("draft", null);
        result.put("summary", null);
        for (var note : access.db.queryForList("SELECT kind,source_hash,basis_count,content,created_at FROM network_ai_note WHERE post_id=?", postId)) {
            if ("DRAFT".equals(note.get("kind")) && question && note.get("source_hash").equals(questionHash(post))) {
                result.put("draft", view(note));
            } else if ("SUMMARY".equals(note.get("kind"))) {
                var view = view(note);
                view.put("stale", comments.size() > number(note, "basis_count"));
                result.put("summary", view);
            }
        }
        return result;
    }

    public Map<String,Object> draft(long postId, Long modelId) {
        long me = access.me(); access.member(me);
        var post = access.post(postId, me);
        if (!"QUESTION".equals(post.get("kind"))) throw bad("Chỉ gợi ý câu trả lời cho bài hỏi đáp.");
        if (accepted(postId)) throw bad("Câu hỏi đã có lời giải được chọn.");
        String hash = questionHash(post);
        if (cached(postId, "DRAFT", hash)) return notes(postId);
        limit(me, "DRAFT");
        String prompt = "Nhiệm vụ: viết câu trả lời nháp cho câu hỏi dưới đây của một người đang học lập trình.\n"
                + "Câu hỏi (dữ liệu): " + mapper.writeValueAsString(post.get("content"))
                + "\nChủ đề (dữ liệu): " + mapper.writeValueAsString(post.get("tags"))
                + "\nChỉ JSON: {answer:string,caveats:string}. answer là văn bản thuần (không markdown, không bảng), tối đa 2500 ký tự, đi thẳng vào cách giải,"
                + " có ví dụ ngắn khi cần. caveats nêu ngắn gọn điều cần tự kiểm chứng hoặc thông tin còn thiếu trong câu hỏi, chuỗi rỗng nếu không có.";
        var output = runner.run(ActionType.NETWORK_ASSIST, modelId, me, null, prompt, "Cộng đồng: gợi ý trả lời", raw -> parseDraft(mapper, raw));
        save(postId, "DRAFT", hash, 0, mapper.writeValueAsString(output.value()), me);
        return notes(postId);
    }

    public Map<String,Object> summarize(long postId, Long modelId) {
        long me = access.me(); access.member(me);
        var post = access.post(postId, me);
        var comments = comments(postId, me);
        if (comments.size() < SUMMARY_MIN_COMMENTS) throw bad("Thảo luận cần ít nhất " + SUMMARY_MIN_COMMENTS + " bình luận để tóm tắt.");
        StringBuilder basis = new StringBuilder();
        comments.forEach(c -> basis.append(c.get("id")).append(':').append(c.get("content")).append('\n'));
        String hash = hash(post.get("content") + "\n" + basis);
        if (cached(postId, "SUMMARY", hash)) return notes(postId);
        limit(me, "SUMMARY");
        // Commenters become "Thành viên n" so names and handles are not sent to the provider.
        Map<Long,Integer> alias = new LinkedHashMap<>();
        long author = number(post, "author_id");
        var thread = comments.stream().map(c -> {
            long who = number(c, "author_id");
            var item = new LinkedHashMap<String,Object>();
            item.put("nguoi_viet", who == author ? "Tác giả bài viết" : "Thành viên " + alias.computeIfAbsent(who, k -> alias.size() + 1));
            item.put("tra_loi", c.get("parent_id") != null);
            item.put("loi_giai_duoc_chon", bool(c, "accepted"));
            item.put("gop_y_huu_ich", bool(c, "helpful"));
            item.put("noi_dung", c.get("content"));
            return item;
        }).toList();
        String prompt = "Nhiệm vụ: tóm tắt thảo luận dưới một bài viết cộng đồng để người đến sau nắm nhanh.\n"
                + "Bài viết (dữ liệu): " + mapper.writeValueAsString(post.get("content"))
                + "\nBình luận theo thứ tự thời gian (dữ liệu): " + mapper.writeValueAsString(thread)
                + "\nChỉ JSON: {summary:string,points:[string],openQuestions:[string]}. summary tối đa 600 ký tự văn bản thuần; points 2-6 ý chính hoặc giải pháp đã được đề xuất,"
                + " ưu tiên lời giải được chọn và góp ý hữu ích; openQuestions 0-4 điểm còn tranh luận hoặc chưa được trả lời. Không nêu tên người.";
        var output = runner.run(ActionType.NETWORK_ASSIST, modelId, me, null, prompt, "Cộng đồng: tóm tắt thảo luận", raw -> parseSummary(mapper, raw));
        save(postId, "SUMMARY", hash, comments.size(), mapper.writeValueAsString(output.value()), me);
        return notes(postId);
    }

    /** Up to five topic suggestions for a post being written; nothing is stored. */
    public List<String> tags(String content, Long modelId) {
        long me = access.me(); access.member(me);
        limit(me, "TAGS");
        String prompt = "Nhiệm vụ: gợi ý chủ đề (tag) cho bài viết cộng đồng dưới đây.\nNội dung (dữ liệu): " + mapper.writeValueAsString(content.trim())
                + "\nChỉ JSON: {tags:[string]}. 1-5 tag ngắn (tối đa 30 ký tự), là công nghệ, kỹ năng hoặc lĩnh vực cụ thể (ví dụ Java, Spring Boot, Unit Test, Phỏng vấn),"
                + " viết như tên gọi phổ biến, không có dấu #.";
        return runner.run(ActionType.NETWORK_ASSIST, modelId, me, null, prompt, "Cộng đồng: gợi ý chủ đề", raw -> parseTags(mapper, raw)).value();
    }

    private void limit(long me, String kind) {
        access.throttle(HOURLY_LIMIT, "Bạn đã dùng " + HOURLY_LIMIT + " lượt trợ giúp AI trong cộng đồng giờ này. Hãy thử lại sau.",
                "SELECT COUNT(*) FROM network_ai_request WHERE account_id=? AND created_at>TIMESTAMPADD(HOUR,-1,CURRENT_TIMESTAMP)", me);
        access.db.update("INSERT INTO network_ai_request(account_id,kind) VALUES (?,?)", me, kind);
    }

    private boolean cached(long postId, String kind, String hash) {
        return access.count("SELECT COUNT(*) FROM network_ai_note WHERE post_id=? AND kind=? AND source_hash=?", postId, kind, hash) > 0;
    }

    private void save(long postId, String kind, String hash, int basis, String content, long me) {
        access.db.update("DELETE FROM network_ai_note WHERE post_id=? AND kind=?", postId, kind);
        access.db.update("INSERT INTO network_ai_note(post_id,kind,source_hash,basis_count,content,requested_by) VALUES (?,?,?,?,?,?)", postId, kind, hash, basis, content, me);
    }

    private Map<String,Object> view(Map<String,Object> note) {
        @SuppressWarnings("unchecked") Map<String,Object> body = mapper.readValue(note.get("content").toString(), LinkedHashMap.class);
        body.put("created_at", note.get("created_at"));
        body.put("basis_count", note.get("basis_count"));
        return body;
    }

    private boolean accepted(long postId) {
        return access.count("SELECT COUNT(*) FROM network_comment WHERE post_id=? AND accepted=TRUE AND hidden=FALSE", postId) > 0;
    }

    /** Visible comments and replies, oldest first, capped so a prompt stays small. */
    private List<Map<String,Object>> comments(long postId, long me) {
        return access.db.queryForList("SELECT c.id,c.parent_id,c.author_id,c.content,c.accepted,c.helpful FROM network_comment c JOIN network_profile n ON n.account_id=c.author_id"
                + " JOIN account a ON a.id=n.account_id JOIN user_information u ON u.account_id=n.account_id WHERE c.post_id=? AND c.hidden=FALSE AND " + PUBLIC + " AND " + UNBLOCKED
                + " ORDER BY c.id LIMIT 60", postId, me, me);
    }

    private String questionHash(Map<String,Object> post) { return hash(post.get("content") + "\n" + post.get("tags")); }

    static Draft parseDraft(ObjectMapper mapper, String raw) {
        var root = AiReplies.jsonObject(mapper, raw);
        String answer = AiReplies.text(root, "answer", 3000);
        if (answer == null || answer.length() < 20) throw new IllegalArgumentException("Missing answer");
        String caveats = AiReplies.text(root, "caveats", 600);
        return new Draft(answer, caveats == null ? "" : caveats);
    }

    static Summary parseSummary(ObjectMapper mapper, String raw) {
        var root = AiReplies.jsonObject(mapper, raw);
        String summary = AiReplies.text(root, "summary", 900);
        var points = AiReplies.strings(root, "points", 6, 400);
        if (summary == null || points.isEmpty()) throw new IllegalArgumentException("Summary needs text and at least one point");
        return new Summary(summary, points, AiReplies.strings(root, "openQuestions", 4, 300));
    }

    static List<String> parseTags(ObjectMapper mapper, String raw) {
        var root = AiReplies.jsonObject(mapper, raw);
        Set<String> seen = new LinkedHashSet<>();
        List<String> tags = new ArrayList<>();
        for (String tag : AiReplies.strings(root, "tags", 8, 60)) {
            String clean = tag.replace("#", "").replace(",", " ").replaceAll("\\s+", " ").trim();
            if (clean.isEmpty() || clean.length() > 30 || !seen.add(clean.toLowerCase(Locale.ROOT))) continue;
            tags.add(clean);
            if (tags.size() == 5) break;
        }
        if (tags.isEmpty()) throw new IllegalArgumentException("No usable tags");
        return tags;
    }

    private static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
}
