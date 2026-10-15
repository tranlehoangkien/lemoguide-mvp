import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, ArrowUpRight, CalendarClock, MessageSquare, Star, Check, X, Video, Sparkles, HandHelping, Inbox, Send, Info } from 'lucide-react';
import { Button, Card, EmptyState, SearchBox, Tabs, Badge, FormModal, TextField, TextareaField, Toast, useToast } from '@/components/ui';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { networkService as api } from '@/services/networkService';
import { refreshNetworkSummary, useNetworkSummary } from '@/services/networkSummary';
import { NetworkLayout, QueryState, Person, Panel, ExternalLink } from './NetworkShared';
import { useNetworkQuery, dateLabel, mentorStatsText } from './networkUtils';

const STATUS = {
  PENDING: { label: 'Chờ phản hồi' },
  ACCEPTED: { label: 'Đã hẹn lịch', tone: 'success' },
  COMPLETED: { label: 'Đã hoàn thành' },
  DECLINED: { label: 'Đã từ chối' },
  CANCELLED: { label: 'Đã hủy' },
};

const splitTopics = (text = '') => text.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8);

/** Mentee's request form: a topic and what they need help with. Used here and on the profile page. */
export function MentorRequestModal({ mentor, onClose, onSent }) {
  const [form, setForm] = useState({ topic: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <FormModal open={!!mentor} title={`Nhờ ${mentor?.full_name || ''} hỗ trợ`}
    description="Mô tả ngắn gọn điều bạn đang vướng. Mentor sẽ hẹn lịch hoặc phản hồi nếu chưa thể nhận."
    submitLabel="Gửi yêu cầu" submittingLabel="Đang gửi..." isSubmitting={busy} onClose={onClose}
    onSubmit={async (e) => {
      e.preventDefault(); if (busy) return;
      if (!form.topic.trim() || !form.message.trim()) { setError('Hãy nhập chủ đề và nội dung cần hỗ trợ.'); return; }
      setBusy(true); setError('');
      try { await api.send(`/people/${mentor.account_id}/mentoring`, form); onSent(); }
      catch (err) { setError(err.message); } finally { setBusy(false); }
    }}>
    <TextField label="Chủ đề" required maxLength={200} placeholder="Ví dụ: Thiết kế REST API cho dự án cá nhân" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
    <TextareaField label="Bạn cần hỗ trợ điều gì?" required rows={5} maxLength={1500} hint="Nêu điều đã thử, chỗ còn vướng và bạn mong đợi gì sau buổi trao đổi."
      value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} error={error || undefined} />
  </FormModal>;
}

/** ISO instant → value for <input type="datetime-local"> in the viewer's time zone. */
const toLocalInput = (iso) => {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function ScheduleModal({ session, onClose, onDone }) {
  const [form, setForm] = useState(() => ({ at: toLocalInput(session.scheduled_at), meetingUrl: session.meeting_url || '', note: session.mentor_note || '' }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const reschedule = session.status === 'ACCEPTED';
  return <FormModal open title={reschedule ? 'Đổi lịch hỗ trợ' : 'Nhận yêu cầu và hẹn lịch'}
    description={`Với ${session.other.full_name} · ${session.topic}`}
    submitLabel={reschedule ? 'Lưu lịch mới' : 'Nhận và hẹn lịch'} isSubmitting={busy} onClose={onClose}
    onSubmit={async (e) => {
      e.preventDefault(); if (busy) return;
      if (!form.at) { setError('Hãy chọn thời gian.'); return; }
      setBusy(true); setError('');
      try { await api.send(`/mentoring/${session.id}/schedule`, { scheduledAt: new Date(form.at).toISOString(), meetingUrl: form.meetingUrl || null, note: form.note }, 'PUT'); onDone(reschedule ? 'Đã cập nhật lịch hỗ trợ.' : 'Đã hẹn lịch. Hai bạn có thể nhắn tin cho nhau.'); }
      catch (err) { setError(err.message); } finally { setBusy(false); }
    }}>
    <TextField label="Thời gian" type="datetime-local" required min={toLocalInput(new Date().toISOString())} value={form.at} onChange={(e) => setForm({ ...form, at: e.target.value })} error={error || undefined} />
    <TextField label="Liên kết buổi gặp" type="url" maxLength={500} placeholder="https://meet.google.com/…" hint="Không bắt buộc. Có thể trao đổi qua tin nhắn LemoNetwork." value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} />
    <TextareaField label="Ghi chú cho người học" rows={3} maxLength={500} placeholder="Ví dụ: Chuẩn bị sẵn repo và lỗi đang gặp." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
  </FormModal>;
}

function DeclineModal({ session, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <FormModal open title="Chưa thể nhận yêu cầu" description={`${session.other.full_name} sẽ nhận được thông báo.`} submitLabel="Từ chối yêu cầu" isSubmitting={busy} onClose={onClose}
    onSubmit={async (e) => {
      e.preventDefault(); if (busy) return; setBusy(true); setError('');
      try { await api.send(`/mentoring/${session.id}/decline`, { note }, 'PUT'); onDone('Đã phản hồi yêu cầu.'); }
      catch (err) { setError(err.message); } finally { setBusy(false); }
    }}>
    <TextareaField label="Lời nhắn (không bắt buộc)" rows={3} maxLength={500} placeholder="Ví dụ: Tuần này mình bận, bạn thử hỏi trong nhóm học nhé." value={note} onChange={(e) => setNote(e.target.value)} error={error || undefined} />
  </FormModal>;
}

function RatingInput({ value, onChange }) {
  return <div className="network-rating" role="radiogroup" aria-label="Mức độ hữu ích">
    {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} trên 5`}
      className={n <= value ? 'is-on' : ''} onClick={() => onChange(n)}><Star size={22} fill={n <= value ? 'currentColor' : 'none'} aria-hidden="true" /></button>)}
  </div>;
}

function CompleteModal({ session, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <FormModal open title="Đánh giá buổi hỗ trợ" description={`${session.topic} · với ${session.other.full_name}`} submitLabel="Gửi đánh giá" isSubmitting={busy} onClose={onClose}
    onSubmit={async (e) => {
      e.preventDefault(); if (busy) return;
      if (!rating) { setError('Hãy chọn mức độ hữu ích.'); return; }
      setBusy(true); setError('');
      try { await api.send(`/mentoring/${session.id}/complete`, { rating, feedback }, 'PUT'); onDone('Cảm ơn bạn đã đánh giá.'); }
      catch (err) { setError(err.message); } finally { setBusy(false); }
    }}>
    <div className="ui-field">
      <span className="ui-label">Buổi hỗ trợ hữu ích đến đâu?</span>
      <RatingInput value={rating} onChange={setRating} />
      {error && <p className="network-error" role="alert">{error}</p>}
    </div>
    <TextareaField label="Nhận xét cho mentor (không bắt buộc)" rows={3} maxLength={1000} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
  </FormModal>;
}

function MentorCard({ mentor, onRequest }) {
  const topics = splitTopics(mentor.mentor_topics);
  const open = mentor.open_request;
  return <Card className="network-person-card"><article className="network-panel">
    <div className="network-person-card__top">
      <Person person={mentor} />
      <Link className="ui-icon-btn network-person-card__open" to={`/u/${mentor.handle}`} aria-label={`Xem hồ sơ ${mentor.full_name}`} title="Xem hồ sơ"><ArrowUpRight size={16} aria-hidden="true" /></Link>
    </div>
    <p className="network-mentor-stats"><Star size={14} aria-hidden="true" />{mentorStatsText(mentor.stats)}</p>
    {topics.length > 0 && <div className="network-mentor-topics"><span>Có thể hỗ trợ</span><ul className="network-tech">{topics.map((t) => <li key={t}>{t}</li>)}</ul></div>}
    {mentor.skills?.length > 0 && <div className="network-mentor-topics"><span>Kỹ năng công khai</span><ul className="network-tech">{mentor.skills.map((t) => <li key={t}>{t}</li>)}</ul></div>}
    {mentor.matched?.length > 0 && <p className="network-mentor-match"><Sparkles size={14} aria-hidden="true" />Khớp chủ đề bạn quan tâm: {mentor.matched.join(', ')}</p>}
    <div className="network-person-card__actions">
      {open ? <>
        <span className="network-status"><Check size={14} aria-hidden="true" />{open.status === 'ACCEPTED' ? 'Đã hẹn lịch' : 'Đã gửi yêu cầu'}</span>
        <Link className="network-link" to="/network/mentors?tab=sessions">Xem buổi hỗ trợ</Link>
      </> : <Button size="sm" icon={HandHelping} onClick={() => onRequest(mentor)}>Nhờ hỗ trợ</Button>}
    </div>
  </article></Card>;
}

function FindMentors({ onChanged, showToast }) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const [requesting, setRequesting] = useState(null);
  const query = useNetworkQuery(`/mentors?q=${encodeURIComponent(q)}`);
  const mine = useNetworkQuery('/mentoring');
  return <>
    <div className="network-toolbar">
      <form className="network-search" role="search" onSubmit={(e) => { e.preventDefault(); setParams(search.trim() ? { q: search.trim() } : {}); }}>
        <SearchBox value={search} onChange={setSearch} onClear={() => { setSearch(''); setParams({}); }} placeholder="Chủ đề, kỹ năng, chức danh…" label="Tìm mentor theo chủ đề hoặc kỹ năng" />
        <Button type="submit" variant="secondary">Tìm</Button>
      </form>
    </div>
    {mine.data && !mine.data.available && <div className="ui-callout"><span>Bạn cũng có thể giúp người đi sau. Bật “Tôi sẵn sàng hỗ trợ người cùng học” trong <Link className="network-link" to="/network/settings">Quyền riêng tư</Link> và ghi rõ chủ đề bạn có thể hỗ trợ.</span></div>}
    <QueryState query={query} rows={3} />
    {query.data?.length > 0 && <div className="network-people-grid">{query.data.map((m) => <MentorCard key={m.account_id} mentor={m} onRequest={setRequesting} />)}</div>}
    {query.data?.length === 0 && <Card><EmptyState icon={GraduationCap} title={q ? 'Không tìm thấy mentor phù hợp' : 'Chưa có mentor nào'}
      hint={q ? 'Thử từ khóa rộng hơn, ví dụ tên công nghệ.' : 'Thành viên bật “Sẵn sàng hỗ trợ” sẽ xuất hiện tại đây.'} /></Card>}
    {requesting && <MentorRequestModal mentor={requesting} onClose={() => setRequesting(null)}
      onSent={() => { showToast(`Đã gửi yêu cầu tới ${requesting.full_name}.`); setRequesting(null); query.reload(); onChanged(); }} />}
  </>;
}

function SessionRow({ session, role, busy, onAction }) {
  const status = STATUS[session.status] || STATUS.PENDING;
  const asMentor = role === 'mentor';
  const open = session.status === 'PENDING' || session.status === 'ACCEPTED';
  return <li className="network-session">
    <div className="network-session__head">
      <Person person={session.other} subtitle={asMentor ? 'Người nhờ hỗ trợ' : 'Mentor'} size={40} />
      <Badge tone={status.tone}>{status.label}</Badge>
    </div>
    <div className="network-session__body">
      <strong>{session.topic}</strong>
      <p className="network-text">{session.message}</p>
      {session.scheduled_at && open && <p className="network-session__when"><CalendarClock size={15} aria-hidden="true" />{dateLabel(session.scheduled_at)}</p>}
      {session.meeting_url && open && <ExternalLink href={session.meeting_url}><Video size={14} aria-hidden="true" />Mở liên kết buổi gặp</ExternalLink>}
      {session.mentor_note && <p className="network-muted"><strong>Lời nhắn của mentor:</strong> {session.mentor_note}</p>}
      {session.status === 'COMPLETED' && <p className="network-session__rating" aria-label={`Đánh giá ${session.rating} trên 5`}>
        {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} fill={n <= session.rating ? 'currentColor' : 'none'} aria-hidden="true" />)}
        {session.feedback && <span>“{session.feedback}”</span>}
      </p>}
    </div>
    {open && <div className="network-actions">
      {asMentor && session.status === 'PENDING' && <>
        <Button size="sm" icon={CalendarClock} disabled={busy} onClick={() => onAction('schedule', session)}>Nhận và hẹn lịch</Button>
        <Button size="sm" variant="ghost" icon={X} disabled={busy} onClick={() => onAction('decline', session)}>Từ chối</Button>
      </>}
      {!asMentor && session.due && <Button size="sm" icon={Star} disabled={busy} onClick={() => onAction('complete', session)}>Đánh giá buổi hỗ trợ</Button>}
      {session.status === 'ACCEPTED' && <Button size="sm" variant={asMentor || session.due ? 'secondary' : 'primary'} icon={MessageSquare} disabled={busy} onClick={() => onAction('chat', session)}>Nhắn tin</Button>}
      {asMentor && session.status === 'ACCEPTED' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction('schedule', session)}>Đổi lịch</Button>}
      {!(asMentor && session.status === 'PENDING') && <Button size="sm" variant="ghost" disabled={busy} onClick={() => onAction('cancel', session)}>{session.status === 'PENDING' ? 'Hủy yêu cầu' : 'Hủy buổi'}</Button>}
    </div>}
  </li>;
}

function Sessions({ onChanged, showToast }) {
  const navigate = useNavigate();
  const query = useNetworkQuery('/mentoring', 0, ['notification']);
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const done = (message) => { setDialog(null); showToast(message); query.reload(); onChanged(); };
  const onAction = async (kind, session) => {
    if (kind !== 'chat') { setDialog({ kind, session }); return; }
    setBusy(true);
    try { const thread = await api.send(`/people/${session.other.account_id}/threads`); navigate(`/network/messages/${thread.id}`); }
    catch (err) { showToast(err.message, 'error'); setBusy(false); }
  };
  const cancel = async () => {
    setBusy(true);
    try { await api.send(`/mentoring/${dialog.session.id}/cancel`, undefined, 'PUT'); done('Đã hủy.'); }
    catch (err) { showToast(err.message, 'error'); setDialog(null); } finally { setBusy(false); }
  };
  const d = query.data;
  return <>
    <QueryState query={query} rows={2} />
    {d && <div className="network-columns"><div className="network-stack">
      <Panel title="Yêu cầu gửi đến bạn" icon={Inbox} count={d.incoming.length}>
        {d.incoming.length ? <ul className="network-sessions">{d.incoming.map((s) => <SessionRow key={s.id} session={s} role="mentor" busy={busy} onAction={onAction} />)}</ul>
          : <p className="network-muted">{d.available ? 'Chưa có ai nhờ bạn hỗ trợ.' : 'Bật “Sẵn sàng hỗ trợ” trong Quyền riêng tư để nhận yêu cầu.'}</p>}
      </Panel>
      <Panel title="Yêu cầu bạn đã gửi" icon={Send} count={d.outgoing.length}>
        {d.outgoing.length ? <ul className="network-sessions">{d.outgoing.map((s) => <SessionRow key={s.id} session={s} role="mentee" busy={busy} onAction={onAction} />)}</ul>
          : <p className="network-muted">Bạn chưa nhờ ai hỗ trợ. Tìm mentor theo chủ đề ở thẻ “Tìm mentor”.</p>}
      </Panel>
    </div><aside className="network-stack">
      <Panel title="Đóng góp của bạn" icon={GraduationCap}>
        <p className="network-mentor-stats"><Star size={14} aria-hidden="true" />{mentorStatsText(d.stats)}</p>
        <p className="network-muted">Mỗi buổi hỗ trợ được người học xác nhận và đánh giá sẽ cộng vào điểm đóng góp trên hồ sơ của bạn.</p>
      </Panel>
      <Panel title="Cách hoạt động" icon={Info}>
        <ol className="network-steps">
          <li>Người học gửi chủ đề và điều đang vướng.</li>
          <li>Mentor nhận và hẹn lịch. Hai bên có thể nhắn tin ngay.</li>
          <li>Sau buổi hẹn, người học đánh giá mức độ hữu ích.</li>
        </ol>
      </Panel>
    </aside></div>}
    {dialog?.kind === 'schedule' && <ScheduleModal session={dialog.session} onClose={() => setDialog(null)} onDone={done} />}
    {dialog?.kind === 'decline' && <DeclineModal session={dialog.session} onClose={() => setDialog(null)} onDone={done} />}
    {dialog?.kind === 'complete' && <CompleteModal session={dialog.session} onClose={() => setDialog(null)} onDone={done} />}
    <ConfirmActionModal isOpen={dialog?.kind === 'cancel'} title="Hủy buổi hỗ trợ" icon={X} confirmLabel="Hủy buổi" isSubmitting={busy}
      message={dialog?.kind === 'cancel' ? `${dialog.session.other.full_name} sẽ nhận được thông báo hủy.` : ''} onCancel={() => setDialog(null)} onConfirm={cancel} />
  </>;
}

export default function NetworkMentorsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'sessions' ? 'sessions' : 'find';
  const summary = useNetworkSummary();
  const { toast, showToast } = useToast();
  return <NetworkLayout title="Mentor" description="Nhờ người đi trước hỗ trợ theo chủ đề và hẹn lịch trao đổi.">
    <Toast toast={toast} />
    <Tabs label="Mentor" value={tab} onChange={(value) => setParams(value === 'sessions' ? { tab: value } : {})} options={[
      { value: 'find', label: 'Tìm mentor', icon: GraduationCap },
      { value: 'sessions', label: 'Buổi hỗ trợ', icon: CalendarClock, count: summary?.mentoring || null },
    ]} />
    {tab === 'find' ? <FindMentors onChanged={refreshNetworkSummary} showToast={showToast} /> : <Sessions onChanged={refreshNetworkSummary} showToast={showToast} />}
  </NetworkLayout>;
}
