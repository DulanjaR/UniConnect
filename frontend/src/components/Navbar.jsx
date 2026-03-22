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
    <nav className="bg-primary-teal text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-accent-beige transition">
          UniConnect
        </Link>

        <div className="flex gap-6 items-center">
          {user ? (
            <>
              <Link to="/" className="hover:text-accent-beige transition">
                Home
              </Link>
              <Link to="/create" className="hover:text-accent-beige transition">
                Create Post
              </Link>
              <Link to="/lost-found" className="hover:text-accent-beige transition">
                Lost & Found
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:text-accent-beige transition font-semibold">
                  Admin Dashboard
                </Link>
              )}
              <div className="flex items-center gap-2 border-l border-accent-beige pl-6">
                <span className="text-sm">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="bg-accent-beige text-primary-teal px-4 py-2 rounded hover:bg-yellow-100 transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-accent-beige transition">
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
