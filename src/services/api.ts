import axios, { AxiosHeaders, isAxiosError } from "axios";
import { clearAuth, getToken } from "./auth";

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? "/api").trim() || "/api";
const POST_LOGIN_REDIRECT_KEY = "nexus:post-login-redirect";

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
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, currentPath);
        window.location.assign("/login");
      }
    }

    return Promise.reject(
      error instanceof Error
        ? error
        : new Error("Erro inesperado na requisição"),
    );
  },
);

export default api;
