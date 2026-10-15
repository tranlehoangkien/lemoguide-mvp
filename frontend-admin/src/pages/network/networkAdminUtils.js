import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/services/apiClient';

const BASE = '/api/admin/network';

export const networkAdmin = {
  async get(path, params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
    return (await apiRequest(`${BASE}${path}${query ? `?${query}` : ''}`)).data;
  },
  async send(path, body, method = 'PUT') {
    return (await apiRequest(`${BASE}${path}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })).data;
  },
};

/**
 * Loads one page of an admin list. `params` is a plain object (page is 0-based on the server);
 * the list reloads whenever a param changes or `reload()` is called. Errors go to `onError`.
 */
export function usePagedList(path, params, onError) {
  const [state, setState] = useState({ request: null, data: { content: [], totalElements: 0, totalPages: 1 } });
  const [version, setVersion] = useState(0);
  const key = JSON.stringify(params);
  const request = `${path}|${key}|${version}`;
  useEffect(() => {
    let alive = true;
    networkAdmin.get(path, JSON.parse(key))
      .then((data) => { if (alive) setState({ request, data }); })
      .catch((err) => { if (alive) { setState((s) => ({ ...s, request })); onError?.(err.message || 'Không thể tải dữ liệu'); } });
    return () => { alive = false; };
    // onError is a toast callback; re-running on its identity would refetch every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  // The previous page stays on screen while the next one loads.
  return { ...state.data, loading: state.request !== request, reload };
}

/** Loads one admin resource (detail modals); `path` null means nothing to load. */
export function useAdminResource(path) {
  const [result, setResult] = useState({ path: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path) return undefined;
    let alive = true;
    networkAdmin.get(path)
      .then((data) => { if (alive) setResult({ path, data }); })
      .catch((err) => { if (alive) setResult({ path, error: err.message || 'Không thể tải dữ liệu' }); });
    return () => { alive = false; };
  }, [path, version]);
  const current = result.path === path;
  return { data: current ? result.data : null, error: current ? result.error : '', reload: useCallback(() => setVersion((v) => v + 1), []) };
}

export const POST_KINDS = { KNOWLEDGE: 'Chia sẻ kiến thức', QUESTION: 'Hỏi đáp', PROJECT: 'Giới thiệu dự án', FEEDBACK: 'Nhờ góp ý dự án', MILESTONE: 'Cột mốc học tập' };
export const REPORT_KINDS = { POST: 'Bài viết', COMMENT: 'Bình luận', PROFILE: 'Hồ sơ', MESSAGE: 'Tin nhắn', COHORT_MESSAGE: 'Tin nhắn nhóm học', CHALLENGE_ENTRY: 'Bài thử thách' };
export const REPORT_STATUS = { OPEN: { label: 'Chờ xử lý', tone: 'warning' }, HIDE: { label: 'Đã ẩn nội dung', tone: 'danger' }, DISMISS: { label: 'Đã bỏ qua' } };
export const MENTOR_STATUS = {
  PENDING: { label: 'Chờ phản hồi', tone: 'warning' },
  ACCEPTED: { label: 'Đã hẹn lịch', tone: 'info' },
  COMPLETED: { label: 'Đã hoàn thành', tone: 'success' },
  DECLINED: { label: 'Bị từ chối' },
  CANCELLED: { label: 'Đã hủy' },
};
export const COHORT_KINDS = { COURSE: 'Theo khóa học', ROLE: 'Theo vị trí' };

/** Visible / hidden by a moderator / deleted by its author. */
export function contentStatus(item) {
  if (!item.hidden) return { label: 'Đang hiển thị', tone: 'success' };
  if (item.hidden_by_admin) return { label: 'Quản trị viên đã ẩn', tone: 'danger' };
  return { label: 'Tác giả đã xóa' };
}

export function memberStatus(member) {
  if (member.suspended) return { label: 'Tạm ẩn', tone: 'danger' };
  if (member.published) return { label: 'Công khai', tone: 'success' };
  return { label: 'Chưa công khai' };
}

export const formatDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '—');
export const formatDateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');
