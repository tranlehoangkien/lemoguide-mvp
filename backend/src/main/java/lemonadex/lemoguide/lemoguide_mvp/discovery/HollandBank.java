package lemonadex.lemoguide.lemoguide_mvp.discovery;

import java.util.*;

/**
 * Holland (RIASEC) interest inventory modelled on the structure of the Self-Directed Search: four sections
 * (activities, competencies, occupations, self-estimates) whose points are summed per type. Items are original
 * LemoGuide wording, not the copyrighted SDS items; occupation codes follow the O*NET interest classification.
 */
public final class HollandBank {
    static final String KIND = "holland";
    static final String VERSION = "holland-v1";
    /** Hexagon order: adjacent letters are psychologically closest, opposite letters (R–S, I–E, A–C) furthest. */
    static final String ORDER = "RIASEC";
    static final int PER_SECTION = 8, SELF_ITEMS = 2, SELF_LEVELS = 7;
    static final int MAX = 3 * PER_SECTION + SELF_ITEMS * SELF_LEVELS;

    public record Section(String id, String title, String instruction, List<String> options) {}
    public record TypeInfo(String code, String name, String english, String summary, List<String> traits,
                    String environment, List<String> values, String action) {}
    public record TypeScore(String code, String name, int raw, int max, int activities, int competencies, int occupations, int selfRating) {}
    public record Career(String name, String code, String field, int fit, String level) {}
    public record Profile(String code, List<String> alternatives, List<TypeScore> types, int differentiation,
                   String differentiationLevel, String differentiationText, String consistencyLevel,
                   String consistencyText, List<TypeInfo> top, List<Career> careers) {}
    private record Occupation(String name, String code, String field) {}

    static final List<Section> SECTIONS = List.of(
        new Section("activities", "Phần 1/4 · Hoạt động",
            "Bạn thích hay không thích làm hoạt động này? Trả lời theo cảm nhận, đừng bận tâm mình đã giỏi việc đó hay chưa.",
            List.of("Thích", "Không thích")),
        new Section("competencies", "Phần 2/4 · Năng lực",
            "Bạn có thể làm tốt việc này không? Chọn “Có” nếu bạn đã từng làm tốt hoặc tin chắc mình làm được.",
            List.of("Có", "Không")),
        new Section("occupations", "Phần 3/4 · Nghề nghiệp",
            "Nghề này có hấp dẫn, khiến bạn tò mò hoặc muốn thử không? Tạm gác lại chuyện thu nhập hay học có khó không.",
            List.of("Hấp dẫn", "Không hấp dẫn")),
        new Section("self", "Phần 4/4 · Tự đánh giá",
            "So với những người cùng độ tuổi, bạn tự đánh giá khả năng này của mình ở mức nào?",
            List.of("1 · Rất thấp", "2 · Thấp", "3 · Hơi thấp", "4 · Trung bình", "5 · Hơi cao", "6 · Cao", "7 · Rất cao")));

