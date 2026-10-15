package lemonadex.lemoguide.lemoguide_mvp.auth.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.auth.dto.RoleView;
import lemonadex.lemoguide.lemoguide_mvp.auth.service.RoleService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;

/** Admin-only role catalogue. */
@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    public ApiResponse<List<RoleView>> list() {
        return ApiResponse.success(roleService.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<RoleView> get(@PathVariable Long id) {
        return ApiResponse.success(roleService.get(id));
    }
}
