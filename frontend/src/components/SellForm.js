import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BankSelect from './BankSelect';

const SellForm = ({ token, onSubmit }) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [card, setCard] = useState('');
  const [pricing, setPricing] = useState(null);
  const [estimatedRub, setEstimatedRub] = useState(0);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [trackingHash, setTrackingHash] = useState('');

  useEffect(() => {
    // Fetch current pricing
    const fetchPricing = async () => {
      setLoadingPricing(true);
      try {
        const response = await axios.get('http://localhost:8000/pricing');
        setPricing(response.data);
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setLoadingPricing(false);
      }
    };
    
    fetchPricing();
    // Refresh pricing every 5 minutes
    const interval = setInterval(fetchPricing, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate estimated RUB amount
    if (amount && pricing) {
      const rub = parseFloat(amount) * pricing.sell_price;
      setEstimatedRub(rub.toFixed(2));
    } else {
      setEstimatedRub(0);
    }
  }, [amount, pricing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      type: 'sell',
      amount_usdt: parseFloat(amount),
      payment_method: method,
      phone_number: method === 'bank' ? phone : null,
      bank_name: method === 'bank' ? bank : null,
      card_number: method === 'card' ? card : null,
    };
    try {
      const config = token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};
      const response = await axios.post('http://localhost:8000/api/transactions', data, config);
      
      // Redirect to transaction details page
      navigate(`/transaction/${response.data.hash}`);
      
      setAmount('');
      setPhone('');
      setBank('');
      setCard('');
      setMethod('bank');
      onSubmit();
    } catch (error) {
      alert('❌ Ошибка: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="form-container">
      <h2>
        🏦 Продать USDT за RUB
        {loadingPricing ? (
          <span style={{ display: 'block', fontSize: '0.65em', fontWeight: '400', color: '#f59e0b', marginTop: '8px' }}>
            ⏳ Ждем обновления цены (10-20 секунд)...
          </span>
        ) : pricing ? (
          <span style={{ display: 'block', fontSize: '0.7em', fontWeight: '400', color: '#059669', marginTop: '8px' }}>
            {pricing.sell_price.toFixed(2)} ₽ за 1 USDT
          </span>
        ) : null}
      </h2>

      {/* Transaction Tracking */}
      <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.9em', fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>
          🔍 Отследить транзакцию
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Введите хеш транзакции"
            value={trackingHash}
            onChange={(e) => setTrackingHash(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '0.9em' }}
          />
          <button
            type="button"
            onClick={() => trackingHash && navigate(`/transaction/${trackingHash}`)}
            disabled={!trackingHash}
            className="secondary"
            style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
          >
            Перейти
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Сумма (USDT)</label>
          <input
            id="amount"
            type="number"
            placeholder="Введите сумму в USDT"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="1"
            required
          />
          {estimatedRub > 0 && (
            <small style={{ color: '#059669', fontWeight: '600', marginTop: '8px', display: 'block' }}>
              ≈ {estimatedRub} ₽
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="method">Способ получения платежа</label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="bank">Банковский счет</option>
            <option value="card">Кредитная/дебетовая карта</option>
          </select>
        </div>

        {method === 'bank' && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Номер телефона</label>
              <input
                id="phone"
                type="tel"
                placeholder="+7XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="bank-select-wrapper">
              <BankSelect
                value={bank}
                onChange={setBank}
                label="Название банка"
              />
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="form-group">
            <label htmlFor="card">Номер карты</label>
            <input
              id="card"
              type="text"
              placeholder="Номер карты или идентификатор"
              value={card}
              onChange={(e) => setCard(e.target.value)}
              required
            />
          </div>
        )}

        <button type="submit" className="form-submit">Отправить заявку на продажу</button>
      </form>
    </div>
  );
};

export default SellForm;