    static final Map<String, TypeInfo> TYPES = new LinkedHashMap<>();
    static {
        type("R", "Kỹ thuật", "Realistic", "Người thực tế, thích làm việc với công cụ, máy móc, vật liệu, cây cối hay con vật và nhìn thấy kết quả hữu hình.",
            List.of("Thực tế", "Thẳng thắn", "Bền bỉ", "Khéo tay", "Ưa hành động hơn lời nói"),
            "Xưởng sản xuất, công trường, phòng máy, hiện trường ngoài trời — nơi có nhiệm vụ cụ thể, kết quả đo được.",
            List.of("Sản phẩm cụ thể", "Kỹ năng thực hành", "Sự độc lập"),
            "Thử một dự án tay chân: lắp ráp, sửa chữa hoặc vận hành một thiết bị và ghi lại điều bạn thích.");
        type("I", "Nghiên cứu", "Investigative", "Người tò mò, thích quan sát, phân tích và tìm lời giải cho các vấn đề trừu tượng hoặc khoa học.",
            List.of("Tò mò", "Tư duy phân tích", "Chính xác", "Độc lập", "Thích đào sâu"),
            "Phòng thí nghiệm, nhóm nghiên cứu, công nghệ, y khoa — nơi coi trọng dữ kiện, logic và thời gian suy nghĩ.",
            List.of("Tri thức", "Sự chính xác", "Khám phá điều mới"),
            "Chọn một câu hỏi bạn tò mò, tìm dữ liệu và viết một bản phân tích ngắn để kiểm chứng.");
        type("A", "Nghệ thuật", "Artistic", "Người sáng tạo, giàu trí tưởng tượng, thích tự thể hiện qua hình ảnh, âm thanh, ngôn từ hay chuyển động.",
            List.of("Sáng tạo", "Giàu cảm xúc", "Độc đáo", "Trực giác tốt", "Không thích khuôn mẫu"),
            "Studio, agency, truyền thông, thiết kế, biểu diễn — nơi linh hoạt, cho phép thử nghiệm và phong cách riêng.",
            List.of("Cái đẹp", "Tự do thể hiện", "Sự độc đáo"),
            "Làm một sản phẩm sáng tạo nhỏ (thiết kế, bài viết, video) và xin phản hồi từ người trong nghề.");
        type("S", "Xã hội", "Social", "Người hướng về con người, thích giúp đỡ, dạy dỗ, chăm sóc và kết nối người khác.",
            List.of("Thân thiện", "Thấu cảm", "Kiên nhẫn", "Hợp tác", "Giỏi lắng nghe"),
            "Trường học, bệnh viện, tổ chức cộng đồng, bộ phận nhân sự — nơi làm việc nhóm và tương tác nhiều.",
            List.of("Giúp đỡ người khác", "Sự gắn kết", "Đóng góp cho cộng đồng"),
            "Tham gia kèm học, tình nguyện hoặc hỗ trợ một nhóm và để ý bạn thấy năng lượng thế nào sau đó.");
        type("E", "Quản lý", "Enterprising", "Người dám nghĩ dám làm, thích dẫn dắt, thuyết phục và theo đuổi mục tiêu kinh doanh hay ảnh hưởng.",
            List.of("Tự tin", "Năng động", "Có sức thuyết phục", "Thích cạnh tranh", "Chấp nhận rủi ro"),
            "Kinh doanh, bán hàng, khởi nghiệp, quản lý, pháp lý — nơi có mục tiêu, cạnh tranh và cơ hội thăng tiến.",
            List.of("Thành tựu", "Tầm ảnh hưởng", "Cơ hội tài chính"),
            "Nhận vai trò dẫn dắt một dự án nhỏ hoặc thử bán một sản phẩm để trải nghiệm việc thuyết phục.");
        type("C", "Nghiệp vụ", "Conventional", "Người cẩn thận, ngăn nắp, thích làm việc với dữ liệu, con số và quy trình rõ ràng.",
            List.of("Cẩn thận", "Ngăn nắp", "Có trách nhiệm", "Kiên trì", "Tôn trọng quy trình"),
            "Tài chính, kế toán, hành chính, vận hành, kiểm soát chất lượng — nơi có quy trình, tiêu chuẩn và sự ổn định.",
            List.of("Sự ổn định", "Chính xác", "Hiệu quả"),
            "Thử xây dựng một bảng theo dõi, quy trình hoặc sổ sách cho một hoạt động thực tế và duy trì nó.");
    }
    private static void type(String code, String name, String english, String summary, List<String> traits, String env, List<String> values, String action) {
        TYPES.put(code, new TypeInfo(code, name, english, summary, traits, env, values, action));
    }

