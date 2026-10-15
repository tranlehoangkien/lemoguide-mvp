package lemonadex.lemoguide.lemoguide_mvp.course.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseRequest;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseResponse;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.course.entity.CourseLevel;
import lemonadex.lemoguide.lemoguide_mvp.course.service.CourseAdminService;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for the {@code course} catalog (Su nghiep > Khoa hoc de xuat). */
@RestController
@RequestMapping("/api/admin/courses")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CourseAdminController {

    private final CourseAdminService courseAdminService;

    @GetMapping
    public ApiResponse<PageResponse<CourseResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        CourseSearchCriteria criteria = new CourseSearchCriteria(keyword, parseLevel(level), isActive);
        Page<CourseResponse> page = courseAdminService.search(criteria, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> create(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course created", courseAdminService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CourseResponse> get(@PathVariable Long id) {
        return ApiResponse.success(courseAdminService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CourseResponse> update(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return ApiResponse.success("Course updated", courseAdminService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        courseAdminService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Course removed", null));
    }

    private static CourseLevel parseLevel(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return CourseLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
