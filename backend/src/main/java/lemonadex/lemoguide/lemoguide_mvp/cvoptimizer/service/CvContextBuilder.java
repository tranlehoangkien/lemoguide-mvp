package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.CvProfile;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Renders a CV's {@code cv_data} JSON as the plain-text "[CV]" block of the optimizer prompts and
 * indexes the editable items so a model answer can point at them by {@code ref}.
 *
 * <p>Built on the server from the stored CV, never taken from the client. Personal identifiers
 * (name, e-mail, phone, links, date of birth, avatar) are left out: the text goes to an external
 * AI provider and none of the tasks need them.
 *
 * <p>A {@code ref} is {@code "profile"} or {@code "<section>:<id>"} where {@code id} is the item's own
 * {@code id} in {@code cv_data}, or {@code #<index>} when the item has none.
 */
@Component
@RequiredArgsConstructor
class CvContextBuilder {

    /** Fields a model may rewrite, per section. Anything else is rejected at suggest and apply time. */
    static final Map<String, Set<String>> EDITABLE_FIELDS = Map.of(
            "profile", Set.of("shortTermGoal", "longTermGoal", "currentTitle"),
            "experiences", Set.of("description"),
            "projects", Set.of("description"));

    static final Map<String, String> SECTION_LABELS = Map.of(
            "profile", "Thông tin chung",
            "experiences", "Kinh nghiệm",
            "projects", "Dự án");

    static final Map<String, String> FIELD_LABELS = Map.of(
            "shortTermGoal", "Mục tiêu ngắn hạn",
            "longTermGoal", "Mục tiêu dài hạn",
            "currentTitle", "Chức danh",
            "description", "Mô tả");

    private static final int MAX_ITEMS = 10;
    private static final int MAX_DESCRIPTION = 1200;

    private final ObjectMapper objectMapper;

    /** One editable item of the CV: the profile block, an experience or a project. */
    record Item(String ref, String section, String label, JsonNode node) {
    }

    /** @param text the rendered block; @param items editable items keyed by ref; @param root the parsed cv_data */
    record CvContext(String text, Map<String, Item> items, JsonNode root) {
    }

    CvContext build(CvProfile cv) {
        JsonNode root = parse(cv.getCvData());
        Map<String, Item> items = index(root);

        StringBuilder out = new StringBuilder();
        JsonNode profile = root.path("profile");
        out.append("HỒ SƠ CHUNG [ref=profile]:\n");
        line(out, "Chức danh hiện tại (currentTitle)", text(profile, "currentTitle"));
        line(out, "Mục tiêu ngắn hạn (shortTermGoal)", clip(text(profile, "shortTermGoal"), MAX_DESCRIPTION));
        line(out, "Mục tiêu dài hạn (longTermGoal)", clip(text(profile, "longTermGoal"), MAX_DESCRIPTION));
        line(out, "Nơi sống", text(profile, "city"));

        boolean hasContent = false;

        List<String> experiences = new ArrayList<>();
        for (Item item : items.values()) {
            if (item.section().equals("experiences") && experiences.size() < MAX_ITEMS) {
                JsonNode n = item.node();
                StringBuilder sb = new StringBuilder("[ref=").append(item.ref()).append("] ").append(item.label())
                        .append(" (").append(period(n)).append(")");
                String techs = names(n.path("technologies"));
                if (!techs.isEmpty()) {
                    sb.append("\n  công nghệ: ").append(techs);
                }
                sb.append("\n  description: ").append(orDash(clip(text(n, "description"), MAX_DESCRIPTION)));
                experiences.add(sb.toString());
            }
        }
        hasContent |= section(out, "KINH NGHIỆM LÀM VIỆC", experiences);

        List<String> projects = new ArrayList<>();
        for (Item item : items.values()) {
            if (item.section().equals("projects") && projects.size() < MAX_ITEMS) {
                JsonNode n = item.node();
                StringBuilder sb = new StringBuilder("[ref=").append(item.ref()).append("] ").append(item.label());
                String role = text(n, "role");
                if (role != null) {
                    sb.append(" - vai trò ").append(role);
                }
                String techs = names(n.path("technologies"));
                if (!techs.isEmpty()) {
                    sb.append("\n  công nghệ: ").append(techs);
                }
                sb.append("\n  description: ").append(orDash(clip(text(n, "description"), MAX_DESCRIPTION)));
                projects.add(sb.toString());
            }
        }
        hasContent |= section(out, "DỰ ÁN", projects);

        List<String> education = new ArrayList<>();
        for (JsonNode n : array(root, "education")) {
            if (education.size() >= MAX_ITEMS) {
                break;
            }
            StringBuilder sb = new StringBuilder(orDash(text(n, "schoolName")));
            String major = text(n, "majorName");
            if (major != null) {
                sb.append(" - ngành ").append(major);
            }
            String cls = text(n, "classification");
            if (cls != null) {
                sb.append(", xếp loại ").append(cls);
            }
            education.add(sb.toString());
        }
        hasContent |= section(out, "HỌC VẤN", education);

        List<String> skills = new ArrayList<>();
        for (JsonNode n : array(root, "skills")) {
            String name = text(n, "skillName") != null ? text(n, "skillName") : text(n, "name");
            if (name != null && skills.size() < 40) {
                skills.add(name);
            }
        }
        if (!skills.isEmpty()) {
            out.append("\nKỸ NĂNG: ").append(String.join(", ", skills)).append('\n');
            hasContent = true;
        }

        List<String> certificates = new ArrayList<>();
        for (JsonNode n : array(root, "certificates")) {
            String name = text(n, "name");
            if (name != null && certificates.size() < MAX_ITEMS) {
                certificates.add(name);
            }
        }
        hasContent |= section(out, "CHỨNG CHỈ", certificates);

        if (!hasContent) {
            throw new AppException(ErrorCode.BAD_REQUEST, "CV này chưa có nội dung để phân tích. Hãy thêm kinh nghiệm, dự án hoặc kỹ năng trước.");
        }
        return new CvContext(out.toString().trim(), items, root);
    }

    /** Editable items of an already parsed {@code cv_data}, keyed by ref. */
    Map<String, Item> index(JsonNode root) {
        Map<String, Item> items = new LinkedHashMap<>();
        JsonNode profile = root.path("profile");
        if (profile.isObject()) {
            items.put("profile", new Item("profile", "profile", SECTION_LABELS.get("profile"), profile));
        }
        addSection(items, root, "experiences", n -> {
            String title = text(n, "jobTitle");
            String company = text(n, "companyName");
            if (title != null && company != null) {
                return title + " tại " + company;
            }
            return title != null ? title : orDash(company);
        });
        addSection(items, root, "projects", n -> orDash(text(n, "name")));
        return items;
    }

    JsonNode parse(String cvData) {
        if (cvData == null || cvData.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "CV này chưa có nội dung để phân tích.");
        }
        try {
            JsonNode root = objectMapper.readTree(cvData);
            if (root == null || !root.isObject()) {
                throw new IllegalArgumentException("cv_data is not an object");
            }
            return root;
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Dữ liệu CV không hợp lệ, hãy mở CV và lưu lại rồi thử lại.");
        }
    }

    private void addSection(Map<String, Item> items, JsonNode root, String section,
            java.util.function.Function<JsonNode, String> label) {
        int index = 0;
        for (JsonNode n : array(root, section)) {
            if (n.isObject()) {
                String id = idOf(n);
                String ref = section + ":" + (id != null ? id : "#" + index);
                items.put(ref, new Item(ref, section, label.apply(n), n));
            }
            index++;
        }
    }

    private static String idOf(JsonNode n) {
        JsonNode id = n.path("id");
        if (id.isNumber() || (id.isTextual() && !id.asText("").isBlank())) {
            return id.asText();
        }
        return null;
    }

    private static Iterable<JsonNode> array(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isArray() ? value : List.of();
    }

    private static boolean section(StringBuilder out, String title, List<String> lines) {
        if (lines.isEmpty()) {
            return false;
        }
        out.append('\n').append(title).append(":\n");
        lines.forEach(l -> out.append(l).append('\n'));
        return true;
    }

    private static void line(StringBuilder out, String label, String value) {
        if (value != null) {
            out.append("- ").append(label).append(": ").append(value).append('\n');
        }
    }

    private static String period(JsonNode n) {
        String from = shortDate(text(n, "startDate"));
        boolean current = n.path("current").asBoolean(false);
        String to = current ? "nay" : shortDate(text(n, "endDate"));
        return (from == null ? "?" : from) + " - " + (to == null ? "?" : to);
    }

    private static String shortDate(String iso) {
        return iso == null ? null : (iso.length() >= 7 ? iso.substring(0, 7) : iso);
    }

    /** Names of a technologies-style array whose items are strings or objects with a name. */
    private static String names(JsonNode array) {
        if (!array.isArray()) {
            return "";
        }
        List<String> out = new ArrayList<>();
        for (JsonNode n : array) {
            String name = n.isTextual() ? n.asText(null)
                    : (text(n, "name") != null ? text(n, "name") : text(n, "technologyName"));
            if (name != null && !name.isBlank()) {
                out.add(name.trim());
            }
        }
        return String.join(", ", out);
    }

    static String text(JsonNode node, String field) {
        String value = node.path(field).asText(null);
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String clip(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max - 1) + "…";
    }

    private static String orDash(String value) {
        return value == null ? "-" : value;
    }
}
