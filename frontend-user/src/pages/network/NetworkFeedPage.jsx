import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Heart, Bookmark, MessageCircle, Send, Plus, Sprout, Trash2, ArrowRight, X, ImagePlus, Pencil, CornerDownRight, ExternalLink as OpenIcon, Sparkles, Flag, Trophy, Bot, RefreshCw, Users, Hash } from 'lucide-react';
import { Button, Card, EmptyState, Segmented, TextField, TextareaField, SelectField } from '@/components/ui';
import ConfirmActionModal from '@/components/common/ConfirmActionModal';
import { networkService as api } from '@/services/networkService';
import { apiRequest, getFullAvatarUrl } from '@/services/apiClient';
import { useChat } from '@/context/ChatContext';
import { NetworkLayout, QueryState, Person, ExternalLink, Report, Tags, Panel, RichText, MoreMenu, ReportForm } from './NetworkShared';
import { useNetworkQuery, kindLabels, aspectLabels, dateLabel } from './networkUtils';

const FEED_MODES = [['recommended', 'Dành cho bạn'], ['all', 'Mới trong cộng đồng'], ['following', 'Đang theo dõi'], ['saved', 'Đã lưu']];
const MENTION_HINT = 'Gõ @tên-đường-dẫn để nhắc một thành viên, ví dụ @minh-anh.';

/** Picks an image, uploads it to /api/network/uploads and reports the stored URL; shows a removable preview. */
function ImagePicker({ value, onChange, disabled }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError('Ảnh tối đa 3MB.'); return; }
    setBusy(true); setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await apiRequest('/api/network/uploads', { method: 'POST', body });
      onChange(res.data.url);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div className="network-image-picker">
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => upload(e.target.files?.[0])} />
    {value ? <div className="network-image-picker__preview">
      <img src={getFullAvatarUrl(value)} alt="Ảnh đính kèm" />
      <button type="button" onClick={() => onChange('')} disabled={disabled} aria-label="Bỏ ảnh"><X size={14} aria-hidden="true" /></button>
    </div> : <Button type="button" variant="secondary" size="sm" icon={ImagePlus} loading={busy} disabled={disabled} onClick={() => input.current?.click()}>Thêm ảnh</Button>}
    {error && <p className="network-error" role="alert">{error}</p>}
  </div>;
}

