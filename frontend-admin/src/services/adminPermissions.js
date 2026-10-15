import { useEffect, useSyncExternalStore } from 'react';
import { apiRequest } from './apiClient';

/**
 * Module permissions of the signed-in admin (GET /api/admin/me/permissions). The backend enforces them
 * (AdminAccessInterceptor); the console uses them to hide menu entries and show a clear "no access" page.
 * Keys match the backend enum AdminPermission.
 */
export const PERMISSION_LABELS = {
  USERS: 'Người dùng & tài khoản',
  CV: 'Quản lý CV',
  MASTER_DATA: 'Danh mục dữ liệu',
  AI: 'Quản lý AI',
  CAREER: 'Việc làm & khóa học',
  NETWORK: 'LemoNetwork',
  REPORTS: 'Thống kê & báo cáo',
  SYSTEM: 'Cài đặt hệ thống',
};

/** Console path prefix -> required permission (same modules as the backend's /api/admin prefixes). */
const PATH_PERMISSIONS = [
  ['/users', 'USERS'], ['/admins', 'USERS'], ['/roles', 'USERS'],
  ['/cv-management', 'CV'],
  ['/master-data', 'MASTER_DATA'],
  ['/ai-management', 'AI'],
  ['/career-management', 'CAREER'],
  ['/network', 'NETWORK'],
  ['/reports', 'REPORTS'],
  ['/settings', 'SYSTEM'],
];

export const permissionForPath = (path = '') => PATH_PERMISSIONS.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] || null;

let state = { status: 'idle', list: [] };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function loadPermissions() {
  if (state.status === 'loading') return;
  state = { ...state, status: 'loading' };
  emit();
  apiRequest('/api/admin/me/permissions')
    .then((res) => { state = { status: 'ready', list: Array.isArray(res?.data) ? res.data : [] }; emit(); })
    // If the call fails (older backend, network), do not hide the console: the backend still enforces access.
    .catch(() => { state = { status: 'ready', list: Object.keys(PERMISSION_LABELS) }; emit(); });
}

export function resetPermissions() { state = { status: 'idle', list: [] }; emit(); }

/** { ready, has(permission), canOpen(path) } for the signed-in admin; loads once per session. */
export function useAdminPermissions(enabled = true) {
  const snapshot = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);
  useEffect(() => { if (enabled && snapshot.status === 'idle') loadPermissions(); }, [enabled, snapshot.status]);
  // Until the list arrives nothing is hidden; the route guard only acts once `ready` is true.
  const has = (p) => !p || snapshot.status !== 'ready' || snapshot.list.includes(p);
  return { ready: snapshot.status === 'ready', has, canOpen: (path) => has(permissionForPath(path)) };
}
