package lemonadex.lemoguide.lemoguide_mvp.jobanalysis.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import lemonadex.lemoguide.lemoguide_mvp.certificate.entity.Certificate;
import lemonadex.lemoguide.lemoguide_mvp.certificate.repository.CertificateRepository;
import lemonadex.lemoguide.lemoguide_mvp.education.entity.Education;
import lemonadex.lemoguide.lemoguide_mvp.education.repository.EducationRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.Experience;
import lemonadex.lemoguide.lemoguide_mvp.experience.entity.ExperienceTechnology;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceRepository;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.major.entity.Major;
import lemonadex.lemoguide.lemoguide_mvp.major.repository.MajorRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.Project;
import lemonadex.lemoguide.lemoguide_mvp.project.entity.ProjectTechnology;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.user.entity.UserInformation;
import lemonadex.lemoguide.lemoguide_mvp.profile.DynamicProfileService;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkill;
import lemonadex.lemoguide.lemoguide_mvp.userskill.entity.UserSkillSource;
import lemonadex.lemoguide.lemoguide_mvp.userskill.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;

/**
 * Renders the caller's Dynamic Profile as the plain-text "[HỒ SƠ ỨNG VIÊN]"
 * block of the analysis prompt. Built on the server from the database - never
 * taken from the client - so the analysis always reflects the real profile.
 *
 * <p>Personal identifiers (name, email, phone, date of birth, links, avatar)
 * are deliberately left out: the text goes to an external AI provider and the
 * analysis does not need any of them. Lists and free-text are capped so a very
 * large profile cannot blow up the prompt.
 */
@Component
@RequiredArgsConstructor
public class ProfileSnapshotBuilder {

    private static final int MAX_ITEMS = 10;
    private static final int MAX_DESCRIPTION = 500;

    private final UserSkillRepository userSkillRepository;
    private final SkillRepository skillRepository;
    private final ExperienceRepository experienceRepository;
    private final ExperienceTechnologyRepository experienceTechnologyRepository;
    private final ProjectRepository projectRepository;
    private final ProjectTechnologyRepository projectTechnologyRepository;
    private final TechnologyRepository technologyRepository;
    private final EducationRepository educationRepository;
    private final MajorRepository majorRepository;
    private final CertificateRepository certificateRepository;
    private final DynamicProfileService dynamicProfile;

    /**
     * @param text the rendered block
     * @param empty true when the profile has no professional data, completed
     *              learning activity or completed skill assessment evidence
     */
    public record ProfileSnapshot(String text, boolean empty) {
        static final ProfileSnapshot EMPTY = new ProfileSnapshot("(Hồ sơ chưa có dữ liệu)", true);
    }

