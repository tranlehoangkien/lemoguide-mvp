package lemonadex.lemoguide.lemoguide_mvp.common.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lemonadex.lemoguide.lemoguide_mvp.aimodel.dto.AiModelResponse;
import lemonadex.lemoguide.lemoguide_mvp.aimodel.service.AiModelService;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.ApiResponse;
import lemonadex.lemoguide.lemoguide_mvp.common.dto.PageResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.service.CvTemplateService;
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorResponse;
import lemonadex.lemoguide.lemoguide_mvp.major.dto.MajorSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.major.service.MajorService;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanResponse;
import lemonadex.lemoguide.lemoguide_mvp.plan.service.PlanService;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillResponse;
import lemonadex.lemoguide.lemoguide_mvp.skill.dto.SkillSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.skill.entity.SkillType;
import lemonadex.lemoguide.lemoguide_mvp.skill.service.SkillService;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologyResponse;
import lemonadex.lemoguide.lemoguide_mvp.technology.dto.TechnologySearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.technology.service.TechnologyService;
import lombok.RequiredArgsConstructor;

/**
 * Lookups for system master data such as majors, skills, and technologies.
 * Accessible by any authenticated user for forms and dropdown selectors.
 */
@RestController
@RequestMapping("/api/lookups")
@RequiredArgsConstructor
public class LookupController {

    private final MajorService majorService;
    private final SkillService skillService;
    private final TechnologyService technologyService;
    private final AiModelService aiModelService;
    private final CvTemplateService cvTemplateService;
    private final PlanService planService;

    @GetMapping("/majors")
    public ApiResponse<PageResponse<MajorResponse>> listMajors(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @PageableDefault(size = 100, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<MajorResponse> page = majorService.search(new MajorSearchCriteria(keyword, name), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/skills")
    public ApiResponse<PageResponse<SkillResponse>> listSkills(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 100, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        SkillType skillType = SkillType.fromString(type);
        Page<SkillResponse> page = skillService.search(new SkillSearchCriteria(keyword, name, skillType), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/technologies")
    public ApiResponse<PageResponse<TechnologyResponse>> listTechnologies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 100, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<TechnologyResponse> page = technologyService.search(new TechnologySearchCriteria(keyword, name, category), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    @GetMapping("/ai-models")
    public ApiResponse<List<AiModelResponse>> listAiModels() {
        return ApiResponse.success(aiModelService.getActiveModels());
    }

    /** Active CV templates only, for the CV creation "choose a template" selector. */
    @GetMapping("/cv-templates")
    public ApiResponse<PageResponse<CvTemplateResponse>> listCvTemplates(
            @RequestParam(required = false) String category,
            @PageableDefault(size = 100, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CvTemplateResponse> page = cvTemplateService.search(
                new CvTemplateSearchCriteria(null, category, null, true), pageable);
        return ApiResponse.success(PageResponse.from(page));
    }

    /** Active subscription plans only, for the self-service "upgrade plan" selector. */
    @GetMapping("/plans")
    public ApiResponse<List<PlanResponse>> listPlans() {
        return ApiResponse.success(planService.getActivePlans());
    }
}
