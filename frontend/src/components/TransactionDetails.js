import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TransactionDetails = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransaction = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/transactions/${hash}`);
      setTransaction(response.data);
      setLoading(false);
    } catch (err) {
      setError('Транзакция не найдена');
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    fetchTransaction();
    // Refresh every 10 seconds
    const interval = setInterval(fetchTransaction, 10000);
    return () => clearInterval(interval);
  }, [fetchTransaction]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена!');
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="form-container" style={{ textAlign: 'center' }}>
          <h2>⏳ Загрузка...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="form-container" style={{ textAlign: 'center' }}>
          <h2>❌ {error}</h2>
          <button className="primary" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return '⏳';
      case 'confirming': return '🔄';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Ожидание платежа';
      case 'confirming': return 'Подтверждение';
      case 'completed': return 'Завершено';
      default: return status;
    }
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <img src="/logo.png" alt="CoinConvert" style={{ maxWidth: '480px', height: 'auto', marginBottom: '8px' }} />
        <p>Детали транзакции</p>
      </div>

      <button className="secondary" onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>
        ← Вернуться на главную
      </button>

      <div className="form-container">
        <h2>
          {transaction.type === 'sell' ? '🏦 Продажа USDT' : '💰 Покупка USDT'}
        </h2>

        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.08)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Статус</div>
            <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white' }}>
              {getStatusIcon(transaction.status)} {getStatusText(transaction.status)}
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.08)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Хеш транзакции на CoinConvert</div>
            <div style={{ fontSize: '0.95rem', wordBreak: 'break-all', marginBottom: '12px', color: 'white' }}>
              {transaction.hash}
            </div>
            <button 
              className="secondary" 
              onClick={() => copyToClipboard(transaction.hash)}
              style={{ width: 'auto', padding: '10px 20px', fontSize: '0.95rem' }}
            >
              📋 Копировать
            </button>
          </div>

          {transaction.type === 'sell' && (
            <>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Сумма</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white' }}>
                  {transaction.amount_usdt} USDT
                </div>
              </div>

              {transaction.deposit_address && (
                <div style={{ 
                  background: 'rgba(251, 191, 36, 0.15)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  marginBottom: '16px',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  <div style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '12px', fontWeight: '600' }}>
                    💳 Адрес для отправки USDT (TRC-20)
                  </div>
                  <div style={{ fontSize: '0.95rem', wordBreak: 'break-all', marginBottom: '12px', fontFamily: 'monospace', color: 'white' }}>
                    {transaction.deposit_address}
                  </div>
                  <button 
                    className="primary" 
                    onClick={() => copyToClipboard(transaction.deposit_address)}
                    style={{ width: 'auto', padding: '12px 24px', fontSize: '0.95rem', marginBottom: '12px' }}
                  >
                    📋 Копировать адрес
                  </button>
                  <div style={{ fontSize: '0.95rem', color: '#fbbf24', marginTop: '12px' }}>
                    ⚠️ Отправляйте только USDT (TRC-20) на этот адрес!
                  </div>
                </div>
              )}
            </>
          )}

          {transaction.type === 'buy' && (
            <>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Сумма</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white' }}>
                  {transaction.amount_rub} ₽
                </div>
              </div>

              {transaction.usdt_address && (
                <div style={{ 
                  background: 'rgba(96, 165, 250, 0.15)', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  marginBottom: '16px',
                  border: '1px solid rgba(96, 165, 250, 0.3)'
                }}>
                  <div style={{ fontSize: '1rem', color: '#60a5fa', marginBottom: '12px', fontWeight: '600' }}>
                    💼 Ваш USDT адрес
                  </div>
                  <div style={{ fontSize: '0.95rem', wordBreak: 'break-all', fontFamily: 'monospace', color: 'white' }}>
                    {transaction.usdt_address}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.08)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Способ оплаты</div>
            <div style={{ fontSize: '1.05rem', color: 'white' }}>
              {transaction.payment_method === 'bank' ? '🏦 Банковский счет' : '💳 Карта'}
            </div>
            {transaction.bank_name && (
              <div style={{ fontSize: '0.95rem', marginTop: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Банк: {transaction.bank_name}
              </div>
            )}
            {transaction.phone_number && (
              <div style={{ fontSize: '0.95rem', marginTop: '8px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Телефон: {transaction.phone_number}
              </div>
            )}
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.08)', 
            padding: '20px', 
            borderRadius: '12px', 
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Создано</div>
            <div style={{ fontSize: '1rem', color: 'white' }}>
              {new Date(transaction.created_at).toLocaleString('ru-RU')}
            </div>
          </div>

          {transaction.status === 'pending' && transaction.type === 'sell' && (
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.15)', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ fontSize: '1rem', color: '#60a5fa' }}>
                ℹ️ Эта страница обновляется автоматически каждые 10 секунд. Сохраните ссылку для отслеживания статуса.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
