import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminClaims() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to admin dashboard claims tab
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to Admin Dashboard...</p>
    </div>
  );
}

export default AdminClaims;
