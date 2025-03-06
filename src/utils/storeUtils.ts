
import { Store, STORES_STORAGE_KEY, STATS_STORAGE_KEY } from "@/types/store";
import { fetchWildberriesStats, fetchWildberriesOrders, fetchWildberriesSales } from "@/services/wildberriesApi";

export const getLastWeekDateRange = () => {
  const now = new Date();
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  return { from: lastWeek, to: now };
};

export const loadStores = (): Store[] => {
  const savedStores = localStorage.getItem(STORES_STORAGE_KEY);
  return savedStores ? JSON.parse(savedStores) : [];
};

export const saveStores = (stores: Store[]): void => {
  localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
};

export const refreshStoreStats = async (store: Store): Promise<Store | null> => {
  if (store.marketplace === "Wildberries") {
    try {
      const { from, to } = getLastWeekDateRange();
      const stats = await fetchWildberriesStats(store.apiKey, from, to);
      if (stats) {
        const updatedStore = { 
          ...store, 
          stats,
          lastFetchDate: new Date().toISOString() 
        };
        
        // Создаем базовую структуру для deductionsTimeline, если она отсутствует
        const deductionsTimeline = stats.dailySales?.map((day: any) => {
          const daysCount = stats.dailySales.length || 1;
          const logistic = (stats.currentPeriod.expenses.logistics || 0) / daysCount;
          const storage = (stats.currentPeriod.expenses.storage || 0) / daysCount;
          const penalties = (stats.currentPeriod.expenses.penalties || 0) / daysCount;
          const acceptance = (stats.currentPeriod.expenses.acceptance || 0) / daysCount;
          const advertising = (stats.currentPeriod.expenses.advertising || 0) / daysCount;
          
          return {
            date: typeof day.date === 'string' ? day.date.split('T')[0] : new Date().toISOString().split('T')[0],
            logistic,
            storage,
            penalties,
            acceptance,
            advertising
          };
        }) || [];
        
        // Генерируем уникальный timestamp для данных, чтобы предотвратить кэширование
        const timestamp = Date.now();
        
        // Сохраняем полные данные статистики, включая топовые продукты с их изображениями
        localStorage.setItem(`${STATS_STORAGE_KEY}_${store.id}`, JSON.stringify({
          storeId: store.id,
          dateFrom: from.toISOString(),
          dateTo: to.toISOString(),
          stats: stats,
          deductionsTimeline: deductionsTimeline,
          timestamp: timestamp
        }));
        
        // Также сохраняем данные для аналитики с обновленной структурой
        localStorage.setItem(`marketplace_analytics_${store.id}`, JSON.stringify({
          storeId: store.id,
          dateFrom: from.toISOString(),
          dateTo: to.toISOString(),
          data: stats,
          deductionsTimeline: deductionsTimeline,
          // Новые данные для дашборда
          ordersByRegion: stats.ordersByRegion || [],
          ordersByWarehouse: stats.ordersByWarehouse || [],
          penalties: stats.penaltiesData || [],
          returns: [],
          productAdvertisingData: [],
          advertisingBreakdown: { search: stats.currentPeriod.expenses.advertising || 0 },
          timestamp: timestamp
        }));
        
        // Детализированные данные по продуктам для раздела товаров с тем же timestamp
        if (stats.topProfitableProducts || stats.topUnprofitableProducts) {
          localStorage.setItem(`products_detailed_${store.id}`, JSON.stringify({
            profitableProducts: stats.topProfitableProducts || [],
            unprofitableProducts: stats.topUnprofitableProducts || [],
            updateDate: new Date().toISOString(),
            timestamp: timestamp
          }));
        }
        
        return updatedStore;
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
      // Return store without stats on error
      return store;
    }
  }
  return store;
};

// Получение данных о доходности товаров для конкретного магазина
export const getProductProfitabilityData = (storeId: string) => {
  try {
    const storedData = localStorage.getItem(`products_detailed_${storeId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
    
    // Также пробуем загрузить из аналитики, если специальные данные не найдены
    const analyticsData = localStorage.getItem(`marketplace_analytics_${storeId}`);
    if (analyticsData) {
      const parsedData = JSON.parse(analyticsData);
      return {
        profitableProducts: parsedData.data.topProfitableProducts || [],
        unprofitableProducts: parsedData.data.topUnprofitableProducts || [],
        updateDate: parsedData.dateTo
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error loading product profitability data:', error);
    return null;
  }
};

// Получение данных аналитики с проверкой обязательных полей и принудительным обновлением при наличии параметра forceRefresh
export const getAnalyticsData = (storeId: string, forceRefresh?: boolean) => {
  try {
    const key = `marketplace_analytics_${storeId}`;
    const storedData = localStorage.getItem(key);
    
    // Если данные отсутствуют или запрошено принудительное обновление, возвращаем пустую структуру
    if (!storedData || forceRefresh) {
      console.log('Analytics data not found or forced refresh requested, returning default structure');
      // Возвращаем базовую структуру с демо-данными
      return {
        data: {
          currentPeriod: {
            sales: 0,
            transferred: 0,
            expenses: {
              total: 0,
              logistics: 0,
              storage: 0,
              penalties: 0,
              advertising: 0,
              acceptance: 0
            },
            netProfit: 0,
            acceptance: 0,
            orders: 0,
            returns: 0,
            cancellations: 0
          }
        },
        ordersByRegion: [],
        ordersByWarehouse: [],
        penalties: [],
        returns: [],
        deductionsTimeline: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          logistic: 0,
          storage: 0, 
          penalties: 0,
          acceptance: 0,
          advertising: 0
        })),
        productAdvertisingData: [],
        advertisingBreakdown: { search: 0 },
        timestamp: Date.now() // Добавляем текущий timestamp
      };
    }
    
    let parsedData = JSON.parse(storedData);
    
    // Добавляем timestamp, если отсутствует
    if (!parsedData.timestamp) {
      parsedData.timestamp = Date.now();
    }
    
    // Проверяем наличие обязательных полей и устанавливаем значения по умолчанию
    if (!parsedData.deductionsTimeline || !Array.isArray(parsedData.deductionsTimeline) || parsedData.deductionsTimeline.length === 0) {
      console.log("Creating default deductionsTimeline data");
      parsedData.deductionsTimeline = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logistic: 0,
        storage: 0, 
        penalties: 0,
        acceptance: 0,
        advertising: 0
      }));
    } else {
      // Ensure all items in deductionsTimeline have all required properties
      parsedData.deductionsTimeline = parsedData.deductionsTimeline.map((item: any) => ({
        date: item.date || new Date().toISOString().split('T')[0],
        logistic: item.logistic || 0,
        storage: item.storage || 0,
        penalties: item.penalties || 0,
        acceptance: item.acceptance || 0,
        advertising: item.advertising || 0
      }));
    }
    
    // Проверка на наличие новых полей в data
    if (parsedData.data && parsedData.data.currentPeriod) {
      if (!parsedData.data.currentPeriod.orders) {
        parsedData.data.currentPeriod.orders = 0;
      }
      if (!parsedData.data.currentPeriod.returns) {
        parsedData.data.currentPeriod.returns = 0;
      }
      if (!parsedData.data.currentPeriod.cancellations) {
        parsedData.data.currentPeriod.cancellations = 0;
      }
    }
    
    // Проверка на наличие данных по регионам и складам
    if (!parsedData.ordersByRegion || !Array.isArray(parsedData.ordersByRegion)) {
      parsedData.ordersByRegion = [];
    }
    
    if (!parsedData.ordersByWarehouse || !Array.isArray(parsedData.ordersByWarehouse)) {
      parsedData.ordersByWarehouse = [];
    }
    
    if (!parsedData.penalties || !Array.isArray(parsedData.penalties)) {
      parsedData.penalties = [];
    }
    
    if (!parsedData.returns || !Array.isArray(parsedData.returns)) {
      parsedData.returns = [];
    }
    
    if (!parsedData.productAdvertisingData || !Array.isArray(parsedData.productAdvertisingData)) {
      parsedData.productAdvertisingData = [];
    }
    
    if (!parsedData.advertisingBreakdown) {
      parsedData.advertisingBreakdown = { search: 0 };
    }
    
    if (parsedData.data && parsedData.data.currentPeriod && parsedData.data.currentPeriod.expenses) {
      // Ensure all expense fields exist
      parsedData.data.currentPeriod.expenses.advertising = parsedData.data.currentPeriod.expenses.advertising || 0;
      parsedData.data.currentPeriod.expenses.acceptance = parsedData.data.currentPeriod.expenses.acceptance || 0;
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error loading analytics data:', error);
    // Возвращаем базовую структуру в случае ошибки
    return {
      data: {
        currentPeriod: {
          sales: 0,
          transferred: 0,
          expenses: {
            total: 0,
            logistics: 0,
            storage: 0,
            penalties: 0,
            advertising: 0,
            acceptance: 0
          },
          netProfit: 0,
          acceptance: 0,
          orders: 0,
          returns: 0,
          cancellations: 0
        }
      },
      ordersByRegion: [],
      ordersByWarehouse: [],
      penalties: [],
      returns: [],
      deductionsTimeline: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logistic: 0,
        storage: 0, 
        penalties: 0,
        acceptance: 0,
        advertising: 0
      })),
      productAdvertisingData: [],
      advertisingBreakdown: { search: 0 },
      timestamp: Date.now() // Добавляем текущий timestamp
    };
  }
};

// Функция для получения статистики заказов с сервера Wildberries
export const fetchOrdersStatistics = async (apiKey: string, from: Date, to: Date) => {
  try {
    // Получаем данные о заказах
    const orders = await fetchWildberriesOrders(apiKey, from, to);
    
    // Получаем данные о продажах
    const sales = await fetchWildberriesSales(apiKey, from, to);
    
    // Группируем данные по регионам
    const regionMap = new Map<string, number>();
    orders.forEach(order => {
      const region = order.regionName || 'Неизвестный регион';
      const currentCount = regionMap.get(region) || 0;
      regionMap.set(region, currentCount + 1);
    });
    
    const topRegions = Array.from(regionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([region, count]) => ({ region, count }));
      
    // Группируем данные по складам
    const warehouseMap = new Map<string, number>();
    orders.forEach(order => {
      const warehouse = order.warehouseName || 'Неизвестный склад';
      const currentCount = warehouseMap.get(warehouse) || 0;
      warehouseMap.set(warehouse, currentCount + 1);
    });
    
    const topWarehouses = Array.from(warehouseMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([warehouse, count]) => ({ warehouse, count }));
    
    // Группируем данные по категориям
    const categoryMap = new Map<string, number>();
    orders.forEach(order => {
      const category = order.category || 'Неизвестная категория';
      const currentCount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentCount + 1);
    });
    
    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
    
    return {
      totalOrders: orders.length,
      totalSales: sales.filter(sale => sale.saleID.startsWith('S')).length,
      totalReturns: sales.filter(sale => sale.saleID.startsWith('R')).length,
      totalCancellations: orders.filter(order => order.isCancel).length,
      topRegions,
      topWarehouses,
      topCategories
    };
  } catch (error) {
    console.error('Error fetching orders statistics:', error);
    throw error;
  }
};
