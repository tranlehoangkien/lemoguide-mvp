package lemonadex.lemoguide.lemoguide_mvp.interest.controller;

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
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestRequest;
import lemonadex.lemoguide.lemoguide_mvp.interest.dto.InterestResponse;
import lemonadex.lemoguide.lemoguide_mvp.interest.service.InterestService;
import lombok.RequiredArgsConstructor;

/** Self-service management of the caller's own interests. */
@RestController
@RequestMapping("/api/me/interests")
@RequiredArgsConstructor
public class InterestController {

    private final InterestService interestService;

    @GetMapping
    public ApiResponse<PageResponse<InterestResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<InterestResponse> page = interestService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InterestResponse>> create(@Valid @RequestBody InterestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interest added", interestService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<InterestResponse> get(@PathVariable Long id) {
        return ApiResponse.success(interestService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<InterestResponse> update(@PathVariable Long id, @Valid @RequestBody InterestRequest request) {
        return ApiResponse.success("Interest updated", interestService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        interestService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Interest removed", null));
    }
}
