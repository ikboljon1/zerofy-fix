
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
  isDemo?: boolean;
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
  try {
    const cacheKey = `${key}${storeId}`;
    const now = Date.now();
    
    const cacheData: CachedData<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      isDemo
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[Cache] Saved ${cacheKey} to cache. Expires in ${ttl/1000} seconds. ${isDemo ? 'Demo data.' : ''}`);
  } catch (error) {
    console.error(`[Cache] Error saving cache for ${key}${storeId}:`, error);
    // Fail gracefully without throwing errors
  }
}

/**
 * Get data from cache if not expired
 */
export function getFromCache<T>(key: string, storeId: string): { data: T | null, isDemo: boolean } {
  try {
    const cacheKey = `${key}${storeId}`;
    const cachedValue = localStorage.getItem(cacheKey);
    
    if (!cachedValue) {
      console.log(`[Cache] No cache found for ${cacheKey}`);
      return { data: null, isDemo: false };
    }
    
    const cachedData = JSON.parse(cachedValue) as CachedData<T>;
    const now = Date.now();
    
    if (now > cachedData.expiresAt) {
      console.log(`[Cache] Cache expired for ${cacheKey}`);
      localStorage.removeItem(cacheKey);
      return { data: null, isDemo: false };
    }
    
    const ageInSeconds = Math.round((now - cachedData.timestamp) / 1000);
    console.log(`[Cache] Using cached data for ${cacheKey} (age: ${ageInSeconds}s) ${cachedData.isDemo ? 'Demo data.' : ''}`);
    
    return { data: cachedData.data, isDemo: cachedData.isDemo || false };
  } catch (error) {
    console.error(`[Cache] Error parsing cache for ${key}${storeId}:`, error);
    try {
      localStorage.removeItem(`${key}${storeId}`);
    } catch {
      // Ignore any errors during cleanup
    }
    return { data: null, isDemo: false };
  }
}

/**
 * Update cache only if new data is available
 */
export function updateCacheIfNeeded<T>(
  key: string,
  storeId: string,
  data: T | null,
  isDemo = false,
  ttl = DEFAULT_CACHE_TTL
): void {
  if (!data) return;
  
  try {
    const { data: existingData } = getFromCache<T>(key, storeId);
    
    // If there's no existing data or if data is demo but new data is not
    if (!existingData || (isDemo === false && getIsDemoData(key, storeId))) {
      saveToCache(key, storeId, data, ttl, isDemo);
    }
  } catch (error) {
    console.error(`[Cache] Error in updateCacheIfNeeded for ${key}${storeId}:`, error);
    // Save the data anyway as a fallback
    try {
      saveToCache(key, storeId, data, ttl, isDemo);
    } catch {
      // Ignore any errors during fallback save
    }
  }
}

/**
 * Check if cached data is demo data
 */
export function getIsDemoData(key: string, storeId: string): boolean {
  try {
    const cacheKey = `${key}${storeId}`;
    const cachedValue = localStorage.getItem(cacheKey);
    
    if (!cachedValue) return false;
    
    const cachedData = JSON.parse(cachedValue) as CachedData<any>;
    return cachedData.isDemo || false;
  } catch {
    return false;
  }
}

/**
 * Clears all cache for a specific store
 */
export function clearStoreCache(storeId: string): void {
  try {
    Object.values(CACHE_KEYS).forEach(keyPrefix => {
      const cacheKey = `${keyPrefix}${storeId}`;
      localStorage.removeItem(cacheKey);
    });
    console.log(`[Cache] Cleared all cache for store ${storeId}`);
  } catch (error) {
    console.error(`[Cache] Error clearing cache for store ${storeId}:`, error);
  }
}

/**
 * Clears specific cache type for a store
 */
export function clearCache(key: string, storeId: string): void {
  try {
    const cacheKey = `${key}${storeId}`;
    localStorage.removeItem(cacheKey);
    console.log(`[Cache] Cleared ${cacheKey} from cache`);
  } catch (error) {
    console.error(`[Cache] Error clearing ${key}${storeId} from cache:`, error);
  }
}

/**
 * Clears all store cache for all stores
 */
export function clearAllStoreCache(): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && Object.values(CACHE_KEYS).some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
    console.log(`[Cache] Cleared all warehouse cache data`);
  } catch (error) {
    console.error(`[Cache] Error clearing all cache:`, error);
  }
}

/**
 * Gets the age of cached data in seconds
 */
export function getCacheAge(key: string, storeId: string): number | null {
  try {
    const cacheKey = `${key}${storeId}`;
    const cachedValue = localStorage.getItem(cacheKey);
    
    if (!cachedValue) {
      return null;
    }
    
    const cachedData = JSON.parse(cachedValue) as CachedData<any>;
    const now = Date.now();
    return Math.round((now - cachedData.timestamp) / 1000);
  } catch (error) {
    console.error(`[Cache] Error getting cache age for ${key}${storeId}:`, error);
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
 * Copy cache from one store to another
 */
export function copyCacheBetweenStores(sourceStoreId: string, targetStoreId: string): void {
  try {
    Object.values(CACHE_KEYS).forEach(keyPrefix => {
      const sourceCacheKey = `${keyPrefix}${sourceStoreId}`;
      const targetCacheKey = `${keyPrefix}${targetStoreId}`;
      
      const cachedValue = localStorage.getItem(sourceCacheKey);
      
      if (cachedValue) {
        localStorage.setItem(targetCacheKey, cachedValue);
        console.log(`[Cache] Copied ${sourceCacheKey} to ${targetCacheKey}`);
      }
    });
    console.log(`[Cache] Completed cache copy from store ${sourceStoreId} to ${targetStoreId}`);
  } catch (error) {
    console.error(`[Cache] Error copying cache between stores:`, error);
  }
}

/**
 * Check if all expected cache types exist for a store
 */
export function checkCacheCompleteness(storeId: string): { 
  complete: boolean, 
  missingKeys: string[] 
} {
  try {
    const missingKeys: string[] = [];
    
    Object.values(CACHE_KEYS).forEach(keyPrefix => {
      const cacheKey = `${keyPrefix}${storeId}`;
      if (!localStorage.getItem(cacheKey)) {
        missingKeys.push(keyPrefix);
      }
    });
    
    return { 
      complete: missingKeys.length === 0,
      missingKeys 
    };
  } catch (error) {
    console.error(`[Cache] Error checking cache completeness:`, error);
    return { complete: false, missingKeys: Object.values(CACHE_KEYS) };
  }
}

/**
 * Get all cache info for diagnostics
 */
export function getCacheInfo(storeId: string): Array<{
  key: string;
  age: number | null;
  expiresIn: number | null;
  isDemo: boolean;
  size: number;
}> {
  try {
    return Object.values(CACHE_KEYS).map(keyPrefix => {
      const cacheKey = `${keyPrefix}${storeId}`;
      const cachedValue = localStorage.getItem(cacheKey);
      
      if (!cachedValue) {
        return {
          key: keyPrefix,
          age: null,
          expiresIn: null,
          isDemo: false,
          size: 0
        };
      }
      
      try {
        const cachedData = JSON.parse(cachedValue) as CachedData<any>;
        const now = Date.now();
        return {
          key: keyPrefix,
          age: Math.round((now - cachedData.timestamp) / 1000),
          expiresIn: Math.max(0, Math.round((cachedData.expiresAt - now) / 1000)),
          isDemo: cachedData.isDemo || false,
          size: cachedValue.length
        };
      } catch {
        return {
          key: keyPrefix,
          age: null,
          expiresIn: null,
          isDemo: false,
          size: cachedValue.length
        };
      }
    });
  } catch (error) {
    console.error(`[Cache] Error getting cache info:`, error);
    return [];
  }
}

/**
 * Extend the TTL of a cache entry
 */
export function extendCacheTTL<T>(key: string, storeId: string, additionalTTL = DEFAULT_CACHE_TTL): boolean {
  try {
    const cacheKey = `${key}${storeId}`;
    const cachedValue = localStorage.getItem(cacheKey);
    
    if (!cachedValue) {
      return false;
    }
    
    const cachedData = JSON.parse(cachedValue) as CachedData<T>;
    const now = Date.now();
    
    // Only extend if not already expired
    if (now <= cachedData.expiresAt) {
      cachedData.expiresAt = now + additionalTTL;
      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      console.log(`[Cache] Extended TTL for ${cacheKey} by ${additionalTTL/1000} seconds`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[Cache] Error extending cache TTL:`, error);
    return false;
  }
}
