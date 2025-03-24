
import { applyTariffRestrictions } from "@/data/tariffs";

// Типы данных
interface Store {
  id: string;
  apiKey: string;
  name: string;
  marketplace: string;
}

interface User {
  id: string;
  tariffId: string;
}

interface ProductProfitability {
  profitableProducts: any[];
  unprofitableProducts: any[];
  updateDate?: string;
}

// Получить хранилище на основе типа авторизации
function getStorage(): Storage {
  // Если пользователь залогинен через "Запомнить меня", данные в localStorage
  if (localStorage.getItem('user')) {
    return localStorage;
  }
  // Иначе данные в sessionStorage
  return sessionStorage;
}

// Получить выбранный магазин
export function getSelectedStore(): { id: string; apiKey: string; name?: string; marketplace?: string } | null {
  const storage = getStorage();
  const selectedStoreJSON = storage.getItem('selectedStore');
  
  if (!selectedStoreJSON) {
    return null;
  }
  
  try {
    return JSON.parse(selectedStoreJSON);
  } catch (e) {
    console.error('Ошибка при парсинге данных выбранного магазина:', e);
    return null;
  }
}

// Установить выбранный магазин
export function setSelectedStore(store: Store): void {
  const storage = getStorage();
  storage.setItem('selectedStore', JSON.stringify({
    id: store.id,
    apiKey: store.apiKey,
    name: store.name,
    marketplace: store.marketplace
  }));
}

// Удалить выбранный магазин
export function clearSelectedStore(): void {
  const storage = getStorage();
  storage.removeItem('selectedStore');
}

// Получить список магазинов пользователя
export function getUserStores(): Store[] {
  const storage = getStorage();
  const storesJSON = storage.getItem('userStores');
  
  if (!storesJSON) {
    return [];
  }
  
  try {
    return JSON.parse(storesJSON);
  } catch (e) {
    console.error('Ошибка при парсинге данных магазинов пользователя:', e);
    return [];
  }
}

// Сохранить список магазинов пользователя
export function saveUserStores(stores: Store[]): void {
  const storage = getStorage();
  storage.setItem('userStores', JSON.stringify(stores));
}

// Добавить новый магазин
export function addUserStore(store: Store): Store[] {
  const stores = getUserStores();
  const updatedStores = [...stores, store];
  saveUserStores(updatedStores);
  return updatedStores;
}

// Проверить, может ли пользователь добавить еще один магазин
export function canAddStore(userData: User): boolean {
  const stores = getUserStores();
  const restrictions = applyTariffRestrictions(userData.tariffId);
  
  return stores.length < restrictions.storeLimit;
}

// Получить лимит магазинов для пользователя
export function getStoreLimit(userData: User): number {
  const restrictions = applyTariffRestrictions(userData.tariffId);
  return restrictions.storeLimit;
}

// Удалить магазин
export function removeUserStore(storeId: string): Store[] {
  const stores = getUserStores();
  const updatedStores = stores.filter(store => store.id !== storeId);
  saveUserStores(updatedStores);
  
  // Если удаляемый магазин был выбран, сбрасываем выбор
  const selectedStore = getSelectedStore();
  if (selectedStore && selectedStore.id === storeId) {
    clearSelectedStore();
  }
  
  return updatedStores;
}

// Сохранить данные о прибыльности товаров
export function saveProductProfitabilityData(storeId: string, data: ProductProfitability): void {
  const storage = getStorage();
  storage.setItem(`profitability_${storeId}`, JSON.stringify({
    ...data,
    updateDate: new Date().toISOString()
  }));
}

// Получить данные о прибыльности товаров
export function getProductProfitabilityData(storeId: string): ProductProfitability | null {
  const storage = getStorage();
  const dataJSON = storage.getItem(`profitability_${storeId}`);
  
  if (!dataJSON) {
    return null;
  }
  
  try {
    return JSON.parse(dataJSON);
  } catch (e) {
    console.error('Ошибка при парсинге данных о прибыльности товаров:', e);
    return null;
  }
}

// Сохранить данные о себестоимости товаров
export function saveCostPriceData(storeId: string, data: any): void {
  const storage = getStorage();
  storage.setItem(`costprice_${storeId}`, JSON.stringify(data));
}

// Получить данные о себестоимости товаров
export function getCostPriceData(storeId: string): any | null {
  const storage = getStorage();
  const dataJSON = storage.getItem(`costprice_${storeId}`);
  
  if (!dataJSON) {
    return null;
  }
  
  try {
    return JSON.parse(dataJSON);
  } catch (e) {
    console.error('Ошибка при парсинге данных о себестоимости товаров:', e);
    return null;
  }
}

