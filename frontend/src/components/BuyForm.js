import React, { useState } from 'react';
import axios from 'axios';

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
      alert(`Transaction created!\n\nYour transaction hash: ${response.data.hash}\n\nStatus: ${response.data.status}\n\nWe will process your order and send USDT to: ${address}\n\nSave your hash to track the transaction.`);
      onSubmit();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <div>
      <h2>Buy USDT with RUB</h2>
      <form onSubmit={handleSubmit}>
        <input type="number" placeholder="RUB Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="text" placeholder="Bank Name" value={bank} onChange={(e) => setBank(e.target.value)} required />
        <input type="text" placeholder="Your USDT Address" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default BuyForm;