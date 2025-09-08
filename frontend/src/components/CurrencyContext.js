import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState('GNF');
  const [currencySettings, setCurrencySettings] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});

  // Currencies configuration
  const currencies = {
    GNF: {
      code: 'GNF',
      name: 'Franc Guinéen',
      symbol: 'GNF',
      position: 'after',
      decimals: 0,
      separator: ' '
    },
    USD: {
      code: 'USD',
      name: 'Dollar US',
      symbol: '$',
      position: 'before',
      decimals: 2,
      separator: ','
    },
    EUR: {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      position: 'after',
      decimals: 2,
      separator: ' '
    }
  };

  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  const fetchCurrencySettings = async () => {
    try {
      const response = await axios.get(`${API}/currency/settings`);
      setCurrencySettings(response.data);
      setExchangeRates(response.data.exchange_rates);
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      // Set default rates if API fails
      setExchangeRates({
        GNF: 1.0,
        USD: 0.00012,
        EUR: 0.00011
      });
    }
  };

  const convertCurrency = async (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      const response = await axios.get(`${API}/currency/convert`, {
        params: {
          amount,
          from_currency: fromCurrency,
          to_currency: toCurrency
        }
      });
      return response.data.converted_amount;
    } catch (error) {
      console.error('Error converting currency:', error);
      // Fallback to local conversion
      return convertCurrencyLocal(amount, fromCurrency, toCurrency);
    }
  };

  const convertCurrencyLocal = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to base currency (GNF) first
    let baseAmount = amount;
    if (fromCurrency !== 'GNF') {
      baseAmount = amount / exchangeRates[fromCurrency];
    }
    
    // Convert from base to target currency
    if (toCurrency !== 'GNF') {
      return baseAmount * exchangeRates[toCurrency];
    }
    
    return baseAmount;
  };

  const formatCurrency = (amount, currency = currentCurrency) => {
    const currencyConfig = currencies[currency];
    if (!currencyConfig) return amount.toString();

    const roundedAmount = Math.round(amount * Math.pow(10, currencyConfig.decimals)) / Math.pow(10, currencyConfig.decimals);
    
    let formattedAmount;
    if (currencyConfig.decimals === 0) {
      formattedAmount = Math.round(roundedAmount).toString();
    } else {
      formattedAmount = roundedAmount.toFixed(currencyConfig.decimals);
    }

    // Add thousands separator
    const parts = formattedAmount.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencyConfig.separator);
    formattedAmount = parts.join('.');

    // Position symbol
    if (currencyConfig.position === 'before') {
      return `${currencyConfig.symbol}${formattedAmount}`;
    } else {
      return `${formattedAmount} ${currencyConfig.symbol}`;
    }
  };

  const getConvertedAmount = async (amount, fromCurrency = 'GNF') => {
    if (fromCurrency === currentCurrency) {
      return amount;
    }
    return await convertCurrency(amount, fromCurrency, currentCurrency);
  };

  const formatConvertedCurrency = async (amount, fromCurrency = 'GNF') => {
    const convertedAmount = await getConvertedAmount(amount, fromCurrency);
    return formatCurrency(convertedAmount, currentCurrency);
  };

  const switchCurrency = (newCurrency) => {
    if (currencies[newCurrency]) {
      setCurrentCurrency(newCurrency);
      localStorage.setItem('selectedCurrency', newCurrency);
    }
  };

  // Load saved currency preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency && currencies[savedCurrency]) {
      setCurrentCurrency(savedCurrency);
    }
  }, []);

  const value = {
    currentCurrency,
    currencies,
    currencySettings,
    exchangeRates,
    formatCurrency,
    formatConvertedCurrency,
    convertCurrency,
    convertCurrencyLocal,
    getConvertedAmount,
    switchCurrency,
    fetchCurrencySettings
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyProvider;