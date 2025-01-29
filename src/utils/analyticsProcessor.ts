interface WildberriesReportData {
  doc_type_name: string;
  retail_price: number;
  quantity: number;
  retail_amount: number;
  ppvz_for_pay: number;
  delivery_rub: number;
  ppvz_sales_commission: number;
  penalty: number;
  storage_fee: number;
  additional_payment: number;
  acquiring_fee: number;
  deduction: number;
  acceptance: number;
  commission_percent: number;
  nm_id: string;
  subject_name: string;
  sale_dt: string;
}

export interface ProcessedAnalytics {
  generalSalesAnalytics: {
    totalSalesVolume: number;
    totalOrdersCount: number;
    totalReturnsCount: number;
    returnRate: number;
  };
  productSalesAnalysis: {
    [key: string]: {
      productName: string;
      quantitySold: number;
      salesAmount: number;
      averagePrice: number;
      profit: number;
      profitability: number;
      ordersCount: number;
      returnsCount: number;
      returnRate: number;
    };
  };
  returnsAnalysis: {
    [key: string]: {
      productName: string;
      ordersCount: number;
      returnsCount: number;
      returnRate: number;
    };
  };
  profitabilityAnalysis: {
    [key: string]: {
      productName: string;
      profit: number;
    };
  };
}

const CACHE_KEY = 'analytics_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

interface CacheData {
  timestamp: number;
  data: ProcessedAnalytics;
}

export const processAnalyticsData = (
  data: WildberriesReportData[], 
  startDate: string, 
  endDate: string
): ProcessedAnalytics => {
  const cacheKey = `${CACHE_KEY}_${startDate}_${endDate}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const parsed: CacheData = JSON.parse(cachedData);
    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
      return parsed.data;
    }
    localStorage.removeItem(cacheKey);
  }

  // Filter data by period
  const filteredData = data.filter(item => {
    const itemDate = new Date(item.sale_dt);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return itemDate >= start && itemDate <= end;
  });

  const salesData = filteredData.filter(item => item.doc_type_name === 'Продажа');
  const returnsData = filteredData.filter(item => item.doc_type_name === 'Возврат');

  // Calculate total sales volume from filtered data only
  const totalSalesVolume = salesData.reduce((sum, item) => {
    const saleAmount = item.retail_price * item.quantity;
    return sum + saleAmount;
  }, 0);

  const totalOrdersCount = salesData.length;
  const totalReturnsCount = returnsData.length;
  const returnRate = totalOrdersCount > 0 
    ? (totalReturnsCount / totalOrdersCount) * 100 
    : 0;

  // Product Analysis with filtered data
  const productAnalysis = filteredData.reduce((acc: any, item) => {
    if (!acc[item.nm_id]) {
      acc[item.nm_id] = {
        productName: item.subject_name,
        quantitySold: 0,
        salesAmount: 0,
        averagePrice: 0,
        profit: 0,
        profitability: 0,
        ordersCount: 0,
        returnsCount: 0,
        returnRate: 0,
        totalExpenses: 0
      };
    }

    const record = acc[item.nm_id];

    if (item.doc_type_name === 'Продажа') {
      record.quantitySold += item.quantity;
      record.salesAmount += item.retail_price * item.quantity;
      record.ordersCount += 1;
    } else if (item.doc_type_name === 'Возврат') {
      record.returnsCount += 1;
      record.totalExpenses += item.retail_amount;
    }

    record.totalExpenses += (
      item.delivery_rub +
      item.storage_fee +
      item.penalty +
      item.additional_payment +
      item.deduction +
      item.acceptance
    );

    record.profit = item.ppvz_for_pay - record.totalExpenses;
    record.averagePrice = record.quantitySold > 0 ? record.salesAmount / record.quantitySold : 0;
    record.profitability = record.salesAmount > 0 
      ? (record.profit / record.salesAmount) * 100 
      : 0;
    record.returnRate = record.ordersCount > 0 
      ? (record.returnsCount / record.ordersCount) * 100 
      : 0;

    return acc;
  }, {});

  // Returns Analysis
  const returnsAnalysis = Object.entries(productAnalysis).reduce((acc: any, [key, value]: [string, any]) => {
    acc[key] = {
      productName: value.productName,
      ordersCount: value.ordersCount,
      returnsCount: value.returnsCount,
      returnRate: value.returnRate
    };
    return acc;
  }, {});

  // Profitability Analysis
  const profitabilityAnalysis = Object.entries(productAnalysis).reduce((acc: any, [key, value]: [string, any]) => {
    acc[key] = {
      productName: value.productName,
      profit: value.profit
    };
    return acc;
  }, {});

  const result = {
    generalSalesAnalytics: {
      totalSalesVolume,
      totalOrdersCount,
      totalReturnsCount,
      returnRate
    },
    productSalesAnalysis: productAnalysis,
    returnsAnalysis,
    profitabilityAnalysis
  };

  // Cache the results
  localStorage.setItem(cacheKey, JSON.stringify({
    timestamp: Date.now(),
    data: result
  }));

  return result;
};