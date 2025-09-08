import React from 'react';
import { useCurrency } from './CurrencyContext';

const CurrencySelector = ({ className = "" }) => {
  const { currentCurrency, currencies, switchCurrency } = useCurrency();

  const handleCurrencyChange = (e) => {
    switchCurrency(e.target.value);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Devise:</span>
      <select
        value={currentCurrency}
        onChange={handleCurrencyChange}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {Object.entries(currencies).map(([code, currency]) => (
          <option key={code} value={code}>
            {currency.symbol} {currency.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;