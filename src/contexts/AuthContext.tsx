import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AuthContext, type AuthContextValue } from "./auth-context";
import {
  AUTH_CHANGED_EVENT,
  clearAuth,
  getAuthUser,
  getToken,
  saveAuth,
  type AuthUser,
} from "../services/auth";

function getAuthSnapshot() {
  return {
    token: getToken(),
    user: getAuthUser(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(getAuthSnapshot);

  useEffect(() => {
    const syncAuth = () => setAuth(getAuthSnapshot());

    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: auth.token,
      user: auth.user,
      isAuthenticated: Boolean(auth.token),
      isAdmin: Boolean(auth.user?.isAdmin),
      login: (token, user) => saveAuth(token, user),
      logout: () => clearAuth(),
      syncUser: (user) => {
        const token = getToken();
        if (!token) {
          return;
        }

        saveAuth(token, user);
      },
    }),
    [auth.token, auth.user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
