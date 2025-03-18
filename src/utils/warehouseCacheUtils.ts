
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
  isDemo?: boolean; // Флаг для отметки демо-данных
  source?: string; // Источник данных (API, cache, demo)
}

/**
 * Save data to cache with TTL
 */
export function saveToCache<T>(
  key: string, 
  storeId: string, 
  data: T, 
  options: { 
    ttl?: number; 
    isDemo?: boolean; 
    source?: string;
  } = {}
): void {
  const { ttl = DEFAULT_CACHE_TTL, isDemo = false, source = 'api' } = options;
  const cacheKey = `${key}${storeId}`;
  const now = Date.now();
  
  const cacheData: CachedData<T> = {
    data,
    timestamp: now,
    expiresAt: now + ttl,
    isDemo,
    source
  };
  
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  console.log(`[Cache] Saved ${cacheKey} to cache. Expires in ${ttl/1000} seconds. Demo data: ${isDemo}`);
}

/**
 * Get data from cache if not expired
 */
export function getFromCache<T>(key: string, storeId: string): { data: T | null; isDemo?: boolean; source?: string } {
  const cacheKey = `${key}${storeId}`;
  const cachedValue = localStorage.getItem(cacheKey);
  
  if (!cachedValue) {
    console.log(`[Cache] No cache found for ${cacheKey}`);
    return { data: null };
  }
  
  try {
    const cachedData = JSON.parse(cachedValue) as CachedData<T>;
    const now = Date.now();
    
    if (now > cachedData.expiresAt) {
      console.log(`[Cache] Cache expired for ${cacheKey}`);
      localStorage.removeItem(cacheKey);
      return { data: null };
    }
    
    const ageInSeconds = Math.round((now - cachedData.timestamp) / 1000);
    console.log(`[Cache] Using cached data for ${cacheKey} (age: ${ageInSeconds}s) Demo: ${cachedData.isDemo}`);
    
    return { 
      data: cachedData.data, 
      isDemo: cachedData.isDemo,
      source: cachedData.source || 'cache'
    };
  } catch (error) {
    console.error(`[Cache] Error parsing cache for ${cacheKey}:`, error);
    localStorage.removeItem(cacheKey);
    return { data: null };
  }
}

/**
 * Updates cache if it's expired or forces update
 * Returns true if cache was updated, false if using existing cache
 */