    /** Items per section, one row per type in hexagon order. */
    private static final String[][] ACTIVITIES = {
        {"Sửa đồ điện, xe máy hoặc thiết bị trong nhà", "Lắp ráp máy tính, mô hình hoặc đồ nội thất theo hướng dẫn", "Làm việc ngoài trời như trồng cây, chăm sóc vật nuôi",
         "Dùng dụng cụ như khoan, cưa, mỏ hàn để làm ra một món đồ", "Chơi thể thao hoặc hoạt động cần vận động cơ thể", "Tháo rời một thiết bị để xem bên trong nó hoạt động thế nào",
         "Học một nghề kỹ thuật như điện, cơ khí, ô tô", "Lái xe hoặc vận hành máy móc"},
        {"Đọc sách, xem tài liệu về khoa học và công nghệ", "Làm thí nghiệm trong phòng thí nghiệm", "Giải các bài toán hoặc câu đố logic khó",
         "Tìm hiểu nguyên nhân của một hiện tượng tự nhiên hay xã hội", "Phân tích số liệu để tìm ra quy luật, xu hướng", "Viết chương trình máy tính để giải một bài toán",
         "Tìm hiểu về cơ thể người, bệnh tật và cách chữa trị", "Tham gia cuộc thi nghiên cứu khoa học hoặc olympic"},
        {"Vẽ, phác họa hoặc thiết kế đồ họa", "Chơi nhạc cụ, hát hoặc sáng tác nhạc", "Viết truyện, thơ, blog hoặc kịch bản",
         "Chụp ảnh, quay và dựng video", "Diễn kịch, nhảy múa hoặc biểu diễn trước khán giả", "Trang trí, sắp đặt lại không gian sống",
         "Đi xem triển lãm, phim nghệ thuật hoặc hòa nhạc", "Tự thiết kế quần áo, phụ kiện hoặc đồ thủ công"},
        {"Giảng bài, kèm học cho bạn bè hoặc em nhỏ", "Lắng nghe và cho lời khuyên khi bạn bè gặp chuyện", "Tham gia hoạt động tình nguyện, thiện nguyện",
         "Chăm sóc người ốm, người già hoặc trẻ nhỏ", "Tổ chức hoạt động gắn kết cho một tập thể", "Giúp người mới làm quen với môi trường mới",
         "Tìm hiểu tâm lý và cách con người cư xử", "Hòa giải khi mọi người bất đồng"},
        {"Thuyết phục người khác làm theo ý tưởng của mình", "Bán hàng hoặc kinh doanh online", "Làm lớp trưởng, trưởng nhóm, chủ nhiệm câu lạc bộ",
         "Lên kế hoạch khởi nghiệp hoặc một dự án kiếm tiền", "Phát biểu, thuyết trình trước đám đông", "Đàm phán giá cả hoặc điều kiện hợp tác",
         "Theo dõi tin tức kinh doanh, đầu tư", "Kêu gọi tài trợ hoặc vận động mọi người tham gia sự kiện"},
        {"Sắp xếp tài liệu, hồ sơ theo một hệ thống rõ ràng", "Nhập và kiểm tra dữ liệu trên bảng tính", "Lập ngân sách, ghi chép thu chi",
         "Làm việc theo quy trình, hướng dẫn chi tiết", "Soát lỗi chính tả và số liệu trong văn bản", "Lên lịch và theo dõi hạn chót cho cả nhóm",
         "Quản lý kho, kiểm đếm hàng hóa", "Soạn văn bản, biểu mẫu theo đúng định dạng"}};
    private static final String[][] COMPETENCIES = {
        {"Dùng thành thạo tua vít, kìm, máy khoan", "Thay ổ cắm, bóng đèn hoặc sửa mạch điện đơn giản", "Đọc hiểu bản vẽ kỹ thuật hoặc sơ đồ lắp ráp",
         "Sửa những đồ dùng hỏng như xe đạp, quạt, vòi nước", "Lắp đặt, cài đặt thiết bị như router, camera, máy in", "Làm đồ gỗ hoặc đồ thủ công chắc chắn, chính xác",
         "Điều khiển xe hoặc máy móc một cách an toàn", "Chơi tốt một môn thể thao cần sự khéo léo"},
        {"Giải bài toán cần nhiều bước suy luận", "Giải thích được một định luật vật lý hay hóa học", "Dùng công cụ phân tích dữ liệu như Excel nâng cao, Python, SPSS",
         "Đọc hiểu một bài báo khoa học", "Viết một chương trình máy tính đơn giản", "Đặt giả thuyết và thiết kế cách kiểm chứng nó",
         "Sử dụng kính hiển vi hoặc dụng cụ thí nghiệm", "Phát hiện lỗi logic trong lập luận của người khác"},
        {"Vẽ chân dung hoặc phong cảnh có hồn", "Chơi thành thạo một nhạc cụ", "Viết một câu chuyện hay bài viết cuốn hút người đọc",
         "Thiết kế poster, logo bằng phần mềm đồ họa", "Biểu diễn hát, múa hoặc diễn xuất trước khán giả", "Phối màu, phối đồ hài hòa và có phong cách",
         "Dựng một video ngắn mang ý tưởng riêng", "Nghĩ ra nhiều ý tưởng độc đáo cho cùng một vấn đề"},
        {"Giải thích điều khó hiểu sao cho người khác dễ hiểu", "Khiến người khác thấy thoải mái khi trò chuyện với mình", "Kèm cặp, hướng dẫn người khác tiến bộ",
         "Nhận ra khi ai đó đang buồn hoặc gặp khó khăn", "Làm việc nhóm hòa hợp với nhiều kiểu người", "Sơ cứu cơ bản hoặc chăm sóc người bệnh",
         "Tổ chức trò chơi, hoạt động cho trẻ em", "Lắng nghe người khác mà không vội phán xét"},
        {"Thuyết phục người khác mua sản phẩm hoặc ủng hộ ý tưởng", "Dẫn dắt một nhóm hoàn thành mục tiêu", "Tự tin phát biểu trước đám đông",
         "Đàm phán để đạt được thỏa thuận có lợi", "Ra quyết định nhanh khi có áp lực", "Lập kế hoạch kinh doanh cho một ý tưởng",
         "Nhanh chóng tạo dựng quan hệ với người mới quen", "Tạo động lực để người khác cùng làm việc"},
        {"Dùng bảng tính để tổng hợp, đối chiếu số liệu", "Giữ sổ sách, hồ sơ ngăn nắp và chính xác", "Đánh máy nhanh và ít lỗi",
         "Làm việc tỉ mỉ trong thời gian dài mà ít sai sót", "Lập bảng thu chi hoặc ngân sách chi tiết", "Soạn văn bản hành chính đúng thể thức",
         "Phát hiện chênh lệch nhỏ trong các con số", "Hoàn thành công việc đúng quy trình và đúng hạn"}};
    private static final String[][] OCCUPATIONS = {
        {"Kỹ sư cơ khí — thiết kế, chế tạo máy móc", "Kỹ thuật viên điện — lắp đặt, sửa chữa hệ thống điện", "Kỹ sư xây dựng — thi công, giám sát công trình",
         "Kỹ thuật viên ô tô — chẩn đoán, sửa chữa xe", "Phi công — điều khiển máy bay", "Kỹ sư nông nghiệp — ứng dụng kỹ thuật vào trồng trọt, chăn nuôi",
         "Kỹ thuật viên bảo trì — giữ cho dây chuyền máy móc vận hành", "Lính cứu hỏa — chữa cháy, cứu nạn"},
        {"Nhà khoa học — nghiên cứu trong phòng thí nghiệm", "Bác sĩ — chẩn đoán và điều trị bệnh", "Lập trình viên — xây dựng phần mềm",
         "Nhà khoa học dữ liệu — tìm hiểu biết từ dữ liệu", "Dược sĩ — nghiên cứu, tư vấn thuốc", "Nhà sinh học — nghiên cứu sự sống",
         "Nhà kinh tế học — phân tích xu hướng kinh tế", "Kỹ sư trí tuệ nhân tạo — xây dựng mô hình AI"},
        {"Nhà thiết kế đồ họa — tạo hình ảnh, nhận diện thương hiệu", "Nhạc sĩ — sáng tác, biểu diễn âm nhạc", "Nhà văn — viết sách, truyện, kịch bản",
         "Diễn viên — biểu diễn trên sân khấu, màn ảnh", "Nhiếp ảnh gia — kể chuyện bằng hình ảnh", "Nhà thiết kế thời trang — sáng tạo trang phục",
         "Kiến trúc sư — thiết kế công trình, không gian", "Họa sĩ hoạt hình — tạo nhân vật và chuyển động"},
        {"Giáo viên — giảng dạy học sinh", "Chuyên viên tư vấn tâm lý — đồng hành cùng người gặp khó khăn", "Điều dưỡng — chăm sóc người bệnh",
         "Nhân viên công tác xã hội — hỗ trợ người yếu thế", "Giáo viên mầm non — chăm sóc, giáo dục trẻ nhỏ", "Chuyên viên tư vấn hướng nghiệp — giúp người khác chọn hướng đi",
         "Chuyên viên vật lý trị liệu — giúp người bệnh phục hồi vận động", "Hướng dẫn viên du lịch — đồng hành, giới thiệu điểm đến"},
        {"Giám đốc kinh doanh — dẫn dắt đội ngũ bán hàng", "Nhân viên kinh doanh — tìm và chốt khách hàng", "Luật sư — tranh tụng, tư vấn pháp lý",
         "Nhà sáng lập khởi nghiệp — xây dựng doanh nghiệp riêng", "Quản lý marketing — định hướng chiến lược thương hiệu", "Quản lý nhà hàng, khách sạn — điều hành dịch vụ",
         "Chuyên viên quan hệ công chúng — xây dựng hình ảnh tổ chức", "Môi giới bất động sản — kết nối người mua và người bán"},
        {"Kế toán — ghi chép, lập báo cáo tài chính", "Kiểm toán viên — kiểm tra tính chính xác của sổ sách", "Giao dịch viên ngân hàng — xử lý giao dịch cho khách",
         "Thư ký văn phòng — quản lý lịch, hồ sơ, văn bản", "Chuyên viên thuế — tính toán, kê khai thuế", "Thủ kho — quản lý xuất nhập hàng hóa",
         "Chuyên viên phân tích tài chính — đánh giá số liệu đầu tư", "Nhân viên kiểm soát chất lượng — kiểm tra sản phẩm theo tiêu chuẩn"}};
    private static final String[][] SELF = {
        {"Khả năng cơ khí, kỹ thuật", "Kỹ năng thao tác bằng tay"},
        {"Năng lực khoa học", "Năng lực toán học"},
        {"Năng khiếu mỹ thuật, thiết kế", "Năng khiếu âm nhạc, biểu diễn"},
        {"Khả năng giảng dạy, hướng dẫn", "Khả năng thấu hiểu người khác"},
        {"Khả năng bán hàng, thuyết phục", "Kỹ năng lãnh đạo, quản lý"},
        {"Kỹ năng văn phòng, hành chính", "Sự tỉ mỉ với số liệu, sổ sách"}};

