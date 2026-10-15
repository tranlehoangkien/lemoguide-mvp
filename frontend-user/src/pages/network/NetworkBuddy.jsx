import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, BellRing, Check, X, UserPlus, MessageSquare, Flame, Clock3, ShieldCheck, UsersRound } from 'lucide-react';
import { Button, Card, Avatar } from '@/components/ui';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { networkService as api } from '@/services/networkService';
import { refreshNetworkSummary } from '@/services/networkSummary';
import { getFullAvatarUrl } from '@/services/apiClient';
import { QueryState } from './NetworkShared';

/** Vietnamese given name is the last word: "Vũ Đức Anh" -> "Anh". */
const givenName = (full = '') => full.trim().split(/\s+/).pop() || full;

function Face({ person, size = 40 }) {
  return <Avatar src={person.avatar_url ? getFullAvatarUrl(person.avatar_url) : null} name={person.full_name || 'L'} size={size} />;
}

function Streak({ weeks }) {
  if (!weeks) return <span className="buddy-streak is-empty">Chưa có chuỗi</span>;
  return <span className="buddy-streak"><Flame size={13} aria-hidden="true" />{weeks} tuần liên tiếp</span>;
}

/** One side of the pair: big ring, weeks done, streak and the week being studied. */
function Side({ label, person, progress }) {
  const p = progress || { percent: 0, done: 0, total: 0, streak: 0 };
  return <div className="buddy-side">
    <span className="network-eyebrow">{label}</span>
    <div className="buddy-side__main">
      <span className="ui-match-ring buddy-side__ring" style={{ '--p': p.percent }}><strong>{p.percent}%</strong></span>
      <div className="buddy-side__text">
        <strong>{person ? person.full_name : 'Lộ trình của bạn'}</strong>
        <span>{p.total ? `${p.done}/${p.total} tuần đã xong` : 'Chưa có lộ trình'}</span>
        <Streak weeks={p.streak} />
      </div>
    </div>
    {p.next_title && <p className="buddy-side__now">Đang học tuần {p.next_week}: {p.next_title}</p>}
    {p.total > 0 && !p.next_title && <p className="buddy-side__now">Đã hoàn thành lộ trình</p>}
  </div>;
}

/** Row for a person in an invite list or suggestion list. */
function PersonRow({ person, children, mine }) {
  const near = mine != null && person.progress && Math.abs(person.progress.percent - mine) <= 10;
  return <li className="buddy-row">
    <Face person={person} />
    <div className="buddy-row__text">
      <strong>{person.full_name}</strong>
      <span>{person.shared_cohort ? `Cùng nhóm ${person.shared_cohort}` : person.current_title || `@${person.handle}`}</span>
      {person.progress && <span className="buddy-row__progress">
        <span className="ui-bar"><span style={{ width: `${person.progress.percent}%` }} /></span>
        {person.progress.percent}%{near && <em>· gần tiến độ của bạn</em>}
      </span>}
    </div>
    <div className="buddy-row__actions">{children}</div>
  </li>;
}

const STEPS = ['Mời một người trong nhóm học', 'Người đó chấp nhận', 'Hai bạn thấy tiến độ và nhắc nhau mỗi tuần'];

/**
 * Accountability buddy, full width on the cohorts page. Shows exactly one state at a time:
 * an invite waiting for you, your current pair, the invite you sent, or people you could invite.
 */
