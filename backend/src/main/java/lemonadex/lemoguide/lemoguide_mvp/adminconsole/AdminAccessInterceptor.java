package lemonadex.lemoguide.lemoguide_mvp.adminconsole;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;

/**
 * Runs for /api/admin/** after Spring Security has confirmed the ADMIN role:
 *  1. rejects the request (403) when its path belongs to a module the admin was not granted;
 *  2. after completion, records every write request (POST/PUT/PATCH/DELETE) in admin_activity_log,
 *     including rejected ones. Request bodies are never stored.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccessInterceptor implements HandlerInterceptor {
    private static final String STARTED = AdminAccessInterceptor.class.getName() + ".started";
    private static final Set<String> WRITES = Set.of("POST", "PUT", "PATCH", "DELETE");
    private final AdminPermissionService permissions;
    private final JdbcTemplate db;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        request.setAttribute(STARTED, System.nanoTime());
        if ("OPTIONS".equals(request.getMethod())) return true;
        var required = AdminPermission.forPath(request.getRequestURI());
        if (required.isEmpty()) return true;
        Long me = SecurityUtils.currentAccountId();
        if (me != null && permissions.permissionsOf(me).contains(required.get().name())) return true;
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"success\":false,\"message\":\"Bạn chưa được cấp quyền " + required.get().label() + ".\",\"data\":null}");
        return false;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        if (!WRITES.contains(request.getMethod())) return;
        try {
            Object started = request.getAttribute(STARTED);
            int duration = started instanceof Long s ? (int) Math.min(Integer.MAX_VALUE, (System.nanoTime() - s) / 1_000_000) : 0;
            String path = request.getRequestURI();
            Long actor = null;
            try { actor = SecurityUtils.currentAccountId(); } catch (RuntimeException ignored) { }
            String email = actor == null ? null : db.queryForList("SELECT email FROM account WHERE id=?", String.class, actor).stream().findFirst().orElse(null);
            int status = ex != null && response.getStatus() < 400 ? 500 : response.getStatus();
            db.update("INSERT INTO admin_activity_log(actor_id,actor_email,method,path,module,target_id,status,duration_ms,ip) VALUES (?,?,?,?,?,?,?,?,?)",
                    actor, email, request.getMethod(), path.length() > 500 ? path.substring(0, 500) : path,
                    AdminActivityService.moduleOf(path), AdminActivityService.targetOf(path), status, duration, clientIp(request));
        } catch (RuntimeException e) {
            // Auditing must never break the admin action itself.
            log.warn("Could not record admin activity for {} {}: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        }
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
        return ip == null ? null : ip.length() > 64 ? ip.substring(0, 64) : ip;
    }
}
