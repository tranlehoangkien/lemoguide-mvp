import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, UserPlus, UserCheck, MessageSquare, Check, X, ArrowUpRight, UserMinus, Target } from 'lucide-react';
import { Button, Card, EmptyState, Segmented, SearchBox, ResetRefreshButtons, Toast, useToast } from '@/components/ui';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { networkService as api } from '@/services/networkService';
import { refreshNetworkSummary, useNetworkSummary } from '@/services/networkSummary';
import { NetworkLayout, QueryState, Person, Tags } from './NetworkShared';
import { useNetworkQuery } from './networkUtils';

const NETWORK_MODES = [
  ['connections', 'Đã kết nối'],
  ['requests', 'Lời mời đến'],
  ['sent', 'Đã gửi lời mời'],
  ['following', 'Đang theo dõi'],
];

/** The buttons a person card offers, from the viewer's relation to that person. */
function PersonActions({ person, busy, run, onMessage, onDisconnect }) {
  const relation = person.connection;
  const incoming = relation?.status === 'PENDING' && relation.requester_id === person.account_id;
  const id = person.account_id;
  if (relation?.status === 'ACCEPTED') return <>
    <Button size="sm" icon={MessageSquare} disabled={busy} onClick={() => onMessage(person)}>Nhắn tin</Button>
    <Button size="sm" variant="ghost" icon={UserMinus} disabled={busy} onClick={() => onDisconnect(person)}>Hủy kết nối</Button>
  </>;
  if (incoming) return <>
    <Button size="sm" icon={Check} disabled={busy} onClick={() => run(id, 'accept', `Bạn và ${person.full_name} đã kết nối.`)}>Chấp nhận</Button>
    <Button size="sm" variant="ghost" icon={X} disabled={busy} onClick={() => run(id, 'remove', `Đã từ chối lời mời của ${person.full_name}.`)}>Từ chối</Button>
  </>;
  if (relation?.status === 'PENDING') return <>
    <span className="network-status"><UserCheck size={14} aria-hidden="true" />Đã gửi lời mời</span>
    <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(id, 'remove', 'Đã hủy lời mời kết nối.')}>Hủy lời mời</Button>
  </>;
  return <>
    <Button size="sm" icon={UserPlus} disabled={busy} onClick={() => run(id, 'request', `Đã gửi lời mời kết nối tới ${person.full_name}.`)}>Kết nối</Button>
    <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(id, person.following ? 'unfollow' : 'follow', person.following ? 'Đã bỏ theo dõi.' : `Bạn đang theo dõi ${person.full_name}.`)}>
      {person.following ? 'Bỏ theo dõi' : 'Theo dõi'}
    </Button>
  </>;
}

