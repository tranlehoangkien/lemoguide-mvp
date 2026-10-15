package lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.dto.AiCreditTransactionResponse;
import lemonadex.lemoguide.lemoguide_mvp.aicredittransaction.service.MyAiCreditTransactionService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Read-only self-service view of the caller's own AI credit ledger. */
@RestController
@RequestMapping("/api/me/ai-credit-transactions")
@RequiredArgsConstructor
public class MyAiCreditTransactionController {

    private final MyAiCreditTransactionService myAiCreditTransactionService;

    @GetMapping
    public ApiResponse<PageResponse<AiCreditTransactionResponse>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiCreditTransactionResponse> page = myAiCreditTransactionService.list(pageable);
        return ApiResponse.success(PageResponse.from(page));
    }
}
