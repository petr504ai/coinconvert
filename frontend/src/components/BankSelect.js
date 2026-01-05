import React, { useState } from 'react';

const BankSelect = ({ value, onChange, label = 'Выберите банк' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const banks = [
    'Сбербанк',
    'ВТБ',
    'Альфа-Банк',
    'Райффайзен Банк',
    'Газпромбанк',
    'ПСБ',
    'Промсвязьбанк',
    'Открытие',
    'МегаФон',
    'Почта Банк',
    'Совкомбанк',
    'Морской Банк',
    'Акордбанк',
    'Инвестиционный банк',
    'КИБ Россия',
    'Бинбанк',
    'Саратовский мотор-завод',
    'Кредобанк',
    'ХайБанк',
    'МСП Банк',
    'ГБПП',
    'МФО',
    'Альтбанк',
    'Восток',
    'Витамин',
    'Инстабанк',
    'Инвестиционно-инновационный',
    'Канский',
    'Кардиональный',
    'КемеровоСервис',
    'КотэкоБанк',
    'КредитБанк 24',
    'КСП',
    'Ланта Банк',
    'ЛК Бизнес Банк',
    'Липецк-Банк',
    'МинИнБанк',
    'Мобил Банк',
    'МодерноБанк',
    'МосИнвест-Банк',
    'МосФинБанк',
    'МТА',
    'МусикБанк',
    'НиБК',
    'НовоселБанк',
    'Оберегал',
    'ОДП Банк',
    'ОНО Банк',
    'Орель-Банк',
    'ОтоБанк',
    'ОтпБанк'
  ];

  const filteredBanks = banks.filter(bank =>
    bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bank-select-wrapper">
      <label htmlFor="bank-input">{label}</label>
      <div className="bank-select-container">
        <input
          id="bank-input"
          type="text"
          className="bank-select-input"
          placeholder="Начните вводить название банка..."
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {isOpen && filteredBanks.length > 0 && (
          <div className="bank-dropdown">
            {filteredBanks.slice(0, 50).map((bank, index) => (
              <div
                key={index}
                className={`bank-option ${bank === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(bank);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {bank}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BankSelect;