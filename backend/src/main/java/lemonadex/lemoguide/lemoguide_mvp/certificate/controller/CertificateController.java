package lemonadex.lemoguide.lemoguide_mvp.certificate.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateRequest;
import lemonadex.lemoguide.lemoguide_mvp.certificate.dto.CertificateResponse;
import lemonadex.lemoguide.lemoguide_mvp.certificate.service.CertificateService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own certificates. */
@RestController
@RequestMapping("/api/me/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping
    public ApiResponse<PageResponse<CertificateResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CertificateResponse> page = certificateService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CertificateResponse>> create(@Valid @RequestBody CertificateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Certificate added", certificateService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CertificateResponse> get(@PathVariable Long id) {
        return ApiResponse.success(certificateService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<CertificateResponse> update(@PathVariable Long id, @Valid @RequestBody CertificateRequest request) {
        return ApiResponse.success("Certificate updated", certificateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        certificateService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Certificate removed", null));
    }
}
