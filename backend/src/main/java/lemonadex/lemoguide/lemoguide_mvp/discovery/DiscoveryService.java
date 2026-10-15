package lemonadex.lemoguide.lemoguide_mvp.discovery;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.*;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

@Service @RequiredArgsConstructor @Transactional
public class DiscoveryService {
    private final DiscoveryRepository repository;
    private final DiscoveryBank bank;
    private final ObjectMapper mapper;
    private final lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository accounts;
    public record Catalog(String kind, String title, String description, int total, String version, String minutes) {}
    /** For Holland items the scored type is withheld (dimension is null); the section tells the user how to answer. */
    public record QuestionView(String id, String dimension, String prompt, List<String> options, boolean adaptive,
                               String section, String instruction) {}
    public record Score(String dimension, String label, int score, int answered, String action) {}
    public record Review(String question, String selected, String correct, String explanation, boolean adaptive) {}
    public record Result(String summary, List<Score> scores, List<Review> review, String note, HollandBank.Profile holland, Adaptive adaptive) {}
    /** Extra reading of the adaptive AI test: the model's narrative, how many questions it took and how settled the code is. */
    public record Adaptive(String narrative, List<String> highlights, int questions, String confidence, boolean aiUnavailable) {}
    public record View(Long id, String kind, String title, String bankVersion, LocalDateTime createdAt,
                       LocalDateTime completedAt, int answered, int total, QuestionView question, Result result) {}
    public record Change(String label, int baseline, int previous, int latest, int fromBaseline, int fromPrevious) {}
    public record Progress(int attempts, LocalDateTime baselineAt, LocalDateTime latestAt, LocalDateTime suggestedReviewAt, List<Change> changes) {}

    @Transactional(readOnly = true)
    public List<Catalog> catalog() {
        return bank.all().stream().filter(d -> !d.retired())
            .map(d -> new Catalog(d.kind(), d.title(), d.description(), d.total(), d.version(), d.minutes())).toList();
    }

