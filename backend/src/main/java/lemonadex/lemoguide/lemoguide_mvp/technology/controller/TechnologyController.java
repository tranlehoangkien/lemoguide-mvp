package lemonadex.lemoguide.lemoguide_mvp.technology.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyRequest;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologySearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.technology.service.TechnologyService;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for the {@code technology} lookup. */
@RestController
@RequestMapping("/api/admin/technologies")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class TechnologyController {

    private final TechnologyService technologyService;

    @GetMapping
    public ApiResponse<PageResponse<TechnologyResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TechnologyResponse> page = technologyService.search(new TechnologySearchCriteria(keyword, name, category), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/categories")
    public ApiResponse<java.util.List<String>> getCategories() {
        return ApiResponse.success(technologyService.getCategories());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TechnologyResponse>> create(@Valid @RequestBody TechnologyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Technology created", technologyService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<TechnologyResponse> get(@PathVariable Long id) {
        return ApiResponse.success(technologyService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<TechnologyResponse> update(@PathVariable Long id, @Valid @RequestBody TechnologyRequest request) {
        return ApiResponse.success("Technology updated", technologyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        technologyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Technology deleted", null));
    }
}
