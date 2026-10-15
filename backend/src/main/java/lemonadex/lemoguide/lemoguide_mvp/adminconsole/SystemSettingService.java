package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.entity.PublishMode;

/**
 * "Cấu hình publish_mode": system-wide CV sharing settings stored in system_setting.
 *  - default publish mode: which state the create-CV form starts in (PUBLIC_LINK = "Công khai"),
 *    and the private mode a draft uses (PDF or ATS_TEXT);
 *  - public link enabled: when false no CV can be switched to PUBLIC_LINK, public links answer 404 and
 *    LemoNetwork stops showing shared CVs;
 *  - default share expiry (days, 0 = never): applied when a CV becomes PUBLIC_LINK without its own expiry.
 * Missing rows fall back to the V50 defaults so the app keeps working on a database without them.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SystemSettingService {
    static final String DEFAULT_MODE = "cv.default_publish_mode", PUBLIC_ENABLED = "cv.public_link_enabled", EXPIRY_DAYS = "cv.default_share_expiry_days";
    static final int MAX_EXPIRY_DAYS = 365;
    private final JdbcTemplate db;

    public record CvPublishSettings(PublishMode defaultPublishMode, boolean publicLinkEnabled, int defaultShareExpiryDays) { }

    @Transactional(readOnly = true)
    public CvPublishSettings cvPublish() {
        Map<String,String> values = new HashMap<>();
        try {
            db.queryForList("SELECT setting_key,setting_value FROM system_setting WHERE setting_key LIKE 'cv.%'")
                    .forEach(r -> values.put((String) r.get("setting_key"), (String) r.get("setting_value")));
        } catch (RuntimeException missingTable) {
            // Before V50 (or on test schemas without the table) the defaults apply.
        }
        PublishMode mode;
        try { mode = PublishMode.valueOf(values.getOrDefault(DEFAULT_MODE, "PDF")); } catch (IllegalArgumentException e) { mode = PublishMode.PDF; }
        int days;
        try { days = Math.clamp(Integer.parseInt(values.getOrDefault(EXPIRY_DAYS, "0")), 0, MAX_EXPIRY_DAYS); } catch (NumberFormatException e) { days = 0; }
        return new CvPublishSettings(mode, !"false".equalsIgnoreCase(values.getOrDefault(PUBLIC_ENABLED, "true")), days);
    }

    /** Settings plus how many CVs currently use each publish mode, for the admin page. */
    @Transactional(readOnly = true)
    public Map<String,Object> cvPublishOverview() {
        var result = new LinkedHashMap<String,Object>();
        result.put("settings", cvPublish());
        Map<String,Long> counts = new LinkedHashMap<>();
        for (PublishMode m : PublishMode.values()) counts.put(m.name(), 0L);
        db.queryForList("SELECT publish_mode,COUNT(*) AS c FROM cv_profile GROUP BY publish_mode")
                .forEach(r -> counts.put(String.valueOf(r.get("publish_mode")).toUpperCase(Locale.ROOT), ((Number) r.get("c")).longValue()));
        result.put("counts", counts);
        result.put("activePublic", db.queryForObject("SELECT COUNT(*) FROM cv_profile WHERE publish_mode='public_link' AND is_active=TRUE", Long.class));
        result.put("updatedAt", db.queryForList("SELECT MAX(updated_at) FROM system_setting WHERE setting_key LIKE 'cv.%'", LocalDateTime.class).stream().findFirst().orElse(null));
        return result;
    }

    public CvPublishSettings updateCvPublish(CvPublishSettings next) {
        if (next.defaultPublishMode() == null) throw new AppException(ErrorCode.BAD_REQUEST, "Hãy chọn chế độ mặc định.");
        if (next.defaultShareExpiryDays() < 0 || next.defaultShareExpiryDays() > MAX_EXPIRY_DAYS)
            throw new AppException(ErrorCode.BAD_REQUEST, "Thời hạn link công khai từ 0 đến " + MAX_EXPIRY_DAYS + " ngày (0 = không hết hạn).");
        if (!next.publicLinkEnabled() && next.defaultPublishMode() == PublishMode.PUBLIC_LINK)
            throw new AppException(ErrorCode.BAD_REQUEST, "Không thể đặt mặc định Công khai khi đang tắt link công khai.");
        Long me = SecurityUtils.currentAccountId();
        put(DEFAULT_MODE, next.defaultPublishMode().name(), me);
        put(PUBLIC_ENABLED, String.valueOf(next.publicLinkEnabled()), me);
        put(EXPIRY_DAYS, String.valueOf(next.defaultShareExpiryDays()), me);
        return cvPublish();
    }

    /** Throws when a CV is being switched to a public link while public links are disabled. */
    public void requirePublicLinkAllowed() {
        if (!cvPublish().publicLinkEnabled())
            throw new AppException(ErrorCode.BAD_REQUEST, "Quản trị viên đang tạm tắt chia sẻ CV bằng link công khai. Hãy lưu CV ở chế độ bản nháp.");
    }

    /** Expiry for a CV that just became public without one: now + default days, or null when the default is "never". */
    public LocalDateTime defaultShareExpiry() {
        int days = cvPublish().defaultShareExpiryDays();
        return days == 0 ? null : LocalDateTime.now().plusDays(days);
    }

    private void put(String key, String value, Long by) {
        if (db.update("UPDATE system_setting SET setting_value=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE setting_key=?", value, by, key) == 0)
            db.update("INSERT INTO system_setting(setting_key,setting_value,updated_by) VALUES (?,?,?)", key, value, by);
    }
}
