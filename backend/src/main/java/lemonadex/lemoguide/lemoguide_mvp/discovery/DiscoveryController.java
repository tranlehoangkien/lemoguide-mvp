package lemonadex.lemoguide.lemoguide_mvp.discovery;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;

@RestController @RequestMapping("/api/me/discovery") @RequiredArgsConstructor
public class DiscoveryController {
    private final DiscoveryService service;
    private final AdaptiveHollandService adaptive;
    public record AdaptiveAnswer(@NotNull @Min(1) Integer turn, @NotNull @Min(0) @Max(6) Integer option, @Size(max = 300) String note) {}
    public record Start(@NotBlank String kind) {}
    public record Answer(@NotBlank String questionId, @NotNull @Min(0) @Max(6) Integer option) {}
    @GetMapping("/catalog") public ApiResponse<List<DiscoveryService.Catalog>> catalog() { return ApiResponse.success(service.catalog()); }
    @GetMapping("/summary") public ApiResponse<List<DiscoveryService.View>> summary() { return ApiResponse.success(service.summary()); }
    @GetMapping("/attempts") public ApiResponse<List<DiscoveryService.View>> history() { return ApiResponse.success(service.history()); }
    @GetMapping("/progress") public ApiResponse<DiscoveryService.Progress> progress() { return ApiResponse.success(service.progress()); }
    @PostMapping("/attempts") public ApiResponse<DiscoveryService.View> start(@Valid @RequestBody Start request) { return ApiResponse.success(service.start(request.kind())); }
    @GetMapping("/attempts/{id}") public ApiResponse<DiscoveryService.View> get(@PathVariable Long id) { return ApiResponse.success(service.get(id)); }
    @PostMapping("/attempts/{id}/answers") public ApiResponse<DiscoveryService.View> answer(@PathVariable Long id, @Valid @RequestBody Answer request) {
        return ApiResponse.success(service.answer(id, request.questionId(), request.option()));
    }
    @PostMapping("/adaptive") public ApiResponse<AdaptiveHollandService.View> startAdaptive() { return ApiResponse.success(adaptive.start()); }
    @GetMapping("/adaptive/{id}") public ApiResponse<AdaptiveHollandService.View> getAdaptive(@PathVariable Long id) { return ApiResponse.success(adaptive.get(id)); }
    @PostMapping("/adaptive/{id}/answers") public ApiResponse<AdaptiveHollandService.View> answerAdaptive(@PathVariable Long id, @Valid @RequestBody AdaptiveAnswer request) {
        return ApiResponse.success(adaptive.answer(id, request.turn(), request.option(), request.note()));
    }
    @PostMapping("/adaptive/{id}/finish") public ApiResponse<AdaptiveHollandService.View> finishAdaptive(@PathVariable Long id) { return ApiResponse.success(adaptive.finish(id)); }
    @DeleteMapping("/attempts/{id}/answers/{questionId}") public ApiResponse<DiscoveryService.View> undo(@PathVariable Long id, @PathVariable String questionId) {
        return ApiResponse.success(service.undo(id, questionId));
    }
}