function Composer({ settings, onPosted }) {
  const [open, setOpen] = useState(false);
  const { selectedModel } = useChat();
  const [form, setForm] = useState({ kind: 'KNOWLEDGE', content: '', tags: '', imageUrl: '', resourceUrl: '', projectId: '', taskId: '', aspects: [] });
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');
  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const withProject = form.kind === 'PROJECT' || form.kind === 'FEEDBACK';
  // AI proposes topics from the text; they are merged into what the author already typed, never replacing it.
  const suggestTags = async () => {
    if (suggesting || busy) return;
    if (form.content.trim().length < 20) { setError('Viết nội dung dài hơn một chút để AI gợi ý chủ đề.'); return; }
    setSuggesting(true); setError('');
    try {
      const tags = await api.send('/ai/tags', { content: form.content, modelId: selectedModel || null });
      setForm((f) => {
        const current = f.tags.split(',').map((t) => t.trim()).filter(Boolean);
        const merged = [...current, ...tags.filter((t) => !current.some((c) => c.toLowerCase() === t.toLowerCase()))];
        return { ...f, tags: merged.join(', ').slice(0, 300) };
      });
    } catch (err) { setError(err.message); } finally { setSuggesting(false); }
  };
  if (!settings) return null;
  if (!settings.published || settings.suspended) return <Card><div className="network-callout">
    <span className="network-callout__icon"><Sprout size={20} aria-hidden="true" /></span>
    <div><strong>Bắt đầu hành trình trong cộng đồng</strong><p>Chọn thông tin bạn muốn chia sẻ và bật hồ sơ cộng đồng để đăng bài, kết nối.</p></div>
    <Link className="ui-btn ui-btn--secondary ui-btn--sm" to="/network/settings">Thiết lập hồ sơ</Link>
  </div></Card>;
  const sharedProjects = settings.items.filter((i) => i.kind === 'PROJECT' && settings.shared.some((s) => s.kind === 'PROJECT' && s.item_id === i.id));
  return <Card><section className="network-panel">
    <button className="network-compose-trigger" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className="network-compose-trigger__icon"><Plus size={18} aria-hidden="true" /></span>Hôm nay bạn học được điều gì?
    </button>
    {open && <form className="network-form" onSubmit={async (e) => {
      e.preventDefault(); if (busy) return; setBusy(true); setError('');
      if (form.kind === 'FEEDBACK' && !form.aspects.length) { setError('Hãy chọn ít nhất một khía cạnh cần góp ý.'); setBusy(false); return; }
      const { aspects, ...body } = form;
      try { await api.send('/posts', { ...body, imageUrl: form.imageUrl || null, projectId: withProject ? Number(form.projectId) : null, taskId: form.kind === 'MILESTONE' ? Number(form.taskId) : null, feedbackAspects: form.kind === 'FEEDBACK' ? aspects.join(',') : null }); setForm({ ...form, content: '', tags: '', imageUrl: '', resourceUrl: '', aspects: [] }); setOpen(false); onPosted(); }
      catch (err) { setError(err.message); } finally { setBusy(false); }
    }}><fieldset disabled={busy}>
      <SelectField label="Loại bài viết" {...field('kind')}>{Object.entries(kindLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField>
      <TextareaField label="Nội dung" required rows={5} maxLength={6000} hint={MENTION_HINT} placeholder="Điều bạn đã thử, kết quả đạt được và bài học rút ra. Thêm dự án hoặc tài liệu để mọi người cùng thực hành…" {...field('content')} />
      {withProject && <SelectField label="Dự án đã chọn công khai" required hint={sharedProjects.length ? null : 'Chưa có dự án nào được công khai trong Hồ sơ và quyền riêng tư.'} {...field('projectId')}>
        <option value="">Chọn dự án</option>{sharedProjects.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
      </SelectField>}
      {form.kind === 'FEEDBACK' && <fieldset className="network-aspects">
        <legend className="ui-label">Bạn cần góp ý về</legend>
        <div>{Object.entries(aspectLabels).map(([key, label]) => <label key={key} className="ui-check">
          <input type="checkbox" checked={form.aspects.includes(key)} onChange={(e) => setForm({ ...form, aspects: e.target.checked ? [...form.aspects, key] : form.aspects.filter((a) => a !== key) })} />
          <span>{label}</span>
        </label>)}</div>
      </fieldset>}
      {form.kind === 'MILESTONE' && <SelectField label="Cột mốc đã hoàn thành" required hint="Bài đăng chia sẻ tiêu chí hoàn thành, không chia sẻ ghi chú riêng tư." {...field('taskId')}>
        <option value="">Chọn cột mốc</option>{settings.milestones.map((i) => <option key={i.id} value={i.id}>Tuần {i.week_number}: {i.title}</option>)}
      </SelectField>}
      <div className="network-tag-field">
        <TextField label="Chủ đề" hint="Cách nhau bằng dấu phẩy." maxLength={300} placeholder="Java, Backend, Kinh nghiệm học tập" {...field('tags')} />
        <Button type="button" variant="secondary" size="sm" icon={Sparkles} loading={suggesting} onClick={suggestTags}>Gợi ý bằng AI</Button>
      </div>
      <TextField label="Liên kết tài liệu" type="url" maxLength={500} placeholder="https://…" {...field('resourceUrl')} />
      <ImagePicker value={form.imageUrl} disabled={busy} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} />
      {error && <p className="network-error" role="alert">{error}</p>}
      <div className="network-form__foot">
        <p className="network-muted">Bài viết hiển thị trong cộng đồng khi hồ sơ của bạn đang công khai.</p>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
        <Button type="submit" loading={busy} icon={Send}>Đăng bài</Button>
      </div>
    </fieldset></form>}
  </section></Card>;
}

/** Inline editor for a post the viewer wrote: text, topics, link and image (kind and attachment stay). */
function PostEditor({ post, onDone, onCancel }) {
  const [form, setForm] = useState({ content: post.content, tags: post.tags || '', resourceUrl: post.resource_url || '', imageUrl: post.image_url || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  return <form className="network-form" onSubmit={async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { await api.send(`/posts/${post.id}`, { ...form, imageUrl: form.imageUrl || null, resourceUrl: form.resourceUrl || null }, 'PUT'); onDone(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }}><fieldset disabled={busy}>
    <TextareaField label="Nội dung" required rows={5} maxLength={6000} hint={MENTION_HINT} {...field('content')} />
    <TextField label="Chủ đề" maxLength={300} {...field('tags')} />
    <TextField label="Liên kết tài liệu" type="url" maxLength={500} {...field('resourceUrl')} />
    <ImagePicker value={form.imageUrl} disabled={busy} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} />
    {error && <p className="network-error" role="alert">{error}</p>}
    <div className="network-form__foot"><Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button><Button type="submit" loading={busy}>Lưu thay đổi</Button></div>
  </fieldset></form>;
}

/** Small textarea + send button used for new comments, replies and comment edits. */
function CommentBox({ id, initial = '', label, submitLabel = 'Gửi', onSubmit, onCancel, busy }) {
  const [content, setContent] = useState(initial);
  return <form className="network-comment-form" onSubmit={async (e) => { e.preventDefault(); if (await onSubmit(content)) setContent(''); }}>
    <label className="ui-sr-only" htmlFor={id}>{label}</label>
    <textarea id={id} className="ui-textarea" rows={2} required maxLength={2000} placeholder={`${label}…`} value={content} onChange={(e) => setContent(e.target.value)} autoFocus={!!onCancel} />
    <div className="network-comment-form__actions">
      {onCancel && <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Hủy</Button>}
      <Button type="submit" size="sm" loading={busy} icon={Send}>{submitLabel}</Button>
    </div>
  </form>;
}

function Comment({ post, comment, busy, act, onReply, reply = false }) {
  const [editing, setEditing] = useState(false);
  return <article className={`network-comment${reply ? ' network-comment--reply' : ''}`}>
    <div className="network-comment__head">
      <Person person={comment} subtitle={`${dateLabel(comment.created_at)}${comment.edited_at ? ' · đã chỉnh sửa' : ''}`} size={reply ? 30 : 36} />
      {comment.accepted && <span className="network-pill">Lời giải hữu ích</span>}
      {comment.helpful && <span className="network-pill">Góp ý hữu ích</span>}
    </div>
    {editing
      ? <CommentBox id={`edit-${comment.id}`} initial={comment.content} label="Sửa bình luận" submitLabel="Lưu" busy={busy} onCancel={() => setEditing(false)}
        onSubmit={async (content) => { const ok = await act(`/posts/${post.id}/comments/${comment.id}`, { content }, 'PUT'); if (ok) setEditing(false); return ok; }} />
      : <RichText text={comment.content} />}
    {!editing && <div className="network-actions network-comment__actions">
      <button type="button" className="network-text-btn" onClick={onReply}><CornerDownRight size={14} aria-hidden="true" />Trả lời</button>
      {!reply && post.mine && post.kind === 'FEEDBACK' && !comment.mine && <button type="button" className="network-text-btn" disabled={busy} onClick={() => act(`/posts/${post.id}/comments/${comment.id}/helpful`, { enabled: !comment.helpful }, 'PUT')}>{comment.helpful ? 'Bỏ đánh dấu hữu ích' : 'Đánh dấu hữu ích'}</button>}
      {!reply && post.mine && post.kind === 'QUESTION' && <button type="button" className="network-text-btn" disabled={busy} onClick={() => act(`/posts/${post.id}/comments/${comment.id}/accepted`, { enabled: !comment.accepted }, 'PUT')}>{comment.accepted ? 'Bỏ chọn lời giải' : 'Chọn lời giải'}</button>}
      {comment.mine && <button type="button" className="network-text-btn" onClick={() => setEditing(true)}>Sửa</button>}
      {comment.mine && <button type="button" className="network-text-btn" disabled={busy} onClick={() => act(`/posts/${post.id}/comments/${comment.id}`, undefined, 'DELETE')}>Xóa</button>}
      <Report kind="COMMENT" targetId={comment.id} />
    </div>}
  </article>;
}

/**
 * AI help on a post: a draft answer for an unanswered question and a summary of a long discussion. Both are cached
 * server-side and shown to every reader with an explicit AI label; the buttons only appear when a request makes sense.
 */
function AiAssist({ post }) {
  const { selectedModel } = useChat();
  const query = useNetworkQuery(`/posts/${post.id}/ai`);
  const [notes, setNotes] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const data = notes || query.data;
  const run = async (kind) => {
    if (busy) return; setBusy(kind); setError('');
    try { setNotes(await api.send(`/posts/${post.id}/ai/${kind}`, { modelId: selectedModel || null })); }
    catch (err) { setError(err.message); } finally { setBusy(''); }
  };
  if (!data || (!data.draft && !data.summary && !data.can_draft && !data.can_summarize)) return null;
  return <div className="network-ai">
    {data.draft && <section className="network-ai__note">
      <header><Bot size={16} aria-hidden="true" /><strong>Gợi ý nháp từ AI</strong></header>
      <p className="network-muted">Chưa được cộng đồng kiểm chứng. Hãy đối chiếu tài liệu chính thức trước khi áp dụng.</p>
      <p className="network-text">{data.draft.answer}</p>
      {data.draft.caveats && <p className="network-muted"><strong>Cần kiểm tra thêm:</strong> {data.draft.caveats}</p>}
    </section>}
    {data.summary && <section className="network-ai__note">
      <header><Bot size={16} aria-hidden="true" /><strong>Tóm tắt thảo luận bằng AI</strong><small>từ {data.summary.basis_count} bình luận</small></header>
      <p className="network-text">{data.summary.summary}</p>
      {data.summary.points?.length > 0 && <ul>{data.summary.points.map((p, i) => <li key={i}>{p}</li>)}</ul>}
      {data.summary.openQuestions?.length > 0 && <><h4>Còn bỏ ngỏ</h4><ul>{data.summary.openQuestions.map((p, i) => <li key={i}>{p}</li>)}</ul></>}
    </section>}
    <div className="network-actions">
      {!data.draft && data.can_draft && <Button size="sm" variant="secondary" icon={Sparkles} loading={busy === 'draft'} disabled={!!busy} onClick={() => run('draft')}>Nhờ AI gợi ý hướng giải</Button>}
      {data.can_summarize && (!data.summary || data.summary.stale) && <Button size="sm" variant="secondary" icon={data.summary ? RefreshCw : Sparkles} loading={busy === 'summary'} disabled={!!busy} onClick={() => run('summary')}>{data.summary ? 'Có bình luận mới · Cập nhật tóm tắt' : 'Tóm tắt thảo luận'}</Button>}
    </div>
    {error && <p className="network-error" role="alert">{error}</p>}
  </div>;
}

function Comments({ post, onChanged }) {
  const [before, setBefore] = useState(0);
  const query = useNetworkQuery(`/posts/${post.id}/comments?before=${before}`, 0, ['notification']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const act = async (path, body, method) => { if (busy) return false; setBusy(true); setError(''); try { await api.send(path, body, method); query.reload(); onChanged(); return true; } catch (err) { setError(err.message); return false; } finally { setBusy(false); } };
  return <div className="network-comments"><h3>Trao đổi</h3><AiAssist key={post.comment_count} post={post} /><QueryState query={query} rows={1} />
    {query.data?.items.map((c) => <div key={c.id} className="network-thread-group">
      <Comment post={post} comment={c} busy={busy} act={act} onReply={() => setReplyTo(c.id)} />
      {(c.replies?.length > 0 || replyTo === c.id) && <div className="network-replies">
        {c.replies.map((r) => <Comment key={r.id} post={post} comment={r} busy={busy} act={act} reply onReply={() => setReplyTo(c.id)} />)}
        {replyTo === c.id && <CommentBox id={`reply-${c.id}`} label={`Trả lời ${c.full_name}`} busy={busy} onCancel={() => setReplyTo(null)}
          onSubmit={async (content) => { const ok = await act(`/posts/${post.id}/comments`, { content, parentId: c.id }); if (ok) setReplyTo(null); return ok; }} />}
      </div>}
    </div>)}
    <div className="network-actions">
      {query.data?.nextCursor && <Button size="sm" variant="secondary" onClick={() => setBefore(query.data.nextCursor)}>Bình luận cũ hơn</Button>}
      {before > 0 && <Button size="sm" variant="ghost" onClick={() => setBefore(0)}>Bình luận mới nhất</Button>}
    </div>
    <CommentBox id={`comment-${post.id}`} label="Viết bình luận" busy={busy} onSubmit={async (content) => { const ok = await act(`/posts/${post.id}/comments`, { content }); if (ok) setBefore(0); return ok; }} />
    {error && <p className="network-error" role="alert">{error}</p>}
  </div>;
}

export function PostCard({ post, onChanged, expanded = false }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState(expanded);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);
  const act = async (fn) => { if (busy) return; setBusy(true); setError(''); try { await fn(); onChanged(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <Card className="network-post-card"><article className="network-panel network-post">
    <div className="network-post__head">
      <Person person={post.author} subtitle={`${dateLabel(post.created_at)}${post.edited_at ? ' · đã chỉnh sửa' : ''}`} />
      <div className="network-post__meta">
        <span className="network-kind">{kindLabels[post.kind]}</span>
        <MoreMenu label="Thao tác với bài viết" items={[
          { label: 'Mở bài viết', icon: OpenIcon, onClick: () => navigate(`/network/posts/${post.id}`), hidden: expanded },
          { label: 'Học từ hồ sơ tác giả', icon: Sparkles, onClick: () => navigate(`/u/${post.author.handle}?learn=1`), hidden: post.mine },
          { label: 'Sửa bài', icon: Pencil, onClick: () => setEditing(true), hidden: !post.mine || editing },
          { label: 'Xóa bài', icon: Trash2, onClick: () => setDeleting(true), tone: 'danger', hidden: !post.mine },
          { label: 'Báo cáo bài viết', icon: Flag, onClick: () => setReporting(true), hidden: post.mine },
        ]} />
      </div>
    </div>
    {post.feed_source === 'COMMUNITY' && !expanded && <small className="network-muted">Mới trong cộng đồng</small>}
    {editing ? <PostEditor post={post} onCancel={() => setEditing(false)} onDone={() => { setEditing(false); onChanged(); }} /> : <>
      <RichText text={post.content} />
      {post.image_url && <img className="network-post__image" src={getFullAvatarUrl(post.image_url)} alt="Hình ảnh được tác giả chia sẻ" loading="lazy" referrerPolicy="no-referrer" />}
      {post.project && <div className="network-attachment"><span>{post.kind === 'FEEDBACK' ? 'Dự án cần góp ý' : 'Dự án từ hồ sơ'}</span><h3><Link to={`/u/${post.author.handle}#project-${post.project.id}`}>{post.project.title}</Link></h3><p>{post.project.description}</p><div className="network-actions"><ExternalLink href={post.project.url}>Xem sản phẩm</ExternalLink><ExternalLink href={post.project.github_url}>Mã nguồn</ExternalLink></div>
        {post.feedback_aspects && <p className="network-aspect-list"><strong>Cần góp ý:</strong> {post.feedback_aspects.split(',').map((a) => aspectLabels[a] || a).join(', ')}</p>}
      </div>}
      {post.milestone && <div className="network-attachment"><span>Cột mốc tự ghi nhận · Tuần {post.milestone.week_number}</span><h3>{post.milestone.title}</h3><p>{post.milestone.success_criteria}</p></div>}
      <ExternalLink href={post.resource_url}>Tài liệu được chia sẻ</ExternalLink><Tags text={post.tags} />
    </>}
    <div className="network-post__bar">
      <button
        type="button"
        className={`network-post__like ${post.liked ? 'is-liked' : ''}`}
        aria-pressed={post.liked}
        disabled={busy}
        onClick={() => act(() => api.send(`/posts/${post.id}/reactions/LIKE`, { enabled: !post.liked }, 'PUT'))}
      >
        <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} aria-hidden="true" /> {post.likes} Hữu ích
      </button>
      <button type="button" aria-expanded={comments} onClick={() => setComments(!comments)}><MessageCircle size={16} aria-hidden="true" /> {post.comment_count} Bình luận</button>
      <button type="button" aria-pressed={post.saved} disabled={busy} onClick={() => act(() => api.send(`/posts/${post.id}/reactions/SAVE`, { enabled: !post.saved }, 'PUT'))}><Bookmark size={16} aria-hidden="true" /> {post.saved ? 'Đã lưu' : 'Lưu'}</button>
      <button type="button" onClick={() => navigate(`/network/messages?share=${post.id}`)}><Send size={16} aria-hidden="true" /> Chia sẻ</button>
    </div>
    {reporting && <ReportForm kind="POST" targetId={post.id} onClose={() => setReporting(false)} />}
    {error && <p role="alert" className="network-error">{error}</p>}
    {comments && <Comments post={post} onChanged={onChanged} />}
    <ConfirmActionModal isOpen={deleting} title="Xóa bài viết" icon={Trash2} message="Bài viết sẽ không còn hiển thị trong cộng đồng." confirmLabel="Xóa bài" isSubmitting={busy} onCancel={() => setDeleting(false)} onConfirm={() => act(async () => { await api.send(`/posts/${post.id}`, undefined, 'DELETE'); setDeleting(false); })} />
  </article></Card>;
}

export default function NetworkFeedPage() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') || 'recommended';
  const tag = params.get('tag') || '';
  const before = params.get('before') || '0';
  const query = useNetworkQuery(`/posts?mode=${encodeURIComponent(mode)}&tag=${encodeURIComponent(tag)}&before=${encodeURIComponent(before)}`);
  const mine = useNetworkQuery('/me');
  const people = useNetworkQuery('/people?mode=suggested');
  const challenges = useNetworkQuery('/challenges');
  const challenge = challenges.data?.open[0] || challenges.data?.upcoming[0];
  const empty = mode === 'following' ? 'Theo dõi người bạn quan tâm để thấy bài viết tại đây.' : mode === 'saved' ? 'Những bài bạn lưu sẽ xuất hiện tại đây.' : 'Chưa có bài viết phù hợp. Hãy chia sẻ điều bạn vừa học được.';
  return <NetworkLayout><div className="network-columns"><div className="network-stack">
    <Composer settings={mine.data} onPosted={query.reload} /><QueryState query={mine} rows={1} />
    <div className="network-toolbar">
      <Segmented label="Lọc bảng tin" value={mode} onChange={(key) => setParams({ mode: key, ...(tag ? { tag } : {}) })} options={FEED_MODES.map(([value, label]) => ({ value, label }))} />
      {tag && <button type="button" className="network-tag-filter" onClick={() => setParams({ mode })} aria-label={`Bỏ lọc chủ đề ${tag}`}>#{tag}<X size={14} aria-hidden="true" /></button>}
    </div>
    <QueryState query={query} rows={2} />
    {query.data?.items.map((post) => <PostCard key={post.id} post={post} onChanged={query.reload} />)}
    {query.data?.items.length === 0 && <Card><EmptyState icon={Sprout} title="Mỗi hành trình bắt đầu từ một chia sẻ" hint={empty}
      action={<Link className="ui-btn ui-btn--secondary" to="/network/discover">Khám phá cộng đồng</Link>} /></Card>}
    <div className="network-more">
      {before !== '0' && <Button variant="ghost" onClick={() => setParams({ mode, ...(tag ? { tag } : {}) })}>Về bài mới nhất</Button>}
      {query.data?.nextCursor && <Button variant="secondary" onClick={() => setParams({ mode, ...(tag ? { tag } : {}), before: query.data.nextCursor })}>Bài viết cũ hơn</Button>}
    </div>
  </div><aside className="network-stack">
    <Panel icon={Users} title="Gợi ý kết nối">
      <QueryState query={people} rows={1} />
      {people.data?.items.length > 0 && <ul className="network-suggestions">{people.data.items.slice(0, 5).map((person) => <li key={person.account_id}><Person person={person} size={38} />{person.available_to_help && <span className="network-pill">Sẵn sàng hỗ trợ</span>}</li>)}</ul>}
      {people.data?.items.length === 0 && <p className="network-muted">Hồ sơ được chia sẻ sẽ xuất hiện tại đây.</p>}
      <div className="network-actions">
        <Link className="network-link" to="/network/discover">Khám phá thêm <ArrowRight size={14} aria-hidden="true" /></Link>
        <Link className="network-link" to="/network/mentors">Tìm mentor <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
    </Panel>
    {challenge && <Panel title="Thử thách tuần" icon={Trophy}>
      <p className="network-challenge-teaser">{challenge.title}</p>
      <p className="network-muted">{challenge.state === 'OPEN' ? 'Đang diễn ra' : 'Sắp diễn ra'} · {challenge.entries} bài tham gia{challenge.joined ? ' · Bạn đã tham gia' : ''}</p>
      <Link className="network-link" to={`/network/challenges/${challenge.id}`}>{challenge.state === 'OPEN' && !challenge.joined ? 'Tham gia ngay' : 'Xem thử thách'} <ArrowRight size={14} aria-hidden="true" /></Link>
    </Panel>}
    <Panel icon={Hash} title="Chủ đề quan tâm">
      {mine.data?.topics ? <Tags text={mine.data.topics} /> : <p className="network-muted">Chưa chọn chủ đề nào.</p>}
      <Link className="network-link" to="/network/settings">Chọn chủ đề quan tâm <ArrowRight size={14} aria-hidden="true" /></Link>
    </Panel>
  </aside></div></NetworkLayout>;
}

export function NetworkPostPage() {
  const { id } = useParams();
  const query = useNetworkQuery(`/posts/${id}`);
  return <NetworkLayout title="Chi tiết bài viết" description="Bài viết và trao đổi trong cộng đồng LemoNetwork."><QueryState query={query} />{query.data && <PostCard post={query.data} onChanged={query.reload} expanded />}</NetworkLayout>;
}
