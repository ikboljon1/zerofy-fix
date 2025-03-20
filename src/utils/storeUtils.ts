import { Store, STORES_STORAGE_KEY, STATS_STORAGE_KEY, ORDERS_STORAGE_KEY, SALES_STORAGE_KEY, WildberriesOrder, WildberriesSale } from "@/types/store";
import { fetchWildberriesStats, fetchWildberriesOrders, fetchWildberriesSales } from "@/services/wildberriesApi";
import { applyTariffRestrictions } from "@/data/tariffs";
import axios from "axios";
import { supabase } from "@/services/supabase";

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
          const daysCount = stats.dailySales.length || 1;
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
        
        try {
          await axios.post('http://localhost:3001/api/store-stats', {
            storeId: store.id,
            dateFrom: from.toISOString(),
            dateTo: to.toISOString(),
            data: stats
          });
          
          await axios.post('http://localhost:3001/api/analytics', analyticsData);
        } catch (error) {
          console.error('Error saving stats to DB:', error);
          localStorage.setItem(`marketplace_analytics_${store.id}`, JSON.stringify(analyticsData));
        }
        
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
    const response = await axios.get(`http://localhost:3001/api/orders/${storeId}`);
    if (response.data) {
      return {
        orders: response.data.orders,
        warehouseDistribution: response.data.warehouse_distribution,
        regionDistribution: response.data.region_distribution
      };
    }
  } catch (error) {
    console.error('Error fetching orders from DB:', error);
    const storedData = localStorage.getItem(`${ORDERS_STORAGE_KEY}_${storeId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
  }
  return null;
};

export const getSalesData = async (storeId: string) => {
  try {
    const response = await axios.get(`http://localhost:3001/api/sales/${storeId}`);
    if (response.data) {
      return {
        sales: response.data.sales
      };
    }
  } catch (error) {
    console.error('Error fetching sales from DB:', error);
    const storedData = localStorage.getItem(`${SALES_STORAGE_KEY}_${storeId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
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
        
        try {
          await axios.post('http://localhost:3001/api/orders', ordersData);
        } catch (error) {
          console.error('Error saving orders to DB:', error);
          localStorage.setItem(`${ORDERS_STORAGE_KEY}_${store.id}`, JSON.stringify(ordersData));
        }
        
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
        
        try {
          await axios.post('http://localhost:3001/api/sales', salesData);
        } catch (error) {
          console.error('Error saving sales to DB:', error);
          localStorage.setItem(`${SALES_STORAGE_KEY}_${store.id}`, JSON.stringify(salesData));
        }
        
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
    
    axios.get(`http://localhost:3001/api/analytics/${storeId}`)
      .then(response => {
        if (response.data && response.data.data) {
          const data = {
            profitableProducts: response.data.data.topProfitableProducts?.slice(0, 3) || [],
            unprofitableProducts: response.data.data.topUnprofitableProducts?.slice(0, 3) || [],
            updateDate: response.data.date_to
          };
          localStorage.setItem(`products_detailed_${storeId}`, JSON.stringify(data));
          return data;
        }
        return null;
      })
      .catch(error => {
        console.error('Error fetching product profitability data from DB:', error);
        return null;
      });
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
    
    axios.get(`http://localhost:3001/api/analytics/${storeId}`)
      .then(response => {
        if (response.data) {
          const parsedData = {
            data: response.data.data,
            penalties: response.data.penalties || [],
            returns: response.data.returns || [],
            deductions: response.data.deductions || [],
            deductionsTimeline: response.data.deductions_timeline || [],
            productAdvertisingData: response.data.product_advertising_data || [],
            advertisingBreakdown: response.data.advertising_breakdown || { search: 0 },
            timestamp: response.data.timestamp
          };
          
          if (!parsedData.deductionsTimeline || !Array.isArray(parsedData.deductionsTimeline) || parsedData.deductionsTimeline.length === 0) {
            parsedData.deductionsTimeline = Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              logistic: 0,
              storage: 0, 
              penalties: 0,
              acceptance: 0,
              advertising: 0,
              deductions: 0
            }));
          }
          
          localStorage.setItem(`marketplace_analytics_${storeId}`, JSON.stringify(parsedData));
          return parsedData;
        }
        return null;
      })
      .catch(error => {
        console.error('Error fetching analytics data from DB:', error);
        return null;
      });
  } catch (error) {
    console.error('Error in getAnalyticsData:', error);
  }
  
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
  
  const userData = localStorage.getItem('user');
  const currentUserId = userData ? JSON.parse(userData).id : null;
  
  const userStores = currentUserId 
    ? stores.filter(store => store.userId === currentUserId) 
    : stores;
  
  if (!userStores.length) return userStores;
  
  const hasSelectedStore = userStores.some(store => store.isSelected);
  
  if (!hasSelectedStore && userStores.length > 0) {
    const lastSelectedStoreData = localStorage.getItem('last_selected_store');
    
    if (lastSelectedStoreData) {
      try {
        const { storeId } = JSON.parse(lastSelectedStoreData);
        
        const storeExists = userStores.some(store => store.id === storeId);
        
        if (storeExists) {
          const updatedAllStores = stores.map(store => ({
            ...store,
            isSelected: store.id === storeId
          }));
          
          saveStores(updatedAllStores);
          
          return currentUserId 
            ? updatedAllStores.filter(store => store.userId === currentUserId)
            : updatedAllStores;
        }
      } catch (error) {
        console.error('Error restoring store selection:', error);
      }
    }
    
    const updatedAllStores = stores.map(store => {
      if (currentUserId && store.userId === currentUserId) {
        const isFirst = store.id === userStores[0].id;
        return { ...store, isSelected: isFirst };
      }
      return { ...store, isSelected: false };
    });
    
    saveStores(updatedAllStores);
    
    return currentUserId 
      ? updatedAllStores.filter(store => store.userId === currentUserId)
      : updatedAllStores;
  }
  
  return userStores;
};

