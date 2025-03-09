
import { Store, STORES_STORAGE_KEY, STATS_STORAGE_KEY, ORDERS_STORAGE_KEY, SALES_STORAGE_KEY, WildberriesOrder, WildberriesSale } from "@/types/store";
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
  const storesWithTimestamp = {
    stores,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
  localStorage.setItem(`${STORES_STORAGE_KEY}_timestamp`, Date.now().toString());
  
  const selectedStore = stores.find(s => s.isSelected);
  if (selectedStore) {
    localStorage.setItem('last_selected_store', JSON.stringify({
      storeId: selectedStore.id,
      timestamp: Date.now()
    }));
  }
  
  window.dispatchEvent(new CustomEvent('stores-updated', { 
    detail: { stores, timestamp: Date.now() } 
  }));
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
        
        const deductionsTimeline = stats.dailySales?.map((day: any) => {
          const daysCount = stats.dailySales?.length || 1;
          const logistic = (stats.currentPeriod.expenses.logistics || 0) / daysCount;
          const storage = (stats.currentPeriod.expenses.storage || 0) / daysCount;
          const penalties = (stats.currentPeriod.expenses.penalties || 0) / daysCount;
          const acceptance = (stats.currentPeriod.expenses.acceptance || 0) / daysCount;
          const advertising = (stats.currentPeriod.expenses.advertising || 0) / daysCount;
          const deductions = (stats.currentPeriod.expenses.deductions || 0) / daysCount;
          
          return {
            date: typeof day.date === 'string' ? day.date.split('T')[0] : new Date().toISOString().split('T')[0],
            logistic,
            storage,
            penalties,
            acceptance,
            advertising,
            deductions
          };
        }) || [];
        
        const analyticsData = {
          storeId: store.id,
          dateFrom: from.toISOString(),
          dateTo: to.toISOString(),
          data: stats,
          penalties: [],
          returns: [],
          deductions: [],
          deductionsTimeline,
          productAdvertisingData: [],
          advertisingBreakdown: { search: 0 },
          timestamp: Date.now()
        };
        
        // Сохраняем данные только в localStorage (не в БД)
        localStorage.setItem(`marketplace_analytics_${store.id}`, JSON.stringify(analyticsData));
        
        return updatedStore;
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
      return store;
    }
  }
  return store;
};

