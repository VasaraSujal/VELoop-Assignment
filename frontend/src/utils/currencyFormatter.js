import { CURRENCIES } from '../data/constants.js';

/**
 * Formats a currency amount and currency type into a clean string.
 * Example: formatCurrency(250, 'VEs') => "250 VEs"
 * Example: formatCurrency(2000, 'Tokens') => "2,000 Tokens"
 */
export const formatCurrency = (amount, currency = CURRENCIES.VES) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0 ${currency}`;
  }
  const formattedNumber = new Intl.NumberFormat('en-IN').format(amount);
  return `${formattedNumber} ${currency}`;
};

/**
 * Formats an amount into Indian Rupees (INR)
 * Example: formatInr(134900) => "₹1,34,900"
 */
export const formatInr = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
