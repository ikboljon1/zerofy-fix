
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0,0';
  }
  
  // Format the number with thousands separators AND with 1 decimal place
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numValue);
};

export const formatWithDecimals = (value: number | string, decimals: number = 1): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0' + (decimals > 0 ? ',' + '0'.repeat(decimals) : '');
  }
  
  // Format the number with specified decimal places but without the ₽ symbol
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

/**
 * Преобразует строку с ценой в число
 * @param value Строка с ценой
 * @returns Число
 */
export const parseCurrencyString = (value: string): number => {
  if (!value) return 0;
  const numericValue = value.replace(/[^\d.-]/g, '');
  return parseFloat(numericValue) || 0;
};

/**
 * Округляет число до одного знака после запятой
 * @param value Число для округления
 * @returns Округленное число
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 10) / 10;
};
