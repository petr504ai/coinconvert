import React, { useState } from 'react';
import axios from 'axios';
import BankSelect from './BankSelect';

const BuyForm = ({ token, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [address, setAddress] = useState('');

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
      alert(`✅ Транзакция создана!\n\n📋 Хеш: ${response.data.hash}\n\nСтатус: ${response.data.status}\n\nМы отправим USDT на: ${address}\n\n💾 Сохраните хеш для отслеживания транзакции.`);
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
      <h2>💰 Купить USDT за RUB</h2>
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