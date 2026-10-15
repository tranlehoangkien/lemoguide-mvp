package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.ThumbnailUploadResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.UpdateCvTemplateStatusRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.service.CvTemplateService;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.service.CvTemplateThumbnailStorageService;
import lombok.RequiredArgsConstructor;

/** Admin-only CRUD for {@code cv_template}s. */
@RestController
@RequestMapping("/api/admin/cv-templates")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CvTemplateController {

    private final CvTemplateService cvTemplateService;
    private final CvTemplateThumbnailStorageService thumbnailStorageService;

    @GetMapping
    public ApiResponse<PageResponse<CvTemplateResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isPremium,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CvTemplateResponse> page = cvTemplateService.search(
                new CvTemplateSearchCriteria(keyword, category, isPremium, isActive), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CvTemplateResponse>> create(@Valid @RequestBody CvTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("CV template created", cvTemplateService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CvTemplateResponse> get(@PathVariable Long id) {
        return ApiResponse.success(cvTemplateService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CvTemplateResponse> update(@PathVariable Long id, @Valid @RequestBody CvTemplateRequest request) {
        return ApiResponse.success("CV template updated", cvTemplateService.update(id, request));
    }

    /** Bật/tắt {@code is_active} — the safe alternative to deleting a template that is still in use. */
    @PatchMapping("/{id}/status")
    public ApiResponse<CvTemplateResponse> updateStatus(
            @PathVariable Long id, @Valid @RequestBody UpdateCvTemplateStatusRequest request) {
        return ApiResponse.success("CV template status updated",
                cvTemplateService.updateStatus(id, request.isActive()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cvTemplateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("CV template deleted", null));
    }

    @PostMapping(value = "/upload-thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ThumbnailUploadResponse> uploadThumbnail(@RequestParam("file") MultipartFile file) {
        return ApiResponse.success(new ThumbnailUploadResponse(thumbnailStorageService.store(file)));
    }
}
