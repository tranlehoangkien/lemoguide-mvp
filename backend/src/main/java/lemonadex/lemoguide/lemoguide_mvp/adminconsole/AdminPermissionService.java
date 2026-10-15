package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;

/**
 * Per-admin module permissions (table admin_permission). An ADMIN account with no rows at all is a newly created
 * admin: it is granted every module on first use, and can then be restricted from "Quản lý Vai trò & Phân quyền".
 * At least one active admin must keep SYSTEM, and nobody can remove SYSTEM from themselves.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminPermissionService {
    private final JdbcTemplate db;

    /** Modules the admin may use; grants all modules to an admin that has none recorded yet. */
    public Set<String> permissionsOf(long accountId) {
        var rows = db.queryForList("SELECT permission FROM admin_permission WHERE account_id=?", String.class, accountId);
        if (!rows.isEmpty()) return new LinkedHashSet<>(rows);
        if (!isAdmin(accountId)) return Set.of();
        for (String p : AdminPermission.names()) db.update("INSERT IGNORE INTO admin_permission(account_id,permission) VALUES (?,?)", accountId, p);
        return new LinkedHashSet<>(AdminPermission.names());
    }

    @Transactional(readOnly = true)
    public Map<String,Object> overview() {
        var admins = db.queryForList("SELECT a.id,a.email,a.status,a.last_login_at,ai.full_name,ai.current_title,ai.avatar_url FROM account a JOIN role r ON r.id=a.role_id AND r.name='ADMIN'"
                + " LEFT JOIN admin_information ai ON ai.account_id=a.id WHERE a.deleted_at IS NULL ORDER BY a.id");
        Map<Long,List<String>> granted = new HashMap<>();
        db.queryForList("SELECT account_id,permission FROM admin_permission").forEach(r ->
                granted.computeIfAbsent(((Number) r.get("account_id")).longValue(), k -> new ArrayList<>()).add((String) r.get("permission")));
        long me = SecurityUtils.currentAccountId();
        for (var a : admins) {
            long id = ((Number) a.get("id")).longValue();
            var list = granted.getOrDefault(id, List.of());
            // No rows yet = never used the console since V50; they get everything on first request.
            a.put("permissions", list.isEmpty() ? AdminPermission.names() : list);
            a.put("me", id == me);
        }
        var catalog = Arrays.stream(AdminPermission.values()).map(p -> Map.of("key", p.name(), "label", p.label(), "description", p.description())).toList();
        return Map.of("catalog", catalog, "admins", admins);
    }

    public void update(long accountId, Collection<String> requested) {
        long me = SecurityUtils.currentAccountId();
        if (!isAdmin(accountId)) throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tài khoản quản trị.");
        Set<String> next = new LinkedHashSet<>();
        for (String p : requested) {
            if (!AdminPermission.names().contains(p)) throw new AppException(ErrorCode.BAD_REQUEST, "Quyền không hợp lệ: " + p);
            next.add(p);
        }
        if (next.isEmpty()) throw new AppException(ErrorCode.BAD_REQUEST, "Mỗi quản trị viên cần ít nhất một quyền. Hãy khóa tài khoản nếu muốn chặn truy cập.");
        if (accountId == me && !next.contains(AdminPermission.SYSTEM.name()))
            throw new AppException(ErrorCode.BAD_REQUEST, "Bạn không thể tự gỡ quyền Cài đặt hệ thống của mình.");
        permissionsOf(accountId); // materialise the implicit "all" of a fresh admin before narrowing it
        db.update("DELETE FROM admin_permission WHERE account_id=?", accountId);
        for (String p : next) db.update("INSERT INTO admin_permission(account_id,permission) VALUES (?,?)", accountId, p);
        long systemAdmins = db.queryForObject("SELECT COUNT(DISTINCT p.account_id) FROM admin_permission p JOIN account a ON a.id=p.account_id"
                + " WHERE p.permission='SYSTEM' AND a.status='active' AND a.deleted_at IS NULL", Long.class);
        if (systemAdmins == 0) throw new AppException(ErrorCode.BAD_REQUEST, "Cần ít nhất một quản trị viên đang hoạt động giữ quyền Cài đặt hệ thống.");
    }

    private boolean isAdmin(long accountId) {
        Long n = db.queryForObject("SELECT COUNT(*) FROM account a JOIN role r ON r.id=a.role_id WHERE a.id=? AND r.name='ADMIN' AND a.deleted_at IS NULL", Long.class, accountId);
        return n != null && n > 0;
    }
}
