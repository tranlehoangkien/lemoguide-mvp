package lemonadex.lemoguide.lemoguide_mvp.cvexport.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.service.CvExportAdminService;
import lombok.RequiredArgsConstructor;

/** Read-only oversight of every user's CV exports. */
@RestController
@RequestMapping("/api/admin/cv-exports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CvExportAdminController {

    private final CvExportAdminService cvExportAdminService;

    @GetMapping
    public ApiResponse<PageResponse<CvExportResponse>> list(
            @RequestParam(required = false) Long accountId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CvExportResponse> page = cvExportAdminService.search(accountId, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/{id}")
    public ApiResponse<CvExportResponse> get(@PathVariable Long id) {
        return ApiResponse.success(cvExportAdminService.get(id));
    }
}
