package lemonadex.lemoguide.lemoguide_mvp.aiconversation.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.AiConversationDetailResponse;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.AiConversationResponse;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.CreateConversationRequest;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.UpdateConversationRequest;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.ConversationCategory;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.service.MyAiConversationService;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.dto.SendMessageRequest;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.dto.SendMessageResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;

/** Self-service endpoints for the AI Coach chat feature (conversations + messages). */
@RestController
@RequestMapping("/api/me/ai-conversations")
@RequiredArgsConstructor
public class MyAiConversationController {

    private final MyAiConversationService myAiConversationService;

    @GetMapping
    public ApiResponse<PageResponse<AiConversationResponse>> list(
            @RequestParam(required = false) ConversationCategory category,
            @PageableDefault(size = 20, sort = {"isPinned", "lastMessageAt"}, direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AiConversationResponse> page = myAiConversationService.list(category, pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AiConversationResponse>> create(@Valid @RequestBody CreateConversationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conversation created", myAiConversationService.create(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<AiConversationDetailResponse> get(
            @PathVariable Long id,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable messagesPageable) {
        return ApiResponse.success(myAiConversationService.getDetail(id, messagesPageable));
    }

    @PatchMapping("/{id}")
    public ApiResponse<AiConversationResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateConversationRequest request) {
        return ApiResponse.success("Conversation updated", myAiConversationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        myAiConversationService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted", null));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<SendMessageResponse>> sendMessage(
            @PathVariable Long id, @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(myAiConversationService.sendMessage(id, request)));
    }
}
