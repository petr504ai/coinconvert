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
        <h1>🪙 CoinConvert</h1>
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
          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '4px' }}>Статус</div>
            <div style={{ fontSize: '1.2em', fontWeight: '600' }}>
              {getStatusIcon(transaction.status)} {getStatusText(transaction.status)}
            </div>
          </div>

          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '4px' }}>Хеш транзакции на CoinConvert</div>
            <div style={{ fontSize: '0.9em', wordBreak: 'break-all', marginBottom: '8px' }}>
              {transaction.hash}
            </div>
            <button 
              className="tertiary" 
              onClick={() => copyToClipboard(transaction.hash)}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85em' }}
            >
              📋 Копировать
            </button>
          </div>

          {transaction.type === 'sell' && (
            <>
              <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '4px' }}>Сумма</div>
                <div style={{ fontSize: '1.1em', fontWeight: '600' }}>
                  {transaction.amount_usdt} USDT
                </div>
              </div>

              {transaction.deposit_address && (
                <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.9em', color: '#92400e', marginBottom: '4px', fontWeight: '600' }}>
                    💳 Адрес для отправки USDT (TRC-20)
                  </div>
                  <div style={{ fontSize: '0.85em', wordBreak: 'break-all', marginBottom: '8px', fontFamily: 'monospace' }}>
                    {transaction.deposit_address}
                  </div>
                  <button 
                    className="primary" 
                    onClick={() => copyToClipboard(transaction.deposit_address)}
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85em' }}
                  >
                    📋 Копировать адрес
                  </button>
                  <div style={{ fontSize: '0.8em', color: '#92400e', marginTop: '12px' }}>
                    ⚠️ Отправляйте только USDT (TRC-20) на этот адрес!
                  </div>
                </div>
              )}
            </>
          )}

          {transaction.type === 'buy' && (
            <>
              <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '4px' }}>Сумма</div>
                <div style={{ fontSize: '1.1em', fontWeight: '600' }}>
                  {transaction.amount_rub} ₽
                </div>
              </div>

              {transaction.usdt_address && (
                <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.9em', color: '#1e40af', marginBottom: '4px', fontWeight: '600' }}>
                    💼 Ваш USDT адрес
                  </div>
                  <div style={{ fontSize: '0.85em', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {transaction.usdt_address}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '4px' }}>Способ оплаты</div>
            <div style={{ fontSize: '1em' }}>
              {transaction.payment_method === 'bank' ? '🏦 Банковский счет' : '💳 Карта'}
            </div>
            {transaction.bank_name && (
              <div style={{ fontSize: '0.9em', marginTop: '4px' }}>
                Банк: {transaction.bank_name}
              </div>
            )}
            {transaction.phone_number && (
              <div style={{ fontSize: '0.9em', marginTop: '4px' }}>
                Телефон: {transaction.phone_number}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.9em', color: '#6b7280', marginBottom: '4px' }}>Создано</div>
            <div style={{ fontSize: '0.9em' }}>
              {new Date(transaction.created_at).toLocaleString('ru-RU')}
            </div>
          </div>

          {transaction.status === 'pending' && transaction.type === 'sell' && (
            <div style={{ backgroundColor: '#dbeafe', padding: '16px', borderRadius: '8px', border: '2px solid #3b82f6' }}>
              <div style={{ fontSize: '0.95em', color: '#1e40af' }}>
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
