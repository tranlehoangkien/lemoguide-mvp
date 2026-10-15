package lemonadex.lemoguide.lemoguide_mvp.plan.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lemonadex.lemoguide.lemoguide_mvp.auth.repository.AccountRepository;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanRequest;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanResponse;
import lemonadex.lemoguide.lemoguide_mvp.plan.dto.PlanSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.plan.entity.Plan;
import lemonadex.lemoguide.lemoguide_mvp.plan.repository.PlanRepository;
import lemonadex.lemoguide.lemoguide_mvp.plan.spec.PlanSpecifications;
import lombok.RequiredArgsConstructor;

/** CRUD for the {@code plan} lookup table. Admin-only (see {@code PlanController}). */
@Service
@Transactional
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;
    private final AccountRepository accountRepository;

    /** Active plans only, for the self-service "choose a plan" selector (see {@code LookupController}). */
    @Transactional(readOnly = true)
    public List<PlanResponse> getActivePlans() {
        return planRepository.findByIsActiveTrueOrderByPriceAsc().stream().map(PlanResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Page<PlanResponse> search(PlanSearchCriteria criteria, Pageable pageable) {
        Specification<Plan> spec = Specification.<Plan>unrestricted()
                .and(PlanSpecifications.keyword(criteria.keyword()));
        return planRepository.findAll(spec, pageable).map(PlanResponse::from);
    }

    @Transactional(readOnly = true)
    public PlanResponse get(Long id) {
        return PlanResponse.from(require(id));
    }

    public PlanResponse create(PlanRequest request) {
        String name = request.name().trim();
        if (planRepository.existsByNameIgnoreCase(name)) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A plan with this name already exists");
        }
        Plan plan = planRepository.save(Plan.builder()
                .name(name)
                .price(request.price())
                .billingCycle(request.billingCycle())
                .aiCreditsPerMonth(request.aiCreditsPerMonth())
                .maxCvs(request.maxCvs())
                .messagesPerDay(request.messagesPerDay())
                .messagesPerWeek(request.messagesPerWeek())
                .messagesPerMonth(request.messagesPerMonth())
                .allowPremiumTemplates(request.allowPremiumTemplates())
                .isActive(request.isActive())
                .build());
        return PlanResponse.from(plan);
    }

    public PlanResponse update(Long id, PlanRequest request) {
        Plan plan = require(id);
        String name = request.name().trim();
        planRepository.findByNameIgnoreCase(name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new AppException(ErrorCode.RESOURCE_CONFLICT, "A plan with this name already exists");
                });
        plan.setName(name);
        plan.setPrice(request.price());
        plan.setBillingCycle(request.billingCycle());
        plan.setAiCreditsPerMonth(request.aiCreditsPerMonth());
        plan.setMaxCvs(request.maxCvs());
        plan.setMessagesPerDay(request.messagesPerDay());
        plan.setMessagesPerWeek(request.messagesPerWeek());
        plan.setMessagesPerMonth(request.messagesPerMonth());
        plan.setAllowPremiumTemplates(request.allowPremiumTemplates());
        plan.setIsActive(request.isActive());
        return PlanResponse.from(plan);
    }

    /**
     * Deletes the plan. Unlike {@code major_id}, {@code account.plan_id} is
     * {@code NOT NULL} with no {@code ON DELETE} clause (implicit RESTRICT), so a
     * plan still assigned to at least one account is rejected up front instead of
     * surfacing a raw SQL constraint violation.
     */
    public void delete(Long id) {
        Plan plan = require(id);
        if (accountRepository.existsByPlanId(plan.getId())) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT,
                    "This plan is still assigned to one or more accounts and cannot be deleted");
        }
        planRepository.delete(plan);
    }

    private Plan require(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Plan not found"));
    }
}
