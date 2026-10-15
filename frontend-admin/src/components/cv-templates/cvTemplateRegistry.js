import CvTemplateGreenSidebar from './CvTemplateGreenSidebar';
import CvTemplateNavyModern from './CvTemplateNavyModern';
import CvTemplateBrownTwoColumn from './CvTemplateBrownTwoColumn';

/**
 * Maps a `cv_template.render_key` to the bespoke React component that
 * pixel-clones it. Templates without a matching key (the older
 * layout_config-driven generic templates) have no bespoke renderer yet and
 * are filtered out of the "create CV" picker — see
 * cvTemplateService.listRenderableTemplates().
 */
export const CV_TEMPLATE_REGISTRY = {
  'green-sidebar': CvTemplateGreenSidebar,
  'navy-modern': CvTemplateNavyModern,
  'brown-two-column': CvTemplateBrownTwoColumn,
};

export const getCvTemplateComponent = (renderKey) => CV_TEMPLATE_REGISTRY[renderKey] || null;
