import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/auth/register' : '/auth/token';
    const data = isRegistering
      ? { email, password }
      : new URLSearchParams({ username: email, password });

    try {
      const response = await axios.post(
        `http://localhost:8000${endpoint}`,
        data,
        {
          headers: {
            'Content-Type': isRegistering ? 'application/json' : 'application/x-www-form-urlencoded'
          }
        }
      );
      const token = response.data.access_token || response.data.access_token;
      onLogin(token);
    } catch (error) {
      alert('❌ ' + (error.response?.data?.detail || 'Ошибка'));
    }
  };

  return (
    <div className="form-container">
      <h2>{isRegistering ? '📝 Регистрация' : '🔐 Вход'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="form-submit">
          {isRegistering ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          className="tertiary"
          onClick={() => setIsRegistering(!isRegistering)}
          style={{ width: 'auto' }}
        >
          {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </div>
  );
};

export default Login;
