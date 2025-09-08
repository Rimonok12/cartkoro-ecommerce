import axios from "axios";
let accessToken = null;
let logoutCallback = null;

// ---------------------- ACCESS TOKEN ----------------------
export const setAccessToken = (newToken) => {
  accessToken = newToken;
};

// ---------------------- LOGOUT CALLBACK ----------------------
export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

// ---------------------- FORCE LOGOUT ----------------------
export const forceLogout = async () => {
  try {
    await axios.post("/api/user/logout", {}, { withCredentials: true });
  } catch (err) {
    console.warn("Logout request failed, continuing local cleanup:", err);
  }

  // Local cleanup
  accessToken = null;
  if (logoutCallback) logoutCallback();
};

// ---------------------- AXIOS INSTANCE ----------------------
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Attach access token to requests
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 → refresh token → retry, or force logout if refresh fails
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      console.log("here from srr");
      try {
        const res = await axios.post(
          "/api/user/refresh",
          {},
          { withCredentials: true }
        );
        console.log("refresh res.data.accessToken::", res.data.accessToken);
        setAccessToken(res.data.accessToken);
        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return axios(original);
      } catch (refreshErr) {
        console.log("falsee");

        // 🔴 Refresh also failed → force logout
        await forceLogout();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
