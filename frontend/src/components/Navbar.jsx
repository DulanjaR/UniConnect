import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-primary text-white shadow-lg sticky top-0 z-50 border-b-4 border-accent-orange">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <img src="/images/UniConnectLogo.png" alt="UniConnect Logo" className="h-10" />
          <span className="text-2xl font-bold text-white">UniConnect</span>
        </Link>

        <div className="flex gap-6 items-center">
          {user ? (
            <>
              <Link to="/" className="hover:text-accent-orange transition">
                Home
              </Link>
              <Link to="/groups" className="hover:text-accent-orange transition">
                Groups
              </Link>
              <Link to="/lost-found" className="hover:text-accent-orange transition">
                Lost & Found
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:text-accent-orange transition font-semibold">
                  Admin Dashboard
                </Link>
              )}
              <div className="flex items-center gap-2 border-l border-secondary-blue pl-6">
                <Link to="/profile" className="hover:text-accent-orange transition">
                  👤 {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-accent-orange text-white px-4 py-2 rounded hover:shadow-lg hover:shadow-orange-400/40 transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-accent-orange transition">
                Login
              </Link>
              <Link to="/register" className="btn-secondary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
