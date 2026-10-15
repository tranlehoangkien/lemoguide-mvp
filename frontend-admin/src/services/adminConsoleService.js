import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from './apiClient';

/** Reports ("Thống kê & Báo cáo") and system settings ("Cài đặt hệ thống") of the admin console. */
export const adminConsole = {
  async get(path, params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    return (await apiRequest(`/api/admin${path}${query ? `?${query}` : ''}`)).data;
  },
  async put(path, body) {
    return (await apiRequest(`/api/admin${path}`, { method: 'PUT', body: JSON.stringify(body) })).data;
  },
};

/**
 * Loads `path` with `params`, reloading whenever they change or reload() is called. The previous data stays on
 * screen while the next request runs; `loading` is derived instead of set inside the effect.
 */
export function useAdminQuery(path, params, onError) {
  const key = JSON.stringify(params || {});
  const [version, setVersion] = useState(0);
  const request = `${path}|${key}|${version}`;
  const [result, setResult] = useState({ request: null, data: null });
  useEffect(() => {
    let alive = true;
    adminConsole.get(path, JSON.parse(key))
      .then((data) => { if (alive) setResult({ request, data }); })
      .catch((err) => { if (alive) { setResult((r) => ({ ...r, request })); onError?.(err.message || 'Không thể tải dữ liệu'); } });
    return () => { alive = false; };
    // onError is a toast callback whose identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);
  return { data: result.data, loading: result.request !== request, reload: useCallback(() => setVersion((v) => v + 1), []) };
}

export const TARGET_MODE_LABELS = { frontend: 'Frontend', backend: 'Backend', fullstack: 'Fullstack' };
export const SKILL_TYPE_LABELS = { hard: 'Kỹ năng chuyên môn', soft: 'Kỹ năng mềm', language: 'Ngoại ngữ' };
export const PUBLISH_MODE_OPTIONS = {
  PUBLIC_LINK: { label: 'Công khai (link chia sẻ)', hint: 'CV mới được bật chia sẻ bằng link ngay khi tạo.' },
  PDF: { label: 'Bản nháp · PDF', hint: 'CV mới ở chế độ riêng tư, người dùng tải PDF để gửi đi.' },
  ATS_TEXT: { label: 'Bản nháp · ATS text', hint: 'CV mới ở chế độ riêng tư, ưu tiên xuất văn bản thuần cho hệ thống ATS.' },
};

export const formatNumber = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
export const formatPercent = (part, total) => (total ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format((part * 100) / total)}%` : '0%');
export const formatDateTime = (v) => (v ? new Date(v).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }) : '—');
export const formatDate = (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');

/** Downloads rows as a UTF-8 CSV (with BOM so Excel shows Vietnamese correctly). columns: [[header, row => value]]. */
export function downloadCsv(filename, columns, rows) {
  const cell = (v) => {
    const text = v == null ? '' : String(v);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map(([h]) => cell(h)).join(','), ...rows.map((r) => columns.map(([, get]) => cell(get(r))).join(','))];
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
