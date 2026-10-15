import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Eye, Save, ArrowRight, Ban, FileText } from 'lucide-react';
import { Button, TextField, TextareaField, Switch, FormAlert } from '@/components/ui';
import { networkService as api } from '@/services/networkService';
import { NetworkLayout, QueryState, Panel } from './NetworkShared';
import { useNetworkQuery, itemLabels, cvTargetLabel } from './networkUtils';

/**
 * Which CV (if any) appears on the community profile. Only CVs that are public, without a share password and not
 * expired can be picked; the others are listed with the reason so the member knows what to change.
 */
function CvSharing() {
  const query = useNetworkQuery('/me/cvs');
  const [choice, setChoice] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState({});
  const saved = query.data?.featured_cv_id ?? null;
  const value = choice === undefined ? saved : choice;
  const save = async () => {
    setBusy(true); setState({});
    try { await api.send('/me/featured-cv', { cvId: value }, 'PUT'); setState({ ok: value ? 'Đã hiển thị CV trên hồ sơ cộng đồng.' : 'Đã gỡ CV khỏi hồ sơ cộng đồng.' }); setChoice(undefined); query.reload(); }
    catch (err) { setState({ error: err.message }); } finally { setBusy(false); }
  };
  return <Panel title="CV trên hồ sơ" icon={FileText}>
    <p className="network-muted">Thành viên LemoNetwork xem được toàn bộ nội dung CV bạn chọn, kể cả thông tin liên hệ trong CV. Bạn cũng có thể gửi CV riêng cho một người trong tin nhắn.</p>
    <QueryState query={query} rows={1} />
    {query.data && <>
      <div className="network-cv-options" role="radiogroup" aria-label="CV hiển thị trên hồ sơ">
        <label className="ui-check"><input type="radio" name="featured-cv" checked={value === null} onChange={() => setChoice(null)} disabled={busy} /><span>Không hiển thị CV</span></label>
        {query.data.cvs.map((cv) => <label key={cv.id} className={`ui-check${cv.shareable ? '' : ' is-disabled'}`}>
          <input type="radio" name="featured-cv" checked={value === cv.id} disabled={busy || !cv.shareable} onChange={() => setChoice(cv.id)} />
          <span>{cv.name}<small>{cv.shareable ? `${cvTargetLabel(cv.target_mode)} · Cập nhật ${new Date(cv.updated_at).toLocaleDateString('vi-VN')}` : `${cv.reason} · chưa chia sẻ được`}</small></span>
        </label>)}
      </div>
      {!query.data.cvs.some((cv) => cv.shareable) && <p className="network-muted">Chuyển một CV sang chế độ <strong>Công khai</strong> (không đặt mật khẩu) trong trang CV của tôi để chia sẻ.</p>}
      <FormAlert>{state.error}</FormAlert>
      <FormAlert tone="success">{state.ok}</FormAlert>
      <div className="network-actions">
        <Button size="sm" icon={Save} loading={busy} disabled={value === saved} onClick={save}>Lưu lựa chọn</Button>
        <Link className="network-link" to="/my-cv">CV của tôi <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
    </>}
  </Panel>;
}

/** One setting row: title + explanation on the left, a switch on the right. */
function SwitchRow({ title, hint, checked, onChange, disabled }) {
  return <div className="network-switch-row">
    <div><strong>{title}</strong>{hint && <small>{hint}</small>}</div>
    <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
  </div>;
}

