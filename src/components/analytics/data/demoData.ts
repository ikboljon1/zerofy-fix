// ��инимальная структура для API-интерфейса
export const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

// Пустые данные для состояния по умолчанию при превышении лимита
export const emptyAnalyticsData = {
  currentPeriod: {
    sales: 0,
    transferred: 0,
    expenses: {
      total: 0,
      logistics: 0,
      storage: 0,
      penalties: 0,
      advertising: 0,
      acceptance: 0,
      deductions: 0
    },
    netProfit: 0,
    acceptance: 0,
    returnsAmount: 0 // Add returnsAmount property with default value of 0
  },
  dailySales: [],
  productSales: [],
  productReturns: [],
  topProfitableProducts: [],
  topUnprofitableProducts: []
};

// Пустые данные для графиков
export const emptyDeductionsTimelineData = [];
export const emptyAdvertisingData = [];
export const emptyPenaltiesData = [];
export const emptyReturnsData = [];
export const emptyDeductionsData = [];

// Минимальные данные для складского API (для обратной совместимости)
export const warehousesData = [];
export const logisticsRoutes = [];
export const inventoryData = [];

/**
 * Ключ для хранения данных о средних продажах в localStorage
 */
const AVERAGE_SALES_STORAGE_KEY = 'wb_average_daily_sales';

/**
 * Ключ для хранения данных о продажах по периодам
 */
const AVERAGE_SALES_BY_PERIOD_STORAGE_KEY = `${AVERAGE_SALES_STORAGE_KEY}_by_period`;

/**
 * Интерфейс для хранения данных о продажах по периодам
 */
interface SalesDataByPeriod {
  // Ключ - строка в формате 'YYYY-MM-DD_YYYY-MM-DD' (начало_конец периода)
  [periodKey: string]: {
    averageSales: Record<number, number>; // nmId -> среднее количество продаж
    fetchDate: string; // Дата и время получения данных
  };
}

/**
 * Генерирует ключ периода для хранения данных
 * @param dateFrom Дата начала периода
 * @param dateTo Дата окончания периода
 */
const generatePeriodKey = (dateFrom: string, dateTo: string): string => {
  const key = `${dateFrom}_${dateTo}`;
  console.log(`[Cache] Generated period key: ${key}`);
  return key;
};

/**
 * Сохраняет данные о средних продажах в localStorage с привязкой к периоду
 * @param salesData Объект с данными о средних продажах
 * @param dateFrom Дата начала периода в формате YYYY-MM-DD
 * @param dateTo Дата окончания периода в формате YYYY-MM-DD
 */
export const saveAverageDailySales = (
  salesData: Record<number, number>,
  dateFrom?: string,
  dateTo?: string
) => {
  try {
    console.log(`[Cache] Saving sales data, with period? ${!!dateFrom && !!dateTo}`);
    console.log(`[Cache] Number of products: ${Object.keys(salesData).length}`);
    
    // Если не переданы даты, сохраняем в обычном формате (для обратной совместимости)
    if (!dateFrom || !dateTo) {
      localStorage.setItem(AVERAGE_SALES_STORAGE_KEY, JSON.stringify(salesData));
      console.log('[Cache] Data saved in legacy format (without period)');
      return;
    }

    // Получаем текущие данные по периодам
    const existingDataStr = localStorage.getItem(AVERAGE_SALES_BY_PERIOD_STORAGE_KEY);
    console.log(`[Cache] Existing period data in storage: ${!!existingDataStr}`);
    
    const existingData: SalesDataByPeriod = existingDataStr 
      ? JSON.parse(existingDataStr) 
      : {};

    // Ключ для текущего периода
    const periodKey = generatePeriodKey(dateFrom, dateTo);

    // Логируем первые 3 продукта для отладки
    const sampleProducts = Object.entries(salesData).slice(0, 3);
    console.log(`[Cache] Sample products (first 3): ${JSON.stringify(sampleProducts)}`);

    // Обновляем данные для текущего периода
    existingData[periodKey] = {
      averageSales: salesData,
      fetchDate: new Date().toISOString()
    };

    // Логируем количество периодов после обновления
    console.log(`[Cache] Total periods after update: ${Object.keys(existingData).length}`);

    // Сохраняем обновленные данные
    localStorage.setItem(AVERAGE_SALES_BY_PERIOD_STORAGE_KEY, JSON.stringify(existingData));
    console.log(`[Cache] Data saved for period ${periodKey} with ${Object.keys(salesData).length} product records`);

    // Проверяем, сохранились ли данные
    const checkSaved = localStorage.getItem(AVERAGE_SALES_BY_PERIOD_STORAGE_KEY);
    if (checkSaved) {
      const savedData = JSON.parse(checkSaved);
      console.log(`[Cache] Verification: data for period ${periodKey} exists: ${!!savedData[periodKey]}`);
      if (savedData[periodKey]) {
        console.log(`[Cache] Verification: products count matches: ${Object.keys(savedData[periodKey].averageSales).length === Object.keys(salesData).length}`);
      }
    }

    // Также сохраняем в обычном формате для обратной совместимости
    localStorage.setItem(AVERAGE_SALES_STORAGE_KEY, JSON.stringify(salesData));
  } catch (error) {
    console.error('[Cache] Error saving sales data:', error);
  }
};

