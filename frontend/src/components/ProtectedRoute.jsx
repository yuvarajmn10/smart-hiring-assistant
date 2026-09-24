import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return <div className="p-8">Loading...</div>;
        // Wait for localStorage check to finish before deciding
    }
    if (!user) {
        return <Navigate to="/login" replace />;
        // Not logged in → go to login page
    }
    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to="/dashboard" replace />;
        // Wrong role (e.g. candidate trying recruiter page) → go to dashboard
    }
    return children;
};
export default ProtectedRoute;