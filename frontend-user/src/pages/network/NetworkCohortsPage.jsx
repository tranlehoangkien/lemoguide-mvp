import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UsersRound, GraduationCap, Target, ArrowRight, Map as MapIcon, Compass } from 'lucide-react';
import { Button, Card, EmptyState, Toast, useToast } from '@/components/ui';
import { networkService as api } from '@/services/networkService';
import { ROUTES } from '@/constants/routes';
import { NetworkLayout, QueryState, Panel } from './NetworkShared';
import { useNetworkQuery } from './networkUtils';
import BuddySection from './NetworkBuddy';

const KIND = {
  COURSE: { icon: GraduationCap, label: 'Cùng khóa học' },
  ROLE: { icon: Target, label: 'Cùng vị trí mục tiêu' },
};

export default function NetworkCohortsPage() {
  const navigate = useNavigate();
  const query = useNetworkQuery('/cohorts', 0, ['cohort']);
  const buddy = useNetworkQuery('/buddy', 0, ['notification']);
  const me = useNetworkQuery('/me');
  const { toast, showToast } = useToast();
  const [busy, setBusy] = useState(null);
  const groupsRef = useRef(null);
  const join = async (c) => {
    if (busy) return;
    setBusy(`${c.kind}:${c.ref_key}`);
    try { const data = await api.send('/cohorts', { kind: c.kind, refKey: c.ref_key }); navigate(`/network/cohorts/${data.cohort.id}`); }
    catch (err) { showToast(err.message, 'error'); setBusy(null); }
  };
  const data = query.data;
  const published = me.data?.published && !me.data?.suspended;
  const open = data?.candidates.filter((c) => !c.joined) || [];

  return <NetworkLayout title="Nhóm học" description="Học cùng người chung khóa học hoặc vị trí mục tiêu, và tìm bạn đồng hành.">
    <Toast toast={toast} />
    {me.data && !published && <div className="ui-callout"><span>Hãy <Link className="network-link" to="/network/settings">bật hồ sơ cộng đồng</Link> để tham gia nhóm học và tìm bạn đồng hành.</span></div>}
    {data && !data.hasPlan && <Card><EmptyState icon={MapIcon} title="Bạn chưa có lộ trình" hint="Nhóm học và bạn đồng hành được gợi ý từ các khóa học và vị trí mục tiêu trong lộ trình của bạn."
      action={<Link className="ui-btn ui-btn--primary" to={ROUTES.CAREER_ROADMAP}>Tạo lộ trình</Link>} /></Card>}

    {data?.hasPlan && <BuddySection query={buddy} showToast={showToast} onFindGroups={() => groupsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />}

    <QueryState query={query} rows={2} />
    {data?.hasPlan && <div className="network-cohort-grid" ref={groupsRef}>
      <Panel title="Nhóm của bạn" icon={UsersRound}>
        {data.joined.length ? <ul className="network-cohort-list">{data.joined.map((c) => { const Icon = KIND[c.kind].icon; return <li key={c.id}>
          <Link className="network-cohort-row" to={`/network/cohorts/${c.id}`}>
            <span className="network-cohort-row__icon"><Icon size={18} aria-hidden="true" /></span>
            <span className="network-cohort-row__text"><strong>{c.title}</strong><small>{KIND[c.kind].label} · {c.members} thành viên</small></span>
            {c.unread > 0 && <b className="network-count" aria-label={`${c.unread} tin chưa đọc`}>{c.unread > 99 ? '99+' : c.unread}</b>}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </li>; })}</ul> : <p className="network-muted">Bạn chưa tham gia nhóm nào. Chọn một nhóm gợi ý để bắt đầu.</p>}
      </Panel>

      <Panel title="Nhóm gợi ý từ lộ trình" icon={Compass}>
        {open.length ? <>
          <ul className="network-cohort-list">{open.map((c) => { const Icon = KIND[c.kind].icon; return <li key={`${c.kind}:${c.ref_key}`}>
            <div className="network-cohort-row">
              <span className="network-cohort-row__icon"><Icon size={18} aria-hidden="true" /></span>
              <span className="network-cohort-row__text"><strong>{c.title}</strong><small>{KIND[c.kind].label} · {c.members ? `${c.members} thành viên` : 'Chưa có ai, hãy là người đầu tiên'}</small></span>
              <Button size="sm" loading={busy === `${c.kind}:${c.ref_key}`} disabled={!!busy || !published} onClick={() => join(c)}>Tham gia</Button>
            </div>
          </li>; })}</ul>
          <p className="network-muted network-cohort-note">Thành viên trong nhóm thấy tiến độ lộ trình của bạn, không thấy ghi chú riêng. Bạn có thể rời nhóm bất cứ lúc nào.</p>
        </> : <p className="network-muted">Bạn đã tham gia mọi nhóm của lộ trình này.</p>}
      </Panel>
    </div>}
  </NetworkLayout>;
}
