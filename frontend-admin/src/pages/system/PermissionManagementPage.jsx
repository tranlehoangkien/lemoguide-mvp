import { useMemo, useState } from 'react';
import { ShieldCheck, KeyRound, RefreshCw, RotateCcw, Users } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Page, PageHeader, Toolbar, ToolbarGroup, SearchBox, FilterSelect, Card, EmptyState, Button, IconButton, Badge, Avatar, FormModal, FormAlert, Toast, useToast } from '@/components/ui';
import { getFullAvatarUrl } from '@/services/apiClient';
import { adminConsole, useAdminQuery, formatDateTime } from '@/services/adminConsoleService';
import { loadPermissions } from '@/services/adminPermissions';
import '../reports/AdminConsole.css';

const STATUS = { active: { label: 'Đang hoạt động', tone: 'success' }, inactive: { label: 'Tạm khóa' }, banned: { label: 'Bị cấm', tone: 'danger' } };

function EditPermissions({ admin, catalog, onClose, onSaved }) {
  const [selected, setSelected] = useState(() => new Set(admin.permissions));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toggle = (key) => setSelected((s) => { const next = new Set(s); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  return <FormModal open title="Phân quyền quản trị viên" description={`${admin.full_name || admin.email} · chọn các phân hệ được phép sử dụng`}
    submitLabel="Lưu phân quyền" isSubmitting={busy} onClose={onClose}
    onSubmit={async (e) => {
      e.preventDefault();
      if (!selected.size) { setError('Hãy chọn ít nhất một phân hệ. Muốn chặn truy cập hoàn toàn, hãy khóa tài khoản ở Quản lý Quản trị viên.'); return; }
      setBusy(true); setError('');
      try { await adminConsole.put(`/permissions/${admin.id}`, { permissions: [...selected] }); onSaved(); }
      catch (err) { setError(err.message || 'Không lưu được phân quyền'); }
      finally { setBusy(false); }
    }}>
    <div className="ac-perm-list">{catalog.map((p) => {
      const locked = admin.me && p.key === 'SYSTEM';
      return <label key={p.key} className="ac-perm">
        <input type="checkbox" checked={selected.has(p.key)} disabled={busy || locked} onChange={() => toggle(p.key)} />
        <span><strong>{p.label}</strong><small>{locked ? 'Bạn không thể tự gỡ quyền này của chính mình.' : p.description}</small></span>
      </label>;
    })}</div>
    <FormAlert>{error}</FormAlert>
  </FormModal>;
}

/**
 * "Quản lý Vai trò & Phân quyền": every ADMIN account with the console modules it may use. Enforced by the backend
 * (AdminAccessInterceptor) on /api/admin/**; the menu hides modules an admin cannot open.
 */
export default function PermissionManagementPage() {
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [editing, setEditing] = useState(null);
  const { toast, showToast } = useToast();
  const { data, loading, reload } = useAdminQuery('/permissions', {}, (m) => showToast(m, 'error'));
  const catalog = data?.catalog || [];
  const labels = Object.fromEntries(catalog.map((p) => [p.key, p.label]));
  const admins = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.admins || []).filter((a) => (!q || `${a.full_name || ''} ${a.email}`.toLowerCase().includes(q)) && (!module || a.permissions.includes(module)));
  }, [data, search, module]);
  const fullAccess = (data?.admins || []).filter((a) => a.permissions.length === catalog.length).length;

  return <AdminLayout>
    <Toast toast={toast} />
    <Page fill>
      <PageHeader title="Quản lý Vai trò & Phân quyền" description={`Quyết định mỗi quản trị viên được dùng những phân hệ nào. ${fullAccess}/${data?.admins?.length || 0} quản trị viên đang có toàn quyền.`} />
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm theo tên hoặc email quản trị viên..." />
        <ToolbarGroup>
          <FilterSelect label="Có quyền" value={module} onChange={setModule}>
            <option value="">Tất cả phân hệ</option>
            {catalog.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </FilterSelect>
          <Button variant="secondary" icon={RotateCcw} onClick={() => { setSearch(''); setModule(''); }}>Đặt lại</Button>
          <Button variant="secondary" icon={RefreshCw} onClick={reload} disabled={loading}>Tải lại</Button>
        </ToolbarGroup>
      </Toolbar>
      <Card fill>
        <div className="ui-table-scroll" aria-busy={loading}>
          {!admins.length ? <EmptyState icon={Users} title={loading ? 'Đang tải dữ liệu...' : 'Không có quản trị viên phù hợp.'} />
            : <table className="ui-table ui-table--stack">
              <thead><tr><th>Quản trị viên</th><th>Trạng thái</th><th>Phân hệ được phép</th><th>Đăng nhập gần nhất</th><th className="is-actions">Thao tác</th></tr></thead>
              <tbody>{admins.map((a) => { const s = STATUS[a.status] || { label: a.status }; const all = a.permissions.length === catalog.length; return <tr key={a.id}>
                <td data-label="Quản trị viên"><div className="ui-person">
                  <Avatar src={a.avatar_url ? getFullAvatarUrl(a.avatar_url) : null} name={a.full_name || a.email} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div className="ui-cell-title">{a.full_name || 'Chưa đặt tên'} {a.me && <Badge tone="info">Bạn</Badge>}</div>
                    <div className="ui-person__sub">{a.email}</div>
                  </div>
                </div></td>
                <td data-label="Trạng thái"><Badge tone={s.tone}>{s.label}</Badge></td>
                <td data-label="Phân hệ">{all ? <Badge tone="success"><ShieldCheck size={12} aria-hidden="true" />Toàn quyền</Badge>
                  : <div className="ac-chips">{a.permissions.map((p) => <Badge key={p}>{labels[p] || p}</Badge>)}</div>}</td>
                <td className="is-muted" data-label="Đăng nhập gần nhất">{formatDateTime(a.last_login_at)}</td>
                <td className="is-actions"><div className="ui-row-actions">
                  <IconButton icon={KeyRound} label="Phân quyền" tone="info" onClick={() => setEditing(a)} />
                </div></td>
              </tr>; })}</tbody>
            </table>}
        </div>
      </Card>
    </Page>
    {editing && <EditPermissions admin={editing} catalog={catalog} onClose={() => setEditing(null)}
      onSaved={() => { showToast(`Đã cập nhật phân quyền cho ${editing.full_name || editing.email}`); setEditing(null); reload(); if (editing.me) loadPermissions(); }} />}
  </AdminLayout>;
}
