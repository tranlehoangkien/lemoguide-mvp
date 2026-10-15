import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trophy, CalendarDays, Users, ArrowRight, ThumbsUp, Pencil, Trash2, Flag, Award, Send, Check, History, Info } from 'lucide-react';
import { Button, Card, EmptyState, Badge, TextField, TextareaField, Toast, useToast } from '@/components/ui';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { networkService as api } from '@/services/networkService';
import { NetworkLayout, QueryState, Person, Panel, ExternalLink, RichText, Tags, MoreMenu, ReportForm } from './NetworkShared';
import { useNetworkQuery, dateLabel } from './networkUtils';

const STATE = { OPEN: { label: 'Đang diễn ra', tone: 'success' }, UPCOMING: { label: 'Sắp diễn ra' }, ENDED: { label: 'Đã kết thúc' } };
const day = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
const challengeDates = (c) => `${day(c.starts_on)} – ${day(c.ends_on)}`;

function ChallengeCard({ challenge }) {
  const state = STATE[challenge.state];
  return <Card className="network-challenge-card"><article className="network-panel">
    <div className="network-challenge-card__head">
      <div>
        <h3><Link to={`/network/challenges/${challenge.id}`}>{challenge.title}</Link></h3>
        <p className="network-challenge-meta"><CalendarDays size={14} aria-hidden="true" />{challengeDates(challenge)}<span aria-hidden="true">·</span><Users size={14} aria-hidden="true" />{challenge.entries} bài tham gia</p>
      </div>
      <Badge tone={state.tone}>{state.label}</Badge>
    </div>
    <p className="network-challenge-card__desc">{challenge.description}</p>
    <Tags text={challenge.tags} />
    <div className="network-actions">
      {challenge.joined && <span className="network-status"><Check size={14} aria-hidden="true" />Bạn đã tham gia</span>}
      <Link className="network-link" to={`/network/challenges/${challenge.id}`}>
        {challenge.state === 'OPEN' && !challenge.joined ? 'Tham gia thử thách' : 'Xem bài tham gia'}<ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  </article></Card>;
}

export default function NetworkChallengesPage() {
  const query = useNetworkQuery('/challenges');
  const d = query.data;
  const empty = d && !d.open.length && !d.upcoming.length && !d.ended.length;
  return <NetworkLayout title="Thử thách tuần" description="Thực hành cùng cộng đồng, nộp bài và bình chọn bài làm hay.">
    <QueryState query={query} rows={2} />
    {empty && <Card><EmptyState icon={Trophy} title="Chưa có thử thách nào" hint="Thử thách mới sẽ được đăng hằng tuần. Hãy quay lại sau nhé." /></Card>}
    {d && !empty && <div className="network-columns"><div className="network-stack">
      {d.open.length > 0 && <><h2 className="network-section-title">Đang diễn ra</h2>{d.open.map((c) => <ChallengeCard key={c.id} challenge={c} />)}</>}
      {d.upcoming.length > 0 && <><h2 className="network-section-title">Sắp diễn ra</h2>{d.upcoming.map((c) => <ChallengeCard key={c.id} challenge={c} />)}</>}
      {d.ended.length > 0 && <Panel title="Đã kết thúc" icon={History} count={d.ended.length}>
        <ul className="network-challenge-past">{d.ended.map((c) => <li key={c.id}>
          <Link to={`/network/challenges/${c.id}`}>{c.title}</Link>
          <span className="network-muted">{challengeDates(c)} · {c.entries} bài{c.joined ? ' · Bạn đã tham gia' : ''}</span>
        </li>)}</ul>
      </Panel>}
    </div><aside className="network-stack">
      <Panel title="Cách tham gia" icon={Info}>
        <ol className="network-steps">
          <li>Làm bài theo đề trong thời gian thử thách mở.</li>
          <li>Nộp mô tả ngắn và liên kết sản phẩm (GitHub, demo…). Bạn có thể sửa bài đến khi kết thúc.</li>
          <li>Bình chọn bài làm hay của người khác. Bài nhiều bình chọn nhất được gắn “Nổi bật” trên hồ sơ.</li>
        </ol>
      </Panel>
    </aside></div>}
  </NetworkLayout>;
}

