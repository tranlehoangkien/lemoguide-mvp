package lemonadex.lemoguide.lemoguide_mvp.jobposting.spec;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.EmploymentType;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.ExperienceLevel;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPosting;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingStatus;

public final class JobPostingSpecifications {

    private JobPostingSpecifications() {
    }

    public static Specification<JobPosting> statusEquals(JobPostingStatus status) {
        if (status == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<JobPosting> locationEquals(String location) {
        if (!StringUtils.hasText(location)) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("location"), location);
    }

    public static Specification<JobPosting> employmentTypeEquals(EmploymentType employmentType) {
        if (employmentType == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("employmentType"), employmentType);
    }

    public static Specification<JobPosting> experienceLevelEquals(ExperienceLevel experienceLevel) {
        if (experienceLevel == null) {
            return Specification.unrestricted();
        }
        return (root, query, cb) -> cb.equal(root.get("experienceLevel"), experienceLevel);
    }

    /** Case-insensitive match of {@code keyword} against title OR company name. */
    public static Specification<JobPosting> keyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return Specification.unrestricted();
        }
        String like = "%" + keyword.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), like),
                cb.like(cb.lower(root.get("companyName")), like));
    }
}
