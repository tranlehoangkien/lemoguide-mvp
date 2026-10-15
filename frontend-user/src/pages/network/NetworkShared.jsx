import { useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Bell, Settings, ArrowLeft, ArrowRight, ArrowUpRight, AlertCircle, Newspaper, Compass, Users, UsersRound, MoreHorizontal, GraduationCap, Trophy } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import AuroraBackdrop from '@/components/stage/AuroraBackdrop';
import mascotFeed from '@/assets/images/3.svg';
import mascotDiscover from '@/assets/images/5.svg';
import mascotCohorts from '@/assets/images/8.svg';
import mascotMentors from '@/assets/images/10.svg';
import mascotChallenges from '@/assets/images/13.svg';
import mascotConnections from '@/assets/images/14.svg';
import mascotDefault from '@/assets/images/2.svg';
import { Page, PageHeader, Card, EmptyState, Button, Avatar } from '@/components/ui';
import { networkService as api } from '@/services/networkService';
import { useNetworkSummary, badgeText } from '@/services/networkSummary';
import { getFullAvatarUrl } from '@/services/apiClient';
import { ROUTES } from '@/constants/routes';
import { mentionParts } from './networkUtils';
import './Network.css';

const SECTIONS = [
  { value: ROUTES.NETWORK, label: 'Bảng tin', icon: Newspaper },
  { value: '/network/discover', label: 'Khám phá', icon: Compass },
  { value: '/network/cohorts', label: 'Nhóm học', icon: UsersRound },
  { value: '/network/mentors', label: 'Mentor', icon: GraduationCap },
  { value: '/network/challenges', label: 'Thử thách', icon: Trophy },
  { value: ROUTES.NETWORK_CONNECTIONS, label: 'Mạng lưới của tôi', icon: Users },
];
const COUNT_KEY = { '/network/cohorts': 'cohorts', '/network/mentors': 'mentoring', [ROUTES.NETWORK_CONNECTIONS]: 'requests' };

/** Labeled shortcuts remain available on both overview and detail pages. */
function HeaderLink({ to, label, icon: Icon, count }) {
  const text = badgeText(count);
  return <NavLink to={to} className="network-header-link" aria-label={text ? `${label} (${text} mới)` : label}>
    <Icon size={18} aria-hidden="true" />
    <span>{label}</span>
    {text && <span className="network-count" aria-hidden="true">{text}</span>}
  </NavLink>;
}


const MASCOTS = { [ROUTES.NETWORK]: mascotFeed, '/network/discover': mascotDiscover, '/network/cohorts': mascotCohorts, '/network/mentors': mascotMentors, '/network/challenges': mascotChallenges, [ROUTES.NETWORK_CONNECTIONS]: mascotConnections };

/** Shortcut row in the hero panel: icon tile, label + hint, unread count, arrow. */
function HeroLink({ to, label, hint, icon: Icon, count }) {
  const text = badgeText(count);
  return <li>
    <Link to={to} className="nw-hero-row" aria-label={text ? `${label} (${text} mới)` : label}>
      <span className="nw-hero-row__icon" aria-hidden="true"><Icon size={20} /></span>
      <span className="nw-hero-row__text"><strong>{label}</strong><small>{hint}</small></span>
      {text && <span className="nw-hero-row__count" aria-hidden="true">{text}</span>}
      <ArrowRight className="nw-hero-row__go" size={16} aria-hidden="true" />
    </Link>
  </li>;
}

/**
 * Top-level LemoNetwork pages open with the same dark aurora stage as "Khám phá bản thân" and "Việc làm phù hợp":
 * mascot, title and actions on the left, the member's own shortcuts in a double-bezel panel on the right.
 */
function NetworkHero({ pathname, title, description, summary }) {
  const navigate = useNavigate();
  const words = title.trim().split(' ');
  const last = words.pop();
  const cta = pathname === '/network/discover'
    ? { label: 'Mạng lưới của tôi', to: ROUTES.NETWORK_CONNECTIONS } : { label: 'Khám phá thành viên', to: '/network/discover' };
  return <header className="ui-aistage nw-hero">
    <AuroraBackdrop />
    <div className="nw-hero__grid">
      <div className="nw-hero__intro">
        <img className="nw-hero__mascot" src={MASCOTS[pathname] || mascotDefault} alt="" width="150" height="150" />
        <div className="nw-hero__copy">
          <span className="nw-hero__eyebrow">LemoNetwork</span>
          <h1 className="nw-hero__title">{words.length ? `${words.join(' ')} ` : ''}<span>{last}</span></h1>
          <p className="nw-hero__lead">{description}</p>
          <div className="nw-hero__actions">
            <Button variant="ai" trailingIcon={ArrowRight} className="ui-aistage__cta" onClick={() => navigate(cta.to)}>{cta.label}</Button>
          </div>
        </div>
      </div>
      <div className="ui-aistage__panel nw-hero__panel">
        <div className="ui-aistage__core nw-hero__core">
          <ul className="nw-hero-list">
            <HeroLink to={ROUTES.NETWORK_MESSAGES} label="Tin nhắn" hint="Trò chuyện với kết nối và mentor" icon={MessageSquare} count={summary?.messages} />
            <HeroLink to="/network/notifications" label="Thông báo" hint="Lời mời, phản hồi và nhắc tên bạn" icon={Bell} count={summary?.notifications} />
            <HeroLink to="/network/settings" label="Quyền riêng tư" hint="Chọn điều bạn chia sẻ với cộng đồng" icon={Settings} />
          </ul>
        </div>
      </div>
    </div>
  </header>;
}

