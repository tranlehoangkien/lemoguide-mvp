package lemonadex.lemoguide.lemoguide_mvp.auth.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.ChangePasswordRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.MeResponse;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdateMeRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.dto.UpdatePlanRequest;
import lemonadex.lemoguide.lemoguide_mvp.auth.service.MeService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;

/** Self-service endpoints for the authenticated user or admin. */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;

    @GetMapping
    public ApiResponse<MeResponse> me() {
        return ApiResponse.success(meService.getCurrent());
    }

    @PatchMapping
    public ApiResponse<MeResponse> updateMe(@Valid @RequestBody UpdateMeRequest request) {
        return ApiResponse.success("Profile updated", meService.updateCurrent(request));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MeResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
        return ApiResponse.success("Avatar updated", meService.uploadAvatar(file));
    }

    @PatchMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        meService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password changed", null));
    }

    @PatchMapping("/plan")
    public ApiResponse<MeResponse> updatePlan(@Valid @RequestBody UpdatePlanRequest request) {
        return ApiResponse.success("Plan updated", meService.updateCurrentPlan(request));
    }
}
