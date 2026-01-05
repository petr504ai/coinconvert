import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? 'http://localhost:8000/auth/register' : 'http://localhost:8000/auth/token';
    try {
      const response = await axios.post(url, isRegister ? { email, password } : new URLSearchParams({ username: email, password }));
      if (isRegister) {
        alert('Registered successfully');
        setIsRegister(false);
      } else {
        onLogin(response.data.access_token);
      }
    } catch (error) {
      alert('Error: ' + error.response.data.detail);
    }
  };

  return (
    <div>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
      </button>
    </div>
  );
};

export default Login;