export function NetworkLayout({ children, title = 'Bảng tin', description = 'Chia sẻ điều bạn học được và học từ hành trình của các thành viên khác.' }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const summary = useNetworkSummary();
  const parent = pathname.startsWith('/network/messages/') ? { to: ROUTES.NETWORK_MESSAGES, label: 'Tin nhắn' }
    : pathname.startsWith('/network/cohorts/') ? { to: '/network/cohorts', label: 'Nhóm học' }
      : pathname.startsWith('/network/challenges/') ? { to: '/network/challenges', label: 'Thử thách' }
      : pathname.startsWith('/network/cv/') ? { to: '/network/discover', label: 'Khám phá' }
      : pathname.startsWith('/u/') ? { to: '/network/discover', label: 'Khám phá' }
        : pathname.startsWith('/network/posts/') ? { to: ROUTES.NETWORK, label: 'Bảng tin' } : null;
  const back = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(parent?.to || (pathname === ROUTES.NETWORK ? ROUTES.DASHBOARD : ROUTES.NETWORK), { replace: true });
  };
  return <UserLayout><Page className="network-page">
    {parent || !SECTIONS.some((x) => x.value === pathname) ? <PageHeader
      back={<button type="button" className="ui-back-btn" onClick={back}><ArrowLeft size={16} aria-hidden="true" /><span>Quay lại</span></button>}
      title={title}
      description={description}
      actions={<div className="network-header-links">
        <HeaderLink to={ROUTES.NETWORK_MESSAGES} label="Tin nhắn" icon={MessageSquare} count={summary?.messages} />
        <HeaderLink to="/network/notifications" label="Thông báo" icon={Bell} count={summary?.notifications} />
        <HeaderLink to="/network/settings" label="Quyền riêng tư" icon={Settings} />
      </div>}
    /> : <NetworkHero pathname={pathname} title={title} description={description} summary={summary} />}
    <nav className="network-section-nav" aria-label="Điều hướng LemoNetwork">
      {SECTIONS.map(({ value, label, icon: Icon }) => <NavLink key={value} to={value} end={value === ROUTES.NETWORK}
        className={({ isActive }) => `network-section-link${isActive ? ' is-active' : ''}`}>
        <Icon size={17} aria-hidden="true" /><span>{label}</span>
        {badgeText(summary?.[COUNT_KEY[value]]) && <span className="network-count">{badgeText(summary[COUNT_KEY[value]])}</span>}
      </NavLink>)}
    </nav>
    {children}
  </Page></UserLayout>;
}

/** Loading skeleton or a retryable error for a network query; renders nothing once data is ready. */
export function QueryState({ query, rows = 2 }) {
  if (query.loading) return <div className="network-skeleton" role="status" aria-label="Đang tải">
    {Array.from({ length: rows }, (_, i) => <span key={i} className="ui-skel" />)}
  </div>;
  if (query.error) return <Card><EmptyState icon={AlertCircle} title="Không tải được dữ liệu" hint={query.error}
    action={<Button variant="secondary" onClick={query.reload}>Thử lại</Button>} /></Card>;
  return null;
}

export function Person({ person, subtitle, size = 44 }) {
  return <Link className="network-person" to={`/u/${person.handle}`}>
    <Avatar src={person.avatar_url ? getFullAvatarUrl(person.avatar_url) : null} name={person.full_name || 'L'} size={size} />
    <span><strong>{person.full_name}</strong><small>{subtitle || person.current_title || `@${person.handle}`}</small></span>
  </Link>;
}

