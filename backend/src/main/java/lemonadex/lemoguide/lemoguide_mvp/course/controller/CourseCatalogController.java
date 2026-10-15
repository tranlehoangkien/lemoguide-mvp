package lemonadex.lemoguide.lemoguide_mvp.course.controller;

import java.util.List;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseCatalogFilters;
import lemonadex.lemoguide.lemoguide_mvp.course.dto.CourseResponse;
import lemonadex.lemoguide.lemoguide_mvp.course.service.CourseCatalogService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me/courses")
@RequiredArgsConstructor
public class CourseCatalogController {
    private final CourseCatalogService service;

    @GetMapping
    public ApiResponse<PageResponse<CourseResponse>> list(
            @RequestParam(required = false) @Size(max = 200) String keyword,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) @Size(max = 150) String provider,
            @RequestParam(required = false) Boolean isFree,
            @RequestParam(required = false) @Positive Long skillId,
            @RequestParam(required = false) @Positive Long technologyId,
            @RequestParam(defaultValue = "newest") String order,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int size) {
        return ApiResponse.success(PageResponse.from(service.search(keyword, level, provider, isFree,
                skillId, technologyId, order, page, size)));
    }

    @GetMapping("/filters")
    public ApiResponse<CourseCatalogFilters> filters() { return ApiResponse.success(service.filters()); }

    @GetMapping("/{id}")
    public ApiResponse<CourseResponse> get(@PathVariable Long id) { return ApiResponse.success(service.get(id)); }

    @GetMapping("/{id}/related")
    public ApiResponse<List<CourseResponse>> related(@PathVariable Long id) { return ApiResponse.success(service.related(id)); }
}