/**
 * Получает данные о средних продажах для конкретного периода
 * @param dateFrom Дата начала периода в формате YYYY-MM-DD
 * @param dateTo Дата окончания периода в формате YYYY-MM-DD
 * @returns Объект с данными о средних продажах или null, если данных нет
 */
export const getAverageDailySalesByPeriod = (
  dateFrom: string,
  dateTo: string
): Record<number, number> | null => {
  try {
    console.log(`[Cache] Trying to get sales data for period: ${dateFrom} - ${dateTo}`);
    
    // Получаем все данные по периодам
    const allPeriodsDataStr = localStorage.getItem(AVERAGE_SALES_BY_PERIOD_STORAGE_KEY);
    
    if (!allPeriodsDataStr) {
      console.log(`[Cache] No period data found in storage at key: ${AVERAGE_SALES_BY_PERIOD_STORAGE_KEY}`);
      return null;
    }
    
    const allPeriodsData: SalesDataByPeriod = JSON.parse(allPeriodsDataStr);
    console.log(`[Cache] Found period data store with ${Object.keys(allPeriodsData).length} periods`);
    console.log(`[Cache] Available periods: ${Object.keys(allPeriodsData).join(', ')}`);

    // Ключ для запрашиваемого периода
    const periodKey = generatePeriodKey(dateFrom, dateTo);

    // Если есть данные для указанного периода, возвращаем их
    if (allPeriodsData[periodKey]) {
      const cachedData = allPeriodsData[periodKey].averageSales;
      const fetchDate = new Date(allPeriodsData[periodKey].fetchDate);
      const productCount = Object.keys(cachedData).length;
      
      console.log(`[Cache] CACHE HIT! Found cached data for period ${periodKey}`);
      console.log(`[Cache] Cached data contains ${productCount} products, fetched on ${fetchDate.toLocaleString()}`);
      
      // Логируем первые 3 продукта для отладки
      const sampleProducts = Object.entries(cachedData).slice(0, 3);
      console.log(`[Cache] Sample cached products (first 3): ${JSON.stringify(sampleProducts)}`);

      return cachedData;
    }

    console.log(`[Cache] CACHE MISS! No data found for period key: ${periodKey}`);
    console.log(`[Cache] Available period keys: ${Object.keys(allPeriodsData).join(', ')}`);
    return null;
  } catch (error) {
    console.error('[Cache] Error retrieving sales data by period:', error);
    return null;
  }
};

/**
 * Получает данные о средних продажах из localStorage
 * @returns Объект с данными о средних продажах или null, если данных нет
 */
export const getAverageDailySales = (): Record<number, number> | null => {
  try {
    const data = localStorage.getItem(AVERAGE_SALES_STORAGE_KEY);
    if (!data) {
      console.log('[Cache] No legacy sales data found');
      return null;
    }
    const parsedData = JSON.parse(data);
    console.log(`[Cache] Found legacy sales data with ${Object.keys(parsedData).length} products`);
    return parsedData;
  } catch (error) {
    console.error('[Cache] Error retrieving legacy sales data:', error);
    return null;
  }
};

/**
 * Получает средние продажи по продуктам из API Wildberries
 * @param apiKey API ключ Wildberries
 * @param dateFrom Дата начала в формате YYYY-MM-DD
 * @param dateTo Дата окончания в формате YYYY-MM-DD
 * @returns Объект с данными о средних продажах по продуктам
 */
