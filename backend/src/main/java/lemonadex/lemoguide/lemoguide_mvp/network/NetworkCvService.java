package lemonadex.lemoguide.lemoguide_mvp.network;

import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.network.NetworkAccess.*;

/**
 * CVs inside LemoNetwork. A member features one of their shareable CVs on the community profile or attaches one
 * to a direct message; nothing else is exposed. Viewing re-checks every rule on each read: the owner is still a
 * visible, unblocked member, the CV is still shareable ({@link NetworkAccess#SHAREABLE_CV}), and it is either
 * the owner's featured CV or was sent by the owner in a thread the viewer belongs to.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class NetworkCvService {
    private final NetworkAccess access;

    /** The caller's CVs with whether each can be shared and why not, plus the one featured on the profile. */
    @Transactional(readOnly = true)
    public Map<String,Object> mine() {
        long me = access.me();
        var cvs = access.db.queryForList("SELECT c.id,c.name,c.target_mode,c.updated_at,c.is_active,c.publish_mode,c.share_password_hash IS NOT NULL AS protected,"
                + "(c.share_expires_at IS NOT NULL AND c.share_expires_at<=CURRENT_TIMESTAMP) AS expired FROM cv_profile c JOIN user_information u ON u.id=c.user_information_id"
                + " WHERE u.account_id=? AND u.deleted_at IS NULL ORDER BY c.updated_at DESC,c.id DESC LIMIT 50", me);
        for (var cv : cvs) {
            String reason = !bool(cv, "is_active") || !"public_link".equalsIgnoreCase(Objects.toString(cv.get("publish_mode"), "")) ? "Đang là bản nháp"
                    : bool(cv, "protected") ? "Có mật khẩu chia sẻ" : bool(cv, "expired") ? "Link chia sẻ đã hết hạn" : null;
            cv.put("shareable", reason == null);
            cv.put("reason", reason);
            for (String key : List.of("is_active", "publish_mode", "protected", "expired")) cv.remove(key);
        }
        var featured = access.db.queryForList("SELECT featured_cv_id FROM network_profile WHERE account_id=?", Long.class, me);
        var result = new LinkedHashMap<String,Object>();
        result.put("featured_cv_id", featured.isEmpty() ? null : featured.getFirst());
        result.put("cvs", cvs);
        return result;
    }

    /** Features one shareable CV on the caller's community profile; null removes it. */
    public void feature(Long cvId) {
        long me = access.me();
        access.settings(me);
        if (cvId != null && access.cvCard(cvId, me) == null)
            throw bad("Chỉ chọn được CV của bạn đang ở chế độ Công khai, không đặt mật khẩu và chưa hết hạn.");
        access.db.update("UPDATE network_profile SET featured_cv_id=? WHERE account_id=?", cvId, me);
    }

    /** Full CV content for rendering, if the caller may see it. Counts a view when someone else opens it. */
    public Map<String,Object> view(long cvId) {
        long me = access.me();
        var rows = access.db.queryForList("SELECT c.id,c.name,c.target_mode,c.template_id,c.cv_data,c.active_sections,c.avatar_url,c.updated_at,u.account_id AS owner_id"
                + " FROM cv_profile c JOIN user_information u ON u.id=c.user_information_id WHERE c.id=?", cvId);
        if (rows.isEmpty()) throw missing();
        var cv = rows.getFirst();
        long owner = number(cv, "owner_id");
        if (owner != me) {
            var person = access.person(owner, me); // published, not suspended, not blocked either way
            if (access.cvCard(cvId, owner) == null) throw missing();
            boolean featured = access.count("SELECT COUNT(*) FROM network_profile WHERE account_id=? AND featured_cv_id=?", owner, cvId) > 0;
            boolean sent = access.count("SELECT COUNT(*) FROM network_message m JOIN network_thread t ON t.id=m.thread_id WHERE m.shared_cv_id=? AND m.sender_id=? AND m.hidden=FALSE"
                    + " AND (t.low_id=? OR t.high_id=?)", cvId, owner, me, me) > 0;
            if (!featured && !sent) throw missing();
            access.db.update("UPDATE cv_profile SET view_count=view_count+1 WHERE id=?", cvId);
            cv.put("owner", person);
        } else {
            // The owner may preview even while unpublished; `owner` is then absent from PERSON's view of the community.
            cv.put("owner", access.db.queryForList(PERSON + "WHERE n.account_id=?", me).stream().findFirst().orElse(null));
        }
        cv.put("mine", owner == me);
        cv.put("cv_data", cv.get("cv_data") == null ? null : cv.get("cv_data").toString());
        cv.put("active_sections", cv.get("active_sections") == null ? null : cv.get("active_sections").toString());
        cv.remove("owner_id");
        return cv;
    }
}
