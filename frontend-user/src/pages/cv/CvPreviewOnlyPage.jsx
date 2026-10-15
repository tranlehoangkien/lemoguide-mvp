import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, FileText } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { cvProfileService } from '@/services/cvProfileService';
import { cvTemplateService, FALLBACK_TEMPLATES } from '@/services/cvTemplateService';
import { getCvTemplateComponent } from '@/components/cv-templates/cvTemplateRegistry';
import CvPaginatedSheet from '@/components/cv-templates/CvPaginatedSheet';
import { buildCvRenderData, resolveActiveSections, DEFAULT_ACTIVE_SECTIONS } from '@/components/cv-templates/cvRenderData';

const emptyData = () => ({
  profile: {},
  contacts: [],
  education: [],
  experiences: [],
  projects: [],
  skills: [],
  certificates: [],
  awards: [],
  interests: [],
  referrers: [],
});

/**
 * Trang độc lập chỉ hiển thị bản xem trước CV — không có header, sidebar hay
 * nút chỉnh sửa nào. Mở qua window.open() từ MyCvPage nên chạy trên tab mới,
 * hoàn toàn tách biệt khỏi trang chỉnh sửa CV.
 */
const CvPreviewOnlyPage = () => {
  const [searchParams] = useSearchParams();
  const cvId = searchParams.get('id');

  const [template, setTemplate] = useState(null);
  const [data, setData] = useState(emptyData());
  const [activeSections, setActiveSections] = useState(DEFAULT_ACTIVE_SECTIONS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cvId) {
        setLoadError('Thiếu mã CV.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError(null);
      try {
        const [cv, templates] = await Promise.all([
          cvProfileService.getCvDetail(cvId),
          cvTemplateService.listActiveTemplates(),
        ]);
        if (cancelled) return;
        if (!cv) {
          setLoadError('Không tìm thấy CV này.');
          return;
        }

        const matchedTemplate =
          (templates || []).find((t) => Number(t.id) === Number(cv.templateId)) ||
          FALLBACK_TEMPLATES.find((t) => Number(t.id) === Number(cv.templateId)) ||
          templates?.[0] ||
          FALLBACK_TEMPLATES[0];
        setTemplate(matchedTemplate || null);

        const renderData = buildCvRenderData(cv);
        if (renderData) setData(renderData);
        setActiveSections(resolveActiveSections(cv));

        document.title = `${cv.name || cv.title || 'Xem trước CV'} · LemoGuide`;
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Không thể tải CV, vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [cvId]);

  const TemplateComponent = useMemo(
    () => (template?.renderKey ? getCvTemplateComponent(template.renderKey) : null),
    [template]
  );

  if (loading) {
    return (
      <div className="ui-center-screen">
        <Card>
          <EmptyState icon={FileText} title="Đang tải bản xem trước..." />
        </Card>
      </div>
    );
  }

  if (loadError || !TemplateComponent) {
    return (
      <div className="ui-center-screen">
        <Card>
          <EmptyState icon={AlertCircle} title="Không thể hiển thị bản xem trước CV" hint={loadError || 'Vui lòng thử lại sau.'} />
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: '210mm', maxWidth: '100%', alignSelf: 'flex-start' }}>
        <CvPaginatedSheet id="printable-cv" boxShadow="0 12px 36px rgba(0,0,0,0.25)">
          <TemplateComponent data={data} editable={false} activeSections={activeSections} />
        </CvPaginatedSheet>
      </div>
    </div>
  );
};

export default CvPreviewOnlyPage;
