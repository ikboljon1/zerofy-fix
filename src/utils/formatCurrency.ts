
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  // Format the number with thousands separators but without the ₽ symbol
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

export const formatWithDecimals = (value: number | string, decimals: number = 2): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
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
 * Округляет число до двух знаков после запятой
 * @param value Число для округления
 * @returns Округленное число
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};
