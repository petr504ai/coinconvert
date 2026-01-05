import React, { useState } from 'react';
import axios from 'axios';

const SellForm = ({ token, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [card, setCard] = useState('');

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
      alert(`Transaction created!\n\nYour transaction hash: ${response.data.hash}\n\nSend ${amount} USDT (TRC-20) to:\n${depositAddr}\n\nSave this information to track your transaction.`);
      onSubmit();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <h2>Sell USDT for RUB</h2>
      <form onSubmit={handleSubmit}>
        <input type="number" placeholder="USDT Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="bank">Bank Account</option>
          <option value="card">Credit Card</option>
        </select>
        {method === 'bank' && (
          <>
            <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <input type="text" placeholder="Bank Name" value={bank} onChange={(e) => setBank(e.target.value)} required />
          </>
        )}
        {method === 'card' && (
          <input type="text" placeholder="Card Number" value={card} onChange={(e) => setCard(e.target.value)} required />
        )}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default SellForm;