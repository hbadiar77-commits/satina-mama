import React, { useState, useEffect } from 'react';
import { useCurrency } from './CurrencyContext';

const CurrencyAmount = ({ 
  amount, 
  fromCurrency = 'GNF', 
  className = "",
  showOriginal = false,
  inline = true 
}) => {
  const { formatCurrency, convertCurrencyLocal, currentCurrency, currencies } = useCurrency();
  const [convertedAmount, setConvertedAmount] = useState(amount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const convertAmount = async () => {
      if (fromCurrency === currentCurrency) {
        setConvertedAmount(amount);
        return;
      }

      setLoading(true);
      try {
        const converted = convertCurrencyLocal(amount, fromCurrency, currentCurrency);
        setConvertedAmount(converted);
      } catch (error) {
        console.error('Error converting amount:', error);
        setConvertedAmount(amount); // Fallback to original amount
      } finally {
        setLoading(false);
      }
    };

    convertAmount();
  }, [amount, fromCurrency, currentCurrency, convertCurrencyLocal]);

  if (loading) {
    return <span className={`animate-pulse ${className}`}>...</span>;
  }

  const formattedAmount = formatCurrency(convertedAmount, currentCurrency);
  const originalFormatted = formatCurrency(amount, fromCurrency);

  if (showOriginal && fromCurrency !== currentCurrency) {
    return (
      <div className={inline ? "inline-flex items-center space-x-2" : "flex flex-col"}>
        <span className={`font-semibold ${className}`}>{formattedAmount}</span>
        <span className="text-xs text-gray-500">({originalFormatted})</span>
      </div>
    );
  }

  return <span className={className}>{formattedAmount}</span>;
};

export default CurrencyAmount;