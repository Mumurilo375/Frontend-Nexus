import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminUser, isAuthenticated } from "../../services/auth";

type GuardProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: GuardProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: GuardProps) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdminUser()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
