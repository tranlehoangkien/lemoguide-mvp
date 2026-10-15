import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileText, MessageSquare, UserRound, ShieldCheck } from 'lucide-react';
import { Button, Card, EmptyState } from '@/components/ui';
import { cvTemplateService, FALLBACK_TEMPLATES } from '@/services/cvTemplateService';
import { getCvTemplateComponent } from '@/components/cv-templates/cvTemplateRegistry';
import CvPaginatedSheet from '@/components/cv-templates/CvPaginatedSheet';
import { buildCvRenderData, resolveActiveSections } from '@/components/cv-templates/cvRenderData';
import { networkService as api } from '@/services/networkService';
import { NetworkLayout, QueryState, Person } from './NetworkShared';
import { useNetworkQuery, cvTargetLabel } from './networkUtils';

/** A4 is 210mm ≈ 794px at 96dpi; below that the sheet is zoomed down to fit instead of scrolling sideways. */
const A4_PX = 794;
const parse = (text) => { try { return text ? JSON.parse(text) : null; } catch { return null; } };

function useFitZoom(ref) {
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setZoom(Math.min(1, (el.clientWidth - 2) / A4_PX));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return zoom;
}

function CvSheet({ cv }) {
  const [templates, setTemplates] = useState(null);
  const stage = useRef(null);
  const zoom = useFitZoom(stage);
  useEffect(() => {
    let alive = true;
    cvTemplateService.listActiveTemplates().then((t) => { if (alive) setTemplates(t || []); }).catch(() => { if (alive) setTemplates([]); });
    return () => { alive = false; };
  }, []);
  const template = useMemo(() => {
    if (!templates) return null;
    return templates.find((t) => Number(t.id) === Number(cv.template_id))
      || FALLBACK_TEMPLATES.find((t) => Number(t.id) === Number(cv.template_id)) || templates[0] || FALLBACK_TEMPLATES[0];
  }, [templates, cv.template_id]);
  const Template = useMemo(() => (template?.renderKey ? getCvTemplateComponent(template.renderKey) : null), [template]);
  const data = useMemo(() => buildCvRenderData({ cvData: parse(cv.cv_data), avatarUrl: cv.avatar_url }), [cv]);
  const sections = useMemo(() => resolveActiveSections({ activeSections: parse(cv.active_sections) }), [cv]);

  return <div className="network-cv-stage" ref={stage}>
    {!templates ? <div className="network-skeleton" role="status" aria-label="Đang dựng CV"><span className="ui-skel" /></div>
      : !Template || !data ? <EmptyState icon={FileText} title="CV chưa có nội dung để hiển thị" hint="Chủ CV cần hoàn thiện CV trong trình soạn thảo." />
        : <div className="network-cv-stage__sheet" style={{ zoom }}>
          <CvPaginatedSheet id="network-cv" boxShadow="var(--ui-shadow-card)">
            <Template data={data} editable={false} activeSections={sections} />
          </CvPaginatedSheet>
        </div>}
  </div>;
}

export default function NetworkCvPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useNetworkQuery(`/cvs/${id}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cv = query.data;
  const openChat = async () => {
    if (busy || !cv?.owner) return;
    setBusy(true); setError('');
    try { const t = await api.send(`/people/${cv.owner.account_id}/threads`); navigate(`/network/messages/${t.id}`); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  useEffect(() => { if (cv?.name) document.title = `${cv.name} · LemoNetwork`; }, [cv?.name]);

  return <NetworkLayout title="CV thành viên" description="CV được thành viên chủ động chia sẻ trong LemoNetwork.">
    <QueryState query={query} />
    {cv && <>
      <Card><section className="network-panel network-cv-head">
        <div className="network-cv-head__main">
          {cv.owner ? <Person person={cv.owner} subtitle={cv.owner.current_title || `@${cv.owner.handle}`} /> : null}
          <div className="network-cv-head__title">
            <h2><FileText size={18} aria-hidden="true" />{cv.name}</h2>
            <p className="network-muted">{cvTargetLabel(cv.target_mode)} · Cập nhật {new Date(cv.updated_at).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        <div className="network-actions">
          {cv.mine ? <Link className="ui-btn ui-btn--secondary" to="/network/settings"><ShieldCheck size={16} aria-hidden="true" />Quyền chia sẻ CV</Link> : <>
            <Button icon={MessageSquare} loading={busy} onClick={openChat}>Nhắn tin</Button>
            {cv.owner && <Link className="ui-btn ui-btn--secondary" to={`/u/${cv.owner.handle}`}><UserRound size={16} aria-hidden="true" />Xem hồ sơ</Link>}
          </>}
        </div>
        {error && <p className="network-error" role="alert">{error}</p>}
        <p className="network-muted network-cv-head__note">
          {cv.mine ? 'Đây là cách thành viên khác nhìn thấy CV của bạn. Chuyển CV về bản nháp hoặc bỏ chọn trong Quyền riêng tư để ngừng chia sẻ.'
            : 'CV được chủ sở hữu chia sẻ với cộng đồng. Hãy dùng thông tin trong CV đúng mục đích học hỏi và kết nối.'}
        </p>
      </section></Card>
      <CvSheet cv={cv} />
    </>}
  </NetworkLayout>;
}
