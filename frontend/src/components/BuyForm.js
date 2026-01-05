import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BankSelect from './BankSelect';

const BuyForm = ({ token, onSubmit }) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [address, setAddress] = useState('');
  const [pricing, setPricing] = useState(null);
  const [estimatedUsdt, setEstimatedUsdt] = useState(0);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [trackingHash, setTrackingHash] = useState('');
  const [addressError, setAddressError] = useState('');

  const validateTronAddress = (addr) => {
    // Basic Tron address validation
    if (!addr) return '';
    if (addr.length !== 34) return 'Адрес должен содержать 34 символа';
    if (!addr.startsWith('T')) return 'Адрес Tron должен начинаться с T';
    if (!/^[A-HJ-NP-Za-km-z1-9]+$/.test(addr)) return 'Недопустимые символы в адресе';
    return '';
  };

  const handleAddressChange = (e) => {
    const value = e.target.value.trim();
    setAddress(value);
    if (value) {
      setAddressError(validateTronAddress(value));
    } else {
      setAddressError('');
    }
  };

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
    // Calculate estimated USDT amount
    if (amount && pricing) {
      const usdt = parseFloat(amount) / pricing.buy_price;
      setEstimatedUsdt(usdt.toFixed(6));
    } else {
      setEstimatedUsdt(0);
    }
  }, [amount, pricing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      type: 'buy',
      amount_rub: parseFloat(amount),
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
          <span style={{ display: 'block', fontSize: '0.7em', fontWeight: '400', color: '#6366f1', marginTop: '8px' }}>
            {pricing.buy_price.toFixed(2)} ₽ за 1 USDT
          </span>
        ) : null}
      </h2>

      {/* Transaction Tracking */}
      <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.9em', fontWeight: '600', marginBottom: '8px', color: '#92400e' }}>
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
          <label htmlFor="amount">Сумма (RUB)</label>
          <input
            id="amount"
            type="number"
            placeholder="Введите сумму в рублях"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="1"
            required
          />
          {estimatedUsdt > 0 && (
            <small style={{ color: '#6366f1', fontWeight: '600', marginTop: '8px', display: 'block' }}>
              ≈ {estimatedUsdt} USDT
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

        <button type="submit" className="form-submit">Отправить заявку на покупку</button>
      </form>
    </div>
  );
};

export default BuyForm;