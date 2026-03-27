import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreatePost from './pages/CreatePost';
import LostFound from './pages/LostFound';
import AddItem from "./pages/AddItem";
import ItemDetails from "./pages/ItemDetails";
import Profile from './pages/Profile';
import MyItems from "./pages/MyItems";
import EditItem from "./pages/EditItem";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return user?.role === 'admin' ? children : <Navigate to="/" />;
};

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lost-found" element={<LostFound />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />

        {/* Protected routes */}
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-item"
          element={
           <ProtectedRoute>
              <AddItem />
           </ProtectedRoute>
          }
        />
        <Route path="/item/:id" element={<ItemDetails />} />
        <Route
          path="/my-items"
          element={
           <ProtectedRoute>
              <MyItems />
           </ProtectedRoute>
          }
         />
         <Route
          path="/edit-item/:id"
          element={
           <ProtectedRoute>
              <EditItem />
           </ProtectedRoute>
          }
          />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-light-beige">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
