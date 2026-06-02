import http from './http';

export const auditsApi = {
  list: (params = {}) => http.get('/audit', { params }).then((r) => r.data),
  forRecord: (recordId) => http.get(`/audit/${recordId}`).then((r) => r.data),
};