    public ProfileSnapshot build(UserInformation profile) {
        Long ownerId = profile.getId();

        List<UserSkill> userSkills = userSkillRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        List<Experience> experiences = experienceRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        List<Project> projects = projectRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        List<Education> educations = educationRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        List<Certificate> certificates = certificateRepository.findByUserInformationIdOrderByCreatedAtDesc(ownerId);
        String progressContext = dynamicProfile.context(profile.getAccountId());

        if (userSkills.isEmpty() && experiences.isEmpty() && projects.isEmpty() && educations.isEmpty() && progressContext.isBlank()) {
            return ProfileSnapshot.EMPTY;
        }

        Map<Long, Skill> skillsById = skillRepository
                .findAllById(userSkills.stream().map(UserSkill::getSkillId).toList()).stream()
                .collect(Collectors.toMap(Skill::getId, Function.identity()));

        Map<Long, List<Long>> techIdsByExperience = experienceTechnologyRepository
                .findByExperienceIdIn(experiences.stream().map(Experience::getId).toList()).stream()
                .collect(Collectors.groupingBy(ExperienceTechnology::getExperienceId,
                        Collectors.mapping(ExperienceTechnology::getTechnologyId, Collectors.toList())));
        Map<Long, List<Long>> techIdsByProject = projectTechnologyRepository
                .findByProjectIdIn(projects.stream().map(Project::getId).toList()).stream()
                .collect(Collectors.groupingBy(ProjectTechnology::getProjectId,
                        Collectors.mapping(ProjectTechnology::getTechnologyId, Collectors.toList())));
        Set<Long> allTechIds = new HashSet<>();
        techIdsByExperience.values().forEach(allTechIds::addAll);
        techIdsByProject.values().forEach(allTechIds::addAll);
        Map<Long, String> techNames = technologyRepository.findAllById(allTechIds).stream()
                .collect(Collectors.toMap(Technology::getId, Technology::getName));

        Map<Long, String> majorNames = majorRepository
                .findAllById(educations.stream().map(Education::getMajorId).filter(id -> id != null).toList()).stream()
                .collect(Collectors.toMap(Major::getId, Major::getName));

        StringBuilder out = new StringBuilder();
        line(out, "Chức danh hiện tại", profile.getCurrentTitle());
        line(out, "Nơi sống", profile.getCity());
        line(out, "Mục tiêu ngắn hạn", clip(profile.getShortTermGoal(), MAX_DESCRIPTION));
        line(out, "Mục tiêu dài hạn", clip(profile.getLongTermGoal(), MAX_DESCRIPTION));
        if (!experiences.isEmpty()) {
            line(out, "Tổng kinh nghiệm làm việc (ước tính, cộng dồn các vị trí)", totalExperience(experiences));
        }

        section(out, "KỸ NĂNG", userSkills, us -> {
            Skill skill = skillsById.get(us.getSkillId());
            if (skill == null) {
                return null;
            }
            StringBuilder sb = new StringBuilder(skill.getName());
            if (us.getSource() == UserSkillSource.CAREER_PLAN) {
                sb.append(" (nguồn: từ lộ trình học, người dùng đánh dấu hoàn thành)");
                if (us.getProficiencyLevel() == null) sb.append(" (mức thành thạo chưa đánh giá)");
            }
            if (us.getLanguageLevel() != null && !us.getLanguageLevel().isBlank()) {
                sb.append(" (trình độ ").append(us.getLanguageLevel().trim()).append(')');
            } else if (us.getProficiencyLevel() != null) {
                sb.append(" (thành thạo ").append(us.getProficiencyLevel()).append("/100)");
            }
            return sb.toString();
        });

        section(out, "KINH NGHIỆM LÀM VIỆC", experiences, e -> {
            StringBuilder sb = new StringBuilder();
            sb.append(nullToEmpty(e.getJobTitle())).append(" tại ").append(nullToEmpty(e.getCompanyName()))
                    .append(" (").append(period(e.getStartDate(), e.getEndDate(), e.isCurrent())).append(')');
            appendTechnologies(sb, techIdsByExperience.get(e.getId()), techNames);
            appendDescription(sb, e.getDescription());
            return sb.toString();
        });

        section(out, "DỰ ÁN", projects, p -> {
            StringBuilder sb = new StringBuilder(nullToEmpty(p.getName()));
            if (p.getRole() != null && !p.getRole().isBlank()) {
                sb.append(" - vai trò ").append(p.getRole().trim());
            }
            appendTechnologies(sb, techIdsByProject.get(p.getId()), techNames);
            appendDescription(sb, p.getDescription());
            return sb.toString();
        });

        section(out, "HỌC VẤN", educations, ed -> {
            StringBuilder sb = new StringBuilder(nullToEmpty(ed.getSchoolName()));
            String major = ed.getMajorId() == null ? null : majorNames.get(ed.getMajorId());
            if (major != null) {
                sb.append(" - ngành ").append(major);
            }
            if (ed.getClassification() != null && !ed.getClassification().isBlank()) {
                sb.append(", xếp loại ").append(ed.getClassification().trim());
            }
            if (ed.getGpa() != null) {
                sb.append(", GPA ").append(ed.getGpa().stripTrailingZeros().toPlainString());
            }
            return sb.toString();
        });

        section(out, "CHỨNG CHỈ", certificates, c -> {
            StringBuilder sb = new StringBuilder(nullToEmpty(c.getName()));
            if (c.getIssuedBy() != null && !c.getIssuedBy().isBlank()) {
                sb.append(" - ").append(c.getIssuedBy().trim());
            }
            if (c.getIssuedYear() != null) {
                sb.append(" (").append(c.getIssuedYear()).append(')');
            }
            return sb.toString();
        });

        out.append(progressContext);
        return new ProfileSnapshot(out.toString().trim(), false);
    }

    private static <T> void section(StringBuilder out, String title, Collection<T> items, Function<T, String> render) {
        List<String> lines = new ArrayList<>();
        for (T item : items) {
            String rendered = render.apply(item);
            if (rendered != null && !rendered.isBlank() && lines.size() < MAX_ITEMS) {
                lines.add(rendered);
            }
        }
        if (lines.isEmpty()) {
            return;
        }
        out.append('\n').append(title).append(":\n");
        lines.forEach(l -> out.append("- ").append(l).append('\n'));
    }

    private static void line(StringBuilder out, String label, String value) {
        if (value != null && !value.isBlank()) {
            out.append(label).append(": ").append(value.trim()).append('\n');
        }
    }

    private static void appendTechnologies(StringBuilder sb, List<Long> techIds, Map<Long, String> names) {
        if (techIds == null || techIds.isEmpty()) {
            return;
        }
        String joined = techIds.stream().map(names::get).filter(n -> n != null).distinct()
                .collect(Collectors.joining(", "));
        if (!joined.isEmpty()) {
            sb.append("; công nghệ: ").append(joined);
        }
    }

    private static void appendDescription(StringBuilder sb, String description) {
        String clipped = clip(description, MAX_DESCRIPTION);
        if (clipped != null) {
            sb.append("; mô tả: ").append(clipped.replaceAll("\\s+", " "));
        }
    }

    private static String period(LocalDate start, LocalDate end, boolean current) {
        String from = start == null ? "?" : start.getMonthValue() + "/" + start.getYear();
        String to = current || end == null ? "nay" : end.getMonthValue() + "/" + end.getYear();
        return from + " - " + to;
    }

    private static String totalExperience(List<Experience> experiences) {
        LocalDate today = LocalDate.now();
        int months = 0;
        for (Experience e : experiences) {
            if (e.getStartDate() == null) {
                continue;
            }
            LocalDate end = e.isCurrent() || e.getEndDate() == null ? today : e.getEndDate();
            if (end.isBefore(e.getStartDate())) {
                continue;
            }
            Period p = Period.between(e.getStartDate(), end);
            months += p.getYears() * 12 + p.getMonths();
        }
        return String.format(Locale.ROOT, "khoảng %.1f năm", months / 12.0);
    }

    private static String clip(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max - 1).trim() + "…";
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
