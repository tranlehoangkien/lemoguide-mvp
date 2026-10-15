package lemonadex.lemoguide.lemoguide_mvp.award.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardRequest;
import lemonadex.lemoguide.lemoguide_mvp.award.dto.AwardResponse;
import lemonadex.lemoguide.lemoguide_mvp.award.service.AwardService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own awards. */
@RestController
@RequestMapping("/api/me/awards")
@RequiredArgsConstructor
public class AwardController {

    private final AwardService awardService;

    @GetMapping
    public ApiResponse<PageResponse<AwardResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AwardResponse> page = awardService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AwardResponse>> create(@Valid @RequestBody AwardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Award added", awardService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AwardResponse> get(@PathVariable Long id) {
        return ApiResponse.success(awardService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<AwardResponse> update(@PathVariable Long id, @Valid @RequestBody AwardRequest request) {
        return ApiResponse.success("Award updated", awardService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        awardService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Award removed", null));
    }
}
