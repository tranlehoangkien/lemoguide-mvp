import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, Card, EmptyState, Avatar } from '@/components/ui';
import { networkService as api } from '@/services/networkService';
import { refreshNetworkSummary } from '@/services/networkSummary';
import { getFullAvatarUrl } from '@/services/apiClient';
import { NetworkLayout, QueryState, Panel } from './NetworkShared';
import { useNetworkQuery, dateLabel } from './networkUtils';
import { describe, kindIcon, notificationTarget } from './notificationKinds';

export default function NetworkNotificationsPage() {
  const query = useNetworkQuery('/notifications', 60000, ['notification']);
  const mine = useNetworkQuery('/me');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const target = (n) => notificationTarget(n, mine.data?.handle);
  const unread = query.data?.filter((n) => !n.is_read).length || 0;
  const markRead = async () => {
    setBusy(true); setError('');
    try { await api.send('/notifications/read', { lastId: query.data[0].id }, 'PUT'); query.reload(); refreshNetworkSummary(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <NetworkLayout title="Thông báo" description="Lời mời, phản hồi và hoạt động liên quan đến bạn.">
    <QueryState query={query} rows={2} />
    {query.data?.length > 0 && <Panel title="Hoạt động gần đây" icon={Bell}
      action={<Button variant="secondary" size="sm" icon={CheckCheck} loading={busy} disabled={!unread} onClick={markRead}>Đánh dấu đã đọc{unread ? ` (${unread})` : ''}</Button>}>
      {error && <p role="alert" className="network-error">{error}</p>}
      {[['Mới', query.data.filter((n) => !n.is_read)], ['Trước đó', query.data.filter((n) => n.is_read)]].filter(([, list]) => list.length).map(([heading, list]) => <section key={heading} className="network-notification-group">
        <h3>{heading}</h3>
        <ul className="network-notifications">{list.map((n) => { const Icon = kindIcon(n.kind); return <li key={n.id}>
          <Link className={`network-notification${n.is_read ? '' : ' is-unread'}`} to={target(n)}>
            <span className="network-notification__face">
              <Avatar src={n.avatar_url ? getFullAvatarUrl(n.avatar_url) : null} name={n.full_name || 'L'} size={40} />
              <span className="network-notification__kind" aria-hidden="true"><Icon size={12} /></span>
            </span>
            <span className="network-notification__text"><strong>{n.full_name}</strong> {describe(n)}<small>{dateLabel(n.created_at)}</small></span>
            {!n.is_read && <span className="network-notification__dot" aria-label="Chưa đọc" />}
          </Link>
        </li>; })}</ul>
      </section>)}
    </Panel>}
    {query.data?.length === 0 && <Card><EmptyState icon={Bell} title="Chưa có thông báo mới" hint="Lời mời kết nối, bình luận và tin nhắn sẽ xuất hiện tại đây." /></Card>}
  </NetworkLayout>;
}