export async function updateCacheIfNeeded<T>(
  key: string, 
  storeId: string, 
  fetchFn: () => Promise<T>, 
  options: { 
    ttl?: number; 
    forceUpdate?: boolean;
    allowDemo?: boolean;
    generateDemoFn?: () => T;
  } = {}
): Promise<{ data: T; isDemo: boolean; fromCache: boolean }> {
  const { ttl = DEFAULT_CACHE_TTL, forceUpdate = false, allowDemo = true, generateDemoFn } = options;
  const cacheKey = `${key}${storeId}`;
  
  // Check if we have valid cache and not forcing update
  if (!forceUpdate) {
    const cachedResult = getFromCache<T>(key, storeId);
    if (cachedResult.data !== null) {
      return { 
        data: cachedResult.data, 
        isDemo: !!cachedResult.isDemo,
        fromCache: true
      };
    }
  }
  
  console.log(`[Cache] Updating cache for ${cacheKey}...`);
  
  try {
    // Attempt to fetch new data
    const freshData = await fetchFn();
    
    // Save to cache
    saveToCache(key, storeId, freshData, { ttl, isDemo: false, source: 'api' });
    
    return { data: freshData, isDemo: false, fromCache: false };
  } catch (error) {
    console.error(`[Cache] Error updating cache for ${cacheKey}:`, error);
    
    // If we allow demo data and have a generator function
    if (allowDemo && generateDemoFn) {
      console.log(`[Cache] Generating demo data for ${cacheKey}`);
      const demoData = generateDemoFn();
      
      // Save demo data to cache with shorter TTL (5 minutes)
      saveToCache(key, storeId, demoData, { ttl: 5 * 60 * 1000, isDemo: true, source: 'demo' });
      
      return { data: demoData, isDemo: true, fromCache: false };
    }
    
    // Check for existing cache even if expired
    const expiredCache = localStorage.getItem(cacheKey);
    if (expiredCache) {
      try {
        const cachedData = JSON.parse(expiredCache) as CachedData<T>;
        console.log(`[Cache] Using expired cache for ${cacheKey} as fallback`);
        return { 
          data: cachedData.data, 
          isDemo: !!cachedData.isDemo,
          fromCache: true
        };
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    throw error; // Re-throw if we can't provide any data
  }
}

/**
 * Copy cache from one store to another
 */
export function copyCacheBetweenStores(sourceStoreId: string, targetStoreId: string, keysToCopy?: string[]): void {
  const keysToUse = keysToCopy || Object.values(CACHE_KEYS);
  let copiedCount = 0;
  
  for (const keyPrefix of keysToUse) {
    const sourceCacheKey = `${keyPrefix}${sourceStoreId}`;
    const targetCacheKey = `${keyPrefix}${targetStoreId}`;
    
    const sourceData = localStorage.getItem(sourceCacheKey);
    if (sourceData) {
      localStorage.setItem(targetCacheKey, sourceData);
      copiedCount++;
    }
  }
  
  console.log(`[Cache] Copied ${copiedCount} cache items from store ${sourceStoreId} to ${targetStoreId}`);
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
 * Checks if cache is demo data
 */
export function isCacheDemo(key: string, storeId: string): boolean {
  const cacheKey = `${key}${storeId}`;
  const cachedValue = localStorage.getItem(cacheKey);
  
  if (!cachedValue) {
    return false;
  }
  
  try {
    const cachedData = JSON.parse(cachedValue) as CachedData<any>;
    return !!cachedData.isDemo;
  } catch (error) {
    return false;
  }
}

/**
 * Export cache data for backup or sharing
 */
export function exportStoreCache(storeId: string): string {
  const cacheData: Record<string, any> = {};
  
  Object.values(CACHE_KEYS).forEach(keyPrefix => {
    const cacheKey = `${keyPrefix}${storeId}`;
    const cachedValue = localStorage.getItem(cacheKey);
    
    if (cachedValue) {
      cacheData[cacheKey] = JSON.parse(cachedValue);
    }
  });
  
  return JSON.stringify(cacheData);
}

/**
 * Import cache data from backup or sharing
 */
export function importStoreCache(storeId: string, cacheJson: string): boolean {
  try {
    const cacheData = JSON.parse(cacheJson);
    
    Object.entries(cacheData).forEach(([key, value]) => {
      // Ensure the key corresponds to this store
      if (Object.values(CACHE_KEYS).some(prefix => key.startsWith(prefix) && key.endsWith(storeId))) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
    
    console.log(`[Cache] Imported cache data for store ${storeId}`);
    return true;
  } catch (error) {
    console.error(`[Cache] Error importing cache:`, error);
    return false;
  }
}

/**
 * Get all cache info for a store for debugging
 */
export function getStoreCacheInfo(storeId: string): Record<string, { age: number; expiresIn: number; isDemo: boolean; size: number }> {
  const result: Record<string, { age: number; expiresIn: number; isDemo: boolean; size: number }> = {};
  
  Object.values(CACHE_KEYS).forEach(keyPrefix => {
    const cacheKey = `${keyPrefix}${storeId}`;
    const cachedValue = localStorage.getItem(cacheKey);
    
    if (cachedValue) {
      try {
        const cachedData = JSON.parse(cachedValue) as CachedData<any>;
        const now = Date.now();
        const age = Math.round((now - cachedData.timestamp) / 1000);
        const expiresIn = Math.max(0, Math.round((cachedData.expiresAt - now) / 1000));
        
        result[keyPrefix] = {
          age,
          expiresIn,
          isDemo: !!cachedData.isDemo,
          size: cachedValue.length
        };
      } catch (error) {
        // Ignore parsing errors
      }
    }
  });
  
  return result;
}

