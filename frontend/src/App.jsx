import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import CreatePost from './pages/CreatePost.jsx';

// Temporary hard-coded user; later replace with real auth context
const currentUser = {
  id: 'placeholder-user-id',
  year: 2,
  semester: 1
};

function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Navbar user={currentUser} />
      <main>
        <Routes>
          <Route path="/" element={<Home user={currentUser} />} />
          <Route path="/create" element={<CreatePost user={currentUser} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
