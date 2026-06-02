import http from './http';

export const ncrApi = {
  list: (params = {}) => http.get('/ncrs', { params }).then((r) => r.data),
  get: (id) => http.get(`/ncrs/${id}`).then((r) => r.data),
  create: (payload) => http.post('/ncrs', payload).then((r) => r.data),
  updateStatus: (id, payload) => http.patch(`/ncrs/${id}/status`, payload).then((r) => r.data),
  escalate: (id, payload = {}) => http.post(`/ncrs/${id}/escalate`, payload).then((r) => r.data),
};
