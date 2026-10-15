import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Bell, CheckCheck } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { getFullAvatarUrl } from '@/services/apiClient';
import { networkService as api } from '@/services/networkService';
import { badgeText, refreshNetworkSummary, useNetworkSummary } from '@/services/networkSummary';
import { useNetworkQuery, dateLabel } from '@/pages/network/networkUtils';
import { describe, kindIcon, notificationTarget } from '@/pages/network/notificationKinds';
import './NotificationBell.css';

const PREVIEW = 6;

/** Header bell on every page: live unread count, and a quick list so members see new activity without opening LemoNetwork. */
export default function NotificationBell() {
  const { pathname } = useLocation();
  const summary = useNetworkSummary();
  // Open "for" the page it was opened on, so following a notification closes it.
  const [openedAt, setOpenedAt] = useState(null);
  const open = openedAt === pathname;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const query = useNetworkQuery(open ? '/notifications' : null, 0, ['notification']);
  const mine = useNetworkQuery(open ? '/me' : null);

  const count = summary?.notifications || 0;
  const text = badgeText(count);
  const list = query.data?.slice(0, PREVIEW) || [];
  const unread = query.data?.filter((n) => !n.is_read).length || 0;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => { if (!rootRef.current?.contains(e.target)) setOpenedAt(null); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpenedAt(null); buttonRef.current?.focus(); } };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const markRead = async () => {
    setBusy(true); setError('');
    try { await api.send('/notifications/read', { lastId: query.data[0].id }, 'PUT'); query.reload(); refreshNetworkSummary(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return <div className="notif-bell" ref={rootRef}>
    <button ref={buttonRef} type="button" className="notif-bell__btn" aria-haspopup="dialog" aria-expanded={open}
      aria-label={text ? `Thông báo (${text} chưa đọc)` : 'Thông báo'} title="Thông báo"
      onClick={() => { setError(''); setOpenedAt(open ? null : pathname); }}>
      <Bell size={18} aria-hidden="true" />
      {text && <span className="notif-bell__count" aria-hidden="true">{text}</span>}
    </button>

    {open && <div className="notif-pop" role="dialog" aria-label="Thông báo">
      <div className="notif-pop__head">
        <strong>Thông báo</strong>
        <button type="button" className="notif-pop__action" disabled={!unread || busy} onClick={markRead}>
          <CheckCheck size={15} aria-hidden="true" />{busy ? 'Đang cập nhật...' : 'Đánh dấu đã đọc'}
        </button>
      </div>
      {error && <p className="notif-pop__error" role="alert">{error}</p>}

      <div className="notif-pop__body">
        {query.loading && <div className="notif-pop__skel" role="status" aria-label="Đang tải thông báo">
          {[0, 1, 2].map((i) => <span key={i} className="ui-skel" />)}
        </div>}
        {!query.loading && query.error && !query.data && <div className="notif-pop__empty">
          <p>Chưa tải được thông báo.</p>
          <button type="button" className="notif-pop__action" onClick={query.reload}>Thử lại</button>
        </div>}
        {query.data?.length === 0 && <div className="notif-pop__empty">
          <span className="notif-pop__empty-icon"><Bell size={20} aria-hidden="true" /></span>
          <p><strong>Chưa có thông báo</strong></p>
          <p>Lời mời kết nối, bình luận và tin nhắn sẽ xuất hiện tại đây.</p>
        </div>}
        {list.length > 0 && <ul className="notif-pop__list">{list.map((n) => {
          const Icon = kindIcon(n.kind);
          return <li key={n.id}>
            <Link className={`notif-item${n.is_read ? '' : ' is-unread'}`} to={notificationTarget(n, mine.data?.handle)}>
              <span className="notif-item__face">
                <Avatar src={n.avatar_url ? getFullAvatarUrl(n.avatar_url) : null} name={n.full_name || 'L'} size={36} />
                <span className="notif-item__kind" aria-hidden="true"><Icon size={11} /></span>
              </span>
              <span className="notif-item__text"><span><strong>{n.full_name}</strong> {describe(n)}</span><small>{dateLabel(n.created_at)}</small></span>
              {!n.is_read && <span className="notif-item__unread" aria-label="Chưa đọc" />}
            </Link>
          </li>;
        })}</ul>}
      </div>

      <Link className="notif-pop__all" to="/network/notifications">Xem tất cả thông báo<ArrowRight size={14} aria-hidden="true" /></Link>
    </div>}
  </div>;
}
