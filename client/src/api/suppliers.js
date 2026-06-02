import http from './http';

export const suppliersApi = {
  list: (params = {}) => http.get('/suppliers', { params }).then((r) => r.data),
  get: (id) => http.get(`/suppliers/${id}`).then((r) => r.data),
  create: (payload) => http.post('/suppliers', payload).then((r) => r.data),
  scorecard: (id) => http.get(`/suppliers/${id}/scorecard`).then((r) => r.data),
  recalculate: (id) => http.post(`/suppliers/${id}/recalculate-score`).then((r) => r.data),
};