export default function BuddySection({ query, showToast, onFindGroups }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const data = query.data;
  const run = async (fn, message) => {
    if (busy) return false;
    setBusy(true);
    try { await fn(); if (message) showToast(message); query.reload(); refreshNetworkSummary(); return true; }
    catch (err) { showToast(err.message, 'error'); return false; }
    finally { setBusy(false); }
  };
  const act = (person, action, message) => run(() => api.send(`/people/${person.account_id}/buddy/${action}`), message);
  const message = (person) => run(async () => { const t = await api.send(`/people/${person.account_id}/threads`); navigate(`/network/messages/${t.id}`); });

  const buddy = data?.buddy;
  const waiting = data?.outgoing?.[0];
  return <Card className="buddy-card"><section className="buddy">
    <header className="buddy__head">
      <div>
        <h2><Handshake size={18} aria-hidden="true" />Bạn đồng hành</h2>
        <p>{buddy ? `Bạn và ${buddy.full_name} đang giữ nhịp học cùng nhau.` : 'Một người học cùng hướng, cùng theo dõi tiến độ và nhắc nhau không bỏ dở.'}</p>
      </div>
    </header>
    <QueryState query={query} rows={1} />

    {data && <>
      {data.incoming.length > 0 && <div className="buddy-invites">
        <h3>{data.incoming.length > 1 ? `${data.incoming.length} lời mời đồng hành` : 'Lời mời đồng hành'}</h3>
        <ul className="buddy-list">{data.incoming.map((p) => <PersonRow key={p.account_id} person={p}>
          <Button size="sm" icon={Check} disabled={busy} onClick={() => act(p, 'accept', `Bạn và ${p.full_name} đã thành bạn đồng hành.`)}>Chấp nhận</Button>
          <Button size="sm" variant="ghost" icon={X} disabled={busy} onClick={() => act(p, 'remove', 'Đã từ chối lời mời.')}>Từ chối</Button>
        </PersonRow>)}</ul>
        {buddy && <p className="buddy-note">Chấp nhận lời mời mới sẽ cần kết thúc đồng hành hiện tại trước.</p>}
      </div>}

      {buddy ? <>
        <div className="buddy-pair">
          <Side label="Bạn" progress={data.me} />
          <Side label="Bạn đồng hành" person={buddy} progress={buddy.progress} />
        </div>
        <div className="buddy-actions">
          <Button icon={BellRing} disabled={busy || buddy.nudged_today} onClick={() => run(() => api.send('/buddy/nudge'), `Đã nhắc ${buddy.full_name}.`)}>
            {buddy.nudged_today ? `Đã nhắc ${givenName(buddy.full_name)} hôm nay` : `Nhắc ${givenName(buddy.full_name)} học tuần này`}
          </Button>
          <Button variant="secondary" icon={MessageSquare} disabled={busy} onClick={() => message(buddy)}>Nhắn tin</Button>
          <Button variant="ghost" disabled={busy} className="buddy-actions__end" onClick={() => setEnding(true)}>Kết thúc đồng hành</Button>
        </div>
        {buddy.nudged_today && <p className="buddy-note"><Clock3 size={13} aria-hidden="true" />Mỗi ngày nhắc được một lần. Bạn có thể nhắc lại vào ngày mai.</p>}
      </> : waiting ? <div className="buddy-waiting">
        <Face person={waiting} />
        <div className="buddy-row__text">
          <strong>Đang chờ {waiting.full_name} phản hồi</strong>
          <span>Bạn sẽ nhận thông báo khi lời mời được chấp nhận. Muốn mời người khác, hãy hủy lời mời này trước.</span>
        </div>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(waiting, 'remove', 'Đã hủy lời mời.')}>Hủy lời mời</Button>
      </div> : !data.incoming.length && <>
        <ol className="buddy-steps">{STEPS.map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}</ol>
        {data.suggestions.length > 0 ? <div className="buddy-suggest">
          <h3>Gợi ý cho bạn</h3>
          <ul className="buddy-list">{data.suggestions.map((p) => <PersonRow key={p.account_id} person={p} mine={data.me?.percent}>
            <Button size="sm" icon={UserPlus} disabled={busy} onClick={() => act(p, 'request', `Đã mời ${p.full_name}. Chờ họ chấp nhận nhé.`)}>Mời đồng hành</Button>
          </PersonRow>)}</ul>
        </div> : <div className="buddy-empty">
          <UsersRound size={22} aria-hidden="true" />
          <div><strong>Chưa có ai để gợi ý</strong><p>Gợi ý đến từ các nhóm học bạn tham gia. Hãy tham gia một nhóm bên dưới để tìm người có tiến độ gần bạn.</p></div>
          {onFindGroups && <Button size="sm" variant="secondary" onClick={onFindGroups}>Xem nhóm học</Button>}
        </div>}
      </>}

      <p className="buddy-privacy"><ShieldCheck size={14} aria-hidden="true" />Bạn đồng hành chỉ thấy số tuần đã xong, chuỗi tuần và tuần đang học. Ghi chú riêng của bạn không được chia sẻ.</p>
    </>}

    <ConfirmActionModal isOpen={ending} title="Kết thúc đồng hành" confirmLabel="Kết thúc" isSubmitting={busy}
      message={buddy ? `Bạn và ${buddy.full_name} sẽ không còn thấy tiến độ của nhau. Bạn có thể ghép đôi với người khác sau đó.` : ''}
      onCancel={() => setEnding(false)} onConfirm={async () => { await act(buddy, 'remove', 'Đã kết thúc đồng hành.'); setEnding(false); }} />
  </section></Card>;
}