export const getOrdersData = async (storeId: string) => {
  try {
    // Используем только localStorage
    const storedData = localStorage.getItem(`${ORDERS_STORAGE_KEY}_${storeId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error fetching orders from localStorage:', error);
  }
  return null;
};

export const getSalesData = async (storeId: string) => {
  try {
    // Используем только localStorage
    const storedData = localStorage.getItem(`${SALES_STORAGE_KEY}_${storeId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error fetching sales from localStorage:', error);
  }
  return null;
};

export const fetchAndUpdateOrders = async (store: Store) => {
  if (store.marketplace === "Wildberries") {
    try {
      const { from } = getLastWeekDateRange();
      const orders = await fetchWildberriesOrders(store.apiKey, from);
      
      if (orders && orders.length > 0) {
        const warehouseCounts: Record<string, number> = {};
        const totalOrders = orders.length;
        
        orders.forEach(order => {
          if (order.warehouseName) {
            warehouseCounts[order.warehouseName] = (warehouseCounts[order.warehouseName] || 0) + 1;
          }
        });
        
        const warehouseDistribution = Object.entries(warehouseCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: (count / totalOrders) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        const regionCounts: Record<string, number> = {};
        
        orders.forEach(order => {
          if (order.regionName) {
            regionCounts[order.regionName] = (regionCounts[order.regionName] || 0) + 1;
          }
        });
        
        const regionDistribution = Object.entries(regionCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: (count / totalOrders) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        const ordersData = {
          storeId: store.id,
          dateFrom: from.toISOString(),
          dateTo: new Date().toISOString(),
          orders,
          warehouseDistribution,
          regionDistribution,
          timestamp: Date.now()
        };
        
        // Сохраняем только в localStorage (не в БД)
        localStorage.setItem(`${ORDERS_STORAGE_KEY}_${store.id}`, JSON.stringify(ordersData));
        
        return {
          orders,
          warehouseDistribution,
          regionDistribution
        };
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }
  return null;
};

export const fetchAndUpdateSales = async (store: Store) => {
  if (store.marketplace === "Wildberries") {
    try {
      const { from } = getLastWeekDateRange();
      const sales = await fetchWildberriesSales(store.apiKey, from);
      
      if (sales && sales.length > 0) {
        const salesData = {
          storeId: store.id,
          dateFrom: from.toISOString(),
          dateTo: new Date().toISOString(),
          sales,
          timestamp: Date.now()
        };
        
        // Сохраняем только в localStorage (не в БД)
        localStorage.setItem(`${SALES_STORAGE_KEY}_${store.id}`, JSON.stringify(salesData));
        
        return sales;
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  }
  return null;
};

export const getProductProfitabilityData = (storeId: string) => {
  try {
    // Получаем данные только из localStorage
    try {
      const storedData = localStorage.getItem(`products_detailed_${storeId}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return {
          profitableProducts: parsedData.profitableProducts?.slice(0, 3) || [],
          unprofitableProducts: parsedData.unprofitableProducts?.slice(0, 3) || [],
          updateDate: parsedData.updateDate
        };
      }
      
      const analyticsData = localStorage.getItem(`marketplace_analytics_${storeId}`);
      if (analyticsData) {
        const parsedData = JSON.parse(analyticsData);
        return {
          profitableProducts: (parsedData.data.topProfitableProducts || []).slice(0, 3),
          unprofitableProducts: (parsedData.data.topUnprofitableProducts || []).slice(0, 3),
          updateDate: parsedData.dateTo
        };
      }
    } catch (innerError) {
      console.error('Error parsing local storage data:', innerError);
    }
  } catch (error) {
    console.error('Error in getProductProfitabilityData:', error);
  }
  
  return {
    profitableProducts: [],
    unprofitableProducts: [],
    updateDate: null
  };
};

export const getAnalyticsData = (storeId: string, forceRefresh?: boolean) => {
  if (forceRefresh) {
    console.log('Forced refresh requested, returning default structure');
    return {
      data: null,
      penalties: [],
      returns: [],
      deductions: [],
      deductionsTimeline: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logistic: 0,
        storage: 0, 
        penalties: 0,
        acceptance: 0,
        advertising: 0,
        deductions: 0
      })),
      productAdvertisingData: [],
      advertisingBreakdown: { search: 0 },
      timestamp: Date.now()
    };
  }
  
  try {
    // Получаем данные только из localStorage
    try {
      const key = `marketplace_analytics_${storeId}`;
      const storedData = localStorage.getItem(key);
      
      if (storedData) {
        let parsedData = JSON.parse(storedData);
        
        if (!parsedData.timestamp) {
          parsedData.timestamp = Date.now();
        }
        
        if (!parsedData.deductionsTimeline || !Array.isArray(parsedData.deductionsTimeline) || parsedData.deductionsTimeline.length === 0) {
          console.log("Creating default deductionsTimeline data");
          parsedData.deductionsTimeline = Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            logistic: 0,
            storage: 0, 
            penalties: 0,
            acceptance: 0,
            advertising: 0,
            deductions: 0
          }));
        } else {
          parsedData.deductionsTimeline = parsedData.deductionsTimeline.map((item: any) => ({
            date: item.date || new Date().toISOString().split('T')[0],
            logistic: item.logistic || 0,
            storage: item.storage || 0,
            penalties: item.penalties || 0,
            acceptance: item.acceptance || 0,
            advertising: item.advertising || 0,
            deductions: item.deductions || 0
          }));
        }
        
        if (!parsedData.penalties || !Array.isArray(parsedData.penalties)) {
          parsedData.penalties = [];
        }
        
        if (!parsedData.returns || !Array.isArray(parsedData.returns)) {
          parsedData.returns = [];
        }
        
        if (!parsedData.deductions || !Array.isArray(parsedData.deductions)) {
          parsedData.deductions = [];
        }
        
        if (!parsedData.productAdvertisingData || !Array.isArray(parsedData.productAdvertisingData)) {
          parsedData.productAdvertisingData = [];
        }
        
        if (!parsedData.advertisingBreakdown) {
          parsedData.advertisingBreakdown = { search: 0 };
        }
        
        if (parsedData.data && parsedData.data.currentPeriod && parsedData.data.currentPeriod.expenses) {
          parsedData.data.currentPeriod.expenses.advertising = parsedData.data.currentPeriod.expenses.advertising || 0;
          parsedData.data.currentPeriod.expenses.acceptance = parsedData.data.currentPeriod.expenses.acceptance || 0;
          parsedData.data.currentPeriod.expenses.deductions = parsedData.data.currentPeriod.expenses.deductions || 0;
        }
        
        return parsedData;
      }
    } catch (localError) {
      console.error('Error parsing localStorage analytics data:', localError);
    }
  } catch (error) {
    console.error('Error in getAnalyticsData:', error);
  }
  
  // Return default structure if nothing was found
  return {
    data: null,
    penalties: [],
    returns: [],
    deductions: [],
    deductionsTimeline: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      logistic: 0,
      storage: 0, 
      penalties: 0,
      acceptance: 0,
      advertising: 0,
      deductions: 0
    })),
    productAdvertisingData: [],
    advertisingBreakdown: { search: 0 },
    timestamp: Date.now()
  };
};

export const getStoresLastUpdateTime = (): number => {
  const timestamp = localStorage.getItem(`${STORES_STORAGE_KEY}_timestamp`);
  return timestamp ? parseInt(timestamp, 10) : 0;
};

export const ensureStoreSelectionPersistence = (): Store[] => {
  const stores = loadStores();
  
  const hasSelectedStore = stores.some(store => store.isSelected);
  
  if (!hasSelectedStore && stores.length > 0) {
    const lastSelectedStoreData = localStorage.getItem('last_selected_store');
    
    if (lastSelectedStoreData) {
      try {
        const { storeId } = JSON.parse(lastSelectedStoreData);
        const updatedStores = stores.map(store => ({
          ...store,
          isSelected: store.id === storeId
        }));
        
        saveStores(updatedStores);
        return updatedStores;
      } catch (error) {
        console.error('Error restoring store selection:', error);
      }
    }
    
    if (stores.length > 0) {
      const updatedStores = stores.map((store, index) => ({
        ...store,
        isSelected: index === 0
      }));
      
      saveStores(updatedStores);
      return updatedStores;
    }
  }
  
  return stores;
};

// Функция для получения выбранного магазина
export const getSelectedStore = (): Store | null => {
  try {
    const stores = JSON.parse(localStorage.getItem('marketplace_stores') || '[]');
    return stores.find((store: Store) => store.isSelected) || null;
  } catch (error) {
    console.error('Error getting selected store:', error);
    return null;
  }
};

// Implementing missing functions with minimal logic for TypeScript compatibility
export const getOrdersData = async (storeId: string) => {
  try {
    // Use only localStorage
    const storedData = localStorage.getItem(`${ORDERS_STORAGE_KEY}_${storeId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error fetching orders from localStorage:', error);
  }
  return null;
};

export const getSalesData = async (storeId: string) => {
  try {
    // Use only localStorage
    const storedData = localStorage.getItem(`${SALES_STORAGE_KEY}_${storeId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Error fetching sales from localStorage:', error);
  }
  return null;
};

export const fetchAndUpdateOrders = async (store: Store) => {
  if (store.marketplace === "Wildberries") {
    try {
      const { from } = getLastWeekDateRange();
      const orders = await fetchWildberriesOrders(store.apiKey, from);
      
      if (orders && orders.length > 0) {
        const warehouseCounts: Record<string, number> = {};
        const totalOrders = orders.length;
        
        orders.forEach((order: any) => {
          if (order.warehouseName) {
            warehouseCounts[order.warehouseName] = (warehouseCounts[order.warehouseName] || 0) + 1;
          }
        });
        
        const warehouseDistribution = Object.entries(warehouseCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: (count / totalOrders) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        const regionCounts: Record<string, number> = {};
        
        orders.forEach((order: any) => {
          if (order.regionName) {
            regionCounts[order.regionName] = (regionCounts[order.regionName] || 0) + 1;
          }
        });
        
        const regionDistribution = Object.entries(regionCounts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: (count / totalOrders) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        const ordersData = {
          storeId: store.id,
          dateFrom: from.toISOString(),
          dateTo: new Date().toISOString(),
          orders,
          warehouseDistribution,
          regionDistribution,
          timestamp: Date.now()
        };
        
        // Save to localStorage only
        localStorage.setItem(`${ORDERS_STORAGE_KEY}_${store.id}`, JSON.stringify(ordersData));
        
        return {
          orders,
          warehouseDistribution,
          regionDistribution
        };
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }
  return null;
};

export const fetchAndUpdateSales = async (store: Store) => {
  if (store.marketplace === "Wildberries") {
    try {
      const { from } = getLastWeekDateRange();
      const sales = await fetchWildberriesSales(store.apiKey, from);
      
      if (sales && sales.length > 0) {
        const salesData = {
          storeId: store.id,
          dateFrom: from.toISOString(),
          dateTo: new Date().toISOString(),
          sales,
          timestamp: Date.now()
        };
        
        // Save to localStorage only
        localStorage.setItem(`${SALES_STORAGE_KEY}_${store.id}`, JSON.stringify(salesData));
        
        return sales;
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  }
  return null;
};
