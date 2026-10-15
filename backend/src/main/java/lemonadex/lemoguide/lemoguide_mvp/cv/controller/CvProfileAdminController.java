package lemonadex.lemoguide.lemoguide_mvp.cv.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileAdminResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileAdminSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.cv.service.CvProfileAdminService;
import lombok.RequiredArgsConstructor;

/**
 * Admin "Quan ly CV" module: search/view every user's CVs and edit their
 * administrative metadata (name, mode, template/theme, active flag, share
 * protection) or remove one outright. CV content itself is self-service only.
 */
@RestController
@RequestMapping("/api/admin/cv-profiles")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CvProfileAdminController {

    private final CvProfileAdminService cvProfileAdminService;

    @GetMapping
    public ApiResponse<PageResponse<CvProfileAdminResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long userInformationId,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CvProfileAdminResponse> page = cvProfileAdminService.search(
                new CvProfileAdminSearchCriteria(keyword, userInformationId, isActive), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/{id}")
    public ApiResponse<CvProfileAdminResponse> get(@PathVariable Long id) {
        return ApiResponse.success(cvProfileAdminService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CvProfileAdminResponse> update(@PathVariable Long id, @Valid @RequestBody CvProfileRequest request) {
        return ApiResponse.success("CV updated", cvProfileAdminService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cvProfileAdminService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("CV deleted", null));
    }
}