// Загрузить магазины
export function loadStores(): Store[] {
  return getUserStores();
}

// Сохранить магазины
export function saveStores(stores: Store[]): void {
  saveUserStores(stores);
}

// Проверить API ключ
export function validateApiKey(apiKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Для демо считаем ключ валидным, если он не пустой и длиннее 8 символов
    setTimeout(() => {
      resolve(apiKey && apiKey.length > 8);
    }, 1000);
  });
}

// Получить данные о заказах
export function getOrdersData(storeId: string): any[] {
  const storage = getStorage();
  const dataJSON = storage.getItem(`orders_${storeId}`);
  
  if (!dataJSON) {
    return [];
  }
  
  try {
    return JSON.parse(dataJSON);
  } catch (e) {
    console.error('Ошибка при парсинге данных о заказах:', e);
    return [];
  }
}

// Получить данные о продажах
export function getSalesData(storeId: string): any[] {
  const storage = getStorage();
  const dataJSON = storage.getItem(`sales_${storeId}`);
  
  if (!dataJSON) {
    return [];
  }
  
  try {
    return JSON.parse(dataJSON);
  } catch (e) {
    console.error('Ошибка при парсинге данных о продажах:', e);
    return [];
  }
}

// Получить данные аналитики
export function getAnalyticsData(storeId: string): any {
  const storage = getStorage();
  const dataJSON = storage.getItem(`analytics_${storeId}`);
  
  if (!dataJSON) {
    return null;
  }
  
  try {
    return JSON.parse(dataJSON);
  } catch (e) {
    console.error('Ошибка при парсинге данных аналитики:', e);
    return null;
  }
}

// Обновить данные о заказах
export function fetchAndUpdateOrders(storeId: string, apiKey: string): Promise<any[]> {
  return new Promise((resolve) => {
    // Генерируем демо-данные
    setTimeout(() => {
      const orders = generateDemoOrders();
      const storage = getStorage();
      storage.setItem(`orders_${storeId}`, JSON.stringify(orders));
      resolve(orders);
    }, 1500);
  });
}

// Обновить данные о продажах
export function fetchAndUpdateSales(storeId: string, apiKey: string): Promise<any[]> {
  return new Promise((resolve) => {
    // Генерируем демо-данные
    setTimeout(() => {
      const sales = generateDemoSales();
      const storage = getStorage();
      storage.setItem(`sales_${storeId}`, JSON.stringify(sales));
      resolve(sales);
    }, 1500);
  });
}

// Генерировать демо-данные о заказах
function generateDemoOrders(): any[] {
  const orders = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setDate(now.getDate() - Math.floor(Math.random() * 30));
    
    orders.push({
      id: `ORDER-${1000 + i}`,
      date: date.toISOString(),
      customer: `Customer ${i + 1}`,
      total: Math.floor(Math.random() * 10000) + 1000,
      status: ['new', 'processing', 'shipped', 'delivered', 'cancelled'][Math.floor(Math.random() * 5)],
      items: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return orders;
}

// Генерировать демо-данные о продажах
function generateDemoSales(): any[] {
  const sales = [];
  const now = new Date();
  
  for (let i = 0; i < 100; i++) {
    const date = new Date();
    date.setDate(now.getDate() - Math.floor(Math.random() * 30));
    
    sales.push({
      id: `SALE-${1000 + i}`,
      date: date.toISOString(),
      product: `Product ${i % 20 + 1}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      price: Math.floor(Math.random() * 5000) + 500,
      total: Math.floor(Math.random() * 10000) + 1000
    });
  }
  
  return sales;
}

// Обеспечить сохранение выбранного магазина
export function ensureStoreSelectionPersistence(): void {
  const stores = getUserStores();
  const selectedStore = getSelectedStore();
  
  // Если есть выбранный магазин, проверяем его существование
  if (selectedStore) {
    const storeExists = stores.some(store => store.id === selectedStore.id);
    
    // Если магазин больше не существует, сбрасываем выбор
    if (!storeExists) {
      clearSelectedStore();
    }
  }
  // Если нет выбранного магазина, но есть магазины, выбираем первый
  else if (stores.length > 0) {
    setSelectedStore(stores[0]);
  }
}

// Обновить статистику магазина
export function refreshStoreStats(storeId: string, apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    Promise.all([
      fetchAndUpdateOrders(storeId, apiKey),
      fetchAndUpdateSales(storeId, apiKey)
    ]).then(() => {
      resolve();
    });
  });
}
