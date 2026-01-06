import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SellForm from './SellForm';
import BuyForm from './BuyForm';

// Use relative URLs in production (empty string), localhost in development
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

const Dashboard = ({ token, onLogout, onShowLogin }) => {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState('sell');
  const [trackingHash, setTrackingHash] = useState('');
  const navigate = useNavigate();

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error(error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token, fetchTransactions]);

  const handleTransaction = () => {
    if (token) {
      fetchTransactions();
    }
    setView('sell');
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'rgba(255, 255, 255, 0.7)', 
          marginBottom: '16px',
          lineHeight: '1.5'
        }}>
          По вопросам сотрудничества, а также приобретения данного веб-сайта свяжитесь с нами через телеграм-бота
        </p>
        <img src="/logo.png" alt="CoinConvert" className="logo" style={{ height: 'auto', marginBottom: '8px' }} />
        <p className="subtitle">
          Обмен USDT на рубли
          <a 
            href="https://t.me/coinconvert_ru_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              marginLeft: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'rgba(42, 171, 238, 0.15)',
              border: '1px solid rgba(42, 171, 238, 0.3)',
              borderRadius: '8px',
              color: '#2aabee',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(42, 171, 238, 0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(42, 171, 238, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            💬 Поддержка в Telegram
          </a>
        </p>
      </div>

      {/* Transaction Tracking */}
      <div className="tracking-section">
        <div className="tracking-label">
          <span className="icon">🔍</span>
          Отследить транзакцию
        </div>
        <div className="tracking-input-group">
          <input
            type="text"
            className="tracking-input"
            placeholder="Введите хеш транзакции"
            value={trackingHash}
            onChange={(e) => setTrackingHash(e.target.value)}
          />
          <button
            className="tracking-button"
            onClick={() => trackingHash && navigate(`/transaction/${trackingHash}`)}
            disabled={!trackingHash}
          >
            Перейти →
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${view === 'sell' ? 'active' : ''}`}
          onClick={() => setView('sell')}
        >
          <span className="tab-icon">💸</span>
          Продать USDT
        </button>
        <button
          className={`tab ${view === 'buy' ? 'active' : ''}`}
          onClick={() => setView('buy')}
        >
          <span className="tab-icon">💰</span>
          Купить USDT
        </button>
      </div>

      {/* Forms */}
      {view === 'sell' && <SellForm token={token} onSubmit={handleTransaction} />}
      {view === 'buy' && <BuyForm token={token} onSubmit={handleTransaction} />}

      {view === 'list' && token && (
        <div className="transaction-list">
          <h2>📊 Ваши транзакции</h2>
          {transactions.length > 0 ? (
            transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <strong>
                  {tx.type === 'sell' ? '🏦 Продано' : '💰 Куплено'} {tx.amount_usdt || tx.amount_rub}
                </strong>
                {tx.type === 'sell' ? ` USDT → ${tx.amount_rub} RUB` : ` RUB → ${tx.amount_usdt} USDT`}
                <br />
                <small>
                  Статус: <strong>{tx.status === 'pending' ? 'В ожидании' : tx.status === 'confirming' ? 'Подтверждение' : 'Завершено'}</strong> | Хеш: <code>{tx.hash.substring(0, 16)}...</code>
                </small>
              </div>
            ))
          ) : (
            <p>Транзакций еще нет</p>
          )}
        </div>
      )}

      {view === 'list' && !token && (
        <div className="form-container">
          <p style={{ textAlign: 'center', fontSize: '1.1em' }}>
            💡 Пожалуйста, войдите, чтобы увидеть историю ваших транзакций
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