function SettingsForm({ data, onSaved }) {
  const [form, setForm] = useState({ handle: data.handle, published: data.published, bio: data.bio, topics: data.topics, showGoals: data.show_goals, allowCompare: data.allow_compare, allowRequests: data.allow_requests, availableToHelp: data.available_to_help, mentorTopics: data.mentor_topics || '', autoShareMilestones: !!data.auto_share_milestones, shared: data.shared.map((i) => ({ kind: i.kind, itemId: i.item_id })) });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const blocks = useNetworkQuery('/blocks');
  const field = (name) => ({ value: form[name] || '', onChange: (e) => setForm({ ...form, [name]: e.target.value }) });
  const toggle = (name) => ({ checked: !!form[name], onChange: (value) => setForm({ ...form, [name]: value }) });
  const isShared = (kind, id) => form.shared.some((s) => s.kind === kind && s.itemId === id);
  const setShared = (kind, id, on) => setForm({ ...form, shared: on ? [...form.shared, { kind, itemId: id }] : form.shared.filter((s) => !(s.kind === kind && s.itemId === id)) });
  const unblock = async (person) => {
    setBusy(true); setError('');
    try { await api.send(`/people/${person.blocked_id}/block`, { enabled: false }, 'PUT'); blocks.reload(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return <div className="network-columns">
    <form onSubmit={async (e) => { e.preventDefault(); if (busy) return; setBusy(true); setNotice(''); setError(''); try { await api.send('/me', form, 'PUT'); setNotice('Đã lưu quyền chia sẻ.'); onSaved(); } catch (err) { setError(err.message); } finally { setBusy(false); } }}>
      <Panel title="Thông tin được chia sẻ" icon={ShieldCheck}>
        <p className="network-muted">Hồ sơ cộng đồng sử dụng dữ liệu hồ sơ của bạn và cập nhật khi bạn chỉnh sửa. Chỉ những mục được chọn bên dưới mới hiển thị với thành viên LemoNetwork.</p>
        {data.suspended && <FormAlert>Hồ sơ cộng đồng đang bị tạm ẩn bởi quản trị viên.</FormAlert>}
        <fieldset className="network-form" disabled={busy}>
          <div className="network-switch-group network-switch-group--primary">
            <SwitchRow title="Bật hồ sơ cộng đồng" hint="Cho phép thành viên tìm thấy hồ sơ và bài viết của bạn." {...toggle('published')} disabled={busy} />
          </div>
          <TextField label="Đường dẫn hồ sơ" required minLength={3} maxLength={40} pattern="[a-z0-9][a-z0-9_-]{2,39}" hint={`/u/${form.handle} · Chữ thường, số, dấu gạch ngang hoặc gạch dưới.`} {...field('handle')} />
          <TextareaField label="Giới thiệu" maxLength={600} rows={3} placeholder="Bạn đang học gì và muốn chia sẻ điều gì?" {...field('bio')} />
          <TextField label="Chủ đề quan tâm" hint="Cách nhau bằng dấu phẩy." maxLength={300} placeholder="Backend, Java, Thiết kế sản phẩm" {...field('topics')} />
          <div className="network-switch-group">
            <SwitchRow title="Chia sẻ mục tiêu nghề nghiệp ngắn hạn" {...toggle('showGoals')} disabled={busy} />
            <SwitchRow title="Tôi sẵn sàng hỗ trợ người cùng học" hint="Bạn xuất hiện trong mục Mentor và có thể nhận yêu cầu hỗ trợ, hẹn lịch trao đổi." {...toggle('availableToHelp')} disabled={busy} />
            <SwitchRow title="Nhận yêu cầu nhắn tin từ người chưa kết nối" {...toggle('allowRequests')} disabled={busy} />
            <SwitchRow title="Tự chia sẻ khi hoàn thành một tuần trong lộ trình" hint="Đăng một bài Cột mốc lên bảng tin và báo cho bạn đồng hành. Không kèm ghi chú riêng." {...toggle('autoShareMilestones')} disabled={busy} />
            <SwitchRow title="Cho phép “Học từ hồ sơ này”" hint="Các mục công khai được gửi đến AI để phân tích tham khảo. Bạn có thể tắt bất cứ lúc nào." {...toggle('allowCompare')} disabled={busy} />
          </div>
          {form.availableToHelp && <TextField label="Chủ đề bạn có thể hỗ trợ" hint="Cách nhau bằng dấu phẩy. Người học tìm mentor theo các chủ đề này." maxLength={300} placeholder="Java, Spring Boot, Phỏng vấn Backend" {...field('mentorTopics')} />}
          <div>
            <h3 className="network-subtitle">Chọn từng mục được công khai</h3>
            <p className="network-muted">Thông tin liên hệ, địa chỉ, ngày sinh, CV và ghi chú riêng tư không được đưa vào hồ sơ cộng đồng.</p>
          </div>
          {Object.entries(itemLabels).map(([kind, title]) => {
            const items = data.items.filter((i) => i.kind === kind);
            return <section className="network-share-section" key={kind}><h4>{title}<span className="ui-tabs__count">{items.filter((i) => isShared(kind, i.id)).length}/{items.length}</span></h4>
              {items.length ? <ul>{items.map((item) => <li key={item.id}><label className="ui-check">
                <input type="checkbox" checked={isShared(kind, item.id)} onChange={(e) => setShared(kind, item.id, e.target.checked)} />
                <span>{item.title}<small>{item.evidence === 'LINKED_ARTIFACT' ? 'Có liên kết minh chứng · Chưa xác minh' : 'Tự khai báo'}</small></span>
              </label></li>)}</ul>
                : <p className="network-muted">Chưa có dữ liệu. <Link className="network-link" to="/profile">Bổ sung vào hồ sơ</Link></p>}
            </section>;
          })}
          <FormAlert>{error}</FormAlert>
          <FormAlert tone="success">{notice}</FormAlert>
          <div><Button type="submit" icon={Save} loading={busy}>Lưu quyền chia sẻ</Button></div>
        </fieldset>
      </Panel>
    </form>
    <aside className="network-stack">
      <CvSharing />
      <Panel title="Hồ sơ công khai" icon={Eye}>
        <p className="network-muted">Họ tên, ảnh đại diện và chức danh hiện tại hiển thị khi bạn bật hồ sơ. Những thông tin khác do bạn chọn.</p>
        {data.published && <Link className="network-link" to={`/u/${data.handle}`}>Xem hồ sơ cộng đồng <ArrowRight size={14} aria-hidden="true" /></Link>}
      </Panel>
      <Panel title="Người đã chặn" icon={Ban}>
        <QueryState query={blocks} rows={1} />
        {blocks.data?.length === 0 && <p className="network-muted">Chưa có người dùng bị chặn.</p>}
        {blocks.data?.length > 0 && <ul className="network-blocked">{blocks.data.map((person) => <li key={person.blocked_id}><span>{person.full_name}</span>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => unblock(person)}>Bỏ chặn</Button></li>)}</ul>}
      </Panel>
    </aside>
  </div>;
}

export default function NetworkSettingsPage() {
  const query = useNetworkQuery('/me');
  return <NetworkLayout title="Hồ sơ và quyền riêng tư" description="Chọn thông tin được chia sẻ và cách thành viên khác liên hệ với bạn."><QueryState query={query} />{query.data && <SettingsForm data={query.data} onSaved={query.reload} />}</NetworkLayout>;
}
