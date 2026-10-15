import { apiRequest } from './apiClient';

const base = '/api/me/career-plans';
export const careerPlanService = {
  async profileContext() { return (await apiRequest(`${base}/profile-context`)).data; },
  async list(page = 0) { return (await apiRequest(`${base}?page=${page}&size=10`)).data; },
  async remove(id) { return apiRequest(`${base}/${id}`, { method: 'DELETE' }); },
  async get(id) { return (await apiRequest(`${base}/${id}`)).data; },
  async propose(body) {
    return (await apiRequest(`${base}/proposals`, { method: 'POST', body: JSON.stringify(body) })).data;
  },
  async create(body) {
    return (await apiRequest(base, { method: 'POST', body: JSON.stringify(body) })).data;
  },
  async updateTask(id, taskId, body) {
    return (await apiRequest(`${base}/${id}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) })).data;
  },
};
