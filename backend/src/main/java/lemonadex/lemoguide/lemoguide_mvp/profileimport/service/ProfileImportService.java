package lemonadex.lemoguide.lemoguide_mvp.profileimport.service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatClient;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatClientRegistry;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatException;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdateMeRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.service.MeService;
import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardRequest;
import lemonadex.lemoguide.lemoguide_mvp.award.entity.Award;
import lemonadex.lemoguide.lemoguide_mvp.award.repository.AwardRepository;
import lemonadex.lemoguide.lemoguide_mvp.award.service.AwardService;
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateRequest;
import lemonadex.lemoguide.lemoguide_mvp.certificate.entity.Certificate;
import lemonadex.lemoguide.lemoguide_mvp.certificate.repository.CertificateRepository;
import lemonadex.lemoguide.lemoguide_mvp.certificate.service.CertificateService;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.contact.dto.ContactRequest;
import lemonadex.lemoguide.lemoguide_mvp.contact.entity.Contact;
import lemonadex.lemoguide.lemoguide_mvp.contact.entity.ContactType;
import lemonadex.lemoguide.lemoguide_mvp.contact.repository.ContactRepository;
import lemonadex.lemoguide.lemoguide_mvp.contact.service.ContactService;
import lemonadex.lemoguide.lemoguide_mvp.education.dto.EducationRequest;
import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;
import lemonadex.lemoguide.lemoguide_mvp.education.repository.EducationRepository;
import lemonadex.lemoguide.lemoguide_mvp.education.service.EducationService;
import lemonadex.lemoguide.lemoguide_mvp.experience.dto.ExperienceRequest;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.TargetTag;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.service.ExperienceService;
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestRequest;
import lemonadex.lemoguide.lemoguide_mvp.interest.entity.Interest;
import lemonadex.lemoguide.lemoguide_mvp.interest.repository.InterestRepository;
import lemonadex.lemoguide.lemoguide_mvp.interest.service.InterestService;
import lemonadex.lemoguide.lemoguide_mvp.major.repository.MajorRepository;
import lemonadex.lemoguide.lemoguide_mvp.profileimport.dto.ProfileApplyResponse;
import lemonadex.lemoguide.lemoguide_mvp.project.dto.ProjectRequest;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.service.ProjectService;
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerRequest;
import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Referrer;
import lemonadex.lemoguide.lemoguide_mvp.referrer.entity.Visibility;
import lemonadex.lemoguide.lemoguide_mvp.referrer.repository.ReferrerRepository;
import lemonadex.lemoguide.lemoguide_mvp.referrer.service.ReferrerService;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillRequest;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.userskill.service.UserSkillService;
import lombok.RequiredArgsConstructor;

