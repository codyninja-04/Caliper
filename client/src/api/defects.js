import http from './http';

export const defectsApi = {
  list: (params = {}) => http.get('/defects', { params }).then((r) => r.data),
  get: (id) => http.get(`/defects/${id}`).then((r) => r.data),
  create: (payload) => http.post('/defects', payload).then((r) => r.data),
  update: (id, payload) => http.patch(`/defects/${id}`, payload).then((r) => r.data),
  stats: () => http.get('/defects/stats/summary').then((r) => r.data),
};
