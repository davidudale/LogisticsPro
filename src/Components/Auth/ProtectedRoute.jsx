import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import {
  canAccessRole,
  getDashboardPathByRole,
  isEmailVerificationRequired,
} from "../../utils/roles.js";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user.emailVerified && isEmailVerificationRequired(user.role)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!canAccessRole(user.role, allowedRoles)) {
    return <Navigate to={getDashboardPathByRole(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