export const fetchAverageDailySalesFromAPI = async (
  apiKey: string, 
  dateFrom: string, 
  dateTo: string
): Promise<Record<number, number>> => {
  try {
    console.log(`[FETCH-SALES-API] Запрос данных о продажах за период: ${dateFrom} - ${dateTo}`);
    console.log(`[FETCH-SALES-API] API ключ: ${apiKey ? apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 5) : 'отсутствует'}`);
    
    // Проверяем, есть ли уже кэшированные данные для этого периода
    const cachedData = getAverageDailySalesByPeriod(dateFrom, dateTo);
    if (cachedData) {
      console.log(`[FETCH-SALES-API] Используем кэшированные данные для периода ${dateFrom} - ${dateTo}`);
      console.log(`[FETCH-SALES-API] Кэш содержит данные для ${Object.keys(cachedData).length} товаров`);
      
      // Отправка события для уведомления компонентов об обновлении данных
      const event = new CustomEvent('salesDataUpdated', { 
        detail: { 
          averageSalesPerDay: cachedData, 
          dateFrom, 
          dateTo,
          fromCache: true
        } 
      });
      window.dispatchEvent(event);
      
      return cachedData;
    }
    
    console.log(`[FETCH-SALES-API] Кэш не найден, запрашиваем свежие данные из API за период ${dateFrom} - ${dateTo}`);
    
    // Получение всех данных с пагинацией
    const url = "https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod";
    console.log(`[FETCH-SALES-API] Базовый URL для запроса: ${url}`);
    
    const allData = await fetchAllReportDetails(apiKey, dateFrom, dateTo);
    
    if (!allData || allData.length === 0) {
      console.warn('[FETCH-SALES-API] API не вернул данных');
      return {};
    }
    
    console.log(`[FETCH-SALES-API] Получено ${allData.length} записей о продажах из API`);
    
    // Рассчитываем среднее количество продаж в день для каждого товара
    const averageSalesPerDay = calculateAverageDailySalesPerProduct(allData, dateFrom, dateTo);
    console.log(`[FETCH-SALES-API] Рассчитаны средние продажи для ${Object.keys(averageSalesPerDay).length} товаров`);
    
    // Логируем первые 5 товаров для отладки
    const top5Products = Object.entries(averageSalesPerDay).slice(0, 5);
    console.log(`[FETCH-SALES-API] Примеры средних продаж (первые 5 товаров): ${JSON.stringify(top5Products)}`);
    
    // Сохраняем данные в localStorage для использования в других компонентах
    saveAverageDailySales(averageSalesPerDay, dateFrom, dateTo);
    
    // Отправка события для уведомления компонентов об обновлении данных
    const event = new CustomEvent('salesDataUpdated', { 
      detail: { 
        averageSalesPerDay, 
        dateFrom, 
        dateTo,
        fromCache: false
      } 
    });
    window.dispatchEvent(event);
    
    return averageSalesPerDay;
  } catch (error) {
    console.error('[FETCH-SALES-API] Ошибка при получении данных о продажах:', error);
    if (error instanceof Error) {
      console.error(`[FETCH-SALES-API] Сообщение ошибки: ${error.message}`);
      console.error(`[FETCH-SALES-API] Стек вызовов: ${error.stack}`);
    }
    return {};
  }
};

/**
 * Загружает детальный отчет с Wildberries API с поддержкой пагинации
 */
const fetchReportDetail = async (
  apiKey: string, 
  dateFrom: string, 
  dateTo: string, 
  rrdid = 0, 
  limit = 100000
) => {
  try {
    const url = "https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod";
    
    const headers = {
      "Authorization": apiKey,
    };
    
    const params = {
      "dateFrom": dateFrom,
      "dateTo": dateTo,
      "rrdid": rrdid,
      "limit": limit,
    };
    
    const fullUrl = `${url}?dateFrom=${dateFrom}&dateTo=${dateTo}&rrdid=${rrdid}&limit=${limit}`;
    
    console.log(`[FETCH-DETAIL] Запрос отчета с rrdid ${rrdid}...`);
    console.log(`[FETCH-DETAIL] Полный URL: ${fullUrl}`);
    console.log(`[FETCH-DETAIL] Заголовки: Authorization: ${apiKey ? apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 5) : 'отсутствует'}`);
    
    const response = await fetch(`${url}?dateFrom=${dateFrom}&dateTo=${dateTo}&rrdid=${rrdid}&limit=${limit}`, {
      headers
    });
    
    console.log(`[FETCH-DETAIL] Статус ответа: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`[FETCH-DETAIL] Запрос вернул ошибку: ${response.status} ${response.statusText}`);
      throw new Error(`[FETCH-DETAIL] Запрос вернул ошибку: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`[FETCH-DETAIL] Получено записей: ${data ? data.length : 0}`);
    
    if (data && data.length > 0) {
      console.log(`[FETCH-DETAIL] Пример первой записи: ${JSON.stringify(data[0]).substring(0, 300)}...`);
      console.log(`[FETCH-DETAIL] Пример последней записи: ${JSON.stringify(data[data.length - 1]).substring(0, 300)}...`);
    }
    
    // Определяем ID для следующего запроса
    let nextRrdid = 0;
    if (data && data.length > 0) {
      const lastRecord = data[data.length - 1];
      nextRrdid = lastRecord.rrd_id || 0;
      console.log(`[FETCH-DETAIL] Следующий rrdid: ${nextRrdid}`);
    }
    
    return { data, nextRrdid };
  } catch (error) {
    console.error("[FETCH-DETAIL] Ошибка при загрузке отчета:", error);
    if (error instanceof Error) {
      console.error(`[FETCH-DETAIL] Сообщение ошибки: ${error.message}`);
      console.error(`[FETCH-DETAIL] Стек вызовов: ${error.stack}`);
    }
    return { data: [], nextRrdid: 0 };
  }
};

