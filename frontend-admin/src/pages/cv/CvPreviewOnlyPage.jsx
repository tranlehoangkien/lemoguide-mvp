import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, FileText } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { cvProfileService } from '@/services/cvProfileService';
import { getCvTemplateComponent } from '@/components/cv-templates/cvTemplateRegistry';

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
 * Trang độc lập (mở ở tab mới từ Quản lý CV) chỉ hiển thị bản xem trước CV
 * thật của người dùng cho admin kiểm duyệt — không có nút chỉnh sửa. Dùng
 * API admin (/api/admin/cv-profiles/{id}) nên xem được mọi CV bất kể chế độ
 * chia sẻ, khác với link công khai vốn chỉ hoạt động khi CV bật Public Link.
 */
const CvPreviewOnlyPage = () => {
  const [searchParams] = useSearchParams();
  const cvId = searchParams.get('id');

  const [renderKey, setRenderKey] = useState(null);
  const [data, setData] = useState(emptyData());
  const [activeSections, setActiveSections] = useState(['profile', 'contacts', 'education', 'experiences', 'skills']);
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
        const cv = await cvProfileService.getCvProfile(cvId);
        if (cancelled) return;
        if (!cv) {
          setLoadError('Không tìm thấy CV này.');
          return;
        }

        setRenderKey(cv.templateRenderKey || null);

        let parsedCvData = cv.cvData;
        if (typeof parsedCvData === 'string') {
          try {
            parsedCvData = JSON.parse(parsedCvData);
          } catch {
            parsedCvData = null;
          }
        }

        if (parsedCvData && typeof parsedCvData === 'object' && Object.keys(parsedCvData).length > 0) {
          const loadedProfile = { ...(parsedCvData.profile || {}) };
          if (!loadedProfile.avatarUrl && cv.avatarUrl) {
            loadedProfile.avatarUrl = cv.avatarUrl;
          }
          setData({
            profile: loadedProfile,
            avatarUrl: cv.avatarUrl || loadedProfile.avatarUrl || null,
            contacts: Array.isArray(parsedCvData.contacts) ? parsedCvData.contacts : [],
            education: Array.isArray(parsedCvData.education) ? parsedCvData.education : [],
            experiences: Array.isArray(parsedCvData.experiences) ? parsedCvData.experiences : [],
            projects: Array.isArray(parsedCvData.projects) ? parsedCvData.projects : [],
            skills: Array.isArray(parsedCvData.skills) ? parsedCvData.skills : [],
            certificates: Array.isArray(parsedCvData.certificates) ? parsedCvData.certificates : [],
            awards: Array.isArray(parsedCvData.awards) ? parsedCvData.awards : [],
            interests: Array.isArray(parsedCvData.interests) ? parsedCvData.interests : [],
            referrers: Array.isArray(parsedCvData.referrers) ? parsedCvData.referrers : [],
          });
        } else {
          setLoadError('CV này chưa có nội dung chi tiết.');
        }

        let parsedSections = cv.activeSections;
        if (typeof parsedSections === 'string') {
          try {
            parsedSections = JSON.parse(parsedSections);
          } catch {
            parsedSections = null;
          }
        }
        setActiveSections(
          Array.isArray(parsedSections) && parsedSections.length > 0
            ? parsedSections
            : ['profile', 'contacts', 'education', 'experiences', 'skills']
        );

        document.title = `${cv.name || 'Xem trước CV'} · LemoGuide Admin`;
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

  const TemplateComponent = renderKey ? getCvTemplateComponent(renderKey) : null;

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
      <div
        id="printable-cv"
        style={{
          width: '210mm',
          maxWidth: '100%',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          alignSelf: 'flex-start',
          boxSizing: 'border-box',
        }}
      >
        <TemplateComponent data={data} editable={false} activeSections={activeSections} />
      </div>
    </div>
  );
};

export default CvPreviewOnlyPage;
