package lemonadex.lemoguide.lemoguide_mvp.aiconversation.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatInvoker;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.AiConversationDetailResponse;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.AiConversationResponse;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.CreateConversationRequest;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.dto.UpdateConversationRequest;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.AiConversation;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.entity.ConversationCategory;
import lemonadex.lemoguide.lemoguide_mvp.aiconversation.repository.AiConversationRepository;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogRequest;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.dto.AiGenerationLogResponse;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.entity.GenerationStatus;
import lemonadex.lemoguide.lemoguide_mvp.aigenerationlog.service.AiGenerationLogService;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.dto.AiMessageResponse;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.dto.SendMessageRequest;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.dto.SendMessageResponse;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.entity.AiMessage;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.entity.MessageRole;
import lemonadex.lemoguide.lemoguide_mvp.aimessage.repository.AiMessageRepository;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.ActionType;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.entity.AiPromptTemplate;
import lemonadex.lemoguide.lemoguide_mvp.aiprompttemplate.repository.AiPromptTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cvoptimizer.service.CvGroundingService;
import lombok.RequiredArgsConstructor;

/**
 * Self-service orchestration for the "AI Coach" chat feature: conversation
 * CRUD plus the actual send-message turn (calls the provider and logs usage
 * via {@link AiGenerationLogService}). Plan quotas are checked before sending;
 * only successful replies consume a message and one AI credit.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class MyAiConversationService {

    private static final int MAX_TITLE_LENGTH = 80;

    /**
     * Appended after the model's base "chat" prompt template whenever the
     * caller sends a {@code context} (the CV Builder page always does - see
     * {@code CvBuilderPage.jsx}). Hard-scopes the turn to CV content only and
     * defines the {@code ```cvpatch} response contract the frontend parses to
     * apply structured updates back onto {@code cv_profile.cv_data}.
     */
    private static final String CV_BUILDER_MODE_INSTRUCTIONS = """


            ### CHE DO: TRO LY VIET VA TOI UU CV (CV BUILDER MODE)
            Trong che do nay, ban la mot chuyen gia VIET CV (CV Writer) va toi uu ATS. Ban CHI duoc phep ho tro cac yeu cau \
            lien quan truc tiep den viec VIET MOI hoac TOI UU LAI noi dung ban CV hien tai cua nguoi dung (thong tin ca \
            nhan, muc tieu nghe nghiep, hoc van, kinh nghiem lam viec, du an, ky nang, chung chi, giai thuong, so thich, \
            nguoi gioi thieu) - bao gom ca viec them/sua/xoa cac muc do khi nguoi dung yeu cau, vi day la mot phan cua \
            qua trinh hoan thien noi dung CV.
            Nguyen tac VIET/TOI UU noi dung bat buoc ap dung moi khi viet moi hoac chinh sua mot doan mo ta (tom tat muc \
            tieu, kinh nghiem, du an...):
            1. Uu tien cong thuc STAR (Situation - Task - Action - Result), dung dong tu hanh dong manh o dau moi y.
            2. Uu tien so lieu dinh luong cu the (%, so luong, thoi gian) khi hop ly - KHONG duoc tu bia so lieu nguoi \
            dung chua cung cap, neu thieu du lieu hay hoi lai thay vi bia dat.
            3. Toi uu tu khoa (keywords) phu hop nganh nghe/vi tri ung tuyen de tang kha nang vuot bo loc ATS.
            4. Van phong ngan gon, suc tich, chuyen nghiep, khong dung dai tu nhan xung ("toi").
            Neu nguoi dung hoi hoac yeu cau bat ky dieu gi KHONG lien quan den viec viet/toi uu CV cua ho (kien thuc \
            chung, viet code khong phuc vu CV, tu van phong van/dam phan luong, tan gau, chu de khac...), hay tu choi \
            lich su bang tieng Viet va nhac nguoi dung quay lai chu de viet/toi uu CV.

            Du lieu CV hien tai cua nguoi dung duoc cung cap ben duoi dang JSON theo dung schema sau (mang rong nghia la \
            muc do chua co du lieu, KHONG duoc tu bia them):
            {
              "profile": { "fullName", "email", "currentTitle", "dateOfBirth", "gender", "city", "district", "shortTermGoal", "longTermGoal", "avatarUrl" },
              "contacts": [{ "type": "PHONE|EMAIL|GITHUB|LINKEDIN|FACEBOOK|PORTFOLIO|WEBSITE|OTHER", "value" }],
              "education": [{ "schoolName", "majorName", "classification", "startDate", "endDate", "gpa", "thesisAchievement" }],
              "experiences": [{ "companyName", "jobTitle", "startDate", "endDate", "current", "description" }],
              "projects": [{ "name", "role", "startDate", "endDate", "githubUrl", "description", "technologies" }],
              "skills": [{ "skillName", "skillType", "proficiencyLevel", "languageLevel" }],
              "certificates": [{ "name", "issuedBy", "issuedYear" }],
              "awards": [{ "name", "grantedBy", "grantedYear" }],
              "interests": [{ "name" }],
              "referrers": [{ "name", "position", "company", "contactInfo" }]
            }

            Khi yeu cau cua nguoi dung can thay doi du lieu CV, hay:
            1. Tra loi ngan gon, tu nhien bang tieng Viet xac nhan nhung gi ban vua cap nhat.
            2. Ngay sau do, xuat RIENG mot khoi ma fenced dang ```cvpatch chua DUY NHAT mot JSON object la ban va (patch) \
            theo dung schema tren - chi gom cac truong/section thuc su thay doi. Voi cac section dang mang (contacts, \
            education, experiences, projects, skills, certificates, awards, interests, referrers), tra ve TOAN BO mang \
            moi sau khi da them/sua/xoa (khong phai chi phan tu thay doi).
            3. Neu yeu cau cua nguoi dung KHONG can thay doi du lieu CV (chi hoi/tu van), KHONG duoc xuat khoi ```cvpatch.
            4. Khong tu bia so lieu/thong tin nguoi dung chua cung cap.

            Du lieu CV hien tai (JSON):
            """;

    private final AiConversationRepository aiConversationRepository;
    private final AiMessageRepository aiMessageRepository;
    private final AiModelRepository aiModelRepository;
    private final AiPromptTemplateRepository aiPromptTemplateRepository;
    private final AiGenerationLogService aiGenerationLogService;
    private final AiChatInvoker aiChatInvoker;
    private final CvGroundingService cvGroundingService;
    private final lemonadex.lemoguide.lemoguide_mvp.careerplan.service.CareerPlanService careerPlanService;
    private final lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanUsageService planUsageService;

    @Transactional(readOnly = true)
    public Page<AiConversationResponse> list(ConversationCategory category, Pageable pageable) {
        Long accountId = SecurityUtils.currentAccountId();
        Page<AiConversation> page = category != null
                ? aiConversationRepository.findByAccountIdAndCategoryAndDeletedAtIsNull(accountId, category, pageable)
                : aiConversationRepository.findByAccountIdAndDeletedAtIsNull(accountId, pageable);
        return page.map(AiConversationResponse::from);
    }

    @Transactional(readOnly = true)
    public AiConversationDetailResponse getDetail(Long id, Pageable messagesPageable) {
        Long accountId = SecurityUtils.currentAccountId();
        AiConversation conversation = requireOwned(id, accountId);
        Page<AiMessageResponse> messages = aiMessageRepository
                .findByConversationIdOrderByCreatedAtAsc(id, messagesPageable)
                .map(AiMessageResponse::from);
        return new AiConversationDetailResponse(AiConversationResponse.from(conversation), PageResponse.from(messages));
    }

    public AiConversationResponse create(CreateConversationRequest request) {
        Long accountId = SecurityUtils.currentAccountId();
        AiModel model = request.modelId() != null ? requireActiveModel(request.modelId()) : requireDefaultModel();
        // A CV / job the chat is grounded on must be the caller's own / an active posting.
        cvGroundingService.requireGroundable(request.cvProfileId(), request.jobPostingId());
        if (request.careerPlanId() != null) {
            careerPlanService.requireOwned(request.careerPlanId());
            if (request.category() != ConversationCategory.CAREER_ROADMAP) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Lộ trình chỉ dùng với chủ đề Định hướng nghề nghiệp.");
            }
        }
        AiConversation conversation = aiConversationRepository.save(AiConversation.builder()
                .accountId(accountId)
                .modelId(model.getId())
                .category(request.category() != null ? request.category() : ConversationCategory.GENERAL)
                .cvProfileId(request.cvProfileId())
                .jobPostingId(request.jobPostingId())
                .careerPlanId(request.careerPlanId())
                .title(request.title())
                .build());
        return AiConversationResponse.from(conversation);
    }

    public AiConversationResponse update(Long id, UpdateConversationRequest request) {
        AiConversation conversation = requireOwned(id, SecurityUtils.currentAccountId());
        if (request.title() != null) {
            conversation.setTitle(request.title());
        }
        if (request.isPinned() != null) {
            conversation.setIsPinned(request.isPinned());
        }
        if (request.modelId() != null) {
            conversation.setModelId(requireActiveModel(request.modelId()).getId());
        }
        return AiConversationResponse.from(conversation);
    }

    public void delete(Long id) {
        AiConversation conversation = requireOwned(id, SecurityUtils.currentAccountId());
        conversation.setDeletedAt(LocalDateTime.now());
    }

    /**
     * Posts the user's turn, calls the model, and returns both saved messages.
     * {@code noRollbackFor} matters here: on a provider failure we still want to
     * keep the user's message and the FAILED log row we just wrote, not undo
     * them along with the {@link AppException} that reports the failure.
     */
    @Transactional(noRollbackFor = AppException.class)
    public SendMessageResponse sendMessage(Long conversationId, SendMessageRequest request) {
        Long accountId = SecurityUtils.currentAccountId();
        AiConversation conversation = requireOwned(conversationId, accountId);

        AiModel model = requireActiveModel(conversation.getModelId());
        ActionType chatActionType = resolveChatActionType(conversation.getCategory());
        AiPromptTemplate template = findChatTemplate(model.getId(), chatActionType);
        planUsageService.checkAi(accountId, true);

        boolean isFirstMessage = conversation.getTitle() == null || conversation.getTitle().isBlank();

        AiMessage userMessage = aiMessageRepository.save(AiMessage.builder()
                .conversationId(conversation.getId())
                .role(MessageRole.USER)
                .content(request.content())
                .attachmentUrl(request.attachmentUrl())
                .build());

        List<AiChatMessage> history = buildHistory(conversation.getId());

        String systemPrompt = template.getPromptText();
        if (conversation.getCareerPlanId() != null) {
            systemPrompt = systemPrompt + careerPlanService.promptContext(conversation.getCareerPlanId());
        } else if (request.context() != null && !request.context().isBlank()) {
            systemPrompt = systemPrompt + CV_BUILDER_MODE_INSTRUCTIONS + request.context();
        } else if (conversation.getCvProfileId() != null || conversation.getJobPostingId() != null) {
            // Grounded chat (AI Coach "Toi uu CV"): the server supplies the real CV / job, not the client.
            systemPrompt = systemPrompt + cvGroundingService.promptContext(
                    conversation.getCvProfileId(), conversation.getJobPostingId());
        }

        AiChatResult result;
        try {
            result = aiChatInvoker.chat(model, systemPrompt, history);
        } catch (Exception ex) {
            aiGenerationLogService.create(new AiGenerationLogRequest(accountId, null, template.getId(),
                    chatActionType, request.content(), null, 0, 0, BigDecimal.ZERO,
                    GenerationStatus.FAILED, ex.getMessage()));
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "Khong the nhan phan hoi tu AI luc nay (nha cung cap dang qua tai hoac gian doan). Vui long thu lai sau it phut.");
        }

        AiGenerationLogResponse log = aiGenerationLogService.create(new AiGenerationLogRequest(accountId, null,
                template.getId(), chatActionType, request.content(), result.content(), result.inputTokens(),
                result.outputTokens(), BigDecimal.ZERO, GenerationStatus.SUCCESS, null));

        AiMessage assistantMessage = aiMessageRepository.save(AiMessage.builder()
                .conversationId(conversation.getId())
                .role(MessageRole.ASSISTANT)
                .content(result.content())
                .generationLogId(log.id())
                .build());

        conversation.setLastMessageAt(LocalDateTime.now());
        if (isFirstMessage) {
            conversation.setTitle(autoTitle(request.content()));
        }

        planUsageService.recordSuccess(accountId, true);
        return new SendMessageResponse(AiMessageResponse.from(userMessage), AiMessageResponse.from(assistantMessage),
                planUsageService.get(accountId).monthlyCredits().remaining().intValue());
    }

    /** Recent turns, oldest first, for the model's chat history context. */
    private List<AiChatMessage> buildHistory(Long conversationId) {
        List<AiMessage> recent = aiMessageRepository.findTop20ByConversationIdOrderByCreatedAtDesc(conversationId);
        Collections.reverse(recent);
        return recent.stream()
                .map(m -> new AiChatMessage(m.getRole() == MessageRole.ASSISTANT ? "assistant" : "user", m.getContent()))
                .toList();
    }

    private String autoTitle(String content) {
        String trimmed = content.trim();
        return trimmed.length() <= MAX_TITLE_LENGTH ? trimmed : trimmed.substring(0, MAX_TITLE_LENGTH).trim() + "...";
    }

    /**
     * Maps the conversation's AI Coach topic to the specialized {@code chat_*}
     * prompt so each of the 4 topic cards on the welcome screen (see
     * AiWelcomeHero.jsx / aiTopics.js on the frontend) gets a system prompt
     * tuned for that specific job - instead of every topic sharing the same
     * generic {@link ActionType#CHAT} prompt. {@code GENERAL} covers both
     * "no topic selected yet" and stays on the broad, catch-all prompt.
     */
    private ActionType resolveChatActionType(ConversationCategory category) {
        if (category == null) {
            return ActionType.CHAT;
        }
        return switch (category) {
            case CV_OPTIMIZATION -> ActionType.CHAT_CV_COACH;
            case INTERVIEW_PRACTICE -> ActionType.CHAT_INTERVIEW_COACH;
            case CAREER_ROADMAP -> ActionType.CHAT_CAREER_COACH;
            case JOB_SEARCH_NEGOTIATION -> ActionType.CHAT_JOB_SEARCH_COACH;
            case GENERAL -> ActionType.CHAT;
        };
    }

    /**
     * Looks up the specialized template first, falling back to the generic
     * {@link ActionType#CHAT} one if this model doesn't have it configured
     * yet (e.g. a model added after the specialized templates were seeded -
     * see the seeding migration's own note on this). Only throws once
     * neither is available.
     */
    private AiPromptTemplate findChatTemplate(Long modelId, ActionType chatActionType) {
        return aiPromptTemplateRepository
                .findFirstByModelIdAndActionTypeAndIsActiveTrueOrderByVersionDesc(modelId, chatActionType)
                .or(() -> chatActionType == ActionType.CHAT
                        ? Optional.empty()
                        : aiPromptTemplateRepository
                                .findFirstByModelIdAndActionTypeAndIsActiveTrueOrderByVersionDesc(modelId, ActionType.CHAT))
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                        "The AI Coach chat prompt is not configured for this model yet"));
    }

    private AiModel requireActiveModel(Long modelId) {
        return aiModelRepository.findById(modelId)
                .filter(AiModel::getIsActive)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "The selected AI model is not available"));
    }

    private AiModel requireDefaultModel() {
        return aiModelRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                        "No active AI model is configured yet. Please ask an admin to add one."));
    }

    private AiConversation requireOwned(Long id, Long accountId) {
        return aiConversationRepository.findByIdAndAccountIdAndDeletedAtIsNull(id, accountId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Conversation not found"));
    }
}