    /** Occupation finder: three-letter codes follow the O*NET interest profile of the closest occupation. */
    private static final List<Occupation> FINDER = List.of(
        new Occupation("Kỹ sư xây dựng", "RIC", "Xây dựng"), new Occupation("Kỹ thuật viên điện", "RCI", "Kỹ thuật"),
        new Occupation("Kỹ thuật viên ô tô", "RCI", "Kỹ thuật"), new Occupation("Kỹ thuật viên bảo trì máy móc", "RCI", "Sản xuất"),
        new Occupation("Kỹ thuật viên điện lạnh", "RCI", "Kỹ thuật"), new Occupation("Thợ mộc, thi công nội thất", "RCI", "Xây dựng"),
        new Occupation("Phi công", "RCI", "Hàng không"), new Occupation("Kỹ sư tự động hóa, robot", "RIC", "Kỹ thuật"),
        new Occupation("Kỹ thuật viên nông nghiệp", "RIC", "Nông nghiệp"), new Occupation("Kỹ sư lâm nghiệp", "RIC", "Nông lâm nghiệp"),
        new Occupation("Đầu bếp", "RAE", "Ẩm thực"), new Occupation("Huấn luyện viên thể thao", "SRE", "Thể thao"),
        new Occupation("Lính cứu hỏa", "RSE", "An toàn công cộng"), new Occupation("Cảnh sát, công an", "RES", "An toàn công cộng"),
        new Occupation("Kỹ sư cơ khí", "IRC", "Kỹ thuật"), new Occupation("Kỹ sư điện, điện tử", "IRC", "Kỹ thuật"),
        new Occupation("Kỹ sư môi trường", "IRC", "Môi trường"), new Occupation("Kỹ sư hóa học", "IRC", "Kỹ thuật"),
        new Occupation("Kỹ sư phần mềm nhúng", "IRC", "Công nghệ thông tin"), new Occupation("Kỹ thuật viên xét nghiệm y khoa", "IRC", "Y tế"),
        new Occupation("Nhà nghiên cứu hóa học, sinh học", "IRA", "Khoa học"), new Occupation("Lập trình viên phần mềm", "ICR", "Công nghệ thông tin"),
        new Occupation("Nhà khoa học dữ liệu", "ICR", "Công nghệ thông tin"), new Occupation("Kỹ sư trí tuệ nhân tạo", "ICR", "Công nghệ thông tin"),
        new Occupation("Quản trị mạng, hệ thống", "ICR", "Công nghệ thông tin"), new Occupation("Chuyên viên phân tích dữ liệu", "ICE", "Công nghệ thông tin"),
        new Occupation("Bác sĩ", "ISR", "Y tế"), new Occupation("Nha sĩ", "IRS", "Y tế"), new Occupation("Bác sĩ thú y", "IRS", "Y tế"),
        new Occupation("Dược sĩ", "ICS", "Y tế"), new Occupation("Chuyên gia dinh dưỡng", "ISR", "Y tế"),
        new Occupation("Nhà tâm lý học lâm sàng", "ISA", "Tâm lý"), new Occupation("Nhà kinh tế học", "ICE", "Kinh tế"),
        new Occupation("Chuyên viên thống kê", "ICE", "Kinh tế"), new Occupation("Chuyên viên nghiên cứu thị trường", "ICE", "Marketing"),
        new Occupation("Chuyên viên phân tích nghiệp vụ (BA)", "ICE", "Công nghệ thông tin"), new Occupation("Nhà toán học", "ICA", "Khoa học"),
        new Occupation("Kiến trúc sư", "AIR", "Kiến trúc"), new Occupation("Nhà thiết kế đồ họa", "ARE", "Thiết kế"),
        new Occupation("Nhà thiết kế UI/UX", "AIE", "Thiết kế"), new Occupation("Nhà thiết kế game", "AIE", "Công nghệ thông tin"),
        new Occupation("Họa sĩ minh họa, hoạt hình", "ARI", "Thiết kế"), new Occupation("Nhiếp ảnh gia", "ARE", "Truyền thông"),
        new Occupation("Nhà thiết kế thời trang", "AER", "Thời trang"), new Occupation("Nhà thiết kế nội thất", "AER", "Thiết kế"),
        new Occupation("Nhạc sĩ, ca sĩ", "AES", "Nghệ thuật"), new Occupation("Diễn viên", "AES", "Nghệ thuật"),
        new Occupation("Nhà văn, biên kịch", "AIS", "Truyền thông"), new Occupation("Copywriter, người viết nội dung", "AEI", "Marketing"),
        new Occupation("Phóng viên, nhà báo", "AEI", "Truyền thông"), new Occupation("Biên tập viên", "AEC", "Truyền thông"),
        new Occupation("Giáo viên nghệ thuật", "ASE", "Giáo dục"), new Occupation("Đạo diễn, nhà sản xuất phim", "EAS", "Nghệ thuật"),
        new Occupation("Giáo viên phổ thông", "SAE", "Giáo dục"), new Occupation("Giáo viên mầm non", "SAC", "Giáo dục"),
        new Occupation("Giảng viên đại học", "SIA", "Giáo dục"), new Occupation("Chuyên viên tư vấn tâm lý", "SIA", "Tâm lý"),
        new Occupation("Điều dưỡng", "SIC", "Y tế"), new Occupation("Chuyên viên vật lý trị liệu", "SIR", "Y tế"),
        new Occupation("Nhân viên công tác xã hội", "SEC", "Cộng đồng"), new Occupation("Nhân viên y tế cộng đồng", "SEC", "Y tế"),
        new Occupation("Chuyên viên tư vấn hướng nghiệp", "SEA", "Giáo dục"), new Occupation("Hướng dẫn viên du lịch", "SEA", "Du lịch"),
        new Occupation("Chuyên viên đào tạo nội bộ", "SAE", "Nhân sự"), new Occupation("Nhân viên kinh doanh", "ECS", "Kinh doanh"),
        new Occupation("Giám đốc điều hành", "ECS", "Quản lý"), new Occupation("Quản lý dự án", "ECS", "Quản lý"),
        new Occupation("Môi giới bất động sản", "ECS", "Kinh doanh"), new Occupation("Chuyên viên quan hệ khách hàng ngân hàng", "ECS", "Tài chính"),
        new Occupation("Nhà sáng lập khởi nghiệp", "EAI", "Kinh doanh"), new Occupation("Quản lý marketing", "EAC", "Marketing"),
        new Occupation("Chuyên viên quan hệ công chúng (PR)", "EAS", "Truyền thông"), new Occupation("Luật sư", "EIS", "Pháp lý"),
        new Occupation("Quản lý sản phẩm (Product Manager)", "EIC", "Công nghệ thông tin"), new Occupation("Quản lý nhà hàng, khách sạn", "ESC", "Du lịch"),
        new Occupation("Chuyên viên tuyển dụng, nhân sự", "ESC", "Nhân sự"), new Occupation("Chuyên viên tổ chức sự kiện", "ESC", "Truyền thông"),
        new Occupation("Quản lý chuỗi cung ứng, logistics", "ECI", "Logistics"), new Occupation("Nhân viên chăm sóc khách hàng", "CSE", "Dịch vụ"),
        new Occupation("Kế toán", "CEI", "Tài chính"), new Occupation("Kiểm toán viên", "CEI", "Tài chính"),
        new Occupation("Chuyên viên thuế", "CEI", "Tài chính"), new Occupation("Chuyên viên phân tích tài chính", "CIE", "Tài chính"),
        new Occupation("Chuyên viên định phí bảo hiểm", "CIE", "Tài chính"), new Occupation("Trợ lý pháp lý", "CIE", "Pháp lý"),
        new Occupation("Giao dịch viên ngân hàng", "CES", "Tài chính"), new Occupation("Nhân viên hành chính văn phòng", "CES", "Hành chính"),
        new Occupation("Nhân viên xuất nhập khẩu", "CES", "Logistics"), new Occupation("Chuyên viên tiền lương, phúc lợi", "CES", "Nhân sự"),
        new Occupation("Thủ thư", "CSE", "Giáo dục"), new Occupation("Kiểm thử phần mềm (QA/QC)", "CIR", "Công nghệ thông tin"),
        new Occupation("Quản trị cơ sở dữ liệu", "CIR", "Công nghệ thông tin"), new Occupation("Chuyên viên an ninh mạng", "CIR", "Công nghệ thông tin"),
        new Occupation("Nhân viên kiểm soát chất lượng", "CRI", "Sản xuất"), new Occupation("Quản lý kho", "CRE", "Logistics"));