/**
 * Gets the currently selected store without modifying any selections
 * This is used to prevent unwanted reselection of stores
 */
export const getSelectedStore = (): Store | null => {
  try {
    const userData = localStorage.getItem('user');
    const currentUserId = userData ? JSON.parse(userData).id : null;
    
    const stores = JSON.parse(localStorage.getItem(STORES_STORAGE_KEY) || '[]');
    
    const userStores = currentUserId 
      ? stores.filter((store: Store) => store.userId === currentUserId)
      : stores;
    
    return userStores.find((store: Store) => store.isSelected) || 
           (userStores.length > 0 ? userStores[0] : null);
  } catch (error) {
    console.error('Error getting selected store:', error);
    return null;
  }
};

export const validateApiKey = async (apiKey: string): Promise<{ isValid: boolean; errorCode?: number; errorMessage?: string }> => {
  try {
    const { from, to } = getLastWeekDateRange();
    const testFrom = new Date();
    testFrom.setDate(testFrom.getDate() - 1);
    
    const url = "https://statistics-api.wildberries.ru/api/v1/supplier/sales";
    const headers = {
      "Authorization": apiKey,
    };
    const params = {
      "dateFrom": testFrom.toISOString().split('T')[0] + 'T00:00:00'
    };
    
    console.log("Validating API key with test request...");
    const response = await axios.get(url, { headers, params });
    
    if (response.status === 200) {
      console.log("API key validation successful");
      return { isValid: true };
    }
    
    console.log(`API key validation returned non-200 status: ${response.status}`);
    return { isValid: false, errorCode: response.status, errorMessage: "Неожиданный ответ от API" };
    
  } catch (error) {
    console.error('Error validating API key:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      let errorMessage = "Ошибка при проверке API ключа";
      
      if (status === 400) {
        errorMessage = "Неправильный запрос";
      } else if (status === 401) {
        errorMessage = "Неверный API ключ";
      } else if (status === 403) {
        errorMessage = "Доступ запрещен";
      } else if (status === 429) {
        errorMessage = "Слишком много запросов, попробуйте позже";
      } else if (status && status >= 500) {
        errorMessage = "Сервер Wildberries временно недоступен";
      }
      
      return { isValid: false, errorCode: status, errorMessage };
    }
    
    return { isValid: false, errorMessage: "Невозможно соединиться с API Wildberries" };
  }
};

/**
 * Проверяет, может ли пользователь добавить новый магазин, исходя из ограничений тарифа
 */
export const canAddNewStore = (userId: string | null): { 
  canAdd: boolean; 
  currentCount: number; 
  limit: number;
  reason?: string;
} => {
  if (!userId) {
    return { 
      canAdd: false, 
      currentCount: 0, 
      limit: 0,
      reason: 'Пользователь не авторизован' 
    };
  }
  
  try {
    // Получаем данные пользователя
    const userData = localStorage.getItem('user');
    if (!userData) {
      return { 
        canAdd: false, 
        currentCount: 0, 
        limit: 0,
        reason: 'Данные пользователя не найдены' 
      };
    }
    
    const user = JSON.parse(userData);
    const tariffId = user.tariffId || '1';
    
    // Получаем ограничения по тарифу
    const restrictions = applyTariffRestrictions(tariffId);
    
    // Загружаем магазины пользователя
    const allStores = loadStores();
    const userStores = allStores.filter(store => store.userId === userId);
    
    const currentCount = userStores.length;
    const limit = restrictions.storeLimit;
    
    if (currentCount >= limit) {
      return {
        canAdd: false,
        currentCount,
        limit,
        reason: `Достигнут лимит магазинов (${limit}) для вашего тарифа`
      };
    }
    
    // Проверяем, активна ли подписка
    if (!user.isSubscriptionActive && !user.isInTrial) {
      return {
        canAdd: false,
        currentCount,
        limit,
        reason: 'Подписка неактивна. Активируйте подписку для добавления магазинов.'
      };
    }
    
    return {
      canAdd: true,
      currentCount,
      limit
    };
  } catch (error) {
    console.error('Ошибка при проверке возможности добавления магазина:', error);
    return {
      canAdd: false,
      currentCount: 0,
      limit: 1,
      reason: 'Произошла ошибка при проверке'
    };
  }
};

export const checkStoreLimit = async (tariffId: string) => {
  try {
    const restrictions = await applyTariffRestrictions(tariffId);
    return restrictions.storeLimit;
  } catch (error) {
    console.error('Error checking store limit:', error);
    return 1; // Default to 1 in case of error
  }
};

export const validateStoreLimit = async (userId: string, currentStoreCount: number): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return false;
    }
    
    // Get user's profile data
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('tariff_id')
      .eq('id', userData.user.id)
      .single();
    
    if (error || !profileData) {
      console.error("Failed to get user's tariff information:", error);
      return false;
    }
    
    // Get tariff restrictions
    const restrictions = await applyTariffRestrictions(profileData.tariff_id);
    
    // Check if store limit is reached
    return currentStoreCount < restrictions.storeLimit;
  } catch (error) {
    console.error("Error validating store limit:", error);
    return false;
  }
};

