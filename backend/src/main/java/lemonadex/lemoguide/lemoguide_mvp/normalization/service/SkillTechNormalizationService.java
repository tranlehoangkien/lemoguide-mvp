package lemonadex.lemoguide.lemoguide_mvp.normalization.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatClient;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatClientRegistry;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatException;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatMessage;
import lemonadex.lemoguide.lemoguide_mvp.aiclient.AiChatResult;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.entity.AiModel;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.repository.AiModelRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.normalization.dto.NormalizeTermsRequest;
import lemonadex.lemoguide.lemoguide_mvp.normalization.dto.NormalizedTermResponse;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.Skill;
import lemonadex.lemoguide.lemoguide_mvp.skill.repository.SkillRepository;
import lemonadex.lemoguide.lemoguide_mvp.technology.entity.Technology;
import lemonadex.lemoguide.lemoguide_mvp.technology.repository.TechnologyRepository;
import lombok.RequiredArgsConstructor;

/**
 * MVP AI-assisted normalization for the {@code skill}/{@code technology}
 * master-data lookups: given a batch of raw, free-text terms, asks the
 * account's default AI model to match each one against the lookups already
 * in the database (by meaning, not exact string - handles casing, spelling,
 * abbreviations, punctuation) or propose a standardized name for a new entry.
 *
 * <p>Deliberately thin - one direct provider call with an inline prompt, no
 * {@code ai_prompt_template}/{@code ai_conversation}/{@code ai_generation_log}
 * plumbing and no auto-write to the lookup tables. This is the "prompt + API
 * key" first cut; usage tracking, credit accounting, and a review/approve
 * workflow for accepted suggestions can layer on top once the shape of the
 * feature has proven itself.</p>
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class SkillTechNormalizationService {

    private static final Pattern JSON_BLOCK = Pattern.compile("```json\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);

    /** Defensive cap on how many existing lookup rows go into the prompt context. */
    private static final int MAX_CONTEXT_ROWS = 300;

    private static final String SYSTEM_PROMPT = """
            Ban la chuyen gia chuan hoa danh muc du lieu nghe nghiep (ky nang va cong nghe) cho mot he thong CV.

            Nhiem vu: voi moi tu khoa tho (rawTerm) nguoi dung nhap, hay:
            1. Xac dinh no thuoc loai nao: "SKILL" (ky nang mem/cung/ngoai ngu, vi du: giao tiep, lam viec nhom, tieng Anh, \
            quan ly thoi gian) hay "TECHNOLOGY" (ngon ngu lap trinh, framework, thu vien, cong cu, nen tang cu the, \
            vi du: React, Docker, MySQL). Neu khong xac dinh duoc, dung "UNKNOWN".
            2. So sanh VE Y NGHIA (khong phan biet hoa/thuong, dau/khong dau, viet tat, ky tu thua) voi danh sach \
            "existingSkills" (neu category la SKILL) hoac "existingTechnologies" (neu category la TECHNOLOGY) duoc \
            cung cap ben duoi. Neu trung mot muc da co, tra ve matched=true kem dung id va name cua muc do.
            3. Neu KHONG trung muc nao da co, tra ve matched=false va de xuat mot ten chuan hoa (suggestedName) - \
            viet hoa dung chuan (vi du "reactjs" -> "React", "excell" -> "Excel"), khong dich sang ngon ngu khac, \
            khong bia them thong tin. Voi category SKILL, kem de xuat suggestedSkillType la mot trong "hard", "soft", \
            "language". Voi category TECHNOLOGY, kem de xuat suggestedTechnologyCategory ngan gon (vi du: \
            "Programming Language", "Frontend Framework", "Database", "DevOps Tool", "Cloud Platform"...).
            4. Neu 2 tu khoa tho khac nhau trong cung 1 lan goi cung ve mot khai niem, ca hai co the cung tro ve \
            mot matched entry hoac mot suggestedName giong nhau - dieu do la binh thuong.

            CHI tra ve DUY NHAT mot khoi ma fenced dang ```json chua mot JSON ARRAY, moi phan tu dung schema sau, \
            khong them van ban giai thich nao khac ben ngoai khoi ```json:
            [
              {
                "rawTerm": "...",
                "category": "SKILL" | "TECHNOLOGY" | "UNKNOWN",
                "matched": true|false,
                "matchedId": number|null,
                "matchedName": string|null,
                "suggestedName": string|null,
                "suggestedSkillType": "hard"|"soft"|"language"|null,
                "suggestedTechnologyCategory": string|null
              }
            ]
            Mang ket qua phai co dung so phan tu va dung thu tu voi mang "rawTerms" duoc cung cap.
            """;

    private final SkillRepository skillRepository;
    private final TechnologyRepository technologyRepository;
    private final AiModelRepository aiModelRepository;
    private final AiChatClientRegistry aiChatClientRegistry;
    private final ObjectMapper objectMapper;

    public List<NormalizedTermResponse> normalize(NormalizeTermsRequest request) {
        AiModel model = requireDefaultModel();
        AiChatClient client = aiChatClientRegistry.resolve(model.getProvider());

        String userPayload = buildUserPayload(request.rawTerms());
        AiChatResult result;
        try {
            result = client.chat(model, SYSTEM_PROMPT, List.of(new AiChatMessage("user", userPayload)));
        } catch (AiChatException ex) {
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "Khong the goi AI de chuan hoa du lieu luc nay, vui long thu lai sau it phut.");
        }

        return parseResults(result.content());
    }

    private record ExistingSkillDto(Long id, String name, String type) {
    }

    private record ExistingTechnologyDto(Long id, String name, String category) {
    }

    private record NormalizationPayload(
            List<ExistingSkillDto> existingSkills,
            List<ExistingTechnologyDto> existingTechnologies,
            List<String> rawTerms) {
    }

    private String buildUserPayload(List<String> rawTerms) {
        List<ExistingSkillDto> skills = skillRepository.findAll().stream()
                .limit(MAX_CONTEXT_ROWS)
                .map(s -> new ExistingSkillDto(s.getId(), s.getName(), s.getType().name()))
                .toList();
        List<ExistingTechnologyDto> technologies = technologyRepository.findAll().stream()
                .limit(MAX_CONTEXT_ROWS)
                .map(t -> new ExistingTechnologyDto(t.getId(), t.getName(), t.getCategory()))
                .toList();

        try {
            return objectMapper.writeValueAsString(new NormalizationPayload(skills, technologies, rawTerms));
        } catch (Exception ex) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Khong the chuan bi du lieu cho AI.");
        }
    }

    private List<NormalizedTermResponse> parseResults(String content) {
        Matcher matcher = JSON_BLOCK.matcher(content);
        String jsonText = matcher.find() ? matcher.group(1).trim() : content.trim();

        JsonNode arrayNode;
        try {
            arrayNode = objectMapper.readTree(jsonText);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "AI tra ve du lieu khong dung dinh dang, vui long thu lai.");
        }
        if (!arrayNode.isArray()) {
            throw new AppException(ErrorCode.AI_PROVIDER_ERROR,
                    "AI tra ve du lieu khong dung dinh dang, vui long thu lai.");
        }

        List<NormalizedTermResponse> results = new ArrayList<>();
        for (JsonNode node : arrayNode) {
            results.add(new NormalizedTermResponse(
                    node.path("rawTerm").asText(null),
                    node.path("category").asText("UNKNOWN"),
                    node.path("matched").asBoolean(false),
                    node.path("matchedId").isNumber() ? node.path("matchedId").asLong() : null,
                    node.path("matchedName").asText(null),
                    node.path("suggestedName").asText(null),
                    node.path("suggestedSkillType").asText(null),
                    node.path("suggestedTechnologyCategory").asText(null)));
        }
        return results;
    }

    private AiModel requireDefaultModel() {
        return aiModelRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                        "Chua co AI model nao dang hoat dong, vui long lien he admin de cau hinh."));
    }
}