function EntryForm({ challenge, entry, onDone, onCancel }) {
  const [form, setForm] = useState({ content: entry?.content || '', url: entry?.url || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <form className="network-form" onSubmit={async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { await api.send(`/challenges/${challenge.id}/entry`, { content: form.content, url: form.url || null }, 'PUT'); onDone(entry ? 'Đã cập nhật bài tham gia.' : 'Đã nộp bài. Chúc bạn may mắn!'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }}><fieldset disabled={busy}>
    <TextareaField label="Bài làm của bạn" required rows={4} maxLength={3000} placeholder="Bạn đã làm gì, gặp khó khăn gì và học được điều gì?" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
    <TextField label="Liên kết sản phẩm" type="url" maxLength={500} placeholder="https://github.com/…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
    {error && <p className="network-error" role="alert">{error}</p>}
    <div className="network-form__foot">
      {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button>}
      <Button type="submit" icon={Send} loading={busy}>{entry ? 'Lưu bài' : 'Nộp bài'}</Button>
    </div>
  </fieldset></form>;
}

function Entry({ entry, open, busy, onVote, onReport, reporting, onCloseReport }) {
  return <li className={`network-entry${entry.highlight ? ' is-highlight' : ''}`}>
    <div className="network-entry__head">
      <Person person={entry.author} subtitle={`${dateLabel(entry.created_at)}${entry.edited_at ? ' · đã chỉnh sửa' : ''}`} size={38} />
      <div className="network-post__meta">
        {entry.highlight && <span className="network-pill"><Award size={13} aria-hidden="true" />Nổi bật</span>}
        {!entry.mine && <MoreMenu label="Thao tác với bài tham gia" items={[{ label: 'Báo cáo bài tham gia', icon: Flag, onClick: onReport }]} />}
      </div>
    </div>
    <RichText text={entry.content} />
    <ExternalLink href={entry.url}>Xem sản phẩm</ExternalLink>
    <div className="network-post__bar">
      <button type="button" className={`network-post__like network-vote ${entry.voted ? 'is-liked' : ''}`} aria-pressed={entry.voted}
        disabled={busy || !open || entry.mine} title={entry.mine ? 'Không thể bình chọn cho bài của chính bạn' : !open ? 'Bình chọn đã đóng' : undefined}
        onClick={() => onVote(entry)}>
        <ThumbsUp size={16} fill={entry.voted ? 'currentColor' : 'none'} aria-hidden="true" /> {entry.votes} Bình chọn
      </button>
    </div>
    {reporting && <ReportForm kind="CHALLENGE_ENTRY" targetId={entry.id} onClose={onCloseReport} />}
  </li>;
}

export function NetworkChallengePage() {
  const { id } = useParams();
  const query = useNetworkQuery(`/challenges/${id}`);
  const [editing, setEditing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(null);
  const { toast, showToast } = useToast();
  const c = query.data;
  const open = c?.state === 'OPEN';
  const mine = c?.my_entry;
  const done = (message) => { setEditing(false); showToast(message); query.reload(); };
  const vote = async (entry) => {
    if (busy) return; setBusy(true);
    try { await api.send(`/challenge-entries/${entry.id}/vote`, { enabled: !entry.voted }, 'PUT'); query.reload(); }
    catch (err) { showToast(err.message, 'error'); } finally { setBusy(false); }
  };
  return <NetworkLayout title="Thử thách tuần" description="Thực hành cùng cộng đồng, nộp bài và bình chọn những bài làm hay.">
    <Toast toast={toast} />
    <QueryState query={query} />
    {c && <div className="network-columns"><div className="network-stack">
      <Card><section className="network-panel network-challenge-detail">
        <div className="network-challenge-card__head">
          <div>
            <h2>{c.title}</h2>
            <p className="network-challenge-meta"><CalendarDays size={14} aria-hidden="true" />{challengeDates(c)}<span aria-hidden="true">·</span><Users size={14} aria-hidden="true" />{c.entries.length} bài tham gia</p>
          </div>
          <Badge tone={STATE[c.state].tone}>{STATE[c.state].label}</Badge>
        </div>
        <RichText text={c.description} />
        <Tags text={c.tags} />
      </section></Card>

      {open && (!mine || editing) && <Panel title={mine ? 'Sửa bài tham gia' : 'Nộp bài của bạn'} icon={mine ? Pencil : Send}>
        <EntryForm challenge={c} entry={mine} onDone={done} onCancel={mine ? () => setEditing(false) : null} />
      </Panel>}
      {c.state === 'UPCOMING' && <div className="ui-callout"><span>Thử thách mở nhận bài từ ngày {day(c.starts_on)}.</span></div>}

      <h2 className="network-section-title">{c.state === 'ENDED' ? 'Kết quả' : 'Bài tham gia'}</h2>
      {c.entries.length > 0 ? <Card><div className="network-panel">
        <ul className="network-entries">{c.entries.map((entry) => <Entry key={entry.id} entry={entry} open={open} busy={busy} onVote={vote}
          reporting={reporting === entry.id} onReport={() => setReporting(entry.id)} onCloseReport={() => setReporting(null)} />)}</ul>
      </div></Card> : <p className="network-muted network-empty-line">{open ? 'Chưa có bài nào. Hãy là người đầu tiên!' : 'Không có bài tham gia.'}</p>}
    </div><aside className="network-stack">
      {mine && !editing && <Panel title="Bài của bạn" icon={Check}>
        <p className="network-muted">{mine.votes} bình chọn{mine.highlight ? ' · Nổi bật' : ''}</p>
        {open && <div className="network-actions">
          <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Sửa bài</Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setWithdrawing(true)}>Rút bài</Button>
        </div>}
      </Panel>}
      <Panel title="Luật chơi" icon={Info}>
        <p className="network-muted">Mỗi người nộp một bài và có thể sửa đến khi thử thách kết thúc. Bình chọn đóng cùng lúc với thử thách; bài có nhiều bình chọn nhất được gắn “Nổi bật”.</p>
        <Link className="network-link" to="/network/challenges">Tất cả thử thách <ArrowRight size={14} aria-hidden="true" /></Link>
      </Panel>
    </aside></div>}
    <ConfirmActionModal isOpen={withdrawing} title="Rút bài tham gia" icon={Trash2} confirmLabel="Rút bài" isSubmitting={busy}
      message="Bài làm và các bình chọn của bài sẽ bị xóa. Bạn có thể nộp lại khi thử thách còn mở." onCancel={() => setWithdrawing(false)}
      onConfirm={async () => {
        setBusy(true);
        try { await api.send(`/challenges/${c.id}/entry`, undefined, 'DELETE'); setWithdrawing(false); showToast('Đã rút bài.'); query.reload(); }
        catch (err) { showToast(err.message, 'error'); setWithdrawing(false); } finally { setBusy(false); }
      }} />
  </NetworkLayout>;
}
