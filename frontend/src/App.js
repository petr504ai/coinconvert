import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <div className="App">
      {showLogin ? (
        <div>
          <button onClick={() => setShowLogin(false)}>Back to Exchange</button>
          <Login onLogin={handleLogin} />
        </div>
      ) : (
        <Dashboard token={token} onLogout={handleLogout} onShowLogin={() => setShowLogin(true)} />
      )}
    </div>
  );
}

export default App;