package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Admin console modules an ADMIN account can be allowed to use. Each module owns the /api/admin path prefixes of
 * its screens; {@link AdminAccessInterceptor} rejects a request whose prefix belongs to a module the caller lacks.
 * Paths matching no module (e.g. /api/admin/me/**) stay open to every admin.
 */
public enum AdminPermission {
    USERS("Người dùng & tài khoản", "Người dùng, quản trị viên, vai trò", "/api/admin/users", "/api/admin/admins", "/api/admin/roles"),
    CV("Quản lý CV", "CV người dùng, mẫu CV, lượt xuất CV", "/api/admin/cv-profiles", "/api/admin/cv-templates", "/api/admin/cv-exports"),
    MASTER_DATA("Danh mục dữ liệu", "Chuyên ngành, công nghệ, kỹ năng", "/api/admin/majors", "/api/admin/skills", "/api/admin/technologies", "/api/admin/master-data"),
    AI("Quản lý AI", "Model, prompt, nhật ký AI, gói dịch vụ", "/api/admin/ai-", "/api/admin/plans"),
    CAREER("Việc làm & khóa học", "Tin tuyển dụng, mô tả công việc, khóa học", "/api/admin/job-", "/api/admin/courses"),
    NETWORK("LemoNetwork", "Thành viên, bài viết, báo cáo, nhóm học, thử thách", "/api/admin/network"),
    // The dashboard is every admin's landing page, so /api/admin/dashboard stays open to all admins.
    REPORTS("Thống kê & báo cáo", "Top công nghệ, kỹ năng, target mode, CV công khai", "/api/admin/reports"),
    SYSTEM("Cài đặt hệ thống", "Phân quyền, cấu hình publish_mode, nhật ký hoạt động", "/api/admin/settings", "/api/admin/activity-logs", "/api/admin/permissions");

    private final String label;
    private final String description;
    private final List<String> prefixes;

    AdminPermission(String label, String description, String... prefixes) {
        this.label = label;
        this.description = description;
        this.prefixes = List.of(prefixes);
    }

    public String label() { return label; }
    public String description() { return description; }

    /** The module that owns `path`, if any. Longest prefix wins so "/api/admin/ai-" never shadows a longer one. */
    public static Optional<AdminPermission> forPath(String path) {
        AdminPermission best = null;
        int bestLength = -1;
        for (AdminPermission permission : values()) {
            for (String prefix : permission.prefixes) {
                if (path.startsWith(prefix) && prefix.length() > bestLength) {
                    best = permission;
                    bestLength = prefix.length();
                }
            }
        }
        return Optional.ofNullable(best);
    }

    public static List<String> names() {
        return Arrays.stream(values()).map(Enum::name).toList();
    }
}
