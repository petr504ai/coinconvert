import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BankSelect from './BankSelect';

const SellForm = ({ token, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [card, setCard] = useState('');
  const [pricing, setPricing] = useState(null);
  const [estimatedRub, setEstimatedRub] = useState(0);

  useEffect(() => {
    // Fetch current pricing
    const fetchPricing = async () => {
      try {
        const response = await axios.get('http://localhost:8000/pricing');
        setPricing(response.data);
      } catch (error) {
        console.error('Error fetching pricing:', error);
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
      const depositAddr = response.data.deposit_address;
      alert(`✅ Транзакция создана!\n\n📋 Хеш: ${response.data.hash}\n\n💵 Отправьте ${amount} USDT (TRC-20) на:\n${depositAddr}\n\n💾 Сохраните эту информацию для отслеживания транзакции.`);
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
        {pricing && (
          <span style={{ display: 'block', fontSize: '0.7em', fontWeight: '400', color: '#059669', marginTop: '8px' }}>
            {pricing.sell_price.toFixed(2)} ₽ за 1 USDT
          </span>
        )}
      </h2>
      {pricing && (
        <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9em' }}>
          💹 <strong>Текущий курс:</strong> 1 USDT = {pricing.sell_price.toFixed(2)} ₽ (рыночный: {pricing.market_rate.toFixed(2)} ₽)
          <br />
          📊 Спред: {pricing.spread.toFixed(2)} ₽
        </div>
      )}
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
