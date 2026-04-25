import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const formatClock = () => {
      return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    };

    setCurrentTime(formatClock());
    const timer = setInterval(() => {
      setCurrentTime(formatClock());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Redirect admin users to admin dashboard
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/profile');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-vibrant">
      <div className="h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
          {/* Left Side - Image */}
          <div className="hidden md:flex items-center justify-center overflow-hidden">
            <img 
              src="/images/login.png" 
              alt="UniConnect" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
              <div className="mb-8 rounded-[36px] border border-slate-200/70 bg-white/80 px-6 py-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl text-center">
                <p className="text-5xl font-semibold tracking-tight text-slate-900">{currentTime}</p>
                <p className="mt-1 text-sm text-slate-500">Live local time</p>
              </div>

              <h1 className="text-3xl font-bold text-black text-center mb-2">Welcome to UniConnect</h1>
              <p className="text-center text-black mb-8">Sign in to your account</p>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="your@university.edu"
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-24"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 mr-3 flex items-center text-sm font-medium text-primary-teal hover:text-primary-dark"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p className="text-center mt-6 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-accent-orange font-semibold hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