    /** Items interleave the six types inside each section so consecutive answers do not reveal the scoring key. */
    static List<DiscoveryBank.Question> questions() {
        var out = new ArrayList<DiscoveryBank.Question>();
        String[][][] banks = {ACTIVITIES, COMPETENCIES, OCCUPATIONS, SELF};
        for (int s = 0; s < SECTIONS.size(); s++) {
            var section = SECTIONS.get(s);
            for (int n = 0; n < banks[s][0].length; n++) for (int t = 0; t < ORDER.length(); t++) {
                String code = String.valueOf(ORDER.charAt(t));
                out.add(new DiscoveryBank.Question(section.id() + "-" + code + "-" + (n + 1), code, banks[s][t][n],
                    section.options(), -1, "", true, section.id()));
            }
        }
        return List.copyOf(out);
    }
    static Section section(String id) { return SECTIONS.stream().filter(s -> s.id().equals(id)).findFirst().orElseThrow(); }

    /** Binary items: the first option ("Thích", "Có", "Hấp dẫn") earns one point. Self-estimates earn 1–7. */
    static int points(DiscoveryBank.Question q, int option) { return q.section().equals("self") ? option + 1 : option == 0 ? 1 : 0; }

    static Profile profile(List<DiscoveryBank.Question> questions, Map<String, Integer> answers) {
        var types = new ArrayList<TypeScore>();
        for (var info : TYPES.values()) {
            int[] parts = new int[4];
            for (var q : questions) if (q.dimension().equals(info.code()))
                parts[SECTIONS.indexOf(section(q.section()))] += points(q, answers.get(q.id()));
            types.add(new TypeScore(info.code(), info.name(), parts[0] + parts[1] + parts[2] + parts[3], MAX, parts[0], parts[1], parts[2], parts[3]));
        }
        return profile(types);
    }

