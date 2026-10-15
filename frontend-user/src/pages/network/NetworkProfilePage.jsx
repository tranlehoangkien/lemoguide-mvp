import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Sparkles, UserPlus, UserMinus, UserCheck, MessageSquare, Share2, Settings, Ban, ArrowRight, Check, X, FileText, Flag, Target, Clock3, Bell, BellOff, BadgeCheck, HandHelping, Award, Star, Layers, FolderGit2, Briefcase, Map as MapIcon, FileText as FileIcon } from 'lucide-react';
import { Button, Card, EmptyState, TextareaField, Toast, useToast, Avatar } from '@/components/ui';
import { useChat } from '@/context/ChatContext';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { networkService as api } from '@/services/networkService';
import { refreshNetworkSummary } from '@/services/networkSummary';
import { getFullAvatarUrl } from '@/services/apiClient';
import { NetworkLayout, QueryState, Tags, ExternalLink, Panel, MoreMenu, ReportForm } from './NetworkShared';
import { useNetworkQuery, itemLabels, mentorStatsText, cvTargetLabel } from './networkUtils';
import { PostCard } from './NetworkFeedPage';
import { MentorRequestModal } from './NetworkMentorsPage';

function LearnFromProfile({ profile }) {
  const navigate = useNavigate();
  const { selectedModel } = useChat();
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const act = async (fn) => { if (busy) return; setBusy(true); setError(''); try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <Panel id="learn" icon={Sparkles} title="Học từ hồ sơ này" className="network-learning">
    <p className="network-muted">AI đối chiếu hồ sơ của bạn với các mục tác giả cho phép chia sẻ. Kết quả là đề xuất học tập, không phải đánh giá ai giỏi hơn.</p>
    <form className="network-form" onSubmit={(e) => { e.preventDefault(); act(async () => { const data = await api.send(`/people/${profile.account_id}/comparisons`, { goal, modelId: selectedModel || null }); setResult(data); setSelected([]); setPreview(null); }); }}>
      <TextareaField label="Bạn muốn học điều gì từ hành trình này?" required maxLength={500} rows={2} placeholder="Ví dụ: Xây dựng portfolio Backend có API và kiểm thử…" value={goal} disabled={busy}
        onChange={(e) => { setGoal(e.target.value); setResult(null); setPreview(null); }} />
      <div><Button type="submit" icon={Sparkles} loading={busy}>Phân tích khác biệt</Button></div>
    </form>
    {error && <p className="network-error" role="alert">{error}</p>}
    {result && <div className="network-comparison">
      <p>{result.analysis.summary}</p>
      <p className="network-muted">Chọn những mục tiêu phù hợp với bạn. “Chưa thấy bằng chứng” không có nghĩa là bạn chưa có kỹ năng.</p>
      <ul className="network-comparison__list">{result.analysis.differences.map((d, i) => <li key={i}>
        <label className="ui-check network-comparison__pick"><input type="checkbox" disabled={busy} checked={selected.includes(i)} onChange={(e) => { setSelected(e.target.checked ? [...selected, i] : selected.filter((n) => n !== i)); setPreview(null); }} /><strong>{d.skill}</strong></label>
        <div className="network-two"><div><h4>Hồ sơ của bạn</h4><p>{d.mine}</p></div><div><h4>Hồ sơ tham khảo</h4><p>{d.reference}</p></div></div>
        <p className="network-muted"><strong>Căn cứ:</strong> {d.evidence}</p>
        <p><strong>Bước thực hành:</strong> {d.action}</p>
      </li>)}</ul>
      {result.courses?.length > 0 && <div><h3>Khóa học hỗ trợ</h3>{result.courses.map((c) => <p key={c.id}><Link className="network-link" to={`/courses/${c.id}`}>{c.title}</Link> · {c.skills.join(', ')}</p>)}</div>}
      <div><Button variant="secondary" disabled={!selected.length || busy} onClick={() => act(async () => setPreview(await api.send(`/comparisons/${result.id}/preview`, { selections: selected })))}>Xem trước mục tiêu đưa vào lộ trình ({selected.length})</Button></div>
    </div>}
    {preview && <div className="network-preview">
      <h3>{preview.id ? 'Đề xuất điều chỉnh lộ trình hiện tại' : 'Đề xuất cho lộ trình mới'}</h3>
      <p className="network-text">{preview.constraints}</p>
      <p className="network-muted">Chưa có thay đổi nào được lưu vào hồ sơ hay lộ trình. Ở bước tiếp theo, bạn kiểm tra mục tiêu, quỹ giờ và thời lượng trước khi tạo.{preview.id ? ' Lộ trình mới sẽ thay thế lộ trình hiện tại sau khi bạn xác nhận tạo tại bước thiết lập.' : ''}</p>
      <div><Button trailingIcon={ArrowRight} onClick={() => navigate('/coach', { state: { careerStudio: { openSetup: true, seed: preview } } })}>Tiếp tục thiết lập lộ trình</Button></div>
    </div>}
  </Panel>;
}

/** Where the viewer stands with this member, shown as a quiet label beside the name. */
function relationOf(profile) {
  const relation = profile.connection;
  if (!relation) return null;
  if (relation.status === 'ACCEPTED') return { key: 'connected', label: 'Đã kết nối', icon: UserCheck };
  if (relation.requester_id === profile.account_id) return { key: 'incoming', label: 'Muốn kết nối với bạn', icon: UserPlus };
  return { key: 'sent', label: 'Đã gửi lời mời', icon: Clock3 };
}

const ITEM_ICONS = { PROJECT: FolderGit2, EXPERIENCE: Briefcase, CERTIFICATE: Award };

/** "Minh, An và 1 người khác" for the endorsers of one item. */
function endorsersText(item) {
  const names = (item.endorsers || []).map((p) => p.full_name);
  const rest = (item.endorsement_count || 0) - names.length;
  return rest > 0 ? `${names.join(', ')} và ${rest} người khác` : names.join(', ');
}

/** Peer endorsement row under a shared project: count, who, and the viewer's toggle when they are connected. */
function Endorsement({ item, busy, onToggle }) {
  if (!item.endorsement_count && !item.can_endorse) return null;
  return <div className="network-endorse">
    {item.endorsement_count > 0 && <span className="network-endorse__count" title={endorsersText(item)}><BadgeCheck size={15} aria-hidden="true" />{item.endorsement_count} người đã kết nối xác nhận</span>}
    {item.can_endorse && <button type="button" className="network-text-btn" aria-pressed={item.endorsed} disabled={busy} onClick={() => onToggle(item)}>
      {item.endorsed ? 'Bỏ xác nhận' : 'Xác nhận dự án này'}
    </button>}
  </div>;
}

const CONTRIBUTION_ROWS = [
  ['accepted_answers', 'lời giải được chọn'],
  ['helpful_feedback', 'góp ý dự án hữu ích'],
  ['mentor_sessions', 'buổi mentor hoàn thành'],
  ['challenges', 'thử thách đã tham gia'],
  ['challenge_highlights', 'bài thử thách nổi bật'],
];

function Contributions({ data }) {
  if (!data) return null;
  const rows = CONTRIBUTION_ROWS.filter(([key]) => data[key] > 0);
  return <Panel title="Đóng góp cho cộng đồng" icon={Award}>
    <p className="network-points"><strong>{data.points}</strong><span>điểm đóng góp</span></p>
    {rows.length ? <ul className="network-contrib">{rows.map(([key, label]) => <li key={key}><strong>{data[key]}</strong> {label}</li>)}</ul>
      : <p className="network-muted">Chưa có đóng góp được ghi nhận.</p>}
    <p className="network-muted">Tính từ lời giải được chọn, góp ý hữu ích, buổi mentor được đánh giá và thử thách tuần.</p>
  </Panel>;
}

function ProfileContent({ profile, reload }) {
  const navigate = useNavigate();
  const { hash } = useLocation();
  useEffect(() => {
    if (/^#project-\d+$/.test(hash)) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash, profile.account_id]);
  const [params] = useSearchParams();
  const [learn, setLearn] = useState(params.has('learn'));
  const [busy, setBusy] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [before, setBefore] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const { toast, showToast } = useToast();
  const posts = useNetworkQuery(`/posts?author=${profile.account_id}&before=${before}`);
  const mine = useNetworkQuery('/me');
  const act = async (fn, message) => {
    if (busy) return false;
    setBusy(true);
    try { await fn(); if (message) showToast(message); reload(); refreshNetworkSummary(); return true; }
    catch (err) { showToast(err.message, 'error'); return false; }
    finally { setBusy(false); }
  };
  const run = (path, body, method, message) => act(() => api.send(`/people/${profile.account_id}/${path}`, body, method), message);
  const openChat = () => act(async () => { const t = await api.send(`/people/${profile.account_id}/threads`); navigate(`/network/messages/${t.id}`); });
  const relation = relationOf(profile);
  const skills = profile.items.filter((i) => i.kind === 'SKILL');
  const RelationIcon = relation?.icon;
  const endorse = (item) => act(() => api.send(`/people/${profile.account_id}/endorsements/${item.kind}/${item.id}`, { enabled: !item.endorsed }, 'PUT'),
    item.endorsed ? 'Đã bỏ xác nhận.' : `Đã xác nhận “${item.title}”.`);
  const canEndorse = skills.some((s) => s.can_endorse);

  // One filled action per state; everything else is secondary or lives in the ⋯ menu.
  const actions = profile.mine ? <>
    <Link className="ui-btn ui-btn--secondary" to="/network/settings"><Settings size={16} aria-hidden="true" />Chỉnh quyền chia sẻ</Link>
    <Link className="ui-btn ui-btn--secondary" to={`/network/messages?profile=${profile.account_id}`}><Share2 size={16} aria-hidden="true" />Chia sẻ hồ sơ</Link>
  </> : <>
    {relation?.key === 'incoming' && <>
      <Button icon={Check} disabled={busy} onClick={() => run('connections/accept', undefined, 'POST', 'Hai bạn đã kết nối.')}>Chấp nhận kết nối</Button>
      <Button variant="secondary" icon={X} disabled={busy} onClick={() => run('connections/remove', undefined, 'POST', 'Đã từ chối lời mời.')}>Từ chối</Button>
    </>}
    {!relation && <Button icon={UserPlus} disabled={busy} onClick={() => run('connections/request', undefined, 'POST', 'Đã gửi lời mời kết nối.')}>Kết nối</Button>}
    <Button variant={relation?.key === 'connected' ? 'primary' : 'secondary'} icon={MessageSquare} disabled={busy} onClick={openChat}>Nhắn tin</Button>
    {profile.allow_compare && <Button variant="secondary" icon={Sparkles} onClick={() => setLearn(!learn)}>{learn ? 'Đóng phân tích' : 'Học từ hồ sơ này'}</Button>}
    <MoreMenu label="Thêm thao tác với hồ sơ" items={[
      { label: profile.following ? 'Bỏ theo dõi' : 'Theo dõi bài viết', icon: profile.following ? BellOff : Bell, onClick: () => run('follow', { enabled: !profile.following }, 'PUT', profile.following ? 'Đã bỏ theo dõi.' : 'Bạn đang theo dõi hồ sơ này.') },
      { label: 'Hủy lời mời kết nối', icon: X, onClick: () => run('connections/remove', undefined, 'POST', 'Đã hủy lời mời kết nối.'), hidden: relation?.key !== 'sent' },
      { label: 'Hủy kết nối', icon: UserMinus, onClick: () => setConfirmDisconnect(true), hidden: relation?.key !== 'connected', tone: 'danger' },
      { label: 'Báo cáo hồ sơ', icon: Flag, onClick: () => setReporting(true) },
      { label: 'Chặn người dùng', icon: Ban, onClick: () => setConfirmBlock(true), tone: 'danger' },
    ]} />
  </>;

  return <>
    <Toast toast={toast} />
    <Card className="network-profile-card"><div className="network-profile">
      <div className="network-profile__cover" aria-hidden="true" />
      <div className="network-profile__body">
        <Avatar src={profile.avatar_url ? getFullAvatarUrl(profile.avatar_url) : null} name={profile.full_name || 'L'} size={96} className="network-profile__avatar" />
        <div className="network-profile__top">
          <div className="network-profile__id">
            <h2>{profile.full_name}</h2>
            <p className="network-profile__role">{profile.current_title || 'Thành viên LemoNetwork'}</p>
            <p className="network-profile__handle">
              <span>@{profile.handle}</span>
              {relation && <span className={`network-profile__relation is-${relation.key}`}><RelationIcon size={13} aria-hidden="true" />{relation.label}</span>}
              {profile.following && !profile.mine && <span className="network-profile__relation"><Bell size={13} aria-hidden="true" />Đang theo dõi</span>}
            </p>
          </div>
          <div className="network-profile__actions">{actions}</div>
        </div>
        {profile.bio && <p className="network-profile__bio">{profile.bio}</p>}
        {profile.goal && <p className="network-profile__goal"><Target size={15} aria-hidden="true" /><span>Đang hướng tới <strong>{profile.goal}</strong></span></p>}
        {(profile.available_to_help || profile.topics) && <div className="network-profile__chips">
          {profile.available_to_help && <span className="network-pill">Sẵn sàng hỗ trợ</span>}
          <Tags text={profile.topics} />
        </div>}
        {reporting && <ReportForm kind="PROFILE" targetId={profile.account_id} onClose={() => setReporting(false)} />}
      </div>
    </div></Card>
    {!profile.mine && mine.data && !mine.data.published && <div className="ui-callout">
      <span>Bạn có thể xem hồ sơ. Để tương tác hoặc học từ hồ sơ, hãy <Link className="network-link" to="/network/settings">bật hồ sơ cộng đồng của bạn</Link>.</span>
    </div>}
    {learn && !profile.mine && profile.allow_compare && <LearnFromProfile profile={profile} />}
    <div className="network-columns"><div className="network-stack">
      {profile.featured_cv ? <Panel title="CV" icon={FileIcon}>
        <div className="network-cv-card">
          <span className="network-cv-card__icon" aria-hidden="true"><FileIcon size={20} /></span>
          <div>
            <strong>{profile.featured_cv.name}</strong>
            <span>{cvTargetLabel(profile.featured_cv.target_mode)} · Cập nhật {new Date(profile.featured_cv.updated_at).toLocaleDateString('vi-VN')}</span>
          </div>
          <Link className="ui-btn ui-btn--secondary ui-btn--sm ui-btn--has-trail" to={`/network/cv/${profile.featured_cv.id}`}>
            <span>Xem CV</span><span className="ui-btn__trail"><ArrowRight size={14} aria-hidden="true" /></span>
          </Link>
        </div>
      </Panel> : profile.mine && <Panel title="CV" icon={FileIcon}>
        <p className="network-muted">Chưa hiển thị CV nào. Chọn một CV công khai để thành viên khác xem được.</p>
        <Link className="network-link" to="/network/settings">Chọn CV hiển thị <ArrowRight size={14} aria-hidden="true" /></Link>
      </Panel>}
      {skills.length > 0 && <Panel title="Kỹ năng" icon={Layers} count={skills.length}>
        <ul className="network-skill-chips">{skills.map((s) => <li key={s.id} id={`skill-${s.id}`}>
          {s.can_endorse ? <button type="button" className={`network-skill-chip${s.endorsed ? ' is-endorsed' : ''}`} aria-pressed={s.endorsed} disabled={busy}
            title={s.endorsed ? 'Bỏ xác nhận kỹ năng này' : 'Xác nhận kỹ năng này'} onClick={() => endorse(s)}>
            {s.endorsed && <Check size={13} aria-hidden="true" />}{s.title}{s.endorsement_count > 0 && <span>{s.endorsement_count}</span>}
          </button> : <span className="network-skill-chip" title={s.endorsement_count ? `Xác nhận bởi ${endorsersText(s)}` : undefined}>
            {s.title}{s.endorsement_count > 0 && <span>{s.endorsement_count}</span>}
          </span>}
        </li>)}</ul>
        <p className="network-muted network-skill-note">Kỹ năng do thành viên tự khai báo. Số bên cạnh là người đã kết nối xác nhận, không phải xác minh của hệ thống.{canEndorse ? ' Chọn một kỹ năng để xác nhận.' : ''}</p>
      </Panel>}
      {Object.entries(itemLabels).filter(([kind]) => kind !== 'SKILL').map(([kind, title]) => {
        const items = profile.items.filter((i) => i.kind === kind);
        return items.length > 0 && <Panel key={kind} title={title} icon={ITEM_ICONS[kind]} count={items.length}>
          <ul className="network-items">{items.map((item) => <li className="network-profile-item" key={item.id} id={`${kind.toLowerCase()}-${item.id}`}>
            <div className="network-profile-item__head"><h3>{item.title}</h3><span className={`network-evidence${item.evidence === 'LINKED_ARTIFACT' ? ' is-linked' : ''}`}>{item.evidence === 'LINKED_ARTIFACT' ? 'Có liên kết minh chứng' : 'Tự khai báo'}</span></div>
            {(item.company_name || item.issued_by) && <p className="network-muted">{item.company_name || item.issued_by}</p>}
            {item.description && <p className="network-text">{item.description}</p>}
            {item.technologies?.length > 0 && <ul className="network-tech">{item.technologies.map((t) => <li key={t}>{t}</li>)}</ul>}
            {(item.url || item.github_url || kind === 'PROJECT') && <div className="network-actions">
              <ExternalLink href={item.url}>Xem minh chứng</ExternalLink>
              <ExternalLink href={item.github_url}>Mã nguồn</ExternalLink>
              {kind === 'PROJECT' && <Link className="network-link" to={`/network/messages?profile=${profile.account_id}&project=${item.id}`}>Chia sẻ dự án <ArrowRight size={14} aria-hidden="true" /></Link>}
            </div>}
            {kind === 'PROJECT' && <Endorsement item={item} busy={busy} onToggle={endorse} />}
          </li>)}</ul>
        </Panel>;
      })}
      {!profile.items.length && <Card><EmptyState icon={FileText} title="Chưa chia sẻ chi tiết hồ sơ" hint="Thành viên chưa chọn công khai kỹ năng, dự án hay kinh nghiệm nào." /></Card>}
      <h2 className="network-section-title">Bài viết và hành trình</h2>
      <QueryState query={posts} rows={1} />
      {posts.data?.items.map((post) => <PostCard key={post.id} post={post} onChanged={posts.reload} />)}
      {posts.data?.items.length === 0 && <p className="network-muted network-empty-line">Chưa có bài viết được chia sẻ.</p>}
      <div className="network-more">
        {before > 0 && <Button variant="ghost" onClick={() => setBefore(0)}>Về bài mới nhất</Button>}
        {posts.data?.nextCursor && <Button variant="secondary" onClick={() => setBefore(posts.data.nextCursor)}>Bài cũ hơn</Button>}
      </div>
    </div><aside className="network-stack">
      {profile.available_to_help && <Panel title={profile.mine ? 'Bạn đang nhận hỗ trợ' : 'Sẵn sàng hỗ trợ'} icon={HandHelping}>
        <p className="network-mentor-stats"><Star size={14} aria-hidden="true" />{mentorStatsText({ sessions: profile.contributions?.mentor_sessions, rating: profile.contributions?.mentor_rating })}</p>
        {profile.mentor_topics && <ul className="network-tech">{profile.mentor_topics.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8).map((t) => <li key={t}>{t}</li>)}</ul>}
        {profile.mine ? <Link className="network-link" to="/network/mentors?tab=sessions">Xem yêu cầu hỗ trợ <ArrowRight size={14} aria-hidden="true" /></Link>
          : profile.mentor_request ? <Link className="network-link" to="/network/mentors?tab=sessions">{profile.mentor_request.status === 'ACCEPTED' ? 'Đã hẹn lịch · Xem chi tiết' : 'Đã gửi yêu cầu · Xem chi tiết'} <ArrowRight size={14} aria-hidden="true" /></Link>
            : <div><Button size="sm" icon={HandHelping} onClick={() => setRequesting(true)}>Nhờ hỗ trợ</Button></div>}
      </Panel>}
      <Contributions data={profile.contributions} />
      <Panel title="Lộ trình của bạn" icon={MapIcon}>
        <p className="network-muted">Dùng hồ sơ làm nguồn tham khảo. Chọn kỹ năng và dự án phù hợp với mục tiêu, thời gian và nền tảng của bạn.</p>
        <Link className="network-link" to="/career-roadmap">Lộ trình của tôi <ArrowRight size={14} aria-hidden="true" /></Link>
      </Panel>
    </aside></div>
    {requesting && <MentorRequestModal mentor={profile} onClose={() => setRequesting(false)}
      onSent={() => { setRequesting(false); showToast(`Đã gửi yêu cầu tới ${profile.full_name}.`); reload(); }} />}
    <ConfirmActionModal isOpen={confirmDisconnect} title="Hủy kết nối" icon={UserMinus} confirmLabel="Hủy kết nối" message="Hai bạn sẽ không còn trong mạng lưới của nhau. Cuộc trò chuyện hiện có vẫn được giữ lại." isSubmitting={busy}
      onCancel={() => setConfirmDisconnect(false)} onConfirm={async () => { await run('connections/remove', undefined, 'POST', 'Đã hủy kết nối.'); setConfirmDisconnect(false); }} />
    <ConfirmActionModal isOpen={confirmBlock} title="Chặn người dùng" icon={Ban} message="Hai bạn sẽ không thể xem nội dung, kết nối hoặc nhắn tin cho nhau. Bạn có thể bỏ chặn trong Quyền riêng tư." confirmLabel="Chặn" isSubmitting={busy}
      onCancel={() => setConfirmBlock(false)} onConfirm={() => act(async () => { await api.send(`/people/${profile.account_id}/block`, { enabled: true }, 'PUT'); navigate('/network'); })} />
  </>;
}

export default function NetworkProfilePage() {
  const { handle } = useParams();
  const query = useNetworkQuery(`/profiles/${encodeURIComponent(handle)}`);
  return <NetworkLayout title="Hồ sơ thành viên" description="Hồ sơ được thành viên chia sẻ trong LemoNetwork."><QueryState query={query} />{query.data && <ProfileContent key={handle} profile={query.data} reload={query.reload} />}</NetworkLayout>;
}
