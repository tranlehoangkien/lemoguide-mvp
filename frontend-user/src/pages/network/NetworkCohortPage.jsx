import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, CalendarCheck, LogOut, GraduationCap, Target, UserPlus, Users } from 'lucide-react';
import { Button, Card, Toast, useToast, Avatar } from '@/components/ui';
import { getFullAvatarUrl } from '@/services/apiClient';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { networkService as api } from '@/services/networkService';
import { refreshNetworkSummary } from '@/services/networkSummary';
import { NetworkLayout, QueryState, Person, Panel, ProgressLine, Report, RichText, ChatInput } from './NetworkShared';
import { useNetworkQuery, dateLabel } from './networkUtils';

export default function NetworkCohortPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [before, setBefore] = useState(0);
  const query = useNetworkQuery(`/cohorts/${id}?before=${before}`, before ? 0 : 60000, before ? [] : ['cohort']);
  const buddy = useNetworkQuery('/buddy', 0, ['notification']);
  const { toast, showToast } = useToast();
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const data = query.data;
  const latest = before ? 0 : data?.messages[0]?.id || 0;

  useEffect(() => {
    if (!latest) return;
    api.send(`/cohorts/${id}/read`, { lastId: latest }, 'PUT').then(refreshNetworkSummary).catch(() => {});
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [id, latest]);

  const run = async (fn, message) => {
    if (busy) return false;
    setBusy(true);
    try { await fn(); if (message) showToast(message); query.reload(); return true; }
    catch (err) { showToast(err.message, 'error'); return false; }
    finally { setBusy(false); }
  };
  const hasBuddy = !!buddy.data?.buddy;
  const invited = new Set((buddy.data?.outgoing || []).map((p) => p.account_id));
  const Icon = data?.cohort.kind === 'COURSE' ? GraduationCap : Target;

  return <NetworkLayout title={data?.cohort.title || 'Nhóm học'} description={data ? (data.cohort.kind === 'COURSE' ? 'Nhóm những người đang học cùng khóa trong lộ trình.' : 'Nhóm những người cùng hướng tới vị trí này.') : ''}>
    <Toast toast={toast} />
    <QueryState query={query} rows={2} />
    {data && <div className="network-inbox network-inbox--reverse">
      <Card className="network-thread-card"><section className="network-thread">
        <header className="network-thread__head">
          <span className="network-cohort-title"><span className="network-cohort-row__icon"><Icon size={18} aria-hidden="true" /></span>{data.members.length} thành viên</span>
          <div className="network-actions">
            <Button size="sm" icon={CalendarCheck} onClick={() => setCheckinOpen((v) => !v)}>Điểm danh tuần</Button>
            <Button size="sm" variant="ghost" icon={LogOut} onClick={() => setLeaving(true)}>Rời nhóm</Button>
          </div>
        </header>
        {checkinOpen && <form className="network-checkin" onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => api.send(`/cohorts/${id}/checkins`, { note }), 'Đã điểm danh.')) { setNote(''); setCheckinOpen(false); setBefore(0); }
        }}>
          <p className="network-muted">Tiến độ lộ trình của bạn được đăng tự động. Thêm vài dòng về điều bạn đã làm hoặc đang vướng.</p>
          <label className="ui-sr-only" htmlFor="checkin-note">Ghi chú điểm danh</label>
          <textarea id="checkin-note" className="ui-textarea" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuần này mình đã…" />
          <div className="network-actions"><Button type="submit" size="sm" loading={busy}>Đăng điểm danh</Button><Button type="button" size="sm" variant="ghost" onClick={() => setCheckinOpen(false)}>Hủy</Button></div>
        </form>}
        <div className="network-messages-log" role="log" aria-label="Trao đổi trong nhóm">
          {data.nextCursor && <div className="network-more"><Button size="sm" variant="ghost" onClick={() => setBefore(data.nextCursor)}>Tin nhắn cũ hơn</Button></div>}
          {[...data.messages].reverse().map((m) => {
            const mine = m.sender_id === data.mine;
            return (
              <div className={`network-message-row${mine ? ' is-mine' : ''}`} key={m.id}>
                <Avatar
                  src={m.avatar_url ? getFullAvatarUrl(m.avatar_url) : null}
                  name={m.full_name || 'U'}
                  size={32}
                  className="network-message__avatar"
                />
                <article className={`network-message network-message--group${mine ? ' is-mine' : ''}${m.kind === 'CHECKIN' ? ' is-checkin' : ''}`}>
                  {!mine && <strong className="network-message__sender">{m.full_name}</strong>}
                  {m.kind === 'CHECKIN' && <span className="network-message__tag"><CalendarCheck size={12} aria-hidden="true" />Điểm danh</span>}
                  <RichText text={m.content} />
                  <small>{dateLabel(m.created_at)}</small>
                  {!mine && !m.hidden && <Report kind="COHORT_MESSAGE" targetId={m.id} />}
                </article>
              </div>
            );
          })}
          {!data.messages.length && <p className="network-muted network-messages-log__empty">Chưa có trao đổi nào. Hãy chào nhóm hoặc điểm danh tuần này.</p>}
          <div ref={end} />
        </div>
        {before > 0 && <div className="network-more"><Button variant="secondary" size="sm" onClick={() => setBefore(0)}>Về tin nhắn mới nhất</Button></div>}
        <form className="network-composer" onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => api.send(`/cohorts/${id}/messages`, { content }))) { setContent(''); setBefore(0); }
        }}>
          <label className="ui-sr-only" htmlFor="cohort-message">Tin nhắn cho nhóm</label>
          <div className="network-composer__row">
            <ChatInput id="cohort-message" required maxLength={3000} value={content} disabled={busy}
              onChange={(e) => setContent(e.target.value)} placeholder="Hỏi nhóm, chia sẻ tài liệu hoặc hẹn học cùng…" />
            <Button type="submit" loading={busy} disabled={!content.trim()} icon={Send}>Gửi</Button>
          </div>
        </form>
      </section></Card>

      <Panel title="Thành viên" icon={Users} count={data.members.length} className="network-inbox__list">
        <ul className="network-members">{data.members.map((m) => <li key={m.account_id}>
          <div className="network-members__head">
            <Person person={m} size={34} subtitle={m.mine ? 'Bạn' : undefined} />
            {buddy.data?.buddy?.account_id === m.account_id && <span className="network-pill">Bạn đồng hành</span>}
            {!m.mine && !hasBuddy && buddy.data && (invited.has(m.account_id)
              ? <span className="network-status">Đã mời</span>
              : invited.size === 0 && <Button size="sm" variant="secondary" icon={UserPlus} disabled={busy}
                onClick={() => run(async () => { await api.send(`/people/${m.account_id}/buddy/request`); buddy.reload(); }, `Đã mời ${m.full_name} làm bạn đồng hành.`)}>
                Mời đồng hành
              </Button>)}
          </div>
          <ProgressLine progress={m.progress} />
          {m.progress?.next_title && <small className="network-muted">Đang học: tuần {m.progress.next_week} · {m.progress.next_title}</small>}
        </li>)}</ul>
      </Panel>
    </div>}
    <ConfirmActionModal isOpen={leaving} title="Rời nhóm học" icon={LogOut} confirmLabel="Rời nhóm" isSubmitting={busy}
      message="Bạn sẽ không nhận tin nhắn của nhóm và thành viên không còn thấy tiến độ của bạn. Bạn có thể tham gia lại sau."
      onCancel={() => setLeaving(false)}
      onConfirm={async () => { if (await run(() => api.send(`/cohorts/${id}/membership`, undefined, 'DELETE'))) { refreshNetworkSummary(); navigate('/network/cohorts'); } }} />
  </NetworkLayout>;
}
