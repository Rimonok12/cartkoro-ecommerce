import axios from 'axios';

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const api = axios.create({
  baseURL: process.env.NODE_HOST, // your BE URL
  withCredentials: true, // send cookies (refresh token)
});

// Interceptor to attach accessToken
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Auto-refresh token if 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${process.env.NODE_HOST}/api/user/refresh`,
          {},
          { withCredentials: true }
        );
        accessToken = res.data.accessToken;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return axios(original);
      } catch (refreshErr) {
        console.log('🔒 Session expired');
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
