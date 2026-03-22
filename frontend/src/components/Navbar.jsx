import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user }) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
        <span style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>UniConnect</span>
      </Link>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white', fontWeight: 500 }}>
          Home
        </Link>
        <Link
          to="/create"
          style={{
            textDecoration: 'none',
            backgroundColor: '#fff',
            color: '#667eea',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + New Post
        </Link>
      </div>

      {user && (
        <div style={{ fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
          Year {user.year} • Sem {user.semester}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
