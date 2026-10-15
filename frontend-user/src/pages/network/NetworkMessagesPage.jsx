import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Send, MessageSquare, Paperclip, X, ArrowRight, FileText } from 'lucide-react';
import { Button, Card, EmptyState, SearchBox, ResetRefreshButtons, Avatar } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { getFullAvatarUrl } from '@/services/apiClient';
import { networkService as api } from '@/services/networkService';
import { refreshNetworkSummary } from '@/services/networkSummary';
import { NetworkLayout, QueryState, Person, Report, Panel, RichText, ChatInput, MoreMenu } from './NetworkShared';
import { useNetworkQuery, dateLabel, cvTargetLabel } from './networkUtils';

function Thread({ id, sharedPostId, sharedProfileId, sharedProjectId, onSent }) {
  const { user } = useAuth();
  const [before, setBefore] = useState(0);
  const query = useNetworkQuery(`/threads/${id}?before=${before}`, before ? 0 : 60000, before ? [] : ['message', 'notification']);
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const [attachedCv, setAttachedCv] = useState(null);
  const myCvs = useNetworkQuery('/me/cvs');
  const shareableCvs = (myCvs.data?.cvs || []).filter((cv) => cv.shareable);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const end = useRef(null);
  const thread = query.data;
  const latest = before ? 0 : thread?.messages[0]?.id || 0;
  useEffect(() => {
    if (!latest) return;
    let alive = true;
    const markRead = () => {
      if (document.visibilityState !== 'visible') return;
      api.send(`/threads/${id}/read`, { lastId: latest }, 'PUT').then(refreshNetworkSummary).catch((err) => { if (alive) setError(err.message); });
      end.current?.scrollIntoView({ block: 'nearest' });
    };
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => { alive = false; document.removeEventListener('visibilitychange', markRead); };
  }, [id, latest]);
  const action = async (fn) => { if (busy) return; setBusy(true); setError(''); try { await fn(); query.reload(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const pending = thread?.status === 'PENDING';
  const maySend = thread && (thread.status === 'ACCEPTED' || (pending && !thread.incoming && thread.messages.length === 0));
  return <Card className="network-thread-card"><section className="network-thread">
    <QueryState query={query} rows={2} />
    {thread && <>
      <header className="network-thread__head"><Person person={thread.other} /><span className="network-status">{thread.status === 'ACCEPTED' ? 'Trao đổi trực tiếp' : pending ? 'Yêu cầu trò chuyện' : 'Yêu cầu đã bị từ chối'}</span></header>
      {pending && <div className="ui-callout network-request">
        <span>{thread.incoming ? 'Người này muốn trò chuyện với bạn. Bạn có thể đọc tin mở đầu rồi quyết định.' : 'Bạn có thể gửi một tin nhắn mở đầu. Chờ người nhận chấp nhận để tiếp tục.'}</span>
        {thread.incoming && <div className="network-actions">
          <Button size="sm" disabled={busy} onClick={() => action(() => api.send(`/threads/${id}/decision`, { enabled: true }, 'PUT'))}>Chấp nhận</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => action(() => api.send(`/threads/${id}/decision`, { enabled: false }, 'PUT'))}>Từ chối</Button>
        </div>}
      </div>}
      <div className="network-messages-log" role="log" aria-label="Lịch sử trò chuyện">
        {thread.nextCursor && <div className="network-more"><Button size="sm" variant="ghost" onClick={() => setBefore(thread.nextCursor)}>Tin nhắn cũ hơn</Button></div>}
        {[...thread.messages].reverse().map((m) => {
          const isMine = m.sender_id === thread.mine;
          const avatarUrl = isMine ? user?.avatarUrl : thread.other?.avatar_url;
          const name = isMine ? (user?.displayName || 'Bạn') : (thread.other?.full_name || 'U');

          return (
            <div className={`network-message-row${isMine ? ' is-mine' : ''}`} key={m.id}>
              <Avatar
                src={avatarUrl ? getFullAvatarUrl(avatarUrl) : null}
                name={name}
                size={32}
                className="network-message__avatar"
              />
              <article className={`network-message${isMine ? ' is-mine' : ''}`}>
                <RichText text={m.content} />
                {m.shared_post_id && <Link className="network-shared-post" to={`/network/posts/${m.shared_post_id}`}>{m.shared_post_title || 'Bài viết được chia sẻ'}<ArrowRight size={14} aria-hidden="true" /></Link>}
                {m.shared_profile && <Link className="network-shared-post" to={`/u/${m.shared_profile.handle}${m.shared_profile.projectId ? `#project-${m.shared_profile.projectId}` : ''}`}>{m.shared_profile.title}<ArrowRight size={14} aria-hidden="true" /></Link>}
                {m.shared_cv && <Link className="network-shared-post network-shared-cv" to={`/network/cv/${m.shared_cv.id}`}>
                  <FileText size={16} aria-hidden="true" /><span><strong>{m.shared_cv.name}</strong><small>{cvTargetLabel(m.shared_cv.target_mode)}</small></span><ArrowRight size={14} aria-hidden="true" />
                </Link>}
                <small>{dateLabel(m.created_at)}</small>
                {!isMine && !m.hidden && <Report kind="MESSAGE" targetId={m.id} />}
              </article>
            </div>
          );
        })}
        {!thread.messages.length && <p className="network-muted network-messages-log__empty">Bắt đầu bằng điều bạn muốn trao đổi hoặc cùng học hỏi.</p>}
        <div ref={end} />
      </div>
      {before > 0 && <div className="network-more"><Button variant="secondary" size="sm" onClick={() => setBefore(0)}>Về tin nhắn mới nhất</Button></div>}
      {error && <p className="network-error" role="alert">{error}</p>}
      <form className="network-composer" onSubmit={(e) => { e.preventDefault(); action(async () => { await api.send(`/threads/${id}/messages`, { content, sharedPostId: sharedPostId ? Number(sharedPostId) : null, sharedProfileId: sharedProfileId ? Number(sharedProfileId) : null, sharedProjectId: sharedProjectId ? Number(sharedProjectId) : null, sharedCvId: attachedCv?.id || null }); setContent(''); setAttachedCv(null); setBefore(0); onSent(); }); }}>
        {(sharedPostId || sharedProfileId) && <div className="network-attach-chip">
          <Paperclip size={14} aria-hidden="true" />Đính kèm {sharedPostId ? 'bài viết' : sharedProjectId ? 'dự án' : 'hồ sơ'}
          <button type="button" onClick={onSent} aria-label="Bỏ đính kèm"><X size={14} aria-hidden="true" /></button>
        </div>}
        {attachedCv && <div className="network-attach-chip">
          <FileText size={14} aria-hidden="true" />Đính kèm CV: {attachedCv.name}
          <button type="button" onClick={() => setAttachedCv(null)} aria-label="Bỏ đính kèm CV"><X size={14} aria-hidden="true" /></button>
        </div>}
        <label className="ui-sr-only" htmlFor="network-message">Tin nhắn</label>
        <div className="network-composer__row">
          {maySend && !sharedPostId && !sharedProfileId && <MoreMenu label="Đính kèm CV" icon={Paperclip} align="start" items={shareableCvs.length
            ? shareableCvs.map((cv) => ({ label: cv.name, icon: FileText, onClick: () => setAttachedCv(cv) }))
            : [{ label: 'Chưa có CV công khai để gửi', icon: FileText, onClick: () => navigate('/my-cv') }]} />}
          <ChatInput id="network-message" required maxLength={3000} value={content} disabled={!maySend || busy}
            onChange={(e) => setContent(e.target.value)} placeholder={maySend ? 'Viết tin nhắn…' : 'Chưa thể gửi tin nhắn trong cuộc trò chuyện này.'} />
          <Button type="submit" loading={busy} disabled={!maySend || !content.trim()} icon={Send}>Gửi</Button>
        </div>
      </form>
    </>}
  </section></Card>;
}

export default function NetworkMessagesPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const threads = useNetworkQuery('/threads', 60000, ['message', 'notification']);
  const sharedPostId = params.get('share');
  const sharedProfileId = params.get('profile');
  const sharedProjectId = params.get('project');
  const sharing = !!(sharedPostId || sharedProfileId);
  const [recipientQuery, setRecipientQuery] = useState('');
  const people = useNetworkQuery(sharing ? `/people?mode=discover&q=${encodeURIComponent(recipientQuery)}` : null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const open = async (person) => { if (opening) return; setOpening(true); setError(''); try { const t = await api.send(`/people/${person.account_id}/threads`); threads.reload(); navigate(`/network/messages/${t.id}?${params.toString()}`); } catch (err) { setError(err.message); } finally { setOpening(false); } };
  return <NetworkLayout title="Tin nhắn" description="Trò chuyện với kết nối và thành viên trong cộng đồng."><div className="network-inbox">
    <Panel title="Cuộc trò chuyện" icon={MessageSquare} className="network-inbox__list">
      {sharing && <div className="network-recipients">
        <p className="network-muted">Chọn người nhận để chia sẻ. Bạn vẫn cần bấm Gửi.</p>
        <SearchBox value={recipientQuery} onChange={setRecipientQuery} onClear={() => setRecipientQuery('')} placeholder="Tên, kỹ năng hoặc mục tiêu…" label="Tìm người nhận" />
        <div className="network-actions"><ResetRefreshButtons onReset={() => { setRecipientQuery(''); people.reload(); }} onRefresh={people.reload} loading={people.refreshing} /></div>
        <QueryState query={people} rows={1} />
        {people.data?.items.map((person) => (
          <button type="button" className="network-thread-choice" key={person.account_id} disabled={opening} onClick={() => open(person)}>
            <Avatar src={person.avatar_url ? getFullAvatarUrl(person.avatar_url) : null} name={person.full_name || 'U'} size={40} className="network-thread-choice__avatar" />
            <div className="network-thread-choice__text">
              <strong>{person.full_name}</strong>
              <span>{person.current_title || `@${person.handle}`}</span>
            </div>
          </button>
        ))}
      </div>}
      {error && <p className="network-error" role="alert">{error}</p>}
      <QueryState query={threads} rows={2} />
      {threads.data?.length > 0 && <div className="network-thread-list">{threads.data.map((t) => (
        <button
          className={`network-thread-choice${String(t.id) === id ? ' is-active' : ''}`}
          type="button"
          key={t.id}
          aria-current={String(t.id) === id ? 'true' : undefined}
          onClick={() => navigate(`/network/messages/${t.id}${sharing ? `?${params.toString()}` : ''}`)}
        >
          <Avatar
            src={t.other?.avatar_url ? getFullAvatarUrl(t.other.avatar_url) : null}
            name={t.other?.full_name || 'U'}
            size={40}
            className="network-thread-choice__avatar"
          />
          <div className="network-thread-choice__text">
            <strong>{t.other.full_name}</strong>
            <span>{t.status === 'PENDING' ? t.incoming ? 'Yêu cầu trò chuyện đến' : 'Đang chờ chấp nhận' : t.status === 'DECLINED' ? 'Đã từ chối' : t.other.current_title || 'Cuộc trò chuyện'}</span>
          </div>
          {t.unread > 0 && <b className="network-count" aria-label={`${t.unread} tin chưa đọc`}>{t.unread > 99 ? '99+' : t.unread}</b>}
        </button>
      ))}</div>}
      {threads.data?.length === 0 && <p className="network-muted">Chưa có cuộc trò chuyện. Mở hồ sơ một người bạn muốn trao đổi và chọn Nhắn tin.</p>}
      <Link className="network-link" to="/network/connections">Tìm người để trò chuyện <ArrowRight size={14} aria-hidden="true" /></Link>
    </Panel>
    {id ? <Thread key={id} id={id} sharedPostId={sharedPostId} sharedProfileId={sharedProfileId} sharedProjectId={sharedProjectId} onSent={() => { setParams({}); threads.reload(); }} />
      : <Card><EmptyState icon={MessageSquare} title="Chọn một cuộc trò chuyện" hint="Tin nhắn giúp kết nối kiến thức với những người đang cùng học." /></Card>}
  </div></NetworkLayout>;
}