/**
 * Загружает все данные отчета с поддержкой пагинации
 */
const fetchAllReportDetails = async (apiKey: string, dateFrom: string, dateTo: string) => {
  let allData: any[] = [];
  let nextRrdid = 0;
  let hasMoreData = true;
  let pageCount = 0;
  
  console.log("[FETCH-ALL] Начинаем пагинацию для получения всех данных отчета...");
  console.log(`[FETCH-ALL] Диапазон дат: ${dateFrom} - ${dateTo}`);
  
  while (hasMoreData) {
    pageCount++;
    console.log(`[FETCH-ALL] Загрузка страницы ${pageCount} с rrdid ${nextRrdid}...`);
    
    const result = await fetchReportDetail(apiKey, dateFrom, dateTo, nextRrdid);
    const data = result.data;
    
    if (!data || data.length === 0) {
      console.log(`[FETCH-ALL] Страница ${pageCount} вернула 0 строк, завершаем пагинацию.`);
      hasMoreData = false;
      continue;
    }
    
    allData = [...allData, ...data];
    
    // Получаем идентификатор для следующего запроса
    const prevRrdid = nextRrdid;
    nextRrdid = result.nextRrdid;
    
    console.log(`[FETCH-ALL] Страница ${pageCount}: получено ${data.length} записей, последний rrdid: ${nextRrdid}`);
    
    // Если вернулось меньше записей, чем размер страницы, или если rrdid не изменился, значит данных больше нет
    if (data.length < 100000 || nextRrdid === 0 || nextRrdid === prevRrdid) {
      console.log(`[FETCH-ALL] Конец пагинации достигнут после ${pageCount} страниц. Всего записей: ${allData.length}`);
      hasMoreData = false;
    }
  }
  
  console.log(`[FETCH-ALL] Завершена загрузка всех страниц. Всего записей: ${allData.length}`);
  return allData;
};

/**
 * Рассчитывает среднее количество продаж в день для каждого товара
 */
const calculateAverageDailySalesPerProduct = (data: any[], dateFrom: string, dateTo: string): Record<number, number> => {
  console.log(`[CALC-AVG] Начинаем расчет средних продаж для ${data.length} записей за период ${dateFrom} - ${dateTo}`);
  
  const salesByProduct: Record<number, {
    totalSalesQuantity: number
  }> = {};
  
  // Логируем типы документов для отладки
  const docTypes = new Set<string>();
  data.forEach(record => {
    if (record.doc_type_name) {
      docTypes.add(record.doc_type_name);
    }
  });
  console.log(`[CALC-AVG] Типы документов в данных: ${Array.from(docTypes).join(', ')}`);
  
  // Суммируем количество продаж для каждого товара
  for (const record of data) {
    const nmId = record.nm_id;
    if (!nmId) {
      continue;
    }
    
    if (!salesByProduct[nmId]) {
      salesByProduct[nmId] = {
        totalSalesQuantity: 0
      };
    }
    
    if (record.doc_type_name === 'Продажа') {
      const quantity = record.quantity || 0;
      salesByProduct[nmId].totalSalesQuantity += quantity;
    }
  }
  
  console.log(`[CALC-AVG] Обработано товаров: ${Object.keys(salesByProduct).length}`);
  
  // Рассчитываем количество дней в периоде
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  console.log(`[CALC-AVG] Количество дней в периоде: ${daysInPeriod}`);
  
  // Рассчитываем среднее количество продаж в день для каждого товара
  const averageSalesPerDay: Record<number, number> = {};
  
  for (const [nmIdStr, data] of Object.entries(salesByProduct)) {
    const nmId = parseInt(nmIdStr);
    const averageSales = daysInPeriod > 0 ? data.totalSalesQuantity / daysInPeriod : 0;
    averageSalesPerDay[nmId] = parseFloat(averageSales.toFixed(2));
  }
  
  // Логируем примеры средних продаж для отладки
  const examples = Object.entries(averageSalesPerDay)
    .slice(0, 5)
    .map(([nmId, avg]) => `nmId ${nmId}: ${avg} шт/день`);
  
  console.log(`[CALC-AVG] Примеры средних продаж: ${examples.join(', ')}`);
  console.log(`[CALC-AVG] Всего рассчитаны средние продажи для ${Object.keys(averageSalesPerDay).length} товаров за ${daysInPeriod} дней`);
  
  return averageSalesPerDay;
};
