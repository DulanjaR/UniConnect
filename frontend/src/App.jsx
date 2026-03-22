import React from 'react';
import Header from './components/Header.jsx';

function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1.5rem' }}>
      <Header />
      <main style={{ marginTop: '1.5rem' }}>
        <h2>UniConnect (MERN)</h2>
        <p>Frontend is running. Connect this UI to backend APIs under <code>/api</code>.</p>
      </main>
    </div>
  );
}

export default App;
