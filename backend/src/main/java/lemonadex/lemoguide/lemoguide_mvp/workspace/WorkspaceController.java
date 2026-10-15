package lemonadex.lemoguide.lemoguide_mvp.workspace;

import java.time.LocalDate;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import static lemonadex.lemoguide.lemoguide_mvp.workspace.WorkspaceDtos.*;

@RestController @RequestMapping("/api/me/workspace") @RequiredArgsConstructor
public class WorkspaceController {
    private final WorkspaceService service;
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    @ResponseStatus(org.springframework.http.HttpStatus.CONFLICT)
    public ApiResponse<?> conflict() { return ApiResponse.error("Dữ liệu đã thay đổi. Hãy tải lại trước khi lưu."); }
    @GetMapping public ApiResponse<?> overview(@RequestParam(required=false) @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate week) { return ApiResponse.success(service.overview(week)); }
    @PostMapping("/tasks") public ApiResponse<?> createTask(@Valid @RequestBody TaskInput input) { return ApiResponse.success(service.saveTask(null, input)); }
    @PutMapping("/tasks/{id}") public ApiResponse<?> updateTask(@PathVariable Long id, @Valid @RequestBody TaskInput input) { return ApiResponse.success(service.saveTask(id, input)); }
    @DeleteMapping("/tasks/{id}") public ApiResponse<?> deleteTask(@PathVariable Long id) { service.deleteTask(id); return ApiResponse.success("Đã xóa", null); }
    @GetMapping("/applications") public ApiResponse<?> list(@RequestParam(required=false) JobApplication.Status status, @RequestParam(defaultValue="") @Size(max=200) String query, @RequestParam(defaultValue="0") @Min(0) int page) { return ApiResponse.success(PageResponse.from(service.list(status, query, page))); }
    @GetMapping("/applications/counts") public ApiResponse<?> counts() { return ApiResponse.success(service.counts()); }
    @GetMapping("/applications/{id}") public ApiResponse<?> get(@PathVariable Long id) { return ApiResponse.success(service.get(id)); }
    @GetMapping("/applications/{id}/history") public ApiResponse<?> history(@PathVariable Long id) { return ApiResponse.success(service.history(id)); }
    @PostMapping("/applications") public ApiResponse<?> create(@Valid @RequestBody ApplicationInput input) { return ApiResponse.success(service.saveApplication(null, input)); }
    @PutMapping("/applications/{id}") public ApiResponse<?> update(@PathVariable Long id, @Valid @RequestBody ApplicationInput input) { return ApiResponse.success(service.saveApplication(id, input)); }
    @DeleteMapping("/applications/{id}") public ApiResponse<?> delete(@PathVariable Long id) { service.deleteApplication(id); return ApiResponse.success("Đã xóa", null); }
}
