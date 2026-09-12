import { Navigate, Outlet } from 'react-router';
import { isAuthenticated } from '../utils/auth';

/** Redirects unauthenticated users to the login page. */
export function RequireAuth() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
