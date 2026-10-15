package lemonadex.lemoguide.lemoguide_mvp.cvversion.controller;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.dto.CvVersionRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.dto.CvVersionResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvversion.service.CvVersionService;
import lombok.RequiredArgsConstructor;

/** Self-service snapshot history (undo/compare) of one CV. */
@RestController
@RequestMapping("/api/me/cv-profiles/{cvProfileId}/versions")
@RequiredArgsConstructor
public class CvVersionController {

    private final CvVersionService cvVersionService;

    @GetMapping
    public ApiResponse<PageResponse<CvVersionResponse>> list(
            @PathVariable Long cvProfileId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CvVersionResponse> page = cvVersionService.list(cvProfileId, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CvVersionResponse>> create(
            @PathVariable Long cvProfileId, @Valid @RequestBody CvVersionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Snapshot saved", cvVersionService.create(cvProfileId, request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CvVersionResponse> get(@PathVariable Long cvProfileId, @PathVariable Long id) {
        return ApiResponse.success(cvVersionService.get(cvProfileId, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long cvProfileId, @PathVariable Long id) {
        cvVersionService.delete(cvProfileId, id);
        return ResponseEntity.ok(ApiResponse.success("Snapshot deleted", null));
    }
}
