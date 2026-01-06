import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Use relative URLs in production (empty string), localhost in development
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

const TransactionDetails = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransaction = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions/${hash}`);
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
        <img src="/logo.png" alt="CoinConvert" className="logo" style={{ height: 'auto', marginBottom: '8px' }} />
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
                <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Сумма USDT</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white' }}>
                  {transaction.amount_usdt} USDT
                </div>
              </div>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Сумма RUB</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white' }}>
                  {transaction.amount_rub} ₽
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
                    ⚠️ Отправляйте только USDT (TRC-20) на этот адрес! Статус транзакции обновляется автоматически после получения 20 подтверждений.  
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
                <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Сумма RUB</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white' }}>
                  {transaction.amount_rub} ₽
                </div>
              </div>

              <div style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Сумма USDT</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white' }}>
                  {transaction.amount_usdt} USDT
                </div>
              </div>

              {/* Merchant Payment Details */}
              <div style={{ 
                background: 'rgba(251, 191, 36, 0.15)', 
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '16px',
                border: '1px solid rgba(251, 191, 36, 0.3)'
              }}>
                <div style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '16px', fontWeight: '600' }}>
                  💳 Реквизиты для перевода RUB
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Телефон:</div>
                  <div style={{ fontSize: '1rem', fontFamily: 'monospace', color: 'white', marginBottom: '8px' }}>
                    +79123456789
                  </div>
                  <button 
                    className="secondary" 
                    onClick={() => copyToClipboard('+79123456789')}
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    📋 Копировать
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>Банк:</div>
                  <div style={{ fontSize: '1rem', color: 'white', marginBottom: '8px' }}>
                    Сбербанк
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', marginTop: '16px', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
                  ⚠️ Переведите <b>{transaction.amount_rub} ₽</b> на указанный номер телефона через СБП в указанный банк. После перевода статус будет обновлен, и USDT будут отправлены на ваш адрес. Переводы на неправильные реквизиты возврату не подлежат.
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

          {/* Payment method section - only for sell transactions */}
          {transaction.type === 'sell' && (
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              padding: '20px', 
              borderRadius: '12px', 
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>Способ оплаты</div>
              <div style={{ fontSize: '1.05rem', color: 'white' }}>
                {transaction.payment_method === 'bank' ? '🏦 Банковский счет (СБП)' : '💳 Карта'}
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
          )}

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
