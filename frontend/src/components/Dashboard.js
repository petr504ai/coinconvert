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
    <div>
      <h1>CoinConvert Exchange</h1>
      <div>
        {token ? (
          <>
            <button onClick={onLogout}>Logout</button>
            <button onClick={() => setView('list')}>My Transactions</button>
          </>
        ) : (
          <button onClick={onShowLogin}>Login / Register</button>
        )}
      </div>
      <div>
        <button onClick={() => setView('sell')}>Sell USDT</button>
        <button onClick={() => setView('buy')}>Buy USDT</button>
      </div>
      {view === 'sell' && <SellForm token={token} onSubmit={handleTransaction} />}
      {view === 'buy' && <BuyForm token={token} onSubmit={handleTransaction} />}
      {view === 'list' && token && (
        <div>
          <h2>My Transactions</h2>
          <ul>
            {transactions.map(tx => (
              <li key={tx.id}>
                <strong>Hash:</strong> {tx.hash}<br/>
                {tx.type} - {tx.amount_usdt ? `${tx.amount_usdt} USDT` : `${tx.amount_rub} RUB`} - {tx.status}
              </li>
            ))}
          </ul>
        </div>
      )}
      {view === 'list' && !token && (
        <div>
          <p>Please login to view your transaction history</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;