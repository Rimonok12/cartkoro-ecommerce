import axios from 'axios';

let accessToken = null;

export const setAccessToken = (newToken) => {
  accessToken = newToken;
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post('/api/user/refresh', {}, { withCredentials: true });
        setAccessToken(res.data.accessToken);
        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return axios(original);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
