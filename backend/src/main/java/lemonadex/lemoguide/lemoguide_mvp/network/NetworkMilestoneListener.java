package lemonadex.lemoguide.lemoguide_mvp.network;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerTaskCompletedEvent;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;

/**
 * Auto-shares a completed roadmap week as a MILESTONE post for members who opted in (auto_share_milestones), and
 * tells their accountability buddy. Runs after the roadmap save commits, in its own transaction, so a network
 * failure can never undo or block marking a week done.
 */
@Component
@RequiredArgsConstructor
public class NetworkMilestoneListener {
    private final NetworkAccess access;
    private final NetworkBuddyService buddies;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onCompleted(CareerTaskCompletedEvent event) {
        share(event.accountId(), event.taskId());
    }

    void share(long account, long taskId) {
        var profile = access.db.queryForList("SELECT published,suspended,auto_share_milestones FROM network_profile WHERE account_id=?", account);
        if (profile.isEmpty() || !bool(profile.getFirst(), "published") || bool(profile.getFirst(), "suspended") || !bool(profile.getFirst(), "auto_share_milestones")) return;
        var tasks = access.db.queryForList("SELECT t.week_number,t.title,t.course_title,p.target_role FROM career_task t JOIN career_plan p ON p.id=t.plan_id WHERE t.id=? AND p.account_id=? AND t.completed=TRUE", taskId, account);
        if (tasks.isEmpty()) return;
        // Un-ticking and re-ticking a week must not publish it twice.
        if (access.count("SELECT COUNT(*) FROM network_post WHERE author_id=? AND task_id=?", account, taskId) > 0) return;
        var task = tasks.getFirst();
        String content = "Mình vừa hoàn thành tuần " + task.get("week_number") + " của lộ trình " + task.get("target_role") + ": " + task.get("title") + ".";
        String tags = task.get("course_title") == null ? "" : clean(task.get("course_title").toString());
        long post = access.insert("INSERT INTO network_post(author_id,kind,content,tags,task_id) VALUES (?,'MILESTONE',?,?,?)", account, content, tags.length() > 300 ? tags.substring(0, 300) : tags, taskId);
        buddies.buddyOf(account).ifPresent(buddy -> access.notify(buddy, account, "BUDDY_MILESTONE", post));
    }
}
