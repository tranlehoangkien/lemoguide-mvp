package lemonadex.lemoguide.lemoguide_mvp.discovery;

import java.util.*;
import org.springframework.stereotype.Component;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.*;

/** Holland inventory, original reflection prompts and workplace scenarios; none is a normed psychometric test. */
@Component
public class DiscoveryBank {
    /** Version of the reflection and skill banks; the Holland bank carries its own. */
    public static final String VERSION = "foundation-v1";
    public record Dimension(String id, String label, String action) {}
    public record Question(String id, String dimension, String prompt, List<String> options,
                           int correct, String explanation, boolean anchor, String section) {}
    /** A retired definition can no longer be started; its attempts stay readable and resumable. */
    public record Definition(String kind, String title, String description, List<Dimension> dimensions,
                             List<Question> questions, int total, String version, String minutes, boolean retired) {}
    private final Map<String, Definition> definitions = new LinkedHashMap<>();
    private static final List<String> INTEREST_SCALE = List.of("Hoàn toàn không thích", "Ít thích", "Trung lập", "Khá thích", "Rất thích");
    private static final List<String> VALUE_SCALE = List.of("Không quan trọng", "Ít quan trọng", "Trung lập", "Quan trọng", "Rất quan trọng");

    public DiscoveryBank() {
        var holland = HollandBank.questions();
        definitions.put(HollandBank.KIND, new Definition(HollandBank.KIND, "Trắc nghiệm Holland (RIASEC)",
            "Tìm mã Holland 3 chữ qua sở thích hoạt động, năng lực, nghề nghiệp và tự đánh giá; gợi ý nhóm nghề phù hợp.",
            HollandBank.TYPES.values().stream().map(t -> new Dimension(t.code(), t.name(), t.action())).toList(),
            holland, holland.size(), HollandBank.VERSION, "15–20", false));
        // Started from its own endpoint (AdaptiveHollandService), so hidden from the catalog; registered for history and summary.
        definitions.put(HollandAdaptive.KIND, new Definition(HollandAdaptive.KIND, "Trắc nghiệm Holland với AI",
            "Trò chuyện với AI: câu hỏi thích ứng theo câu trả lời, dừng khi đủ thông tin để xác định mã Holland.",
            HollandBank.TYPES.values().stream().map(t -> new Dimension(t.code(), t.name(), t.action())).toList(),
            List.of(), HollandAdaptive.MAX_TURNS, HollandAdaptive.VERSION, "5–10", true));
        var interests = List.of(
            new Dimension("R", "Thực hành & kỹ thuật", "Thử một dự án lắp ráp, vận hành hoặc kiểm thử sản phẩm để khám phá sở thích thực hành."),
            new Dimension("I", "Phân tích & nghiên cứu", "Thử phân tích một bộ dữ liệu hoặc tìm nguyên nhân của một vấn đề thực tế."),
            new Dimension("A", "Sáng tạo & biểu đạt", "Tạo một thiết kế, bài viết hoặc ý tưởng sản phẩm và xin phản hồi."),
            new Dimension("S", "Hỗ trợ & kết nối", "Thử hướng dẫn một người khác học kỹ năng mới hoặc tham gia hoạt động cộng đồng."),
            new Dimension("E", "Dẫn dắt & thuyết phục", "Thử điều phối một dự án nhỏ hoặc trình bày đề xuất trước nhóm."),
            new Dimension("C", "Tổ chức & quy trình", "Thử xây dựng bảng theo dõi, quy trình hoặc kiểm tra chất lượng dữ liệu."));
        reflection("interests", "Sở thích nghề nghiệp", "Khám phá sáu nhóm hoạt động bạn muốn trải nghiệm, tham khảo cách phân nhóm RIASEC.", interests, new String[][] {
            {"Tôi thích trực tiếp thao tác với công cụ để tạo ra sản phẩm.", "Tôi thích tìm cách sửa một thiết bị hoặc hệ thống bị lỗi.", "Tôi muốn dành một buổi thử nghiệm một quy trình kỹ thuật mới."},
            {"Tôi thích tìm bằng chứng trước khi đưa ra kết luận.", "Tôi thích đào sâu để hiểu vì sao một hiện tượng xảy ra.", "Tôi muốn nghiên cứu một câu hỏi chưa có lời giải rõ ràng."},
            {"Tôi thích biến ý tưởng thành hình ảnh, câu chuyện hoặc thiết kế.", "Tôi thích tìm cách diễn đạt mới cho một thông điệp quen thuộc.", "Tôi muốn làm một sản phẩm cho phép thể hiện phong cách riêng."},
            {"Tôi thích giúp người khác hiểu một vấn đề khó.", "Tôi thích lắng nghe để hỗ trợ người đang gặp trở ngại.", "Tôi muốn tổ chức một buổi chia sẻ kiến thức cho cộng đồng."},
            {"Tôi thích thuyết phục mọi người thử một ý tưởng mới.", "Tôi thích nhận trách nhiệm dẫn dắt nhóm đến mục tiêu.", "Tôi muốn thương lượng để các bên cùng thống nhất một đề xuất."},
            {"Tôi thích sắp xếp thông tin rõ ràng và dễ kiểm tra.", "Tôi thích làm việc có kế hoạch và theo dõi chi tiết.", "Tôi muốn cải thiện một quy trình để giảm sai sót lặp lại."}
        }, INTEREST_SCALE);
        var values = List.of(
            new Dimension("autonomy", "Tự chủ", "Tìm hiểu mức độ tự quyết về cách làm việc khi trao đổi với nhà tuyển dụng."),
            new Dimension("growth", "Học hỏi", "Ưu tiên môi trường có người hướng dẫn và thời gian phát triển kỹ năng."),
            new Dimension("impact", "Đóng góp", "Xác định nhóm người hoặc vấn đề bạn muốn tạo ảnh hưởng tích cực."),
            new Dimension("security", "Ổn định & đãi ngộ", "Làm rõ nhu cầu thu nhập, hợp đồng và mức độ ổn định bạn mong muốn."),
            new Dimension("balance", "Cân bằng", "Viết ra giới hạn giờ làm, di chuyển và thời gian cá nhân của bạn."),
            new Dimension("belonging", "Gắn kết", "Tìm hiểu cách đội nhóm phản hồi, hợp tác và giải quyết bất đồng."));
        reflection("values", "Giá trị & động lực", "Làm rõ điều bạn ưu tiên ở công việc và môi trường làm việc.", values, new String[][] {
            {"Được tự chọn cách thực hiện công việc quan trọng với tôi.", "Được chủ động quyết định thứ tự công việc quan trọng với tôi.", "Tôi ưu tiên vai trò cho phép tự thử nghiệm giải pháp."},
            {"Có cơ hội học điều mới thường xuyên quan trọng với tôi.", "Được nhận phản hồi để cải thiện quan trọng với tôi.", "Tôi ưu tiên công việc có lộ trình phát triển chuyên môn rõ ràng."},
            {"Thấy công việc giúp ích cho người khác quan trọng với tôi.", "Làm việc phù hợp với giá trị cá nhân quan trọng với tôi.", "Tôi ưu tiên hiểu tác động thực tế của sản phẩm mình làm."},
            {"Có thu nhập ổn định và dự đoán được quan trọng với tôi.", "Có chính sách đãi ngộ minh bạch quan trọng với tôi.", "Tôi ưu tiên biết rõ điều kiện hợp đồng trước khi nhận việc."},
            {"Có thời gian phục hồi ngoài công việc quan trọng với tôi.", "Có lịch làm việc phù hợp cuộc sống cá nhân quan trọng với tôi.", "Tôi ưu tiên môi trường tôn trọng ranh giới giờ làm việc."},
            {"Được đồng nghiệp tôn trọng và lắng nghe quan trọng với tôi.", "Có thể nhờ hỗ trợ khi gặp khó khăn quan trọng với tôi.", "Tôi ưu tiên đội nhóm chia sẻ thông tin và ghi nhận đóng góp."}
        }, VALUE_SCALE);
        var skills = List.of(
            new Dimension("reasoning", "Phân tích vấn đề", "Chọn một vấn đề thực tế: ghi giả thuyết, thu thập bằng chứng và kiểm tra trước khi kết luận."),
            new Dimension("communication", "Giao tiếp & hợp tác", "Viết một cập nhật gồm bối cảnh, dữ kiện, đề xuất và câu hỏi cần xác nhận; xin phản hồi từ đồng đội."),
            new Dimension("planning", "Lập kế hoạch & học tập", "Chia một mục tiêu thành đầu ra nhỏ, ưu tiên theo tác động và kiểm tra kết quả sau mỗi tuần."));
        var q = new ArrayList<Question>();
        scenario(q,"reasoning",1,"Lượt đăng ký giảm sau khi đổi giao diện. Bước đầu phù hợp nhất?", 1,"Cần kiểm tra dữ liệu và các yếu tố đồng thời trước khi kết luận nguyên nhân.", "Khôi phục ngay vì chắc chắn do giao diện", "Kiểm tra số liệu, lỗi và các thay đổi cùng thời điểm", "Tăng quảng cáo ngay", "Chờ một tháng mà không kiểm tra");
        scenario(q,"reasoning",2,"Một khảo sát hỏi 10 người trong nhóm bạn. Có thể kết luận gì?", 2,"Mẫu thuận tiện nhỏ chỉ phản ánh nhóm được hỏi, chưa đại diện cho toàn thị trường.", "Mọi khách hàng đều có cùng ý kiến", "Không thể học được điều gì", "Có tín hiệu ban đầu cần kiểm tra với mẫu rộng hơn", "Chỉ cần lấy ý kiến người trả lời nhanh nhất");
        scenario(q,"reasoning",3,"Hai báo cáo doanh thu khác nhau. Bạn làm gì trước?", 0,"Đối chiếu định nghĩa và phạm vi dữ liệu giúp tìm nguyên nhân chênh lệch.", "Đối chiếu kỳ báo cáo, nguồn và cách tính", "Chọn số lớn hơn", "Lấy trung bình hai số", "Bỏ cả hai báo cáo");
        scenario(q,"communication",1,"Bạn nhận yêu cầu 'làm giao diện đẹp hơn'. Phản hồi nào hữu ích nhất?", 2,"Làm rõ người dùng, mục tiêu và tiêu chí giúp hai bên thống nhất kết quả.", "Tự đổi tất cả màu sắc", "Từ chối vì yêu cầu mơ hồ", "Hỏi mục tiêu, người dùng và ví dụ kết quả mong muốn", "Chỉ tăng kích thước chữ");
        scenario(q,"communication",2,"Đồng đội phản đối giải pháp của bạn. Bạn nên làm gì?", 0,"Tìm hiểu lo ngại và so sánh theo tiêu chí chung giúp giải quyết bất đồng.", "Hỏi lý do và cùng so sánh các phương án theo tiêu chí", "Ngắt lời để bảo vệ ý kiến", "Đồng ý ngay dù chưa hiểu", "Tránh nói chuyện với người đó");
        scenario(q,"communication",3,"Nhiệm vụ có nguy cơ trễ hạn. Cập nhật nào phù hợp nhất?", 3,"Báo sớm cùng tác động, phương án và hỗ trợ cần thiết giúp nhóm chủ động.", "Im lặng cho đến hạn", "Chỉ nói tôi đang bận", "Đổ lỗi cho bộ phận khác", "Báo sớm trở ngại, tác động và đề xuất điều chỉnh");
        scenario(q,"planning",1,"Bạn có một mục tiêu học kỹ năng mới trong tháng. Nên bắt đầu thế nào?", 1,"Đầu ra quan sát được và mốc nhỏ giúp theo dõi việc học.", "Lưu càng nhiều khóa học càng tốt", "Xác định sản phẩm cần làm và chia mốc hàng tuần", "Học bất kỳ nội dung nào đang phổ biến", "Đợi có cả ngày rảnh");
        scenario(q,"planning",2,"Hai nhiệm vụ cùng đến hạn nhưng không đủ thời gian. Bạn nên?", 3,"Ưu tiên có căn cứ và thống nhất phạm vi tốt hơn cam kết thiếu thực tế.", "Hứa hoàn thành cả hai", "Chọn việc dễ nhất mà không trao đổi", "Bỏ qua một việc", "Đánh giá tác động, phụ thuộc và thống nhất lại ưu tiên");
        scenario(q,"planning",3,"Sau khi xem một khóa học, cách kiểm tra việc hiểu bài tốt nhất?", 0,"Vận dụng độc lập và nhận phản hồi cung cấp bằng chứng tốt hơn số video đã xem.", "Tự làm một bài áp dụng và nhận phản hồi", "Đếm số video đã xem", "Đọc lại tiêu đề bài học", "Chỉ đánh dấu khóa học hoàn thành");
        followup(q,"reasoning",false,"Bạn thấy một bài đăng nói công cụ X giúp mọi người tăng năng suất. Nên kiểm tra gì?",1,"Nguồn và cách đo quyết định mức độ đáng tin của nhận định.","Số lượt thích", "Nguồn, cách đo và đối tượng thử nghiệm", "Màu của biểu đồ", "Người chia sẻ có quen bạn không");
        followup(q,"reasoning",true,"Nhóm A dùng công cụ mới có kết quả cao hơn nhóm B, nhưng A có nhiều kinh nghiệm hơn. Bạn kết luận gì?",2,"Kinh nghiệm là yếu tố gây nhiễu; cần so sánh có kiểm soát trước khi quy tác động cho công cụ.","Công cụ chắc chắn tốt hơn", "Kinh nghiệm không ảnh hưởng", "Chưa tách được tác động của công cụ khỏi kinh nghiệm", "Công cụ chắc chắn không có tác dụng");
        followup(q,"communication",false,"Bạn chưa hiểu hướng dẫn. Cách phản hồi phù hợp?",0,"Nhắc lại điều đã hiểu và hỏi phần còn thiếu giúp xác nhận kỳ vọng.","Tóm tắt điều đã hiểu và hỏi điểm chưa rõ", "Giả vờ đã hiểu", "Làm ngẫu nhiên", "Bỏ qua nhiệm vụ");
        followup(q,"communication",true,"Hai bên có mục tiêu xung đột về tốc độ và chất lượng. Bạn điều phối thế nào?",3,"Tiêu chí chấp nhận và đánh đổi rõ ràng giúp các bên đưa ra quyết định chung.","Chọn bên có chức vụ cao hơn", "Yêu cầu cả hai nhượng bộ mà không phân tích", "Trì hoãn vô thời hạn", "Thống nhất mức chất lượng tối thiểu và so sánh phương án theo rủi ro, thời hạn");
        followup(q,"planning",false,"Một việc lớn khiến bạn khó bắt đầu. Bước nào hữu ích?",2,"Một đầu ra nhỏ, rõ ràng giúp bắt đầu và kiểm tra tiến độ.","Đợi có động lực", "Làm nhiều việc cùng lúc", "Chọn bước nhỏ có đầu ra cụ thể để làm hôm nay", "Bỏ toàn bộ kế hoạch");
        followup(q,"planning",true,"Một đầu vào quan trọng bị trễ, ảnh hưởng nhiều nhiệm vụ. Bạn làm gì?",1,"Phân tích phụ thuộc và cập nhật kế hoạch giúp xử lý đúng tác động dây chuyền.","Giữ nguyên mọi hạn chót", "Xác định việc bị chặn, làm phần độc lập và thống nhất lại các mốc", "Tăng số cuộc họp mà không đổi kế hoạch", "Dừng toàn bộ công việc");
        definitions.put("skills", new Definition("skills", "Năng lực nền tảng", "Đánh giá tình huống về phân tích, giao tiếp và lập kế hoạch. Lưu mốc ban đầu và so sánh khi đánh giá lại.", skills, List.copyOf(q), 12, VERSION, "5–8", false));
    }

