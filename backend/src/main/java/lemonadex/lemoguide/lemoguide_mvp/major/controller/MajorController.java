package lemonadex.lemoguide.lemoguide_mvp.major.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorRequest;
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorResponse;
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.major.service.MajorService;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for the {@code major} lookup. */
@RestController
@RequestMapping("/api/admin/majors")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class MajorController {

    private final MajorService majorService;

    @GetMapping
    public ApiResponse<PageResponse<MajorResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MajorResponse> page = majorService.search(new MajorSearchCriteria(keyword, name), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MajorResponse>> create(@Valid @RequestBody MajorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Major created", majorService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<MajorResponse> get(@PathVariable Long id) {
        return ApiResponse.success(majorService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<MajorResponse> update(@PathVariable Long id, @Valid @RequestBody MajorRequest request) {
        return ApiResponse.success("Major updated", majorService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        majorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Major deleted", null));
    }
}