    /** Reading of six type scores on any common scale (the full inventory's 0–38 or the adaptive test's 0–100). */
    static Profile profile(List<TypeScore> types) {
        int max = types.getFirst().max();
        var alternatives = codes(types);
        String code = alternatives.getFirst();
        int high = types.stream().mapToInt(TypeScore::raw).max().orElseThrow();
        int low = types.stream().mapToInt(TypeScore::raw).min().orElseThrow();
        int diff = high - low;
        // Thresholds were set on the 38-point scale (16 and 8 points) and scale with the maximum.
        boolean clear = diff * 38 >= 16 * max, moderate = diff * 38 >= 8 * max;
        String diffLevel = clear ? "Cao" : moderate ? "Trung bình" : "Thấp";
        String diffText = clear ? "Sở thích của bạn phân hóa rõ: nhóm nổi trội vượt hẳn nhóm yếu nhất, nên mã Holland có giá trị định hướng tốt."
            : moderate ? "Sở thích phân hóa ở mức vừa phải. Hãy xem xét cả ba chữ của mã và kiểm chứng bằng trải nghiệm thực tế."
            : high >= max * 0.6 ? "Bạn quan tâm đến nhiều lĩnh vực gần như ngang nhau. Đây là lợi thế linh hoạt, nhưng cần trải nghiệm thêm để biết điều gì thực sự giữ chân bạn."
            : "Bạn chưa thể hiện sự yêu thích rõ rệt ở nhóm nào — thường gặp khi chưa có nhiều trải nghiệm. Hãy thử các hoạt động mới và làm lại bài sau vài tháng.";
        int distance = hexDistance(code.charAt(0), code.charAt(1));
        String consLevel = distance == 1 ? "Cao" : distance == 2 ? "Trung bình" : "Thấp";
        String consText = distance == 1 ? "Hai nhóm đầu nằm cạnh nhau trên lục giác Holland, có nhiều điểm chung nên dễ tìm được nghề thỏa mãn cả hai."
            : distance == 2 ? "Hai nhóm đầu cách nhau một nhóm trên lục giác: vẫn có điểm chung, nhưng đôi khi cần cân bằng giữa hai kiểu môi trường."
            : "Hai nhóm đầu nằm đối diện trên lục giác, là những sở thích khá khác nhau. Bạn có thể cần một công việc kết hợp đặc biệt hoặc thỏa mãn một phần sở thích ngoài công việc.";
        var top = code.chars().mapToObj(c -> TYPES.get(String.valueOf((char) c))).toList();
        var careers = FINDER.stream().map(o -> {
            int fit = alternatives.stream().mapToInt(a -> iachan(a, o.code())).max().orElse(0);
            return new Career(o.name(), o.code(), o.field(), fit, fit >= 22 ? "Rất phù hợp" : fit >= 15 ? "Phù hợp" : "Có liên quan");
        }).filter(c -> c.fit() >= 10).sorted(Comparator.comparingInt(Career::fit).reversed()).limit(15).toList();
        return new Profile(code, alternatives, types, diff, diffLevel, diffText, consLevel, consText, top, careers);
    }

