import { apiRequest } from './apiClient';

const base = '/api/network';
export const networkService = {
  async get(path) { return (await apiRequest(`${base}${path}`)).data; },
  async send(path, body, method = 'POST') {
    return (await apiRequest(`${base}${path}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })).data;
  },
};
