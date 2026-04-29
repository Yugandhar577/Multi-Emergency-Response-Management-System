import axiosLib from 'axios';

// Original instance — has /api baseURL. Existing pages call e.g. api.get('/incidents').
export const api = axiosLib.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15_000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[api]', err?.response?.status, err?.config?.url, err?.message);
    return Promise.reject(err);
  },
);

// New instance — no baseURL. New pages call e.g. axios.get('/api/incidents') with full path.
// Vite dev server proxies /api/* to backend on :8080.
export const axios = axiosLib.create({
  timeout: 15_000,
});

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error('[axios]', err?.response?.status, err?.config?.url, err?.message);
    return Promise.reject(err);
  },
);
