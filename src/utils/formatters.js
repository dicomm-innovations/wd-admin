import { format, parseISO, formatDistanceToNow, isValid } from 'date-fns';

/**
 * Date Formatting Utilities
 */

export const formatDate = (date, formatString = 'yyyy-MM-dd') => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatTime = (date) => {
  return formatDate(date, 'HH:mm');
};

export const formatDateShort = (date) => {
  return formatDate(date, 'MMM dd, yyyy');
};

export const formatDateLong = (date) => {
  return formatDate(date, 'MMMM dd, yyyy');
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '-';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return '-';
  }
};

/**
 * Currency Formatting Utilities
 */

export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined) return '-';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

export const formatCurrencyCompact = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined) return '-';

  try {
    if (amount >= 1000000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
      }).format(amount);
    }
    return formatCurrency(amount, currency, locale);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

/**
 * Number Formatting Utilities
 */

export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '-';

  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  } catch (error) {
    console.error('Number formatting error:', error);
    return Number(number).toFixed(decimals);
  }
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '-';

  try {
    return `${Number(value).toFixed(decimals)}%`;
  } catch (error) {
    console.error('Percentage formatting error:', error);
    return '-';
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Phone Number Formatting
 */

export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  } else if (cleaned.length === 12) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
  }

  return phone;
};

/**
 * String Formatting Utilities
 */

export const formatName = (firstName, lastName) => {
  if (!firstName && !lastName) return '-';
  return `${firstName || ''} ${lastName || ''}`.trim();
};

export const formatInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

export const formatBusinessUnit = (unit) => {
  const units = {
    gym: 'The Ring',
    spa: 'The Olive Room',
    manufacturing: 'The Edit Collection',
    childcare: "The Women's Den",
    marketing: 'TWD Marketing'
  };

  return units[unit] || capitalizeWords(unit);
};

/**
 * Status Badge Formatting
 */

export const getStatusVariant = (status) => {
  const variants = {
    active: 'success',
    completed: 'success',
    approved: 'success',
    paid: 'success',

    pending: 'warning',
    in_progress: 'warning',
    processing: 'warning',

    inactive: 'error',
    cancelled: 'error',
    rejected: 'error',
    expired: 'error',
    failed: 'error',

    scheduled: 'info',
    draft: 'info'
  };

  return variants[status] || 'default';
};

export const formatStatus = (status) => {
  if (!status) return '-';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * ID/Code Formatting
 */

export const formatCustomerId = (customerId) => {
  return customerId || '-';
};

export const formatOrderNumber = (orderNumber) => {
  return orderNumber || '-';
};

export const maskSensitiveData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars) return data;
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
};

/**
 * Duration Formatting
 */

export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '-';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const formatSeconds = (seconds) => {
  if (!seconds || seconds === 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Array/List Formatting
 */

export const formatList = (items, separator = ', ', lastSeparator = ' and ') => {
  if (!items || items.length === 0) return '-';
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(lastSeparator);

  const allButLast = items.slice(0, -1).join(separator);
  return `${allButLast}${lastSeparator}${items[items.length - 1]}`;
};

export const formatTags = (tags) => {
  if (!tags || tags.length === 0) return '-';
  return tags.join(', ');
};

/**
 * Address Formatting
 */

export const formatAddress = (address) => {
  if (!address) return '-';

  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country
  ].filter(Boolean);

  return parts.join(', ');
};

/**
 * Error Message Formatting
 */

export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
};

/**
 * Validation Helpers
 */

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone);
};

export default {
  // Date
  formatDate,
  formatDateTime,
  formatTime,
  formatDateShort,
  formatDateLong,
  formatRelativeTime,

  // Currency
  formatCurrency,
  formatCurrencyCompact,

  // Number
  formatNumber,
  formatPercentage,
  formatFileSize,

  // Phone
  formatPhoneNumber,

  // String
  formatName,
  formatInitials,
  truncateText,
  capitalize,
  capitalizeWords,
  formatBusinessUnit,

  // Status
  getStatusVariant,
  formatStatus,

  // ID
  formatCustomerId,
  formatOrderNumber,
  maskSensitiveData,

  // Duration
  formatDuration,
  formatSeconds,

  // List
  formatList,
  formatTags,

  // Address
  formatAddress,

  // Error
  formatErrorMessage,

  // Validation
  isValidEmail,
  isValidPhone
};
