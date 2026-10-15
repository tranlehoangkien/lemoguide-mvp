package lemonadex.lemoguide.lemoguide_mvp.plan.service;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import lemonadex.lemoguide.lemoguide_mvp.auth.entity.Account;
import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.*;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanUsageResponse;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanUsageResponse.Meter;
import lemonadex.lemoguide.lemoguide_mvp.plan.entity.*;
import lemonadex.lemoguide.lemoguide_mvp.plan.repository.*;
import lemonadex.lemoguide.lemoguide_mvp.user.repository.UserInformationRepository;
import lombok.RequiredArgsConstructor;

/** Calendar quotas in Vietnam time. The account lock spans check, AI work and
 * successful recording in the caller's transaction, serializing parallel requests. */
@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor = AppException.class)
public class PlanUsageService {
    static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final AccountRepository accounts;
    private final PlanRepository plans;
    private final PlanUsageEventRepository events;
    private final UserInformationRepository profiles;
    private final CvProfileRepository cvs;

    @Transactional(readOnly = true)
    public PlanUsageResponse get(Long accountId) {
        Account account = accounts.findById(accountId).orElseThrow(() ->
                new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy người dùng."));
        return snapshot(account, LocalDate.now(ZONE), false);
    }

    private PlanUsageResponse snapshot(Account account, LocalDate today, boolean locked) {
        Plan plan = plans.findById(account.getPlanId()).orElseThrow(() ->
                new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy gói của người dùng."));
        LocalDate week = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate month = today.withDayOfMonth(1);
        Long id = account.getId();
        // Locking reads see newly committed usage even when the surrounding MySQL
        // transaction has already established a REPEATABLE_READ snapshot.
        var recent = locked ? events.findByAccountIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(id,
                (week.isBefore(month) ? week : month).atStartOfDay(), today.plusDays(1).atStartOfDay()) : null;
        long daily = locked ? count(recent, today, true) : messages(id, today, today.plusDays(1));
        long weekly = locked ? count(recent, week, true) : messages(id, week, week.plusWeeks(1));
        long monthly = locked ? count(recent, month, true) : messages(id, month, month.plusMonths(1));
        long credits = locked ? count(recent, month, false) : events.countByAccountIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(
                id, month.atStartOfDay(), month.plusMonths(1).atStartOfDay());
        long cvCount = profiles.findByAccountId(id).map(p -> locked
                ? (long) cvs.findByUserInformationId(p.getId()).size() : cvs.countByUserInformationId(p.getId())).orElse(0L);
        return new PlanUsageResponse(plan.getId(), plan.getName(), ZONE.getId(),
                Meter.of(daily, plan.getMessagesPerDay(), reset(today.plusDays(1))),
                Meter.of(weekly, plan.getMessagesPerWeek(), reset(week.plusWeeks(1))),
                Meter.of(monthly, plan.getMessagesPerMonth(), reset(month.plusMonths(1))),
                Meter.of(credits, plan.getAiCreditsPerMonth(), reset(month.plusMonths(1))),
                Meter.of(cvCount, plan.getMaxCvs(), null));
    }

    private long messages(Long id, LocalDate from, LocalDate to) {
        return events.countByAccountIdAndMessageTrueAndUsedAtGreaterThanEqualAndUsedAtLessThan(
                id, from.atStartOfDay(), to.atStartOfDay());
    }

    private long count(java.util.List<PlanUsageEvent> recent, LocalDate from, boolean messagesOnly) {
        return recent.stream().filter(e -> !e.getUsedAt().isBefore(from.atStartOfDay()))
                .filter(e -> !messagesOnly || e.isMessage()).count();
    }

    private OffsetDateTime reset(LocalDate date) { return date.atStartOfDay(ZONE).toOffsetDateTime(); }

    private PlanUsageResponse lockedUsage(Long id) {
        Account account = accounts.lockById(id).orElseThrow(() ->
                new AppException(ErrorCode.UNAUTHENTICATED, "Không tìm thấy tài khoản."));
        return snapshot(account, LocalDate.now(ZONE), true);
    }

    @Transactional(propagation = Propagation.MANDATORY, noRollbackFor = AppException.class)
    public void checkAi(Long id, boolean message) {
        PlanUsageResponse usage = lockedUsage(id);
        if (message && usage.dailyMessages().exhausted()) {
            throw new AppException(ErrorCode.DAILY_MESSAGE_LIMIT,
                    "Bạn đã dùng hết " + usage.dailyMessages().limit() + " tin nhắn/ngày của gói " + usage.planName()
                    + ". Hạn mức đặt lại lúc 00:00 ngày mai (giờ Việt Nam).");
        }
        if (message && usage.weeklyMessages().exhausted()) {
            throw new AppException(ErrorCode.WEEKLY_MESSAGE_LIMIT,
                    "Bạn đã dùng hết " + usage.weeklyMessages().limit() + " tin nhắn/tuần của gói " + usage.planName()
                    + ". Hạn mức đặt lại lúc 00:00 thứ Hai tuần tới (giờ Việt Nam).");
        }
        if (message && usage.monthlyMessages().exhausted()) {
            throw new AppException(ErrorCode.MONTHLY_MESSAGE_LIMIT,
                    "Bạn đã dùng hết " + usage.monthlyMessages().limit() + " tin nhắn/tháng của gói " + usage.planName()
                    + ". Hạn mức đặt lại lúc 00:00 ngày đầu tháng sau (giờ Việt Nam).");
        }
        if (usage.monthlyCredits().exhausted()) {
            throw new AppException(ErrorCode.AI_CREDIT_EXHAUSTED,
                    "Bạn đã dùng hết " + usage.monthlyCredits().limit() + " credit AI/tháng của gói " + usage.planName()
                    + ". Hạn mức đặt lại vào ngày đầu tháng sau. Hãy đổi gói hoặc chờ kỳ tiếp theo.");
        }
    }

    /** Only call after checkAi and a successful result, in the same transaction. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void recordSuccess(Long id, boolean message) {
        events.save(PlanUsageEvent.builder().accountId(id).message(message).usedAt(LocalDateTime.now(ZONE)).build());
    }

    @Transactional(propagation = Propagation.MANDATORY, noRollbackFor = AppException.class)
    public void checkCvCreation(Long id) {
        PlanUsageResponse usage = lockedUsage(id);
        if (usage.cvs().exhausted()) {
            throw new AppException(ErrorCode.CV_LIMIT_REACHED,
                    "Gói " + usage.planName() + " cho phép tối đa " + usage.cvs().limit()
                    + " CV. Bạn hiện có " + usage.cvs().used() + " CV. Hãy xóa CV không cần thiết hoặc đổi gói để tạo thêm.");
        }
    }
}
