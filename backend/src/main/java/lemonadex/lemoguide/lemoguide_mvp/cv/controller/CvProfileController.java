package lemonadex.lemoguide.lemoguide_mvp.cv.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileRequest;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvProfileResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.service.CvPdfImportService;
import lemonadex.lemoguide.lemoguide_mvp.cv.service.CvProfileService;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own CVs ("Engine Hien thi Dong"). */
@RestController
@RequestMapping("/api/me/cv-profiles")
@RequiredArgsConstructor
public class CvProfileController {

    private final CvProfileService cvProfileService;
    private final CvPdfImportService cvPdfImportService;

    @GetMapping
    public ApiResponse<PageResponse<CvProfileResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CvProfileResponse> page = cvProfileService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CvProfileResponse>> create(@Valid @RequestBody CvProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("CV created", cvProfileService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CvProfileResponse> get(@PathVariable Long id) {
        return ApiResponse.success(cvProfileService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CvProfileResponse> update(@PathVariable Long id, @Valid @RequestBody CvProfileRequest request) {
        return ApiResponse.success("CV updated", cvProfileService.update(id, request));
    }

    @PostMapping(value = "/{id}/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CvProfileResponse> uploadAvatar(
            @PathVariable Long id,
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ApiResponse.success("CV avatar uploaded", cvProfileService.uploadAvatar(id, file));
    }

    @PostMapping(value = "/upload-avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<java.util.Map<String, String>> uploadAvatarOnly(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String avatarUrl = cvProfileService.uploadAvatarOnly(file);
        return ApiResponse.success("Avatar uploaded", java.util.Map.of("avatarUrl", avatarUrl));
    }

    /** Extracts raw text from an uploaded CV PDF for the AI CV Builder chat to read (no persistence here). */
    @PostMapping(value = "/extract-pdf-text", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<java.util.Map<String, String>> extractPdfText(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String text = cvPdfImportService.extractText(file);
        return ApiResponse.success(java.util.Map.of("text", text));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        cvProfileService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("CV deleted", null));
    }
}
