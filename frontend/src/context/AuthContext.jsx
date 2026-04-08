import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      // Validate token is still valid by checking if we can fetch profile
      const validateToken = async () => {
        try {
          const res = await axios.get(`${API_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          // Token is valid, update user with fresh data
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          // Token is invalid, clear storage
          console.log('Token validation failed, clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        }
      };
      
      validateToken();
    }

    setLoading(false);
  }, []);

  const register = async (name, email, password, role = 'student', university, academicYear, semester) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role,
        university,
        academicYear,
        semester
      });

      const { token: newToken, user: newUser } = res.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Registration failed' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });

      const { token: newToken, user: newUser } = res.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, profileData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true, user: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
