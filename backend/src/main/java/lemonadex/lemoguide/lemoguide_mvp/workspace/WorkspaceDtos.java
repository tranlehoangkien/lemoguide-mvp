package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.time.*;
import java.util.*;
import jakarta.validation.constraints.*;

public final class WorkspaceDtos {
    private WorkspaceDtos() {}
    public record TaskInput(@NotBlank @Size(max=200) String title, @NotNull LocalDate dueDate,
            @Size(max=4000) String notes, @NotNull Boolean completed, Long version) {}
    public record ApplicationInput(Long jobPostingId, @NotBlank @Size(max=200) String title,
            @NotBlank @Size(max=200) String company, @Size(max=500) String sourceUrl, Long cvProfileId,
            @NotNull JobApplication.Status status, @PastOrPresent LocalDate appliedDate,
            LocalDateTime nextActionAt, @Size(max=200) String nextAction, @Size(max=4000) String notes, Long version) {}
    public record TaskView(Long id, Long planId, String title, LocalDate dueDate, String notes,
            boolean completed, LocalDateTime completedAt, Long version) {}
    public record Recommendation(Long id, String title, String subtitle, LocalDateTime publishedAt,
            List<String> reasons) {}
    public record Overview(LocalDate today, LocalDate weekStart, List<TaskView> tasks, List<TaskView> completed,
            List<TaskView> previousCompleted, List<TaskView> overdue, long overdueCount,
            List<JobApplication> upcoming, Map<String, Long> applicationCounts,
            List<Recommendation> jobs, List<Recommendation> courses) {}
}
