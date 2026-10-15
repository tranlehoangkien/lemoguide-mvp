package lemonadex.lemoguide.lemoguide_mvp.referrer.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerRequest;
import lemonadex.lemoguide.lemoguide_mvp.referrer.dto.ReferrerResponse;
import lemonadex.lemoguide.lemoguide_mvp.referrer.service.ReferrerService;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own referrers. */
@RestController
@RequestMapping("/api/me/referrers")
@RequiredArgsConstructor
public class ReferrerController {

    private final ReferrerService referrerService;

    @GetMapping
    public ApiResponse<PageResponse<ReferrerResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReferrerResponse> page = referrerService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReferrerResponse>> create(@Valid @RequestBody ReferrerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Referrer added", referrerService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReferrerResponse> get(@PathVariable Long id) {
        return ApiResponse.success(referrerService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<ReferrerResponse> update(@PathVariable Long id, @Valid @RequestBody ReferrerRequest request) {
        return ApiResponse.success("Referrer updated", referrerService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        referrerService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Referrer removed", null));
    }
}
