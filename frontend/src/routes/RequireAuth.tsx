import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem('access_token') ?? localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
