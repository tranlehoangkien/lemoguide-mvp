package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto.AiCreditTransactionRequest;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto.AiCreditTransactionResponse;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.service.AiCreditTransactionService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Admin CRUD for the {@code ai_credit_transaction} ledger, kept in sync with account balances. */
@RestController
@RequestMapping("/api/admin/ai-credit-transactions")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AiCreditTransactionController {

    private final AiCreditTransactionService aiCreditTransactionService;

    @GetMapping
    public ApiResponse<PageResponse<AiCreditTransactionResponse>> list(
            @RequestParam(required = false) Long accountId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiCreditTransactionResponse> page = aiCreditTransactionService.search(accountId, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AiCreditTransactionResponse>> create(
            @Valid @RequestBody AiCreditTransactionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Credit transaction recorded", aiCreditTransactionService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AiCreditTransactionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(aiCreditTransactionService.get(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<AiCreditTransactionResponse> update(
            @PathVariable Long id, @Valid @RequestBody AiCreditTransactionRequest request) {
        return ApiResponse.success("Credit transaction updated", aiCreditTransactionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        aiCreditTransactionService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Credit transaction deleted", null));
    }
}
