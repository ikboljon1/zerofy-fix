
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
export function getSelectedStore(): { id: string; apiKey: string } | null {
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
  storage.setItem(`profitability_${storeId}`, JSON.stringify(data));
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
