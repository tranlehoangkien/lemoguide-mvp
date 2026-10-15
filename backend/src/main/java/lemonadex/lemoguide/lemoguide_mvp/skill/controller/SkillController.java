package lemonadex.lemoguide.lemoguide_mvp.skill.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillRequest;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillResponse;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;
import lemonadex.lemoguide.lemoguide_mvp.skill.service.SkillService;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for the {@code skill} lookup. */
@RestController
@RequestMapping("/api/admin/skills")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    @GetMapping
    public ApiResponse<PageResponse<SkillResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        SkillType skillType = SkillType.fromString(type);
        Page<SkillResponse> page = skillService.search(new SkillSearchCriteria(keyword, name, skillType), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SkillResponse>> create(@Valid @RequestBody SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill created", skillService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<SkillResponse> get(@PathVariable Long id) {
        return ApiResponse.success(skillService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<SkillResponse> update(@PathVariable Long id, @Valid @RequestBody SkillRequest request) {
        return ApiResponse.success("Skill updated", skillService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        skillService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Skill deleted", null));
    }
}
