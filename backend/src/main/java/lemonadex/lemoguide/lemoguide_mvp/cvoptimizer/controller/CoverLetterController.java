package lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CoverLetterRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CoverLetterResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.dto.CoverLetterUpdateRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CoverLetterService;
import lombok.RequiredArgsConstructor;

/** Generate, keep, edit and delete the caller's own cover letters. */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class CoverLetterController {

    private final CoverLetterService coverLetterService;

    @PostMapping("/cv-profiles/{cvProfileId}/cover-letters")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CoverLetterResponse> generate(@PathVariable Long cvProfileId,
            @Valid @RequestBody CoverLetterRequest request) {
        return ApiResponse.success(coverLetterService.generate(cvProfileId, request));
    }

    @GetMapping("/cv-profiles/{cvProfileId}/cover-letters")
    public ApiResponse<List<CoverLetterResponse>> list(@PathVariable Long cvProfileId) {
        return ApiResponse.success(coverLetterService.list(cvProfileId));
    }

    @GetMapping("/cover-letters/{id}")
    public ApiResponse<CoverLetterResponse> get(@PathVariable Long id) {
        return ApiResponse.success(coverLetterService.get(id));
    }

    @PutMapping("/cover-letters/{id}")
    public ApiResponse<CoverLetterResponse> update(@PathVariable Long id,
            @Valid @RequestBody CoverLetterUpdateRequest request) {
        return ApiResponse.success(coverLetterService.update(id, request));
    }

    @DeleteMapping("/cover-letters/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        coverLetterService.delete(id);
        return ApiResponse.success(null);
    }
}
