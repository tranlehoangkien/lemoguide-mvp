package lemonadex.lemoguide.lemoguide_mvp.cvexport.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.dto.CvExportStatusUpdateRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvexport.service.CvExportService;
import lombok.RequiredArgsConstructor;

/** Self-service export (PDF/DOCX/PNG) history for the caller's own CVs. */
@RestController
@RequestMapping("/api/me/cv-exports")
@RequiredArgsConstructor
public class CvExportController {

    private final CvExportService cvExportService;

    @GetMapping
    public ApiResponse<PageResponse<CvExportResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CvExportResponse> page = cvExportService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CvExportResponse>> create(@Valid @RequestBody CvExportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Export started", cvExportService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CvExportResponse> get(@PathVariable Long id) {
        return ApiResponse.success(cvExportService.get(id));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<CvExportResponse> updateStatus(
            @PathVariable Long id, @Valid @RequestBody CvExportStatusUpdateRequest request) {
        return ApiResponse.success("Export status updated", cvExportService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cvExportService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Export deleted", null));
    }
}
