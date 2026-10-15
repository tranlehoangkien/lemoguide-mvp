import { apiRequest } from './apiClient';
const base = '/api/me/workspace';
const read = async (path, options) => (await apiRequest(`${base}${path}`, options)).data;
const save = (path, body, method) => read(path, { method, body: JSON.stringify(body) });
export const workspaceService = {
  overview: (week) => read(week ? `?week=${week}` : ''),
  saveTask: (task) => save(`/tasks${task.id ? `/${task.id}` : ''}`, task, task.id ? 'PUT' : 'POST'),
  deleteTask: (id) => read(`/tasks/${id}`, { method: 'DELETE' }),
  applications: (params) => read(`/applications?${new URLSearchParams(params)}`),
  application: (id) => read(`/applications/${id}`),
  counts: () => read('/applications/counts'),
  saveApplication: (item) => save(`/applications${item.id ? `/${item.id}` : ''}`, item, item.id ? 'PUT' : 'POST'),
  deleteApplication: (id) => read(`/applications/${id}`, { method: 'DELETE' }),
  history: (id) => read(`/applications/${id}/history`),
};
export const APPLICATION_STATUSES = { SAVED: 'Đã lưu', APPLIED: 'Đã nộp', INTERVIEW: 'Phỏng vấn', OFFER: 'Nhận offer', REJECTED: 'Từ chối', WITHDRAWN: 'Đã rút' };
export const localDate = (value = new Date()) => {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const shiftDate = (value, days) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + days); return localDate(date); };
export const displayDate = (date) => date ? new Date(date.length === 10 ? `${date}T12:00:00` : date).toLocaleDateString('vi-VN') : 'Chưa đặt ngày';