/**
 * MVP AI-assisted "extract CV text -> fill in the Dynamic Profile" pipeline.
 * Two steps, deliberately separate so the caller can review before writing:
 * {@link #extract} turns raw CV text into a JSON patch (one direct AI call,
 * same thin pattern as {@code SkillTechNormalizationService} - no
 * ai_conversation/ai_prompt_template plumbing); {@link #apply} replays that
 * patch onto the caller's own profile via the existing self-service domain
 * services (Contact/Education/Experience/... Service), so every normal
 * validation/ownership rule those already enforce still applies here.
 *
 * <p>Every individual create runs in its own {@code REQUIRES_NEW} transaction
 * (see {@link #runIsolated}) rather than sharing {@code apply()}'s ambient
 * one. Each target service (ContactService, UserSkillService, ...) is itself
 * {@code @Transactional}; if one throws (e.g. a duplicate-skill conflict),
 * Spring marks whatever transaction it participated in rollback-only at that
 * inner proxy boundary - catching the exception in the outer loop does NOT
 * undo that marking, so without isolation the entire batch's ambient
 * transaction fails at commit with {@code UnexpectedRollbackException},
 * silently discarding every item already processed in the same call (#this
 * is what caused "education added but then vanished" when a later section
 * hit a duplicate). Isolating each write means one bad item can only roll
 * back its own transaction.</p>
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ProfileImportService {

    private static final Pattern JSON_BLOCK = Pattern.compile("```json\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);

    private static final String SYSTEM_PROMPT = """
            Ban la chuyen gia trich xuat thong tin CV thanh du lieu co cau truc cho ho so ung vien (Dynamic Profile).

            Nguoi dung se gui noi dung van ban CV cua ho (trich xuat tu file PDF hoac dan tay). Hay doc va tra ve
            DUY NHAT mot khoi ma fenced dang ```json chua mot JSON object dung schema sau (bo qua truong/section nao
            khong co du lieu trong CV, KHONG duoc tu bia them thong tin khong co trong CV goc):

            {
              "profile": { "fullName", "currentTitle", "city", "district", "shortTermGoal", "longTermGoal",
                            "dateOfBirth" (dang yyyy-MM-dd neu co), "gender" ("MALE"|"FEMALE"|"OTHER") },
              "contacts": [{ "type": "PHONE"|"EMAIL"|"LINKEDIN"|"GITHUB"|"WEBSITE"|"OTHER", "value", "primary": true|false }],
              "education": [{ "schoolName", "majorName", "startDate" (yyyy-MM-dd), "endDate" (yyyy-MM-dd hoac null neu dang hoc),
                               "gpa" (so thap phan hoac null), "classification", "thesisAchievement" }],
              "experiences": [{ "companyName", "jobTitle", "startDate" (yyyy-MM-dd), "endDate" (yyyy-MM-dd hoac null),
                                 "current": true|false, "description",
                                 "targetTag": "FRONTEND"|"BACKEND"|"FULLSTACK"|"OTHER"|null }],
              "projects": [{ "name", "role", "description", "startDate" (yyyy-MM-dd hoac null),
                              "endDate" (yyyy-MM-dd hoac null), "githubUrl", "demoUrl" }],
              "skills": [{ "name", "type": "hard"|"soft"|"language" }],
              "certificates": [{ "name", "issuedBy", "issuedYear" (so nguyen), "credentialUrl", "description" }],
              "awards": [{ "name", "grantedBy", "grantedYear" (so nguyen), "description" }],
              "interests": [{ "name", "description" }],
              "referrers": [{ "name", "position", "company", "contactInfo", "visibility": "PRIVATE"|"PUBLIC" }]
            }

            Quy tac ngay thang: "startDate" cua education/experiences la BAT BUOC - neu CV chi ghi nam (vi du "2019"),
            dung "2019-01-01". Neu hoan toan khong xac dinh duoc nam, BO QUA muc do (khong dua vao mang). Luon dung
            dung dinh dang yyyy-MM-dd, khong dung dinh dang khac (dd/MM/yyyy, MM/yyyy...).
            Neu vi tri/cong viec dang lam ("Hien tai", "Present"), dat "current": true va "endDate": null.
            "visibility" cua referrers mac dinh la "PRIVATE" neu CV khong noi ro co the cong khai.

            Quy tac rieng cho "skills": neu mot dong ky nang/cong nghe trong CV liet ke NHIEU cong nghe cu the cach
            nhau boi dau phay, dau cham phay hoac trong ngoac (vi du: "Relational DB (PostgreSQL, MySQL, Oracle, SQL
            Server)" hoac "Cloud DB & DevOps (AWS RDS/Aurora, Docker, Terraform, Bash/Python)"), hay TACH thanh CAC
            PHAN TU SKILL RIENG BIET cho tung cong nghe cu the (vi du: "PostgreSQL", "MySQL", "Oracle", "SQL Server"),
            KHONG gop chung thanh mot chuoi dai. Ten cong nghe cu the (ngon ngu lap trinh, framework, database, cloud,
            devops tool...) luon dat "type": "hard" va dung dung ten chuan cua cong nghe do (vi du "PostgreSQL" chu
            khong phai "postgres" hay "Postgre SQL").

            KHONG xuat van ban giai thich nao ben ngoai khoi ```json.
            """;

    private final AiModelRepository aiModelRepository;
    private final AiChatClientRegistry aiChatClientRegistry;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;
    private final CurrentUserProfileService currentUserProfile;
    private final lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService planUsageService;

    private final MeService meService;
    private final ContactService contactService;
    private final ContactRepository contactRepository;
    private final EducationService educationService;
    private final EducationRepository educationRepository;
    private final MajorRepository majorRepository;
    private final ExperienceService experienceService;
    private final ExperienceRepository experienceRepository;
    private final ProjectService projectService;
    private final ProjectRepository projectRepository;
    private final UserSkillService userSkillService;
    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final TechnologyRepository technologyRepository;
    private final CertificateService certificateService;
    private final CertificateRepository certificateRepository;
    private final AwardService awardService;
    private final AwardRepository awardRepository;
    private final InterestService interestService;
    private final InterestRepository interestRepository;
    private final ReferrerService referrerService;
    private final ReferrerRepository referrerRepository;

    public String extract(String sourceText) {
        Long accountId = lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils.currentAccountId();
        AiModel model = requireDefaultModel();
        planUsageService.checkAi(accountId, false);
        AiChatClient client = aiChatClientRegistry.resolve(model.getProvider());
        AiChatResult result;
        try {
            result = client.chat(model, SYSTEM_PROMPT, List.of(new AiChatMessage("user", sourceText)));
        } catch (AiChatException ex) {
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "Khong the goi AI de trich xuat ho so luc nay, vui long thu lai sau it phut.");
        }

        Matcher matcher = JSON_BLOCK.matcher(result.content());
        String jsonText = matcher.find() ? matcher.group(1).trim() : result.content().trim();
        try {
            objectMapper.readTree(jsonText);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "AI tra ve du lieu khong dung dinh dang, vui long thu lai.");
        }
        planUsageService.recordSuccess(accountId, false);
        return jsonText;
    }

    public ProfileApplyResponse apply(String patchJson) {
        JsonNode root;
        try {
            root = objectMapper.readTree(patchJson);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Du lieu patch khong hop le");
        }

        Long ownerId = currentUserProfile.requireId();
        Map<String, Integer> created = new LinkedHashMap<>();
        List<String> skipped = new ArrayList<>();

        applyProfile(root.path("profile"), skipped);
        created.put("contacts", applyContacts(root.path("contacts"), ownerId, skipped));
        created.put("education", applyEducation(root.path("education"), ownerId, skipped));
        created.put("experiences", applyExperiences(root.path("experiences"), ownerId, skipped));
        created.put("projects", applyProjects(root.path("projects"), ownerId, skipped));
        created.put("skills", applySkills(root.path("skills"), ownerId, skipped));
        created.put("certificates", applyCertificates(root.path("certificates"), ownerId, skipped));
        created.put("awards", applyAwards(root.path("awards"), ownerId, skipped));
        created.put("interests", applyInterests(root.path("interests"), ownerId, skipped));
        created.put("referrers", applyReferrers(root.path("referrers"), ownerId, skipped));

        return new ProfileApplyResponse(created, skipped);
    }

    /**
     * Wrapped in try/catch (unlike the section applies below, this one has no
     * per-item loop to isolate failures at) so a single bad field here (e.g. a
     * value that trips a downstream validation rule) cannot abort the rest of
     * apply() - contacts/education/... must still get a chance to apply even if
     * the free-text profile fields the AI extracted don't all check out.
     */
    private void applyProfile(JsonNode node, List<String> skipped) {
        if (node.isMissingNode() || !node.isObject()) {
            return;
        }
        try {
            runIsolated(() -> meService.updateCurrent(new UpdateMeRequest(
                    text(node, "fullName"),
                    null,
                    text(node, "currentTitle"),
                    date(node, "dateOfBirth"),
                    text(node, "gender"),
                    text(node, "city"),
                    text(node, "district"),
                    text(node, "shortTermGoal"),
                    text(node, "longTermGoal"))));
        } catch (Exception ex) {
            skipped.add("Thông tin hồ sơ: " + ex.getMessage());
        }
    }

    private int applyContacts(JsonNode array, Long ownerId, List<String> skipped) {
        List<Contact> existing = contactRepository.findByUserInformationId(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String value = text(node, "value");
            if (value == null || value.isBlank()) {
                skipped.add("Kênh liên lạc thiếu giá trị, đã bỏ qua");
                continue;
            }
            ContactType type = enumOrDefault(text(node, "type"), ContactType.class, ContactType.OTHER);
            String normValue = normalizeContactValue(type, value);
            boolean duplicate = existing.stream()
                    .anyMatch(c -> c.getType() == type && normalizeContactValue(type, c.getValue()).equals(normValue));
            if (duplicate) {
                skipped.add("Kênh liên lạc \"" + value + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            try {
                runIsolated(() -> contactService.create(new ContactRequest(type, value, node.path("primary").asBoolean(false))));
                count++;
            } catch (Exception ex) {
                skipped.add("Kênh liên lạc \"" + value + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applyEducation(JsonNode array, Long ownerId, List<String> skipped) {
        List<Education> existing = educationRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String schoolName = text(node, "schoolName");
            LocalDate startDate = date(node, "startDate");
            if (schoolName == null || schoolName.isBlank() || startDate == null) {
                skipped.add("Học vấn thiếu tên trường hoặc ngày bắt đầu, đã bỏ qua");
                continue;
            }
            String normSchool = normalizeText(schoolName);
            boolean duplicate = existing.stream().anyMatch(e ->
                    normalizeText(e.getSchoolName()).equals(normSchool) && startDate.equals(e.getStartDate()));
            if (duplicate) {
                skipped.add("Học vấn \"" + schoolName + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            String majorName = text(node, "majorName");
            Long majorId = majorName == null ? null
                    : majorRepository.findByNameIgnoreCase(majorName)
                            .map(lemonadex.lemoguide.lemoguide_mvp.major.entity.Major::getId)
                            .orElse(null);
            try {
                runIsolated(() -> educationService.create(new EducationRequest(
                        majorId, schoolName, startDate, date(node, "endDate"),
                        decimal(node, "gpa"), text(node, "classification"), text(node, "thesisAchievement"))));
                count++;
            } catch (Exception ex) {
                skipped.add("Học vấn \"" + schoolName + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applyExperiences(JsonNode array, Long ownerId, List<String> skipped) {
        List<Experience> existing = experienceRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String companyName = text(node, "companyName");
            String jobTitle = text(node, "jobTitle");
            LocalDate startDate = date(node, "startDate");
            if (companyName == null || jobTitle == null || startDate == null) {
                skipped.add("Kinh nghiệm làm việc thiếu công ty/chức danh/ngày bắt đầu, đã bỏ qua");
                continue;
            }
            String normCompany = normalizeText(companyName);
            String normTitle = normalizeText(jobTitle);
            boolean duplicate = existing.stream().anyMatch(e ->
                    normalizeText(e.getCompanyName()).equals(normCompany)
                            && normalizeText(e.getJobTitle()).equals(normTitle)
                            && startDate.equals(e.getStartDate()));
            if (duplicate) {
                skipped.add("Kinh nghiệm tại \"" + companyName + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            TargetTag targetTag = enumOrDefault(text(node, "targetTag"), TargetTag.class, null);
            try {
                runIsolated(() -> experienceService.create(new ExperienceRequest(
                        companyName, jobTitle, startDate, date(node, "endDate"),
                        node.path("current").asBoolean(false), text(node, "description"),
                        targetTag, 0, null)));
                count++;
            } catch (Exception ex) {
                skipped.add("Kinh nghiệm tại \"" + companyName + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applyProjects(JsonNode array, Long ownerId, List<String> skipped) {
        List<Project> existing = projectRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String name = text(node, "name");
            if (name == null || name.isBlank()) {
                skipped.add("Dự án thiếu tên, đã bỏ qua");
                continue;
            }
            String normName = normalizeText(name);
            boolean duplicate = existing.stream().anyMatch(p -> normalizeText(p.getName()).equals(normName));
            if (duplicate) {
                skipped.add("Dự án \"" + name + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            try {
                runIsolated(() -> projectService.create(new ProjectRequest(
                        name, text(node, "role"), text(node, "description"),
                        date(node, "startDate"), date(node, "endDate"),
                        text(node, "demoUrl"), text(node, "githubUrl"), 0, null)));
                count++;
            } catch (Exception ex) {
                skipped.add("Dự án \"" + name + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applySkills(JsonNode array, Long ownerId, List<String> skipped) {
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String name = text(node, "name");
            if (name == null || name.isBlank()) {
                continue;
            }
            // SkillType constants are lowercase (hard/soft/language), unlike the other
            // enums here, so the generic uppercase-then-valueOf helper doesn't apply.
            SkillType parsedType = SkillType.fromString(text(node, "type"));
            SkillType type = parsedType != null ? parsedType : SkillType.hard;

            // 1. Khớp trực tiếp với danh mục "skill" hiện có (ưu tiên cùng type, rồi mọi type).
            Skill match = skillRepository.findByNameIgnoreCaseAndType(name, type)
                    .or(() -> skillRepository.findAll().stream()
                            .filter(s -> s.getName().equalsIgnoreCase(name))
                            .findFirst())
                    .orElse(null);

            // 2. Chưa có: thử chuẩn hóa tên qua danh mục "technology" (PostgreSQL, Docker...)
            // vì CV thật thường liệt kê tên công nghệ cụ thể, khác với các nhóm kỹ năng
            // trừu tượng có sẵn trong dữ liệu mẫu của "skill".
            String canonicalName = name;
            if (match == null) {
                var tech = technologyRepository.findByNameIgnoreCase(name).orElse(null);
                if (tech != null) {
                    canonicalName = tech.getName();
                    match = skillRepository.findByNameIgnoreCaseAndType(canonicalName, type).orElse(null);
                }
            }

            // 2.5. Vẫn chưa khớp: so sánh tên đã chuẩn hóa (bỏ khoảng trắng/dấu câu, không phân
            // biệt hoa thường) với TOÀN BỘ danh mục "skill" hiện có - CV trích xuất 2 lần khác
            // nhau hay ghi cùng một công nghệ dưới nhiều cách viết ("React.js" / "ReactJS" /
            // "React JS"), nếu so khớp tuyệt đối như buoc 1 se tao ra nhieu dong "skill" trung
            // lap trong danh muc, roi tu do sinh ra nhieu user_skill trung nhau ve mat noi dung.
            if (match == null) {
                String normTarget = normalizeSkillName(name);
                match = skillRepository.findAll().stream()
                        .filter(s -> normalizeSkillName(s.getName()).equals(normTarget))
                        .findFirst()
                        .orElse(null);
            }

            // 3. Vẫn chưa có: tự tạo mới trong danh mục "skill" (self-service) thay vì chặn
            // người dùng lại chờ admin duyệt - đơn giản hóa cho MVP, chuẩn hóa sau.
            if (match == null) {
                String nameToCreate = canonicalName;
                try {
                    match = runIsolated(() -> skillRepository.save(Skill.builder().name(nameToCreate).type(type).build()));
                } catch (Exception ex) {
                    skipped.add("Kỹ năng \"" + name + "\": " + ex.getMessage());
                    continue;
                }
            }

            // 4. Kiểm tra trùng TRƯỚC khi gán, tránh gọi create() vào trường hợp chắc chắn sẽ
            // ném lỗi conflict - làm vậy để không phải dựa vào catch (Exception) cho case phổ biến.
            if (userSkillRepository.existsByUserInformationIdAndSkillId(ownerId, match.getId())) {
                Long existingSkillId = match.getId();
                try {
                    runIsolated(() -> { userSkillService.confirmImportedSkill(existingSkillId); return null; });
                } catch (Exception ex) {
                    skipped.add("Kỹ năng \"" + name + "\": " + ex.getMessage());
                    continue;
                }
                skipped.add("Kỹ năng \"" + name + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }

            Skill finalMatch = match;
            try {
                runIsolated(() -> userSkillService.create(new UserSkillRequest(finalMatch.getId(), null, null)));
                count++;
            } catch (Exception ex) {
                skipped.add("Kỹ năng \"" + name + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applyCertificates(JsonNode array, Long ownerId, List<String> skipped) {
        List<Certificate> existing = certificateRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String name = text(node, "name");
            if (name == null || name.isBlank()) {
                continue;
            }
            String normName = normalizeText(name);
            if (existing.stream().anyMatch(c -> normalizeText(c.getName()).equals(normName))) {
                skipped.add("Chứng chỉ \"" + name + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            try {
                runIsolated(() -> certificateService.create(new CertificateRequest(
                        name, text(node, "issuedBy"), integer(node, "issuedYear"),
                        text(node, "credentialUrl"), text(node, "description"))));
                count++;
            } catch (Exception ex) {
                skipped.add("Chứng chỉ \"" + name + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applyAwards(JsonNode array, Long ownerId, List<String> skipped) {
        List<Award> existing = awardRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String name = text(node, "name");
            if (name == null || name.isBlank()) {
                continue;
            }
            String normName = normalizeText(name);
            if (existing.stream().anyMatch(a -> normalizeText(a.getName()).equals(normName))) {
                skipped.add("Giải thưởng \"" + name + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            try {
                runIsolated(() -> awardService.create(new AwardRequest(name, text(node, "grantedBy"), integer(node, "grantedYear"), text(node, "description"))));
                count++;
            } catch (Exception ex) {
                skipped.add("Giải thưởng \"" + name + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applyInterests(JsonNode array, Long ownerId, List<String> skipped) {
        List<Interest> existing = interestRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String name = text(node, "name");
            if (name == null || name.isBlank()) {
                continue;
            }
            String normName = normalizeText(name);
            if (existing.stream().anyMatch(i -> normalizeText(i.getName()).equals(normName))) {
                skipped.add("Sở thích \"" + name + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            try {
                runIsolated(() -> interestService.create(new InterestRequest(name, text(node, "description"))));
                count++;
            } catch (Exception ex) {
                skipped.add("Sở thích \"" + name + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private int applyReferrers(JsonNode array, Long ownerId, List<String> skipped) {
        List<Referrer> existing = referrerRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        int count = 0;
        for (JsonNode node : safeArray(array)) {
            String name = text(node, "name");
            if (name == null || name.isBlank()) {
                continue;
            }
            String normName = normalizeText(name);
            if (existing.stream().anyMatch(r -> normalizeText(r.getName()).equals(normName))) {
                skipped.add("Người giới thiệu \"" + name + "\" đã có trong hồ sơ, bỏ qua");
                continue;
            }
            Visibility visibility = enumOrDefault(text(node, "visibility"), Visibility.class, Visibility.PRIVATE);
            try {
                runIsolated(() -> referrerService.create(new ReferrerRequest(
                        name, text(node, "position"), text(node, "company"), text(node, "contactInfo"), visibility)));
                count++;
            } catch (Exception ex) {
                skipped.add("Người giới thiệu \"" + name + "\": " + ex.getMessage());
            }
        }
        return count;
    }

    private AiModel requireDefaultModel() {
        return aiModelRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                        "Chua co AI model nao dang hoat dong, vui long lien he admin de cau hinh."));
    }

    /**
     * Runs one write in its own top-level {@code REQUIRES_NEW} transaction so a
     * failure there (duplicate conflict, validation error, ...) can only roll
     * back that single item - never the whole {@code apply()} batch. See the
     * class javadoc for why this is necessary (Spring marks the ambient
     * transaction rollback-only at the inner {@code @Transactional} proxy the
     * moment it throws, regardless of whether the caller catches it).
     */
    private <T> T runIsolated(Supplier<T> action) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(status -> action.get());
    }

    private static Iterable<JsonNode> safeArray(JsonNode node) {
        return node.isArray() ? node : java.util.Collections.emptyList();
    }

    private static String text(JsonNode node, String field) {
        String v = node.path(field).asText(null);
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private static final Pattern YEAR_ONLY = Pattern.compile("^(\\d{4})$");
    private static final Pattern MONTH_YEAR = Pattern.compile("^(\\d{1,2})/(\\d{4})$");
    private static final Pattern DAY_MONTH_YEAR = Pattern.compile("^(\\d{1,2})/(\\d{1,2})/(\\d{4})$");

    /**
     * Parses "startDate"/"endDate"/"dateOfBirth" leniently - the prompt asks the AI
     * for strict yyyy-MM-dd, but models don't always comply (or the CV only gives a
     * year/month). Falling back to null on a genuinely unparseable value causes the
     * whole item to be skipped (see applyEducation/applyExperiences), so being lenient
     * here directly avoids education/experience rows silently failing to import.
     */
    private static LocalDate date(JsonNode node, String field) {
        String v = text(node, field);
        if (v == null) {
            return null;
        }
        try {
            return LocalDate.parse(v);
        } catch (DateTimeParseException ignored) {
            // fall through to the lenient formats below
        }
        try {
            return java.time.YearMonth.parse(v).atDay(1);
        } catch (DateTimeParseException ignored) {
            // fall through
        }
        Matcher dmy = DAY_MONTH_YEAR.matcher(v);
        if (dmy.matches()) {
            try {
                return LocalDate.of(Integer.parseInt(dmy.group(3)), Integer.parseInt(dmy.group(2)), Integer.parseInt(dmy.group(1)));
            } catch (java.time.DateTimeException ex) {
                return null;
            }
        }
        Matcher my = MONTH_YEAR.matcher(v);
        if (my.matches()) {
            try {
                return LocalDate.of(Integer.parseInt(my.group(2)), Integer.parseInt(my.group(1)), 1);
            } catch (java.time.DateTimeException ex) {
                return null;
            }
        }
        Matcher yearOnly = YEAR_ONLY.matcher(v);
        if (yearOnly.matches()) {
            return LocalDate.of(Integer.parseInt(yearOnly.group(1)), 1, 1);
        }
        return null;
    }

    private static java.math.BigDecimal decimal(JsonNode node, String field) {
        String v = text(node, field);
        if (v == null) {
            return null;
        }
        try {
            return new java.math.BigDecimal(v);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Integer integer(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isNumber() ? value.asInt() : null;
    }

    /**
     * Chuẩn hóa chuỗi để so khớp trùng lặp khoan dung hơn {@code equalsIgnoreCase}:
     * bỏ dấu tiếng Việt, hạ chữ thường, gộp mọi khoảng trắng liên tiếp thành một dấu
     * cách. CV trích xuất 2 lần khác nhau (hoặc do AI diễn đạt lại) hay lệch nhau ở
     * đúng những chi tiết này (thừa khoảng trắng, hoa/thường không nhất quán), khiến
     * so sánh tuyệt đối coi hai mục giống hệt nhau là "khác nhau" và tạo ra bản ghi
     * trùng lặp khi người dùng áp dụng CV nhiều lần.
     */
    private static String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        String noAccents = java.text.Normalizer.normalize(value.trim().toLowerCase(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return noAccents.replaceAll("\\s+", " ").trim();
    }

    /** Như {@link #normalizeText}, dùng riêng cho tên kỹ năng: bỏ luôn mọi khoảng trắng/dấu câu. */
    private static String normalizeSkillName(String value) {
        return normalizeText(value).replaceAll("[^a-z0-9]", "");
    }

    /**
     * So khớp giá trị liên lạc khoan dung với sự khác biệt định dạng số điện thoại
     * (khoảng trắng, dấu gạch ngang, ngoặc, mã vùng "+84"/"84" so với số "0" ở đầu) -
     * nguồn phổ biến khiến cùng một số điện thoại bị coi là 2 kênh liên lạc khác nhau
     * giữa hai lần trích xuất từ CV.
     */
    private static String normalizeContactValue(ContactType type, String value) {
        if (value == null) {
            return "";
        }
        if (type == ContactType.PHONE) {
            String digits = value.replaceAll("[^0-9]", "");
            if (digits.startsWith("84") && digits.length() > 9) {
                digits = "0" + digits.substring(2);
            }
            return digits;
        }
        return normalizeText(value);
    }

    private static <E extends Enum<E>> E enumOrDefault(String value, Class<E> type, E fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }
}
