package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Turns a free-text roadmap target role into the canonical role a ROLE cohort is keyed on, so
 * "Backend Developer cấp độ Junior", "Back-end Engineer (Java)" and "Lập trình viên Backend" share one cohort.
 * First a known role family is matched by keywords (order matters: specific families before general ones);
 * otherwise seniority words and parenthesised details are dropped and the rest is used as-is.
 */
final class CareerRoleNormalizer {
    private CareerRoleNormalizer() { }

    /** Canonical display title plus the lowercase key stored in network_cohort.ref_key. */
    record Role(String title, String key) { }

    private record Family(String title, Pattern pattern) { }

    private static Family family(String title, String regex) {
        return new Family(title, Pattern.compile("(?U)(?:^|\\W)(?:" + regex + ")(?:\\W|$)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE));
    }

    private static final List<Family> FAMILIES = List.of(
        family("Fullstack Developer", "full[\\s-]?stack"),
        family("Mobile Developer", "mobile|android|ios|react native|flutter|di động"),
        family("Frontend Developer", "front[\\s-]?end|giao diện người dùng"),
        family("Backend Developer", "back[\\s-]?end|máy chủ"),
        family("Data Engineer", "data engineer|kỹ sư dữ liệu"),
        family("Data Scientist", "data scien\\w*|khoa học dữ liệu"),
        family("AI/ML Engineer", "machine learning|ml engineer|ai engineer|học máy|trí tuệ nhân tạo"),
        family("Data Analyst", "data analy\\w*|phân tích dữ liệu|bi analyst"),
        family("DevOps Engineer", "devops|sre|site reliability"),
        family("Cloud Engineer", "cloud|điện toán đám mây"),
        family("Security Engineer", "security|bảo mật|an toàn thông tin|pentest\\w*"),
        family("QA/Tester", "qa|qc|tester|test engineer|automation test\\w*|kiểm thử"),
        family("UI/UX Designer", "ui|ux|product designer|thiết kế (?:giao diện|trải nghiệm)"),
        family("Business Analyst", "business analyst|phân tích nghiệp vụ"),
        family("Product Manager", "product manager|product owner|quản lý sản phẩm"),
        family("Project Manager", "project manager|quản lý dự án|scrum master"),
        family("Game Developer", "game"),
        family("Embedded Engineer", "embedded|nhúng|iot"),
        family("Software Engineer", "software engineer|kỹ sư phần mềm|software developer|lập trình viên phần mềm")
    );

    /** Seniority and filler words that do not change which cohort someone belongs to. */
    private static final Pattern SENIORITY = Pattern.compile(
        "(?U)\\b(?:cấp độ|cấp bậc|cấp|level|junior|senior|middle|mid[\\s-]?level|mid|intern(?:ship)?|fresher|entry[\\s-]?level|trainee|thực tập sinh|thực tập|mới ra trường|vị trí)\\b",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    static Role normalize(String raw) {
        String text = raw == null ? "" : raw.trim();
        if (text.isEmpty()) return new Role("", "");
        for (Family f : FAMILIES) {
            if (f.pattern().matcher(text).find()) return new Role(f.title(), f.title().toLowerCase(Locale.ROOT));
        }
        String title = SENIORITY.matcher(text.replaceAll("\\([^)]*\\)|\\[[^]]*]", " ")).replaceAll(" ")
                .replaceAll("[\\s,;:·/-]+$", "").replaceAll("^[\\s,;:·/-]+", "").replaceAll("\\s+", " ").trim();
        if (title.isEmpty()) title = text.replaceAll("\\s+", " ");
        if (title.length() > 200) title = title.substring(0, 200);
        return new Role(title, title.toLowerCase(Locale.ROOT));
    }
}
