package lemonadex.lemoguide.lemoguide_mvp.userskill.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillRequest;
import lemonadex.lemoguide.lemoguide_mvp.userskill.dto.UserSkillResponse;
import lemonadex.lemoguide.lemoguide_mvp.userskill.service.UserSkillService;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own skill assignments. */
@RestController
@RequestMapping("/api/me/skills")
@RequiredArgsConstructor
public class UserSkillController {

    private final UserSkillService userSkillService;

    @GetMapping
    public ApiResponse<PageResponse<UserSkillResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserSkillResponse> page = userSkillService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserSkillResponse>> create(@Valid @RequestBody UserSkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill assigned", userSkillService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<UserSkillResponse> get(@PathVariable Long id) {
        return ApiResponse.success(userSkillService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserSkillResponse> update(@PathVariable Long id, @Valid @RequestBody UserSkillRequest request) {
        return ApiResponse.success("Skill assignment updated", userSkillService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        userSkillService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Skill assignment removed", null));
    }
}
