import { apiRequest } from './apiClient';

const base = '/api/me/discovery';
const get = async path => (await apiRequest(`${base}${path}`)).data;
const post = async (path, body) => (await apiRequest(`${base}${path}`, { method: 'POST', body: JSON.stringify(body) })).data;
export const discoveryService = {
  catalog: () => get('/catalog'),
  summary: () => get('/summary'),
  history: () => get('/attempts'),
  progress: () => get('/progress'),
  get: id => get(`/attempts/${encodeURIComponent(id)}`),
  start: kind => post('/attempts', { kind }),
  answer: (id, questionId, option) => post(`/attempts/${encodeURIComponent(id)}/answers`, { questionId, option }),
  startAdaptive: () => post('/adaptive', {}),
  getAdaptive: id => get(`/adaptive/${encodeURIComponent(id)}`),
  answerAdaptive: (id, turn, option, note) => post(`/adaptive/${encodeURIComponent(id)}/answers`, { turn, option, note: note || null }),
  finishAdaptive: id => post(`/adaptive/${encodeURIComponent(id)}/finish`, {}),
  undo: async (id, questionId) => (await apiRequest(`${base}/attempts/${encodeURIComponent(id)}/answers/${encodeURIComponent(questionId)}`, { method: 'DELETE' })).data,
};
