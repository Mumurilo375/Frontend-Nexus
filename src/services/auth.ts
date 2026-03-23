type AuthUser = {
  id: number;
  email: string;
  username: string;
  isAdmin?: boolean;
};

const TOKEN_KEY = "token";
const USER_KEY = "authUser";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveAuth(token: string, user?: AuthUser | null) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function isAdminUser() {
  return Boolean(getAuthUser()?.isAdmin);
}
