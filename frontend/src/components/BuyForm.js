import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BankSelect from './BankSelect';

const BuyForm = ({ token, onSubmit }) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [inputCurrency, setInputCurrency] = useState('usdt'); // 'usdt' or 'rub'
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [address, setAddress] = useState('');
  const [pricing, setPricing] = useState(null);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [loadingPricing, setLoadingPricing] = useState(true);

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
    // Calculate the other currency amount
    if (amount && pricing) {
      if (inputCurrency === 'usdt') {
        // User entered USDT, calculate RUB
        const rub = parseFloat(amount) * pricing.buy_price;
        setCalculatedAmount(rub.toFixed(2));
      } else {
        // User entered RUB, calculate USDT
        const usdt = parseFloat(amount) / pricing.buy_price;
        setCalculatedAmount(usdt.toFixed(6));
      }
    } else {
      setCalculatedAmount(0);
    }
  }, [amount, pricing, inputCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate both amounts
    let amount_usdt, amount_rub;
    if (inputCurrency === 'usdt') {
      amount_usdt = parseFloat(amount);
      amount_rub = parseFloat(calculatedAmount);
    } else {
      amount_rub = parseFloat(amount);
      amount_usdt = parseFloat(calculatedAmount);
    }
    
    const data = {
      type: 'buy',
      amount_usdt: amount_usdt,
      amount_rub: amount_rub,
      payment_method: 'bank',
      phone_number: phone,
      bank_name: bank,
      usdt_address: address,
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
      setAddress('');
      onSubmit();
    } catch (error) {
      alert('❌ Ошибка: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div className="form-container">
      <h2>
        💰 Купить USDT за RUB
        {loadingPricing ? (
          <span style={{ display: 'block', fontSize: '0.65em', fontWeight: '400', color: '#f59e0b', marginTop: '8px' }}>
            ⏳ Ждем обновления цены (10-20 секунд)...
          </span>
        ) : pricing ? (
          <span style={{ 
            display: 'block', 
            fontSize: '0.9em', 
            fontWeight: '600', 
            color: '#60a5fa', 
            marginTop: '12px',
            padding: '8px 16px',
            background: 'rgba(96, 165, 250, 0.15)',
            borderRadius: '8px',
            border: '1px solid rgba(96, 165, 250, 0.3)'
          }}>
            💵 {pricing.buy_price.toFixed(2)} ₽ за 1 USDT
          </span>
        ) : null}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Currency selector toggle */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              type="button"
              onClick={() => setInputCurrency('usdt')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: inputCurrency === 'usdt' ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
                color: inputCurrency === 'usdt' ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: inputCurrency === 'usdt' ? '600' : '400',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: inputCurrency === 'usdt' ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid transparent'
              }}
            >
              💵 USDT
            </button>
            <button
              type="button"
              onClick={() => setInputCurrency('rub')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                background: inputCurrency === 'rub' ? 'rgba(96, 165, 250, 0.3)' : 'transparent',
                color: inputCurrency === 'rub' ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                fontWeight: inputCurrency === 'rub' ? '600' : '400',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: inputCurrency === 'rub' ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid transparent'
              }}
            >
              💰 RUB
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            {inputCurrency === 'usdt' ? 'Сумма USDT' : 'Сумма RUB'}
          </label>
          <input
            id="amount"
            type="number"
            placeholder={inputCurrency === 'usdt' ? 'Введите сумму в USDT' : 'Введите сумму в рублях'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step={inputCurrency === 'usdt' ? '0.000001' : '0.01'}
            min="0.000001"
            required
          />
          {calculatedAmount > 0 && (
            <small style={{ color: '#60a5fa', fontWeight: '700', fontSize: '1em', marginTop: '8px', display: 'block' }}>
              ≈ {calculatedAmount} {inputCurrency === 'usdt' ? 'RUB' : 'USDT'}
            </small>
          )}
        </div>

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

        <div className="form-group">
          <label htmlFor="address">Ваш USDT адрес (TRC-20)</label>
          <input
            id="address"
            type="text"
            placeholder="Ваш адрес кошелька Tron, начинающийся с T..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="form-submit" style={{ marginTop: '24px' }}>Отправить заявку на покупку</button>
      </form>
    </div>
  );
};

export default BuyForm;