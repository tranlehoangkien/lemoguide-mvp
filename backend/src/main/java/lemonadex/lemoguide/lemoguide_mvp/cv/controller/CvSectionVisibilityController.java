package lemonadex.lemoguide.lemoguide_mvp.cv.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvSectionVisibilityRequest;
import lemonadex.lemoguide.lemoguide_mvp.cv.dto.CvSectionVisibilityResponse;
import lemonadex.lemoguide.lemoguide_mvp.cv.service.CvSectionVisibilityService;
import lombok.RequiredArgsConstructor;

/** Self-service show/hide + ordering of one CV's sections ("Cau hinh hien thi"). */
@RestController
@RequestMapping("/api/me/cv-profiles/{cvProfileId}/sections")
@RequiredArgsConstructor
public class CvSectionVisibilityController {

    private final CvSectionVisibilityService sectionVisibilityService;

    @GetMapping
    public ApiResponse<List<CvSectionVisibilityResponse>> list(@PathVariable Long cvProfileId) {
        return ApiResponse.success(sectionVisibilityService.list(cvProfileId));
    }

    /** Upsert: creates the section's row on first use, or updates it if it already exists. */
    @PutMapping("/{sectionName}")
    public ApiResponse<CvSectionVisibilityResponse> upsert(
            @PathVariable Long cvProfileId,
            @PathVariable String sectionName,
            @Valid @RequestBody CvSectionVisibilityRequest request) {
        return ApiResponse.success("Section visibility updated",
                sectionVisibilityService.upsert(cvProfileId, sectionName, request));
    }

    @DeleteMapping("/{sectionId}")
    @ResponseStatus(org.springframework.http.HttpStatus.OK)
    public ApiResponse<Void> delete(@PathVariable Long cvProfileId, @PathVariable Long sectionId) {
        sectionVisibilityService.delete(cvProfileId, sectionId);
        return ApiResponse.success("Section removed", null);
    }
}
