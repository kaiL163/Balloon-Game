import { Navigate, Outlet } from 'react-router';
import { isAdmin, isAuthenticated } from '../utils/auth';

export function RequireAdmin() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <Outlet />;
}
