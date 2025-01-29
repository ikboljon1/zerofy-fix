import { differenceInMonths, subMonths } from 'date-fns';

export interface WildberriesReportItem {
  date: string;
  quantity: number;
  acceptedQuantity: number;
  acceptedAmount: number;
  storageAmount: number;
  logisticAmount: number;
  penaltyAmount: number;
  sale: number;
  ppvz_for_pay: number;
  acceptance: number;
}

export interface WildberriesResponse {
  currentPeriod: {
    sales: number;
    transferred: number;
    expenses: {
      total: number;
      logistics: number;
      storage: number;
      penalties: number;
    };
    netProfit: number;
    acceptance: number;
  };
  previousPeriod: {
    sales: number;
    transferred: number;
    expenses: {
      total: number;
      logistics: number;
      storage: number;
      penalties: number;
    };
    netProfit: number;
    acceptance: number;
  };
  salesTrend: Array<{
    date: string;
    currentValue: number;
    previousValue: number;
  }>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retries = 5, baseDelay = 2000) => {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      await delay(i > 0 ? baseDelay * Math.pow(2, i - 1) : 0); // Add initial delay for retries
      
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, i);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
        await delay(waitTime);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error;
      if (i === retries - 1) break;
      
      const waitTime = baseDelay * Math.pow(2, i);
      console.log(`Request failed. Waiting ${waitTime}ms before retry ${i + 1}/${retries}`);
    }
  }
  
  throw lastError || new Error('Max retries reached');
};

export const fetchWildberriesStats = async (
  apiKey: string, 
  dateFrom: Date, 
  dateTo: Date
): Promise<WildberriesResponse> => {
  try {
    const monthsDiff = differenceInMonths(dateTo, dateFrom) + 1;
    const previousDateFrom = subMonths(dateFrom, monthsDiff);
    const previousDateTo = subMonths(dateTo, monthsDiff);

    // Sequential requests instead of parallel to avoid rate limits
    const currentUrl = new URL('https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod');
    currentUrl.searchParams.append('dateFrom', dateFrom.toISOString().split('T')[0]);
    currentUrl.searchParams.append('dateTo', dateTo.toISOString().split('T')[0]);
    currentUrl.searchParams.append('limit', '100000');

    const previousUrl = new URL('https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod');
    previousUrl.searchParams.append('dateFrom', previousDateFrom.toISOString().split('T')[0]);
    previousUrl.searchParams.append('dateTo', previousDateTo.toISOString().split('T')[0]);
    previousUrl.searchParams.append('limit', '100000');

    // Make requests sequentially with delay between them
    const currentData = await fetchWithRetry(currentUrl.toString(), {
      headers: { 'Authorization': apiKey }
    });
    
    await delay(3000); // Wait 3 seconds between requests
    
    const previousData = await fetchWithRetry(previousUrl.toString(), {
      headers: { 'Authorization': apiKey }
    });

    // Process current period data
    const currentSalesData = currentData.filter((item: WildberriesReportItem) => item.quantity > 0);
    const currentTotalExpenses = currentSalesData.reduce((sum: number, item: WildberriesReportItem) => {
      return sum + 
        (item.acceptance || 0) +
        (item.storageAmount || 0) +
        (item.logisticAmount || 0) +
        (item.penaltyAmount || 0);
    }, 0);

    // Process previous period data
    const previousSalesData = previousData.filter((item: WildberriesReportItem) => item.quantity > 0);
    const previousTotalExpenses = previousSalesData.reduce((sum: number, item: WildberriesReportItem) => {
      return sum + 
        (item.acceptance || 0) +
        (item.storageAmount || 0) +
        (item.logisticAmount || 0) +
        (item.penaltyAmount || 0);
    }, 0);

    // Calculate current period stats
    const currentStats = {
      sales: currentSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.sale || 0), 0),
      transferred: currentSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.ppvz_for_pay || 0), 0),
      expenses: {
        total: currentTotalExpenses,
        logistics: currentSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.logisticAmount || 0), 0),
        storage: currentSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.storageAmount || 0), 0),
        penalties: currentSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.penaltyAmount || 0), 0)
      },
      acceptance: currentSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.acceptance || 0), 0),
      netProfit: 0
    };
    currentStats.netProfit = currentStats.transferred - currentStats.expenses.total;

    // Calculate previous period stats
    const previousStats = {
      sales: previousSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.sale || 0), 0),
      transferred: previousSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.ppvz_for_pay || 0), 0),
      expenses: {
        total: previousTotalExpenses,
        logistics: previousSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.logisticAmount || 0), 0),
        storage: previousSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.storageAmount || 0), 0),
        penalties: previousSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.penaltyAmount || 0), 0)
      },
      acceptance: previousSalesData.reduce((sum: number, item: WildberriesReportItem) => sum + (item.acceptance || 0), 0),
      netProfit: 0
    };
    previousStats.netProfit = previousStats.transferred - previousStats.expenses.total;

    // Prepare sales trend data
    const salesByDate = new Map();
    const previousSalesByDate = new Map();

    currentSalesData.forEach((item: WildberriesReportItem) => {
      const date = item.date.split('T')[0];
      salesByDate.set(date, (salesByDate.get(date) || 0) + (item.sale || 0));
    });

    previousSalesData.forEach((item: WildberriesReportItem) => {
      const date = item.date.split('T')[0];
      previousSalesByDate.set(date, (previousSalesByDate.get(date) || 0) + (item.sale || 0));
    });

    const salesTrend = Array.from(salesByDate.entries()).map(([date, value]) => ({
      date,
      currentValue: value,
      previousValue: previousSalesByDate.get(date) || 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      currentPeriod: currentStats,
      previousPeriod: previousStats,
      salesTrend
    };

  } catch (error) {
    console.error('Error fetching Wildberries stats:', error);
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('Превышен лимит запросов к API. Пожалуйста, подождите немного и попробуйте снова.');
      }
    }
    throw new Error('Не удалось загрузить статистику Wildberries');
  }
};