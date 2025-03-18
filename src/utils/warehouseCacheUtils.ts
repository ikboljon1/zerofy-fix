
// Default cache TTL (time to live) in milliseconds (30 minutes)
export const DEFAULT_CACHE_TTL = 30 * 60 * 1000;

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
  isDemo?: boolean; // Флаг для пометки демо-данных
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
  console.log(`[Cache] Saved ${cacheKey} to cache. Expires in ${ttl/1000} seconds${isDemo ? ' (DEMO data)' : ''}`);
}

/**
 * Get data from cache if not expired
 * Returns an object with the data and a flag indicating if it's demo data
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
    console.log(`[Cache] Using cached data for ${cacheKey} (age: ${ageInSeconds}s)${cachedData.isDemo ? ' (DEMO data)' : ''}`);
    
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
 * Checks if cache exists and is demo data
 */
export function isDataDemo(key: string, storeId: string): boolean {
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
 * Копирует кеш между магазинами (для синхронизации)
 */
export function copyCacheBetweenStores(sourceStoreId: string, targetStoreId: string): void {
  Object.values(CACHE_KEYS).forEach(keyPrefix => {
    const sourceCacheKey = `${keyPrefix}${sourceStoreId}`;
    const cachedValue = localStorage.getItem(sourceCacheKey);
    
    if (cachedValue) {
      const targetCacheKey = `${keyPrefix}${targetStoreId}`;
      localStorage.setItem(targetCacheKey, cachedValue);
      console.log(`[Cache] Copied ${sourceCacheKey} to ${targetCacheKey}`);
    }
  });
}