    /** Every reading of the top three when scores tie: each next letter is any remaining type with the highest score. */
    static List<String> codes(List<TypeScore> types) {
        var out = new ArrayList<String>();
        collect("", types, out);
        return out.stream().limit(6).toList();
    }
    private static void collect(String prefix, List<TypeScore> types, List<String> out) {
        if (prefix.length() == 3) { out.add(prefix); return; }
        var rest = types.stream().filter(t -> !prefix.contains(t.code())).toList();
        int best = rest.stream().mapToInt(TypeScore::raw).max().orElseThrow();
        for (var t : rest) if (t.raw() == best) collect(prefix + t.code(), types, out);
    }
    static int hexDistance(char a, char b) {
        int d = Math.abs(ORDER.indexOf(a) - ORDER.indexOf(b));
        return Math.min(d, 6 - d);
    }
    /** Iachan (1984) agreement index between two three-letter codes, 0–28. */
    static int iachan(String person, String environment) {
        int[][] weights = {{22, 10, 4}, {10, 5, 2}, {4, 2, 1}};
        int sum = 0;
        for (int i = 0; i < 3; i++) {
            int j = environment.indexOf(person.charAt(i));
            if (j >= 0) sum += weights[i][j];
        }
        return sum;
    }
    private HollandBank() {}
}