    private void reflection(String kind, String title, String description, List<Dimension> dimensions, String[][] prompts, List<String> scale) {
        var q = new ArrayList<Question>();
        for (int i = 0; i < dimensions.size(); i++) for (int j = 0; j < 3; j++)
            q.add(new Question(dimensions.get(i).id() + "-" + j, dimensions.get(i).id(), prompts[i][j], scale, -1, "", j < 2, ""));
        // The short interest reflection is superseded by the Holland inventory.
        definitions.put(kind, new Definition(kind, title, description, dimensions, List.copyOf(q), 14, VERSION, "5–8", kind.equals("interests")));
    }
    private void scenario(List<Question> q, String dim, int n, String prompt, int correct, String explanation, String... options) {
        q.add(new Question(dim + "-" + n, dim, prompt, List.of(options), correct, explanation, true, ""));
    }
    private void followup(List<Question> q, String dim, boolean advanced, String prompt, int correct, String explanation, String... options) {
        q.add(new Question(dim + (advanced ? "-advanced" : "-practice"), dim, prompt, List.of(options), correct, explanation, false, ""));
    }
    public Collection<Definition> all() { return definitions.values(); }
    public Definition get(String kind) {
        var d = definitions.get(kind);
        if (d == null) throw new AppException(ErrorCode.BAD_REQUEST, "Loại đánh giá không hợp lệ.");
        return d;
    }
    public List<Question> sequence(String kind, Map<String, Integer> answers) {
        var d = get(kind);
        if (d.questions().isEmpty()) return List.of();
        var sequence = new ArrayList<>(d.questions().stream().filter(Question::anchor).toList());
        if (kind.equals(HollandBank.KIND) || !sequence.stream().allMatch(q -> answers.containsKey(q.id()))) return sequence;
        if (kind.equals("skills")) {
            for (var dim : d.dimensions()) {
                long correct = sequence.stream().filter(q -> q.dimension().equals(dim.id()) && q.anchor())
                    .filter(q -> answers.get(q.id()) == q.correct()).count();
                String id = dim.id() + (correct >= 2 ? "-advanced" : "-practice");
                sequence.add(d.questions().stream().filter(q -> q.id().equals(id)).findFirst().orElseThrow());
            }
        } else {
            // Explore the two least decisive dimensions; ties are stable in bank order.
            var ranked = new ArrayList<>(d.dimensions());
            ranked.sort(Comparator.comparingDouble(dim -> {
                var values = sequence.stream().filter(q -> q.anchor() && q.dimension().equals(dim.id()))
                    .mapToInt(q -> answers.get(q.id())).toArray();
                return Math.abs((values[0] + values[1]) / 2.0 - 2) - Math.abs(values[0] - values[1]);
            }));
            for (var dim : ranked.subList(0, 2)) sequence.add(d.questions().stream()
                .filter(q -> !q.anchor() && q.dimension().equals(dim.id())).findFirst().orElseThrow());
        }
        return sequence;
    }
}
