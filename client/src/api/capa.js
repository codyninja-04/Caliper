import http from './http';

export const capaApi = {
  list: (params = {}) => http.get('/capas', { params }).then((r) => r.data),
  get: (id) => http.get(`/capas/${id}`).then((r) => r.data),
  create: (payload) => http.post('/capas', payload).then((r) => r.data),
  update: (id, payload) => http.patch(`/capas/${id}`, payload).then((r) => r.data),
  verify: (id, payload) => http.post(`/capas/${id}/verify`, payload).then((r) => r.data),
};
