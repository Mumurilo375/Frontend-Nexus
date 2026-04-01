import axios, { AxiosHeaders, isAxiosError } from "axios";
import { clearAuth, getToken } from "./auth";

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? "/api").trim() || "/api";

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      clearAuth();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error instanceof Error ? error : new Error("Unexpected request error"));
  },
);

export default api;
