
// Default cache TTL (time to live) in milliseconds (30 minutes)
const DEFAULT_CACHE_TTL = 30 * 60 * 1000;

// Keys for different types of warehouse data
export const CACHE_KEYS = {
  WAREHOUSES: 'wb_warehouses_',
  COEFFICIENTS: 'wb_coefficients_',
  REMAINS: 'wb_remains_',
  PAID_STORAGE: 'wb_paid_storage_',
  AVG_SALES: 'wb_avg_sales_',
};

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  isDemo?: boolean; // Маркер для определения, являются ли данные демо
}

/**
 * Save data to cache with TTL
 */
export function saveToCache<T>(
  key: string, 
  storeId: string, 
  data: T, 
  ttl = DEFAULT_CACHE_TTL, 
  isDemo = false
): void {
  const cacheKey = `${key}${storeId}`;
  const now = Date.now();
  
  const cacheData: CachedData<T> = {
    data,
    timestamp: now,
    expiresAt: now + ttl,
    isDemo
  };
  
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  console.log(`[Cache] Saved ${cacheKey} to cache. ${isDemo ? 'DEMO DATA' : 'REAL DATA'}. Expires in ${ttl/1000} seconds`);
}

/**
 * Get data from cache if not expired
 */
export function getFromCache<T>(key: string, storeId: string): { data: T | null, isDemo: boolean } {
  const cacheKey = `${key}${storeId}`;
  const cachedValue = localStorage.getItem(cacheKey);
  
  if (!cachedValue) {
    console.log(`[Cache] No cache found for ${cacheKey}`);
    return { data: null, isDemo: false };
  }
  
  try {
    const cachedData = JSON.parse(cachedValue) as CachedData<T>;
    const now = Date.now();
    
    if (now > cachedData.expiresAt) {
      console.log(`[Cache] Cache expired for ${cacheKey}`);
      localStorage.removeItem(cacheKey);
      return { data: null, isDemo: false };
    }
    
    const ageInSeconds = Math.round((now - cachedData.timestamp) / 1000);
    console.log(`[Cache] Using cached data for ${cacheKey} (age: ${ageInSeconds}s) ${cachedData.isDemo ? 'DEMO DATA' : 'REAL DATA'}`);
    
    return { 
      data: cachedData.data, 
      isDemo: cachedData.isDemo || false 
    };
  } catch (error) {
    console.error(`[Cache] Error parsing cache for ${cacheKey}:`, error);
    localStorage.removeItem(cacheKey);
    return { data: null, isDemo: false };
  }
}

/**
 * Clears all cache for a specific store
 */
export function clearStoreCache(storeId: string): void {
  Object.values(CACHE_KEYS).forEach(keyPrefix => {
    const cacheKey = `${keyPrefix}${storeId}`;
    localStorage.removeItem(cacheKey);
  });
  console.log(`[Cache] Cleared all cache for store ${storeId}`);
}

/**
 * Clears specific cache type for a store
 */
export function clearCache(key: string, storeId: string): void {
  const cacheKey = `${key}${storeId}`;
  localStorage.removeItem(cacheKey);
  console.log(`[Cache] Cleared ${cacheKey} from cache`);
}

/**
 * Clears all store cache for all stores
 */
export function clearAllStoreCache(): void {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && Object.values(CACHE_KEYS).some(prefix => key.startsWith(prefix))) {
      localStorage.removeItem(key);
    }
  }
  console.log(`[Cache] Cleared all warehouse cache data`);
}

/**
 * Gets the age of cached data in seconds
 */
export function getCacheAge(key: string, storeId: string): number | null {
  const cacheKey = `${key}${storeId}`;
  const cachedValue = localStorage.getItem(cacheKey);
  
  if (!cachedValue) {
    return null;
  }
  
  try {
    const cachedData = JSON.parse(cachedValue) as CachedData<any>;
    const now = Date.now();
    return Math.round((now - cachedData.timestamp) / 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Format a cache age to a human-readable string
 */
export function formatCacheAge(seconds: number | null): string {
  if (seconds === null) return 'Никогда';
  
  if (seconds < 60) {
    return `${seconds} сек. назад`;
  }
  
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} мин. назад`;
  }
  
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} ч. назад`;
  }
  
  return `${Math.floor(seconds / 86400)} дн. назад`;
}

/**
 * Проверяет, если магазин использует демо-данные
 */
export function isUsingDemoData(key: string, storeId: string): boolean {
  const cacheKey = `${key}${storeId}`;
  const cachedValue = localStorage.getItem(cacheKey);
  
  if (!cachedValue) {
    return false;
  }
  
  try {
    const cachedData = JSON.parse(cachedValue) as CachedData<any>;
    return cachedData.isDemo || false;
  } catch (error) {
    return false;
  }
}

/**
 * Синхронизирует кеш между магазинами
 * Используется для применения данных от одного магазина к другому
 */
export function syncCacheToAllStores(sourceStoreId: string, targetStoreIds: string[]): void {
  // Получаем все данные из кеша для исходного магазина
  const cacheData: Record<string, any> = {};
  
  Object.values(CACHE_KEYS).forEach(keyPrefix => {
    const sourceKey = `${keyPrefix}${sourceStoreId}`;
    const sourceData = localStorage.getItem(sourceKey);
    
    if (sourceData) {
      cacheData[keyPrefix] = sourceData;
    }
  });
  
  // Применяем данные ко всем целевым магазинам
  targetStoreIds.forEach(targetId => {
    if (targetId === sourceStoreId) return; // Пропускаем исходный магазин
    
    Object.entries(cacheData).forEach(([keyPrefix, data]) => {
      const targetKey = `${keyPrefix}${targetId}`;
      localStorage.setItem(targetKey, data);
    });
    
    console.log(`[Cache] Synchronized data from store ${sourceStoreId} to ${targetId}`);
  });
}

/**
 * Проверяет наличие согласованных данных между разными типами кешей
 * Возвращает true, если все требуемые типы данных присутствуют
 */
export function hasConsistentData(storeId: string, requiredKeys: string[]): boolean {
  return requiredKeys.every(key => {
    const { data } = getFromCache(key, storeId);
    return data !== null;
  });
}

/**
 * Копирует кеш от одного магазина к другому
 */
export function copyCache(sourceStoreId: string, targetStoreId: string, keys: string[] = Object.values(CACHE_KEYS)): void {
  keys.forEach(keyPrefix => {
    const sourceKey = `${keyPrefix}${sourceStoreId}`;
    const sourceData = localStorage.getItem(sourceKey);
    
    if (sourceData) {
      const targetKey = `${keyPrefix}${targetStoreId}`;
      localStorage.setItem(targetKey, sourceData);
      console.log(`[Cache] Copied ${keyPrefix} data from store ${sourceStoreId} to ${targetStoreId}`);
    }
  });
}