export default function NetworkPeoplePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const network = location.pathname.endsWith('/connections');
  const [params, setParams] = useSearchParams();
  const mode = network ? params.get('mode') || 'connections' : 'discover';
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const [busy, setBusy] = useState(null);
  const [disconnect, setDisconnect] = useState(null);
  const [more, setMore] = useState({ key: '', items: [], cursor: undefined, loading: false });
  const listVersion = useRef(0);
  const { toast, showToast } = useToast();
  const summary = useNetworkSummary();
  const path = `/people?mode=${encodeURIComponent(mode)}&q=${encodeURIComponent(q)}`;
  const query = useNetworkQuery(`${path}&page=0`);

  // "Xem thêm" appends the next page instead of replacing the list; any change of filter starts over.
  const extra = more.key === path ? more : { items: [], cursor: undefined };
  const items = [...(query.data?.items || []), ...extra.items];
  const nextCursor = extra.cursor !== undefined ? extra.cursor : query.data?.nextCursor;
  const loadMore = async () => {
    if (more.loading || nextCursor == null) return;
    const version = listVersion.current;
    setMore({ ...extra, key: path, loading: true });
    try {
      const data = await api.get(`${path}&page=${nextCursor}`);
      if (version !== listVersion.current) return;
      setMore({ key: path, items: [...extra.items, ...data.items], cursor: data.nextCursor ?? null, loading: false });
    } catch (err) { if (version !== listVersion.current) return; setMore({ ...extra, key: path, loading: false }); showToast(err.message, 'error'); }
  };
  const reload = () => { listVersion.current += 1; setMore({ key: '', items: [], cursor: undefined, loading: false }); query.reload(); refreshNetworkSummary(); };

  const run = async (id, action, message) => {
    if (busy) return;
    setBusy(id);
    try {
      if (action === 'follow' || action === 'unfollow') await api.send(`/people/${id}/follow`, { enabled: action === 'follow' }, 'PUT');
      else await api.send(`/people/${id}/connections/${action}`);
      showToast(message);
      reload();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setBusy(null); }
  };
  const openThread = async (person) => {
    if (busy) return;
    setBusy(person.account_id);
    try { const thread = await api.send(`/people/${person.account_id}/threads`); navigate(`/network/messages/${thread.id}`); }
    catch (err) { showToast(err.message, 'error'); setBusy(null); }
  };

  const modeOptions = NETWORK_MODES.map(([value, label]) => ({
    value,
    label: value === 'requests' && summary?.requests ? `${label} · ${summary.requests}` : label,
  }));
  const emptyHint = {
    connections: 'Kết nối với người cùng hướng đi để nhắn tin và học hỏi lẫn nhau.',
    requests: 'Chưa có lời mời kết nối nào đang chờ bạn.',
    sent: 'Bạn chưa gửi lời mời nào đang chờ phản hồi.',
    following: 'Theo dõi người bạn quan tâm để thấy bài viết của họ trên bảng tin.',
    discover: 'Thử từ khóa khác hoặc quay lại khi cộng đồng có thêm người chia sẻ.',
  }[mode];

  return <NetworkLayout title={network ? 'Mạng lưới của tôi' : 'Khám phá thành viên'} description={network ? 'Kết nối, lời mời và những người bạn đang theo dõi.' : 'Tìm người theo kỹ năng, mục tiêu nghề nghiệp và chủ đề quan tâm.'}>
    <Toast toast={toast} />
    <div className="network-toolbar">
      {network && <Segmented label="Lọc mạng lưới" value={mode} onChange={(value) => setParams({ mode: value, ...(q ? { q } : {}) })} options={modeOptions} />}
      <form className="network-search" role="search" onSubmit={(e) => { e.preventDefault(); setParams({ ...(network ? { mode } : {}), ...(search.trim() ? { q: search.trim() } : {}) }); }}>
        <SearchBox value={search} onChange={setSearch} onClear={() => { setSearch(''); setParams(network ? { mode } : {}); }} placeholder="Tên, kỹ năng, mục tiêu…" label="Tìm người theo tên, kỹ năng hoặc mục tiêu" />
        <Button type="submit" variant="secondary">Tìm</Button>
        <ResetRefreshButtons onReset={() => { setSearch(''); setParams({}); reload(); }} onRefresh={reload} loading={query.refreshing || more.loading} />
      </form>
    </div>

    <QueryState query={query} rows={3} />
    {items.length > 0 && <div className="network-people-grid">{items.map((person) => (
      <Card key={person.account_id} className="network-person-card">
        <article className="network-panel">
          <div className="network-person-card__top">
            <Person person={person} />
            <Link className="ui-icon-btn network-person-card__open" to={`/u/${person.handle}`} aria-label={`Xem hồ sơ ${person.full_name}`} title="Xem hồ sơ"><ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <p className="network-person-card__bio">{person.bio || 'Cùng học hỏi và chia sẻ kinh nghiệm.'}</p>
          {person.goal && <p className="network-person-card__goal"><Target size={14} aria-hidden="true" /><span>{person.goal}</span></p>}
          {(person.available_to_help || person.topics) && <div className="network-person-card__chips">
            {person.available_to_help && <span className="network-pill">Sẵn sàng hỗ trợ</span>}
            <Tags text={person.topics} />
          </div>}
          <div className="network-person-card__actions">
            <PersonActions person={person} busy={busy === person.account_id} run={run} onMessage={openThread} onDisconnect={setDisconnect} />
          </div>
        </article>
      </Card>
    ))}</div>}
    {query.data && items.length === 0 && <Card><EmptyState icon={Users} title={q ? 'Không tìm thấy hồ sơ phù hợp' : 'Chưa có ai ở đây'} hint={emptyHint}
      action={mode !== 'discover' ? <Button variant="secondary" onClick={() => navigate('/network/discover')}>Khám phá cộng đồng</Button> : null} /></Card>}
    {nextCursor != null && items.length > 0 && <div className="network-more"><Button variant="secondary" loading={more.loading} onClick={loadMore}>Xem thêm</Button></div>}

    <ConfirmActionModal isOpen={!!disconnect} title="Hủy kết nối" icon={UserMinus} confirmLabel="Hủy kết nối"
      message={disconnect ? `Bạn và ${disconnect.full_name} sẽ không còn trong mạng lưới của nhau. Cuộc trò chuyện hiện có vẫn được giữ lại.` : ''}
      isSubmitting={!!busy} onCancel={() => setDisconnect(null)}
      onConfirm={async () => { await run(disconnect.account_id, 'remove', `Đã hủy kết nối với ${disconnect.full_name}.`); setDisconnect(null); }} />
  </NetworkLayout>;
}
