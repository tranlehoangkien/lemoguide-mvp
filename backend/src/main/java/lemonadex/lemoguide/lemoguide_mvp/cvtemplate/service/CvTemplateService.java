package lemonadex.lemoguide.lemoguide_mvp.cvtemplate.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import lemonadex.lemoguide.lemoguide_mvp.auth.security.SecurityUtils;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.AppException;
import lemonadex.lemoguide.lemoguide_mvp.common.exception.ErrorCode;
import lemonadex.lemoguide.lemoguide_mvp.cv.repository.CvProfileRepository;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateRequest;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateResponse;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.dto.CvTemplateSearchCriteria;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.CvTemplate;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.Density;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.entity.LayoutType;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.repository.CvTemplateRepository;
import lemonadex.lemoguide.lemoguide_mvp.cvtemplate.spec.CvTemplateSpecifications;
import lombok.RequiredArgsConstructor;

/**
 * CRUD for admin-managed {@code cv_template}s — merged from the former
 * separate {@code cv_template} + {@code theme} modules, so this also owns the
 * color/font/layout-type/density validation that used to live in
 * {@code ThemeService}. Admin-only (see {@code CvTemplateController}).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CvTemplateService {

    private static final Set<Integer> ALLOWED_COLUMNS = Set.of(1, 2);
    private static final Set<String> ALLOWED_SPACING = Set.of("compact", "normal", "spacious");
    private static final String HEX_COLOR_PATTERN = "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$";

    private final CvTemplateRepository cvTemplateRepository;
    private final CvProfileRepository cvProfileRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<CvTemplateResponse> search(CvTemplateSearchCriteria criteria, Pageable pageable) {
        Specification<CvTemplate> spec = Specification.<CvTemplate>unrestricted()
                .and(CvTemplateSpecifications.keyword(criteria.keyword()))
                .and(CvTemplateSpecifications.category(criteria.category()))
                .and(CvTemplateSpecifications.isPremium(criteria.isPremium()))
                .and(CvTemplateSpecifications.isActive(criteria.isActive()));
        Page<CvTemplate> page = cvTemplateRepository.findAll(spec, pageable);

        Map<Long, Long> usageByTemplateId = usageCounts(page.getContent().stream().map(CvTemplate::getId).toList());
        return page.map(t -> CvTemplateResponse.from(t, usageByTemplateId.getOrDefault(t.getId(), 0L)));
    }

    @Transactional(readOnly = true)
    public CvTemplateResponse get(Long id) {
        CvTemplate template = require(id);
        return CvTemplateResponse.from(template, cvProfileRepository.countByTemplateId(id));
    }

    public CvTemplateResponse create(CvTemplateRequest request) {
        String layoutConfig = normalizeLayoutConfig(request.layoutConfig());
        String colorScheme = normalizeColorScheme(request.colorScheme());
        CvTemplate template = cvTemplateRepository.save(CvTemplate.builder()
                .name(request.name().trim())
                .category(trimToNull(request.category()))
                .thumbnailUrl(trimToNull(request.thumbnailUrl()))
                .layoutConfig(layoutConfig)
                .colorScheme(colorScheme)
                .fontPair(trimToNull(request.fontPair()))
                .layoutType(request.layoutType() != null ? request.layoutType() : LayoutType.SINGLE)
                .density(request.density() != null ? request.density() : Density.NORMAL)
                .renderKey(trimToNull(request.renderKey()))
                .isPremium(request.isPremium())
                .isActive(request.isActive())
                .createdBy(SecurityUtils.currentAccountId())
                .build());
        return CvTemplateResponse.from(template, 0);
    }

    public CvTemplateResponse update(Long id, CvTemplateRequest request) {
        CvTemplate template = require(id);
        String layoutConfig = normalizeLayoutConfig(request.layoutConfig());
        String colorScheme = normalizeColorScheme(request.colorScheme());
        template.setName(request.name().trim());
        template.setCategory(trimToNull(request.category()));
        template.setThumbnailUrl(trimToNull(request.thumbnailUrl()));
        template.setLayoutConfig(layoutConfig);
        template.setColorScheme(colorScheme);
        template.setFontPair(trimToNull(request.fontPair()));
        template.setLayoutType(request.layoutType() != null ? request.layoutType() : LayoutType.SINGLE);
        template.setDensity(request.density() != null ? request.density() : Density.NORMAL);
        template.setRenderKey(trimToNull(request.renderKey()));
        template.setIsPremium(request.isPremium());
        template.setIsActive(request.isActive());
        return CvTemplateResponse.from(template, cvProfileRepository.countByTemplateId(id));
    }

    /** Toggles {@code is_active} without touching the rest of the template (used to "deactivate" instead of deleting). */
    public CvTemplateResponse updateStatus(Long id, boolean isActive) {
        CvTemplate template = require(id);
        template.setIsActive(isActive);
        return CvTemplateResponse.from(template, cvProfileRepository.countByTemplateId(id));
    }

    /**
     * Hard-deletes the template. Blocked while any {@code cv_profile} still
     * references it (unlike {@code cv_profile.template_id}'s {@code ON DELETE SET
     * NULL}, we never want to silently unlink CVs a user is actively using) —
     * the admin should deactivate the template via {@link #updateStatus} instead.
     */
    public void delete(Long id) {
        CvTemplate template = require(id);
        long usageCount = cvProfileRepository.countByTemplateId(template.getId());
        if (usageCount > 0) {
            throw new AppException(ErrorCode.RESOURCE_CONFLICT,
                    "This template is still used by " + usageCount
                            + " CV(s) and cannot be deleted. Deactivate it instead via PATCH /status.");
        }
        cvTemplateRepository.delete(template);
    }

    private Map<Long, Long> usageCounts(List<Long> templateIds) {
        if (templateIds.isEmpty()) {
            return Map.of();
        }
        return cvProfileRepository.countGroupedByTemplateIds(templateIds).stream()
                .collect(Collectors.toMap(CvProfileRepository.TemplateUsageCount::getTemplateId,
                        CvProfileRepository.TemplateUsageCount::getCvCount));
    }

    private CvTemplate require(Long id) {
        return cvTemplateRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "CV template not found"));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Validates {@code layoutConfig} against the shape the generic CV renderer
     * expects ({@code columns}, {@code spacing}, {@code sections_order}, {@code
     * header_style}) when it is provided; {@code null}/blank is left as-is since
     * the column is nullable (bespoke {@code renderKey} templates need neither).
     */
    private String normalizeLayoutConfig(String layoutConfig) {
        if (layoutConfig == null || layoutConfig.isBlank()) {
            return null;
        }
        JsonNode node;
        try {
            node = objectMapper.readTree(layoutConfig);
        } catch (Exception e) {
            throw new AppException(ErrorCode.BAD_REQUEST, "layoutConfig must be valid JSON");
        }
        if (!node.isObject()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "layoutConfig must be a JSON object");
        }

        JsonNode columns = node.get("columns");
        if (columns == null || !columns.isInt() || !ALLOWED_COLUMNS.contains(columns.asInt())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "layoutConfig.columns must be 1 or 2");
        }

        JsonNode spacing = node.get("spacing");
        if (spacing == null || !spacing.isTextual() || !ALLOWED_SPACING.contains(spacing.asText())) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "layoutConfig.spacing must be one of: compact, normal, spacious");
        }

        JsonNode sectionsOrder = node.get("sections_order");
        if (sectionsOrder == null || !sectionsOrder.isArray() || sectionsOrder.isEmpty()
                || !allTextual(sectionsOrder)) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "layoutConfig.sections_order must be a non-empty array of section names");
        }

        JsonNode headerStyle = node.get("header_style");
        if (headerStyle == null || !headerStyle.isTextual() || headerStyle.asText().isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "layoutConfig.header_style is required");
        }

        return layoutConfig;
    }

    private static boolean allTextual(JsonNode array) {
        for (JsonNode item : array) {
            if (!item.isTextual() || item.asText().isBlank()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validates {@code colorScheme} against the shape the CV renderer expects
     * ({@code primary}, {@code secondary} required hex colors; {@code accent},
     * {@code text} optional hex colors) when provided; {@code null}/blank is
     * left as-is (absorbed from the former {@code ThemeService}).
     */
    private String normalizeColorScheme(String colorScheme) {
        if (colorScheme == null || colorScheme.isBlank()) {
            return null;
        }
        JsonNode node;
        try {
            node = objectMapper.readTree(colorScheme);
        } catch (Exception e) {
            throw new AppException(ErrorCode.BAD_REQUEST, "colorScheme must be valid JSON");
        }
        if (!node.isObject()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "colorScheme must be a JSON object");
        }

        requireHexColor(node, "primary", true);
        requireHexColor(node, "secondary", true);
        requireHexColor(node, "accent", false);
        requireHexColor(node, "text", false);

        return colorScheme;
    }

    private void requireHexColor(JsonNode node, String field, boolean required) {
        JsonNode value = node.get(field);
        if (value == null) {
            if (required) {
                throw new AppException(ErrorCode.BAD_REQUEST, "colorScheme." + field + " is required");
            }
            return;
        }
        if (!value.isTextual() || !value.asText().matches(HEX_COLOR_PATTERN)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "colorScheme." + field + " must be a hex color (e.g. #15803D)");
        }
    }
}
