import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TransactionDetails from './components/TransactionDetails';
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
    <Router>
      <div className="App">
        <Routes>
          <Route path="/transaction/:hash" element={<TransactionDetails />} />
          <Route path="/" element={
            showLogin ? (
              <div className="app-container">
                <div className="button-group">
                  <button className="tertiary" onClick={() => setShowLogin(false)}>
                    ← Back to Exchange
                  </button>
                </div>
                <Login onLogin={handleLogin} />
              </div>
            ) : (
              <Dashboard token={token} onLogout={handleLogout} onShowLogin={() => setShowLogin(true)} />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;