export function ExternalLink({ href, children }) {
  if (!href || !/^https?:\/\//i.test(href)) return null;
  return <a className="network-external" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={14} aria-hidden="true" /></a>;
}

/**
 * "⋯" button with a small action list, for secondary actions that would otherwise clutter a card.
 * items: [{ label, icon, onClick, tone: 'danger' | undefined, hidden }]. Closes on outside click, Escape or choice.
 */
export function MoreMenu({ items, label = 'Thêm thao tác', align = 'end', icon: TriggerIcon = MoreHorizontal }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const visible = items.filter((i) => !i.hidden);
  useLayoutEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  if (!visible.length) return null;
  return <div ref={root} className={`network-more-menu network-more-menu--${align}`}>
    <button type="button" className="network-more-menu__trigger" aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
      <TriggerIcon size={18} aria-hidden="true" />
    </button>
    {open && <div className="network-more-menu__list" role="menu">
      {visible.map(({ label: text, icon: Icon, onClick, tone }) => <button key={text} type="button" role="menuitem"
        className={`network-more-menu__item${tone === 'danger' ? ' is-danger' : ''}`} onClick={() => { setOpen(false); onClick(); }}>
        {Icon && <Icon size={15} aria-hidden="true" />}{text}
      </button>)}
    </div>}
  </div>;
}

/** Inline report form (opened from a MoreMenu item); `onClose` hides it. */
export function ReportForm({ kind, targetId, onClose }) {
  const [reason, setReason] = useState('');
  const [state, setState] = useState({});
  const id = `report-${kind}-${targetId}`;
  return <form className="network-report-form" onSubmit={async (e) => {
    e.preventDefault(); if (state.busy) return; setState({ busy: true });
    try { await api.send('/reports', { kind, targetId, reason }); setState({ success: true }); }
    catch (err) { setState({ error: err.message }); }
  }}>
    {state.success ? <p className="network-muted" role="status">Đã gửi báo cáo cho quản trị viên. Cảm ơn bạn đã giúp cộng đồng an toàn hơn.</p> : <>
      <label className="ui-label" htmlFor={id}>Lý do báo cáo</label>
      <textarea id={id} className="ui-textarea" rows={3} required maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Nội dung này vi phạm điều gì?" autoFocus />
      {state.error && <p className="network-error" role="alert">{state.error}</p>}
      <div className="network-actions"><Button type="submit" size="sm" variant="secondary" loading={state.busy}>Gửi báo cáo</Button><Button type="button" size="sm" variant="ghost" onClick={onClose}>Hủy</Button></div>
    </>}
    {state.success && <div><Button type="button" size="sm" variant="ghost" onClick={onClose}>Đóng</Button></div>}
  </form>;
}

export function Report({ kind, targetId }) {
  const [reason, setReason] = useState('');
  const [state, setState] = useState({});
  return <details className="network-report"><summary>Báo cáo</summary><form onSubmit={async (e) => {
    e.preventDefault(); if (state.busy) return; setState({ busy: true });
    try { await api.send('/reports', { kind, targetId, reason }); setState({ success: true }); }
    catch (err) { setState({ error: err.message }); }
  }}><label className="ui-label" htmlFor={`report-${kind}-${targetId}`}>Lý do báo cáo</label>
    <textarea id={`report-${kind}-${targetId}`} className="ui-textarea" rows={3} required maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
    {state.error && <p className="network-error" role="alert">{state.error}</p>}
    {state.success ? <p className="network-muted" role="status">Đã gửi báo cáo cho quản trị viên.</p> : <Button type="submit" size="sm" variant="secondary" loading={state.busy}>Gửi báo cáo</Button>}
  </form></details>;
}

/**
 * Chat input sized like the send button next to it: one line (40px) that grows with the text up to ~5 lines.
 * Enter sends (submits the surrounding form), Shift+Enter adds a line; IME composition (Vietnamese Telex) is left alone.
 */
export function ChatInput({ value, onChange, className = '', ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight + 2, 140)}px`;
  }, [value]);
  return <textarea ref={ref} rows={1} className={`ui-textarea network-chat-input ${className}`} value={value}
    onChange={onChange}
    onKeyDown={(e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (value.trim()) e.currentTarget.form?.requestSubmit();
      }
    }}
    {...props} />;
}

/** User text with line breaks kept and @handle mentions linked to the member's profile. */
export function RichText({ text, className = 'network-text' }) {
  return <p className={className}>{mentionParts(text || '').map((part, i) => part.handle
    ? <Link key={i} className="network-mention" to={`/u/${part.handle}`}>{part.text}</Link>
    : <span key={i}>{part.text}</span>)}</p>;
}

/** Percent bar + "x/y tuần" for roadmap progress shown in cohorts and the buddy panel. */
export function ProgressLine({ progress, label }) {
  if (!progress) return null;
  return <div className="network-progress">
    <div className="network-progress__row">
      <span>{label || `${progress.done}/${progress.total} tuần`}</span>
      <strong>{progress.percent}%</strong>
    </div>
    <div className="ui-bar"><span style={{ width: `${progress.percent}%` }} /></div>
    {progress.streak > 0 && <small className="network-streak">Chuỗi {progress.streak} tuần liên tiếp</small>}
  </div>;
}

export function Tags({ text = '' }) {
  const tags = text.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10);
  if (!tags.length) return null;
  return <div className="network-tags">{tags.map((tag, i) => <Link key={`${tag}-${i}`} to={`/network?mode=all&tag=${encodeURIComponent(tag)}`}>#{tag}</Link>)}</div>;
}

/**
 * Titled block inside a network page: the same double-bezel Card and head as the app's SectionCard
 * (icon + title + optional count on the left, one action on the right).
 */
export function Panel({ title, icon: Icon, count, action, className, children, as: Tag = 'section', ...props }) {
  return <Card className={className}><Tag className="network-panel" {...props}>
    {(title || action) && <header className="network-panel__head">
      {title && <h2>{Icon && <Icon size={18} aria-hidden="true" />}{title}{count != null && <span className="ui-tabs__count">{count}</span>}</h2>}
      {action}
    </header>}
    {children}
  </Tag></Card>;
}
