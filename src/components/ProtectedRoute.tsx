import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredMode?: 'admin' | 'client';
}

export default function ProtectedRoute({ children, requiredMode }: ProtectedRouteProps) {
  const { isAuthenticated, mode } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredMode && mode !== requiredMode) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
