package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.net.URI;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.*;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.repository.JobPostingRepository;
import lemonadex.lemoguide.lemoguide_mvp.jobposting.entity.JobPostingStatus;
import lemonadex.lemoguide.lemoguide_mvp.user.service.CurrentUserProfileService;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.workspace.WorkspaceDtos.*;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class WorkspaceService {
    private final WeeklyTaskRepository tasks;
    private final JobApplicationRepository applications;
    private final ApplicationEventRepository events;
    private final CareerPlanRepository plans;
    private final CareerTaskRepository careerTasks;
    private final JobPostingRepository jobs;
    private final CvProfileRepository cvs;
    private final CurrentUserProfileService profile;
    private final WorkspaceRecommendations recommendations;
    private final lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository accounts;

    private Long owner() { return SecurityUtils.currentAccountId(); }
    private AppException missing() { return new AppException(ErrorCode.RESOURCE_NOT_FOUND); }
    private void checkVersion(Long actual, Long submitted) {
        if (!Objects.equals(actual, submitted)) throw new AppException(ErrorCode.RESOURCE_CONFLICT, "Dữ liệu đã thay đổi. Hãy tải lại trước khi lưu.");
    }
    private TaskView view(WeeklyTask t) { return new TaskView(t.getId(), null, t.getTitle(), t.getDueDate(), t.getNotes(), t.isCompleted(), t.getCompletedAt(), t.getVersion()); }

    public Overview overview(LocalDate date) {
        Long account = owner();
        LocalDate start = (date == null ? LocalDate.now() : date).with(DayOfWeek.MONDAY);
        LocalDate end = start.plusWeeks(1);
        List<TaskView> all = new ArrayList<>(tasks.week(account, start.minusWeeks(1), end, start.minusWeeks(1).atStartOfDay(), end.atStartOfDay()).stream().map(this::view).toList());
        List<TaskView> overdue = new ArrayList<>(tasks.findTop20ByAccountIdAndCompletedFalseAndDueDateBeforeOrderByDueDateAscIdAsc(account, start).stream().map(this::view).toList());
        long overdueCount = tasks.countByAccountIdAndCompletedFalseAndDueDateBefore(account, start);
        for (var plan : plans.findByAccountIdOrderByUpdatedAtDescIdDesc(account, PageRequest.of(0, 10))) {
            for (var task : careerTasks.findByPlanIdOrderByWeekNumberAsc(plan.getId())) {
                LocalDate due = plan.getCreatedAt().toLocalDate().with(DayOfWeek.MONDAY).plusWeeks(task.getWeekNumber() - 1L).plusDays(6);
                TaskView item = new TaskView(task.getId(), plan.getId(), task.getTitle(), due, task.getNotes(), Boolean.TRUE.equals(task.getCompleted()), task.getCompletedAt(), null);
                all.add(item);
                if (!item.completed() && due.isBefore(start)) { overdue.add(item); overdueCount++; }
            }
        }
        var weekly = all.stream().filter(t -> !t.dueDate().isBefore(start) && t.dueDate().isBefore(end)).sorted(Comparator.comparing(TaskView::dueDate)).toList();
        return new Overview(LocalDate.now(), start, weekly, completed(all, start, end), completed(all, start.minusWeeks(1), start), overdue, overdueCount,
                applications.upcoming(account, end.atStartOfDay(), List.of(JobApplication.Status.SAVED, JobApplication.Status.APPLIED, JobApplication.Status.INTERVIEW, JobApplication.Status.OFFER), PageRequest.of(0, 20)),
                counts(), recommendations.find(account, start, true), recommendations.find(account, start, false));
    }

    private List<TaskView> completed(List<TaskView> all, LocalDate from, LocalDate to) {
        return all.stream().filter(t -> t.completed() && t.completedAt() != null && !t.completedAt().isBefore(from.atStartOfDay()) && t.completedAt().isBefore(to.atStartOfDay())).sorted(Comparator.comparing(TaskView::completedAt).reversed()).toList();
    }
    @Transactional public TaskView saveTask(Long id, TaskInput input) {
        WeeklyTask t = id == null ? new WeeklyTask() : tasks.findByIdAndAccountId(id, owner()).orElseThrow(this::missing);
        if (id != null) checkVersion(t.getVersion(), input.version());
        t.setAccountId(owner()); t.setTitle(input.title().trim()); t.setDueDate(input.dueDate()); t.setNotes(input.notes());
        if (input.completed() && !t.isCompleted()) t.setCompletedAt(LocalDateTime.now());
        if (!input.completed()) t.setCompletedAt(null);
        t.setCompleted(input.completed());
        return view(tasks.saveAndFlush(t));
    }
    @Transactional public void deleteTask(Long id) { tasks.delete(tasks.findByIdAndAccountId(id, owner()).orElseThrow(this::missing)); }

    public Page<JobApplication> list(JobApplication.Status status, String query, int page) {
        String escaped = query.trim().toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return applications.search(owner(), status, "%" + escaped + "%", PageRequest.of(page, 12, Sort.by(Sort.Direction.DESC, "updatedAt", "id")));
    }
    public Map<String, Long> counts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (var status : JobApplication.Status.values()) counts.put(status.name(), 0L);
        for (var row : applications.counts(owner())) counts.put(row[0].toString(), (Long) row[1]);
        return counts;
    }
    public JobApplication get(Long id) { return applications.findByIdAndAccountId(id, owner()).orElseThrow(this::missing); }
    public List<ApplicationEvent> history(Long id) { get(id); return events.findByApplicationIdOrderByOccurredAtDescIdDesc(id); }

    @Transactional public JobApplication saveApplication(Long id, ApplicationInput input) {
        JobApplication a = id == null ? new JobApplication() : applications.lockOwned(id, owner()).orElseThrow(this::missing);
        if (id != null) checkVersion(a.getVersion(), input.version());
        var oldStatus = a.getStatus();
        if (id == null && input.jobPostingId() != null) {
            accounts.lockById(owner()).orElseThrow(this::missing);
            var existing = applications.findByAccountIdAndJobPostingId(owner(), input.jobPostingId());
            if (existing.isPresent()) return existing.get();
            var job = jobs.findById(input.jobPostingId()).filter(j -> j.getStatus() == JobPostingStatus.ACTIVE && (j.getExpiresAt() == null || j.getExpiresAt().isAfter(LocalDateTime.now()))).orElseThrow(this::missing);
            a.setJobPostingId(job.getId());
            a.setTitle(job.getTitle()); a.setCompany(job.getCompanyName()); a.setSourceUrl(safeUrl(job.getSourceUrl()));
        } else {
            a.setTitle(input.title().trim()); a.setCompany(input.company().trim()); a.setSourceUrl(safeUrl(input.sourceUrl()));
        }
        if (input.cvProfileId() != null) {
            var cv = cvs.findByIdAndUserInformationId(input.cvProfileId(), profile.requireId()).orElseThrow(this::missing);
            a.setCvProfileId(cv.getId()); a.setCvName(cv.getName());
        } else { a.setCvProfileId(null); a.setCvName(null); }
        if (input.nextActionAt() != null && (input.nextAction() == null || input.nextAction().isBlank())) throw new AppException(ErrorCode.BAD_REQUEST, "Hãy nhập nội dung lịch hẹn / việc tiếp theo.");
        a.setAccountId(owner()); a.setStatus(input.status()); a.setAppliedDate(input.appliedDate());
        a.setNextActionAt(input.nextActionAt()); a.setNextAction(input.nextAction()); a.setNotes(input.notes());
        applications.saveAndFlush(a);
        if (oldStatus != a.getStatus()) {
            ApplicationEvent event = new ApplicationEvent(); event.setApplicationId(a.getId()); event.setStatus(a.getStatus().name());
            event.setOccurredAt(LocalDateTime.now()); event.setDescription(oldStatus == null ? "Đã thêm vào theo dõi" : oldStatus.name() + " → " + a.getStatus().name()); events.save(event);
        }
        return a;
    }
    private String safeUrl(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            URI uri = URI.create(value.trim());
            if (Set.of("http", "https").contains(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null) return uri.toString();
        } catch (IllegalArgumentException ignored) { }
        throw new AppException(ErrorCode.BAD_REQUEST, "Liên kết phải là địa chỉ HTTP(S) hợp lệ.");
    }
    @Transactional public void deleteApplication(Long id) {
        var a = applications.lockOwned(id, owner()).orElseThrow(this::missing);
        events.deleteByApplicationId(id); applications.delete(a);
    }
}
