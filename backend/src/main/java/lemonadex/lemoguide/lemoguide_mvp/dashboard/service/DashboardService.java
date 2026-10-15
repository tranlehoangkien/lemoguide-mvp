package lemonadex.lemoguide.lemoguide_mvp.dashboard.service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.entity.RoleName;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.dashboard.dto.DashboardSummaryResponse;
import lemonadex.lemoguide.lemoguide_mvp.dashboard.dto.TopTechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.experience.repository.ExperienceTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.project.repository.ProjectTechnologyRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lombok.RequiredArgsConstructor;

/**
 * Computes the KPIs shown on the admin console's Dashboard page from real
 * data: account/CV counts and week-over-week growth, and a "top technology"
 * ranking derived from how many CV owners list each technology in their
 * experience or project entries.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final int TOP_TECHNOLOGY_LIMIT = 4;

    private final AccountRepository accountRepository;
    private final CvProfileRepository cvProfileRepository;
    private final ExperienceTechnologyRepository experienceTechnologyRepository;
    private final ProjectTechnologyRepository projectTechnologyRepository;
    private final TechnologyRepository technologyRepository;

    public DashboardSummaryResponse getSummary() {
        LocalDateTime weekStart = LocalDateTime.now().toLocalDate().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime previousWeekStart = weekStart.minusWeeks(1);

        long totalUsers = accountRepository.countByRole_Name(RoleName.USER);
        long totalCvProfiles = cvProfileRepository.count();
        long totalPublicViews = cvProfileRepository.sumViewCount();
        long newCvThisWeek = cvProfileRepository.countByCreatedAtGreaterThanEqual(weekStart);
        long newCvPreviousWeek = cvProfileRepository.countByCreatedAtBetween(previousWeekStart, weekStart);
        long newUsersThisWeek = accountRepository.countByRole_NameAndCreatedAtGreaterThanEqual(RoleName.USER, weekStart);
        long newUsersPreviousWeek = accountRepository.countByRole_NameAndCreatedAtBetween(
                RoleName.USER, previousWeekStart, weekStart);

        Double usersGrowthPercent = growthPercent(newUsersThisWeek, newUsersPreviousWeek);
        Double cvGrowthPercent = growthPercent(newCvThisWeek, newCvPreviousWeek);

        return new DashboardSummaryResponse(totalUsers, totalCvProfiles, totalPublicViews, newCvThisWeek,
                usersGrowthPercent, cvGrowthPercent, topTechnologies(totalCvProfiles));
    }

    private Double growthPercent(long current, long previous) {
        if (previous == 0) {
            return current == 0 ? null : 100.0;
        }
        return ((current - previous) * 100.0) / previous;
    }

    private List<TopTechnologyResponse> topTechnologies(long totalCvProfiles) {
        Map<Long, Long> cvCountByUser = cvProfileRepository.countCvsGroupedByUser().stream()
                .collect(Collectors.toMap(CvProfileRepository.UserCvCount::getUserInformationId,
                        CvProfileRepository.UserCvCount::getCvCount));

        Map<Long, Set<Long>> usersByTechnology = new HashMap<>();
        for (var row : experienceTechnologyRepository.findTechnologyUserPairs()) {
            usersByTechnology.computeIfAbsent(row.getTechnologyId(), k -> new HashSet<>())
                    .add(row.getUserInformationId());
        }
        for (var row : projectTechnologyRepository.findTechnologyUserPairs()) {
            usersByTechnology.computeIfAbsent(row.getTechnologyId(), k -> new HashSet<>())
                    .add(row.getUserInformationId());
        }
        if (usersByTechnology.isEmpty()) {
            return List.of();
        }

        Map<Long, Technology> technologyById = technologyRepository.findAllById(usersByTechnology.keySet()).stream()
                .collect(Collectors.toMap(Technology::getId, t -> t));

        return usersByTechnology.entrySet().stream()
                .map(entry -> {
                    Technology technology = technologyById.get(entry.getKey());
                    if (technology == null) {
                        return null;
                    }
                    long cvCount = entry.getValue().stream()
                            .mapToLong(userId -> cvCountByUser.getOrDefault(userId, 0L))
                            .sum();
                    double percent = totalCvProfiles == 0 ? 0.0
                            : Math.min(100.0, (cvCount * 100.0) / totalCvProfiles);
                    return new TopTechnologyResponse(technology.getName(), technology.getCategory(), cvCount, percent);
                })
                .filter(Objects::nonNull)
                .filter(t -> t.cvCount() > 0)
                .sorted(Comparator.comparingLong(TopTechnologyResponse::cvCount).reversed())
                .limit(TOP_TECHNOLOGY_LIMIT)
                .toList();
    }
}