    public View start(String kind) {
        if (kind.equals(HollandAdaptive.KIND)) throw new AppException(ErrorCode.BAD_REQUEST, "Hãy bắt đầu bài này từ nút Trắc nghiệm với AI.");
        if (bank.get(kind).retired()) throw new AppException(ErrorCode.BAD_REQUEST, "Bài đánh giá này đã được thay bằng Trắc nghiệm Holland.");
        Long account = SecurityUtils.currentAccountId();
        // Serialize starts from multiple tabs so an account has one unfinished attempt per kind.
        accounts.lockById(account).orElseThrow(DiscoveryService::notFound);
        var existing = repository.findFirstByAccountIdAndKindAndCompletedAtIsNullOrderByIdDesc(account, kind);
        if (existing.isPresent()) return view(existing.get());
        var a = new DiscoveryAttempt();
        a.setAccountId(account); a.setKind(kind); a.setBankVersion(bank.get(kind).version());
        return view(repository.save(a));
    }
    @Transactional(readOnly = true)
    public View get(Long id) { return view(owned(id)); }
    @Transactional(readOnly = true)
    public List<View> summary() { return latest(SecurityUtils.currentAccountId()).stream().map(this::view).toList(); }
    /** Latest completed attempt per assessment; the retired interest reflection only stands in until a Holland result exists. */
    private List<DiscoveryAttempt> latest(Long accountId) {
        var out = new ArrayList<DiscoveryAttempt>();
        // Both Holland tests answer the same question; the more recent one stands for it.
        repository.findFirstByAccountIdAndKindAndCompletedAtIsNotNullOrderByIdDesc(accountId, HollandBank.KIND)
            .ifPresent(out::add);
        repository.findFirstByAccountIdAndKindAndCompletedAtIsNotNullOrderByIdDesc(accountId, HollandAdaptive.KIND).ifPresent(ai -> {
            if (out.isEmpty() || ai.getCompletedAt().isAfter(out.getFirst().getCompletedAt())) { out.clear(); out.add(ai); }
        });
        for (String kind : List.of("interests", "values", "skills")) {
            if (kind.equals("interests") && !out.isEmpty()) continue;
            repository.findFirstByAccountIdAndKindAndCompletedAtIsNotNullOrderByIdDesc(accountId, kind).ifPresent(out::add);
        }
        return out;
    }
    @Transactional(readOnly = true)
    public List<View> history() {
        return repository.findTop100ByAccountIdOrderByIdDesc(SecurityUtils.currentAccountId()).stream().map(this::view).toList();
    }
    public View answer(Long id, String questionId, int option) {
        var a = repository.lockOwned(id, SecurityUtils.currentAccountId()).orElseThrow(DiscoveryService::notFound);
        requireFixed(a);
        requireVersion(a);
        var answers = answers(a);
        // Safe retry after a lost response, including the final submission.
        if (Objects.equals(answers.get(questionId), option)) return view(a);
        if (a.getCompletedAt() != null) throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Bài đánh giá đã hoàn thành.");
        var next = bank.sequence(a.getKind(), answers).stream().filter(q -> !answers.containsKey(q.id())).findFirst().orElseThrow();
        if (!next.id().equals(questionId) || option < 0 || option >= next.options().size())
            throw new AppException(ErrorCode.BAD_REQUEST, "Câu trả lời không hợp lệ. Hãy tải lại bài đánh giá.");
        answers.put(questionId, option);
        a.setAnswersJson(mapper.writeValueAsString(answers));
        if (answers.size() == bank.get(a.getKind()).total()) {
            a.setResultJson(mapper.writeValueAsString(score(a.getKind(), answers)));
            a.setCompletedAt(LocalDateTime.now());
        }
        return view(repository.save(a));
    }
    /** Takes back the most recent answer of an unfinished attempt; naming it keeps a retried request from removing two. */
    public View undo(Long id, String questionId) {
        var a = repository.lockOwned(id, SecurityUtils.currentAccountId()).orElseThrow(DiscoveryService::notFound);
        requireFixed(a);
        requireVersion(a);
        if (a.getCompletedAt() != null) throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Bài đánh giá đã hoàn thành.");
        var answers = answers(a);
        if (!answers.containsKey(questionId)) return view(a);
        if (!questionId.equals(answers.sequencedKeySet().getLast()))
            throw new AppException(ErrorCode.BAD_REQUEST, "Chỉ có thể sửa câu trả lời gần nhất.");
        answers.remove(questionId);
        a.setAnswersJson(mapper.writeValueAsString(answers));
        return view(repository.save(a));
    }
    private DiscoveryAttempt owned(Long id) {
        return repository.findByIdAndAccountId(id, SecurityUtils.currentAccountId()).orElseThrow(DiscoveryService::notFound);
    }
    /** The adaptive AI test has its own answer endpoint. */
    private static void requireFixed(DiscoveryAttempt a) {
        if (HollandAdaptive.KIND.equals(a.getKind())) throw new AppException(ErrorCode.BAD_REQUEST, "Bài trắc nghiệm với AI dùng cách trả lời riêng. Hãy tải lại trang.");
    }
    private static AppException notFound() { return new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy bài đánh giá."); }
    private void requireVersion(DiscoveryAttempt a) {
        if (!bank.get(a.getKind()).version().equals(a.getBankVersion())) throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Bài đánh giá dùng phiên bản cũ. Vui lòng liên hệ hỗ trợ.");
    }
    private LinkedHashMap<String, Integer> answers(DiscoveryAttempt a) {
        var type = mapper.getTypeFactory().constructMapType(LinkedHashMap.class, String.class, Integer.class);
        return mapper.readValue(a.getAnswersJson(), type);
    }
    private Result result(DiscoveryAttempt a) { return a.getResultJson() == null ? null : mapper.readValue(a.getResultJson(), Result.class); }
    private View view(DiscoveryAttempt a) {
        var d = bank.get(a.getKind());
        var answers = answers(a);
        QuestionView question = null;
        if (a.getCompletedAt() == null) {
            requireVersion(a);
            question = bank.sequence(a.getKind(), answers).stream().filter(q -> !answers.containsKey(q.id())).findFirst()
                .map(q -> question(d, q)).orElse(null);
        }
        int answered = answers.size();
        if (HollandAdaptive.KIND.equals(a.getKind()) && a.getStateJson() != null)
            answered = mapper.readValue(a.getStateJson(), HollandAdaptive.State.class).answered().size();
        return new View(a.getId(), a.getKind(), d.title(), a.getBankVersion(), a.getCreatedAt(), a.getCompletedAt(), answered, d.total(), question, result(a));
    }
    private static QuestionView question(DiscoveryBank.Definition d, DiscoveryBank.Question q) {
        if (!q.section().isEmpty()) {
            var section = HollandBank.section(q.section());
            return new QuestionView(q.id(), null, q.prompt(), q.options(), false, section.title(), section.instruction());
        }
        String label = d.dimensions().stream().filter(dim -> dim.id().equals(q.dimension())).findFirst().orElseThrow().label();
        return new QuestionView(q.id(), label, q.prompt(), q.options(), !q.anchor(), null, null);
    }
    Result score(String kind, Map<String, Integer> answers) {
        var d = bank.get(kind);
        var sequence = bank.sequence(kind, answers);
        if (kind.equals(HollandBank.KIND)) return holland(sequence, answers);
        boolean skills = kind.equals("skills");
        var scores = d.dimensions().stream().map(dim -> {
            var questions = sequence.stream().filter(q -> q.dimension().equals(dim.id()) && (!skills || q.anchor())).toList();
            double points = questions.stream().mapToDouble(q -> skills ? (answers.get(q.id()) == q.correct() ? 1 : 0) : answers.get(q.id()) / 4.0).sum();
            return new Score(dim.id(), dim.label(), (int)Math.round(100 * points / questions.size()), questions.size(), dim.action());
        }).toList();
        var review = skills ? sequence.stream().map(q -> new Review(q.prompt(), q.options().get(answers.get(q.id())), q.options().get(q.correct()), q.explanation(), !q.anchor())).toList() : List.<Review>of();
        String summary;
        if (skills) {
            var weakest = scores.stream().min(Comparator.comparingInt(Score::score)).orElseThrow();
            summary = "Ưu tiên thực hành: " + weakest.label() + ". " + weakest.action();
        } else {
            var highest = scores.stream().mapToInt(Score::score).max().orElse(0);
            String labels = String.join(", ", scores.stream().filter(s -> s.score() == highest).map(Score::label).toList());
            summary = highest <= 25 ? "Bạn chưa thể hiện ưu tiên rõ rệt. Hãy thử thêm hoạt động thực tế và đánh giá lại khi có trải nghiệm mới."
                : "Những nhóm bạn ưu tiên ở lần này: " + labels + ". Hãy đối chiếu với trải nghiệm thực tế trước khi chọn hướng đi.";
        }
        String note = skills
            ? "Điểm 0–100 chỉ tính 9 câu nền cố định (3 câu mỗi kỹ năng). 3 câu thích ứng dùng để luyện tập, không tính vào so sánh. Đây là bài tình huống ngắn, chưa đại diện toàn bộ năng lực; làm lại có thể chịu ảnh hưởng ghi nhớ."
            : "Đây là công cụ tự phản ánh do LemoGuide biên soạn, chưa được chuẩn hóa tâm lý. Điểm thể hiện mức độ ưu tiên tự báo cáo, không phải năng lực hay mức phù hợp nghề nghiệp. Sở thích thay đổi không đồng nghĩa với tiến bộ.";
        return new Result(summary, scores, review, note, null, null);
    }
    private static Result holland(List<DiscoveryBank.Question> sequence, Map<String, Integer> answers) {
        var p = HollandBank.profile(sequence, answers);
        var scores = p.types().stream().map(t -> new Score(t.code(), t.code() + " · " + t.name(),
            (int) Math.round(100.0 * t.raw() / t.max()), 3 * HollandBank.PER_SECTION + HollandBank.SELF_ITEMS,
            HollandBank.TYPES.get(t.code()).action())).toList();
        String names = String.join(" – ", p.top().stream().map(HollandBank.TypeInfo::name).toList());
        String summary = "Mã Holland của bạn là " + p.code() + " (" + names + ")."
            + (p.alternatives().size() > 3 ? " Nhiều nhóm bằng điểm nhau nên thứ tự các chữ chưa rõ nét."
                : p.alternatives().size() > 1 ? " Do bằng điểm, mã cũng có thể đọc là " + String.join(", ", p.alternatives().subList(1, p.alternatives().size())) + "." : "");
        String note = "Bài do LemoGuide biên soạn theo cấu trúc Self-Directed Search của John Holland (hoạt động, năng lực, nghề nghiệp, tự đánh giá), "
            + "chưa được chuẩn hóa trên mẫu người Việt. Mã Holland mô tả sở thích nghề nghiệp, không đo năng lực hay bảo đảm thành công; "
            + "mã nghề tham khảo cách phân loại của O*NET. Hãy dùng kết quả như gợi ý để tìm hiểu và trải nghiệm thực tế.";
        return new Result(summary, scores, List.of(), note, p, null);
    }
    @Transactional(readOnly = true)
    public Progress progress() {
        return progress(SecurityUtils.currentAccountId());
    }
    /** Server-side profile aggregation; the HTTP endpoint always uses the caller's account. */
    @Transactional(readOnly = true)
    public Progress progress(Long accountId) {
        var attempts = repository.findByAccountIdAndKindAndBankVersionAndCompletedAtIsNotNullOrderByCompletedAtAscIdAsc(
            accountId, "skills", DiscoveryBank.VERSION);
        if (attempts.isEmpty()) return new Progress(0, null, null, null, List.of());
        var baseline = attempts.getFirst(); var latest = attempts.getLast();
        var previous = attempts.get(Math.max(0, attempts.size() - 2));
        var firstScores = result(baseline).scores(); var previousScores = result(previous).scores();
        var changes = result(latest).scores().stream().map(s -> {
            int first = firstScores.stream().filter(x -> x.dimension().equals(s.dimension())).findFirst().orElseThrow().score();
            int prev = previousScores.stream().filter(x -> x.dimension().equals(s.dimension())).findFirst().orElseThrow().score();
            return new Change(s.label(), first, prev, s.score(), s.score() - first, s.score() - prev);
        }).toList();
        return new Progress(attempts.size(), baseline.getCompletedAt(), latest.getCompletedAt(), latest.getCompletedAt().plusDays(14), changes);
    }
    /** Only completed results; no raw answers or unverified skill claims are written into the profile. */
    @Transactional(readOnly = true)
    public String context(Long accountId) {
        var out = new StringBuilder();
        for (var a : latest(accountId)) {
            var r = result(a);
            out.append("\n[KHÁM PHÁ BẢN THÂN: ").append(bank.get(a.getKind()).title()).append("; ").append(a.getCompletedAt()).append("]\n")
                .append(r.summary()).append('\n');
            r.scores().forEach(s -> out.append(s.label()).append(": ").append(s.score()).append("/100\n"));
            if (r.holland() != null) {
                out.append("Độ phân hóa: ").append(r.holland().differentiationLevel()).append("; độ nhất quán: ").append(r.holland().consistencyLevel()).append('\n')
                    .append(r.adaptive() != null && r.adaptive().narrative() != null ? "Nhận xét: " + r.adaptive().narrative() + "\n" : "")
                    .append("Nhóm nghề gợi ý theo mã: ").append(String.join(", ", r.holland().careers().stream().limit(8).map(c -> c.name() + " (" + c.code() + ")").toList())).append('\n');
            }
            out.append(r.note()).append('\n');
        }
        return out.toString();
    }
}
