import axios from "axios";
import { useAuth } from "@/store/auth";

const baseURL = `${import.meta.env.VITE_API_URL || ""}/api/v1`;

export const api = axios.create({ baseURL, withCredentials: true, timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

/** Exchanges the httpOnly refresh cookie for a new access token. Shared between concurrent callers. */
export function refreshSession() {
  refreshing ??= axios
    .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      useAuth.getState().setSession(res.data.data);
      return res.data.data.accessToken;
    })
    .catch((err) => {
      useAuth.getState().clear();
      throw err;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.startsWith("/auth/");
    if (status === 401 && !original._retry && !isAuthCall && useAuth.getState().user) {
      original._retry = true;
      try {
        const token = await refreshSession();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        /* fall through */
      }
    }
    return Promise.reject(error);
  }
);

/** Human-readable message from an API error. */
export const errorMessage = (err, fallback = "Something went wrong. Try again.") =>
  err?.response?.data?.message || (err?.code === "ERR_NETWORK" ? "Cannot reach the server. Check your connection." : fallback);

export const fieldErrors = (err) => err?.response?.data?.errors || {};

/** Unwraps { success, data, meta } responses. */
export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, body, config) => api.post(url, body, config).then((r) => r.data);
export const patch = (url, body) => api.patch(url, body).then((r) => r.data);
export const put = (url, body) => api.put(url, body).then((r) => r.data);
export const del = (url) => api.delete(url).then((r) => r.data);

export const apiUrl = (path) => `${baseURL}${path}`;

export const assetUrl = (url) =>
  !url ? "" : url.startsWith("/uploads") ? `${import.meta.env.VITE_API_URL || ""}${url}` : url;
