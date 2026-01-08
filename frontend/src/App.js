import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TransactionDetails from './components/TransactionDetails';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import './App.css';

// Matomo page tracking component
function MatomoTracker() {
  const location = useLocation();

  useEffect(() => {
    if (window._paq) {
      window._paq.push(['setCustomUrl', window.location.href]);
      window._paq.push(['setDocumentTitle', document.title]);
      window._paq.push(['trackPageView']);
    }
  }, [location]);

  return null;
}

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
      <MatomoTracker />
      <div className="App">
        <Routes>
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
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