import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SellForm from './SellForm';
import BuyForm from './BuyForm';

const Dashboard = ({ token, onLogout, onShowLogin }) => {
  const [transactions, setTransactions] = useState([]);
  const [view, setView] = useState('sell');

  useEffect(() => {
    if (token) {
      fetchTransactions();
    }
  }, [token]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTransaction = () => {
    if (token) {
      fetchTransactions();
    }
    setView('sell');
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>🪙 CoinConvert</h1>
        <p>Обмен USDT и российских рублей</p>
      </div>

      <div className="button-group">
        <button
          className={`primary ${view === 'sell' ? '' : 'secondary'}`}
          onClick={() => setView('sell')}
        >
          🏦 Продать USDT
        </button>
        <button
          className={`primary ${view === 'buy' ? '' : 'secondary'}`}
          onClick={() => setView('buy')}
        >
          💰 Купить USDT
        </button>
        {token && (
          <button className="secondary" onClick={() => setView('list')}>
            📋 Мои транзакции
          </button>
        )}
        {!token && (
          <button className="tertiary" onClick={onShowLogin}>
            🔐 Вход / Регистрация
          </button>
        )}
        {token && (
          <button className="danger" onClick={onLogout}>
            🚪 Выход
          </button>
        )}
      </div>

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
