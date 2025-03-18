import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardListIcon, 
  PackageOpen, 
  RefreshCw, 
  Store, 
  DollarSign,
  Building2,
  HelpCircle,
  Book,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  fetchAcceptanceCoefficients, 
  fetchWarehouses, 
  fetchFullPaidStorageReport,
  getPreferredWarehouses,
  togglePreferredWarehouse
} from '@/services/suppliesApi';
import {
  fetchWarehouseRemains
} from '@/services/warehouseRemainsApi';
import { 
  SupplyForm, 
  WarehouseCoefficientsTable, 
  WarehouseRemains,
  StorageProfitabilityAnalysis,
  PaidStorageCostReport,
  WarehouseCoefficientsCard,
  WarehouseCoefficientsDateCard
} from '@/components/supplies';
import { 
  WarehouseCoefficient, 
  Warehouse as WBWarehouse,
  WarehouseRemainItem,
  PaidStorageItem
} from '@/types/supplies';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ensureStoreSelectionPersistence, getSelectedStore } from '@/utils/storeUtils';
import { Store as StoreType } from '@/types/store';
import { fetchAverageDailySalesFromAPI } from '@/components/analytics/data/demoData';
import LimitExceededMessage from '@/components/analytics/components/LimitExceededMessage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CACHE_KEYS, 
  saveToCache, 
  getFromCache, 
  clearCache,
  getCacheAge,
  formatCacheAge,
  DEFAULT_CACHE_TTL,
  isDataDemo,
  copyCacheBetweenStores
} from '@/utils/warehouseCacheUtils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Warehouses: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [wbWarehouses, setWbWarehouses] = useState<WBWarehouse[]>([]);
  const [coefficients, setCoefficients] = useState<WarehouseCoefficient[]>([]);
  const [warehouseRemains, setWarehouseRemains] = useState<WarehouseRemainItem[]>([]);
  const [paidStorageData, setPaidStorageData] = useState<PaidStorageItem[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState({
    warehouses: false,
    coefficients: false,
    options: false,
    remains: false,
    paidStorage: false,
    averageSales: false
  });
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [preferredWarehouses, setPreferredWarehouses] = useState<number[]>([]);
  const [averageDailySales, setAverageDailySales] = useState<Record<number, number>>({});
  const [dailyStorageCosts, setDailyStorageCosts] = useState<Record<number, number>>({});
  const [storageCostsCalculated, setStorageCostsCalculated] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(
    localStorage.getItem('warehouses_seen_help') !== 'true'
  );
  const [lastUpdated, setLastUpdated] = useState({
    warehouses: null as number | null,
    coefficients: null as number | null,
    remains: null as number | null,
    paidStorage: null as number | null,
    averageSales: null as number | null,
  });
  
  const [isDemo, setIsDemo] = useState({
    remains: false,
    paidStorage: false,
    averageSales: false
  });

  const updateLastUpdatedTimes = useCallback((storeId: string) => {
    setLastUpdated({
      warehouses: getCacheAge(CACHE_KEYS.WAREHOUSES, storeId),
      coefficients: getCacheAge(CACHE_KEYS.COEFFICIENTS, storeId),
      remains: getCacheAge(CACHE_KEYS.REMAINS, storeId),
      paidStorage: getCacheAge(CACHE_KEYS.PAID_STORAGE, storeId),
      averageSales: getCacheAge(CACHE_KEYS.AVG_SALES, storeId),
    });
    
    setIsDemo({
      remains: isDataDemo(CACHE_KEYS.REMAINS, storeId),
      paidStorage: isDataDemo(CACHE_KEYS.PAID_STORAGE, storeId),
      averageSales: isDataDemo(CACHE_KEYS.AVG_SALES, storeId)
    });
  }, []);

  useEffect(() => {
    const stores = ensureStoreSelectionPersistence();
    const selected = stores.find(store => store.isSelected);
    
    if (selected) {
      setSelectedStore(selected);
      
      const otherStores = stores.filter(store => 
        store.id !== selected.id && 
        (localStorage.getItem(`${CACHE_KEYS.REMAINS}${store.id}`) || 
         localStorage.getItem(`${CACHE_KEYS.AVG_SALES}${store.id}`))
      );
      
      if (otherStores.length > 0) {
        const hasRemainsCache = localStorage.getItem(`${CACHE_KEYS.REMAINS}${selected.id}`);
        const hasAvgSalesCache = localStorage.getItem(`${CACHE_KEYS.AVG_SALES}${selected.id}`);
        
        if (!hasRemainsCache || !hasAvgSalesCache) {
          copyCacheBetweenStores(otherStores[0].id, selected.id);
          console.log(`[Warehouses] Скопированы данные кеша из магазина ${otherStores[0].id} в ${selected.id}`);
        }
      }
      
      if (activeTab === 'supplies') {
        loadWarehouses(selected.apiKey, selected.id);
        loadCoefficients(selected.apiKey, selected.id);
        const preferred = getPreferredWarehouses(selected.id);
        setPreferredWarehouses(preferred);
      } else if (activeTab === 'inventory') {
        loadWarehouseRemains(selected.apiKey, selected.id);
        loadAverageDailySales(selected.apiKey, selected.id);
        loadPaidStorageData(selected.apiKey, selected.id);
      } else if (activeTab === 'storage') {
        loadPaidStorageData(selected.apiKey, selected.id);
      }
      
      updateLastUpdatedTimes(selected.id);
    } else if (stores.length > 0) {
      setSelectedStore(stores[0]);
    }
  }, []);

  useEffect(() => {
    if (selectedStore) {
      if (activeTab === 'supplies') {
        loadWarehouses(selectedStore.apiKey, selectedStore.id);
        loadCoefficients(selectedStore.apiKey, selectedStore.id);
        const preferred = getPreferredWarehouses(selectedStore.id);
        setPreferredWarehouses(preferred);
      } else if (activeTab === 'inventory') {
        loadWarehouseRemains(selectedStore.apiKey, selectedStore.id);
        loadAverageDailySales(selectedStore.apiKey, selectedStore.id);
        loadPaidStorageData(selectedStore.apiKey, selectedStore.id);
      } else if (activeTab === 'storage') {
        loadPaidStorageData(selectedStore.apiKey, selectedStore.id);
      }
      
      updateLastUpdatedTimes(selectedStore.id);
    }
  }, [activeTab, selectedStore]);

  useEffect(() => {
    if (paidStorageData.length > 0 && warehouseRemains.length > 0) {
      console.log('[Warehouses] Пересчет стоимости хранения из данных API...');
      console.log(`[Warehouses] Имеется ${paidStorageData.length} записей о платном хранении`);
      console.log(`[Warehouses] Имеется ${warehouseRemains.length} товаров на складах`);
      calculateRealStorageCostsFromAPI();
    }
  }, [paidStorageData, warehouseRemains]);

  useEffect(() => {
    if (showHelpGuide) {
      const timer = setTimeout(() => {
        localStorage.setItem('warehouses_seen_help', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showHelpGuide]);

  const loadAverageDailySales = async (apiKey: string, storeId: string, forceRefresh = false) => {
    if (!apiKey) {
      toast.warning('Необходимо выбрать магазин для получения данных');
      return;
    }
    
    if (!forceRefresh) {
      const { data: cachedData, isDemo: isCachedDataDemo } = getFromCache<Record<number, number>>(CACHE_KEYS.AVG_SALES, storeId);
      if (cachedData) {
        setAverageDailySales(cachedData);
        setIsDemo(prev => ({ ...prev, averageSales: isCachedDataDemo }));
        setLastUpdated(prev => ({ ...prev, averageSales: getCacheAge(CACHE_KEYS.AVG_SALES, storeId) }));
        return;
      }
    }
    
    try {
      setLoading(prev => ({ ...prev, averageSales: true }));
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      const dateFrom = formatDate(thirtyDaysAgo);
      const dateTo = formatDate(now);
      
      console.log(`[Warehouses] Запрашиваем данные о средних продажах с ${dateFrom} по ${dateTo}`);
      
      const data = await fetchAverageDailySalesFromAPI(apiKey, dateFrom, dateTo);
      console.log('[Warehouses] Получены данные о средних продажах:', 
                  `${Object.keys(data).length} товаров`);
      
      setAverageDailySales(data);
      saveToCache(CACHE_KEYS.AVG_SALES, storeId, data, DEFAULT_CACHE_TTL, false);
      setIsDemo(prev => ({ ...prev, averageSales: false }));
      setLastUpdated(prev => ({ ...prev, averageSales: 0 }));
      
    } catch (error: any) {
      console.error('[Warehouses] Ошибка при загрузке средних продаж:', error);
      generateMockAverageSales();
    } finally {
      setLoading(prev => ({ ...prev, averageSales: false }));
    }
  };
  
  const calculateRealStorageCostsFromAPI = useCallback(() => {
    console.log('[Warehouses] Расчет стоимости хранения на основе данных API');
    
    const storageCosts: Record<number, number> = {};
    
    warehouseRemains.forEach(item => {
      const nmId = item.nmId;
      
      const storageItem = paidStorageData.find(
        storage => storage.nmId === nmId
      );
      
      if (storageItem && storageItem.warehousePrice) {
        const dailyCost = storageItem.warehousePrice / 30;
        
        storageCosts[nmId] = dailyCost;
        storageItem.dailyStorageCost = dailyCost;
        
        console.log(`[Warehouses] Для товара ${nmId} найдена стоимость хранения из API: ${dailyCost.toFixed(2)}`);
      } else {
        const volume = item.volume || 0.001;
        const baseStorageRate = item.category ? 
          calculateCategoryRate(item.category) : 5;
        
        storageCosts[nmId] = volume * baseStorageRate;
        console.log(`[Warehouses] Для товара ${nmId} стоимость хранения рассчитана (запасной вариант): ${storageCosts[nmId].toFixed(2)}`);
      }
    });
    
    console.log('[Warehouses] Расчет стоимости хранения завершен для', Object.keys(storageCosts).length, 'товаров');
    setDailyStorageCosts(storageCosts);
    setStorageCostsCalculated(true);
  }, [warehouseRemains, paidStorageData]);
  
  const calculateCategoryRate = (category: string): number => {
    switch(category.toLowerCase()) {
      case 'обувь':
        return 6.5;
      case 'одежда':
        return 5.8;
      case 'аксессуары':
        return 4.5;
      case 'электроника':
        return 7.2;
      default:
        return 5;
    }
  };
  
  const generateMockAverageSales = () => {
    const mockSalesData: Record<number, number> = {};
    warehouseRemains.forEach(item => {
      mockSalesData[item.nmId] = Math.random() * 2;
    });
    setAverageDailySales(mockSalesData);
    
    setIsDemo(prev => ({ ...prev, averageSales: true }));
    saveToCache(CACHE_KEYS.AVG_SALES, selectedStore?.id || '', mockSalesData, DEFAULT_CACHE_TTL, true);
    
    console.log('[Warehouses] Используем моковые данные для средних продаж:', mockSalesData);
    
    toast.warning(
      'Используются демо-данные для продаж. Реальные данные не получены от API.',
      { duration: 5000 }
    );
  };
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadWarehouses = async (apiKey: string, storeId: string, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const { data: cachedData } = getFromCache<WBWarehouse[]>(CACHE_KEYS.WAREHOUSES, storeId);
        if (cachedData) {
          setWbWarehouses(cachedData);
          setLastUpdated(prev => ({ ...prev, warehouses: getCacheAge(CACHE_KEYS.WAREHOUSES, storeId) }));
          return;
        }
      }
    
      setLoading(prev => ({ ...prev, warehouses: true }));
      const data = await fetchWarehouses(apiKey);
      setWbWarehouses(data);
      saveToCache(CACHE_KEYS.WAREHOUSES, storeId, data);
      setLastUpdated(prev => ({ ...prev, warehouses: 0 }));
      
    } catch (error) {
      console.error('Ошибка при загрузке складов:', error);
      toast.error('Не удалось загрузить список складов');
    } finally {
      setLoading(prev => ({ ...prev, warehouses: false }));
    }
  };

  const loadCoefficients = async (apiKey: string, storeId: string, warehouseId?: number, forceRefresh = false) => {
    try {
      if (!forceRefresh && !warehouseId) {
        const { data: cachedData } = getFromCache<WarehouseCoefficient[]>(CACHE_KEYS.COEFFICIENTS, storeId);
        if (cachedData) {
          setCoefficients(cachedData);
          setLastUpdated(prev => ({ ...prev, coefficients: getCacheAge(CACHE_KEYS.COEFFICIENTS, storeId) }));
          return;
        }
      }
      
      setLoading(prev => ({ ...prev, coefficients: true }));
      const data = await fetchAcceptanceCoefficients(
        apiKey, 
        warehouseId ? [warehouseId] : undefined
      );
      setCoefficients(data);
      
      if (!warehouseId) {
        saveToCache(CACHE_KEYS.COEFFICIENTS, storeId, data);
        setLastUpdated(prev => ({ ...prev, coefficients: 0 }));
      }
      
    } catch (error) {
      console.error('Ошибка при загрузке коэффициентов:', error);
      toast.error('Не удалось загрузить коэффициенты приемки');
    } finally {
      setLoading(prev => ({ ...prev, coefficients: false }));
    }
  };

  const handleWarehouseSelect = (warehouseId: number) => {
    setSelectedWarehouseId(warehouseId);
    
    if (selectedStore) {
      loadCoefficients(selectedStore.apiKey, selectedStore.id, warehouseId);
    }
  };

  const handleSavePreferredWarehouse = (warehouseId: number) => {
    if (!selectedStore) return;
    
    const newPreferred = togglePreferredWarehouse(selectedStore.id, warehouseId);
    setPreferredWarehouses(newPreferred);
  };

  const loadWarehouseRemains = async (apiKey: string, storeId: string, forceRefresh = false) => {
    if (!apiKey) {
      toast.warning('Необходимо выбрать магазин для получения данных');
      return;
    }
    
    if (!forceRefresh) {
      const { data: cachedData, isDemo: isCachedDataDemo } = getFromCache<WarehouseRemainItem[]>(CACHE_KEYS.REMAINS, storeId);
      if (cachedData) {
        setWarehouseRemains(cachedData);
        setIsDemo(prev => ({ ...prev, remains: isCachedDataDemo }));
        setLastUpdated(prev => ({ ...prev, remains: getCacheAge(CACHE_KEYS.REMAINS, storeId) }));
        return;
      }
    }
    
    try {
      setLoading(prev => ({ ...prev, remains: true }));
      toast.info('Запрос на формирование отчета отправлен. Это может занять некоторое время...');
      
      const data = await fetchWarehouseRemains(apiKey, {
        groupByBrand: true,
        groupByWarehouse: true,
        groupBySize: true
      });
      
      setWarehouseRemains(data);
      saveToCache(CACHE_KEYS.REMAINS, storeId, data, DEFAULT_CACHE_TTL, false);
      setIsDemo(prev => ({ ...prev, remains: false }));
      setLastUpdated(prev => ({ ...prev, remains: 0 }));
      
      toast.success('Отчет об остатках на складах успешно загружен');
      
      if (paidStorageData.length > 0) {
        calculateRealStorageCostsFromAPI();
      }
      
    } catch (error: any) {
      console.error('Ошибка при загрузке остатков на складах:', error);
      toast.error(`Не удалось загрузить отчет: ${error.message || 'Неизвестная ошибка'}`);
      
      const demoData: WarehouseRemainItem[] = [];
      for (let i = 0; i < 20; i++) {
        demoData.push({
          nmId: 288457437 + i,
          name: `Демо-товар ${i+1}`,
          brand: 'Демо-бренд',
          category: i % 2 === 0 ? 'Одежда' : 'Обувь',
          warehouse: `Склад ${i % 5 + 1}`,
          warehouseId: (i % 5 + 1) * 100,
          quantity: Math.floor(Math.random() * 50) + 1,
          volume: Math.random() * 0.5,
          barcode: `123456${i}`,
          price: Math.floor(Math.random() * 10000) + 500,
          size: `${Math.floor(Math.random() * 10) + 30}`
        });
      }
      
      setWarehouseRemains(demoData);
      
      setIsDemo(prev => ({ ...prev, remains: true }));
      saveToCache(CACHE_KEYS.REMAINS, storeId, demoData, DEFAULT_CACHE_TTL, true);
      
      toast.warning(
        'Используются демо-данные для остатков. Реальные данные не получены от API.',
        { duration: 5000 }
      );
    } finally {
      setLoading(prev => ({ ...prev, remains: false }));
    }
  };

  const loadPaidStorageData = async (
    apiKey: string,
    storeId: string,
    dateFrom: string = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: string = new Date().toISOString().split('T')[0],
    forceRefresh = false
  ) => {
    if (!apiKey) {
      toast.warning('Необходимо выбрать магазин для получения данных');
      return;
    }
    
    const cacheKey = `${dateFrom}_${dateTo}`;
    if (!forceRefresh) {
      const { data: cachedData, isDemo: isCachedDataDemo } = getFromCache<PaidStorageItem[]>(CACHE_KEYS.PAID_STORAGE, storeId);
      if (cachedData) {
        setPaidStorageData(cachedData);
        setIsDemo(prev => ({ ...prev, paidStorage: isCachedDataDemo }));
        setLastUpdated(prev => ({ ...prev, paidStorage: getCacheAge(CACHE_KEYS.PAID_STORAGE, storeId) }));
        return;
      }
    }
    
    try {
      setLoading(prev => ({ ...prev, paidStorage: true }));
      toast.info('Запрос отчета о платном хранении. Это может занять некоторое время...');
      
      const data = await fetchFullPaidStorageReport(apiKey, dateFrom, dateTo);
      console.log(`[Warehouses] Получено ${data.length} записей данных о платном хранении`);
      
      if (data.length > 0) {
        console.log('[Warehouses] Пример данных платного хранения:', {
          nmId: data[0].nmId,
          warehousePrice: data[0].warehousePrice,
          volume: data[0].volume,
          barcode: data[0].barcode,
        });
      }
      
      setPaidStorageData(data);
      saveToCache(CACHE_KEYS.PAID_STORAGE, storeId, data, DEFAULT_CACHE_TTL, false);
      setIsDemo(prev => ({ ...prev, paidStorage: false }));
      setLastUpdated(prev => ({ ...prev, paidStorage: 0 }));
      
      if (warehouseRemains.length > 0) {
        calculateRealStorageCostsFromAPI();
      }
      
      toast.success('Отчет о платном хранении успешно загружен');
    } catch (error: any) {
      console.error('Ошибка при загрузке отчета о платном хранении:', error);
      toast.error(`Не удалось загрузить отчет: ${error.message || 'Неизвестная ошибка'}`);
      
      const demoStorageData: PaidStorageItem[] = [];
      
      if (warehouseRemains.length > 0) {
        warehouseRemains.forEach(item => {
          demoStorageData.push({
            nmId: item.nmId,
            warehouseId: item.warehouseId || 0,
            warehousePrice: Math.random() * 100 + 50,
            volume: item.volume || Math.random() * 0.5,
            barcode: item.barcode || '',
            date: new Date().toISOString(),
            logWarehouseCoef: 1,
            warehouse: item.warehouse || '',
            officeId: 0,
            subject: '',
            supplierArticle: '',
            techSize: item.size || '',
            quantity: item.quantity || 0
          });
        });
      } else {
        for (let i = 0; i < 20; i++) {
          demoStorageData.push({
            nmId: 288457437 + i,
            warehouseId: (i % 5 + 1) * 100,
            warehousePrice: Math.random() * 100 + 50,
            volume: Math.random() * 0.5,
            barcode: `123456${i}`,
            date: new Date().toISOString(),
            logWarehouseCoef: 1,
            warehouse: `Склад ${i % 5 + 1}`,
            officeId: 0,
            subject: '',
            supplierArticle: '',
            techSize: `${Math.floor(Math.random() * 10) + 30}`,
            quantity: Math.floor(Math.random() * 50) + 1
          });
        }
      }
      
      setPaidStorageData(demoStorageData);
      
      setIsDemo(prev => ({ ...prev, paidStorage: true }));
      saveToCache(CACHE_KEYS.PAID_STORAGE, storeId, demoStorageData, DEFAULT_CACHE_TTL, true);
      
      toast.warning(
        'Используются демо-данные для хранения. Реальные данные не получены от API.',
        { duration: 5000 }
      );
    } finally {
      setLoading(prev => ({ ...prev, paidStorage: false }));
    }
  };

  const handleRefreshData = () => {
    if (!selectedStore) {
      toast.warning('Необходимо выбрать магазин для получения данных');
      return;
    }
    
    if (activeTab === 'inventory') {
      clearCache(CACHE_KEYS.REMAINS, selectedStore.id);
      clearCache(CACHE_KEYS.AVG_SALES, selectedStore.id);
      clearCache(CACHE_KEYS.PAID_STORAGE, selectedStore.id);
      
      loadWarehouseRemains(selectedStore.apiKey, selectedStore.id, true);
      loadAverageDailySales(selectedStore.apiKey, selectedStore.id, true);
      loadPaidStorageData(selectedStore.apiKey, selectedStore.id, undefined, undefined, true);
    } else if (activeTab === 'supplies') {
      clearCache(CACHE_KEYS.WAREHOUSES, selectedStore.id);
      clearCache(CACHE_KEYS.COEFFICIENTS, selectedStore.id);
      
      loadWarehouses(selectedStore.apiKey, selectedStore.id, true);
      loadCoefficients(selectedStore.apiKey, selectedStore.id, undefined, true);
    } else if (activeTab === 'storage') {
      clearCache(CACHE_KEYS.PAID_STORAGE, selectedStore.id);
      
      loadPaidStorageData(selectedStore.apiKey, selectedStore.id, undefined, undefined, true);
    }
  };

  const renderLastUpdated = (type: keyof typeof lastUpdated) => {
    const age = lastUpdated[type];
    
    if (age === null) {
      return null;
    }
    
    return (
      <Badge variant="outline" className="ml-2 text-xs bg-muted/50">
        <Clock className="h-3 w-3 mr-1" />
        {formatCacheAge(age)}
      </Badge>
    );
  };

  const renderDemoBadge = (isDemoData: boolean) => {
    if (!isDemoData) return null;
    
    return (
      <Badge className="ml-2 bg-yellow-500 text-white hover:bg-yellow-600">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Демо
      </Badge>
    );
  };

  const renderNoStoreSelected = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Store className="mr-2 h-5 w-5" />
          Выберите магазин
        </CardTitle>
        <CardDescription>
          Для просмотра и управления складами необходимо выбрать магазин в разделе "Магазины"
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Store className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Для работы с отчетами о складах необходимо выбрать магазин</p>
        <Button 
          className="mt-4"
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
        >
          Перейти к выбору магазина
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Управление складами и логистикой
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="max-w-xs">
                  Здесь вы управляете запасами, планируете поставки и анализируете затраты на хранение
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h1>
      </div>

      {showHelpGuide && (
        <div className="mb-4">
          <LimitExceededMessage
            title="Руководство по работе со складами"
            message="Здесь вы можете управлять запасами товаров, планировать поставки и анализировать затраты на хранение."
            onRefresh={() => setShowHelpGuide(false)}
            isLoading={false}
          />
        </div>
      )}

      {(isDemo.remains || isDemo.paidStorage || isDemo.averageSales) && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Внимание! Используются демо-данные</AlertTitle>
          <AlertDescription>
            {isDemo.remains && <div>• Данные об остатках на складах не получены от API и заменены демо-данными.</div>}
            {isDemo.paidStorage && <div>• Данные о стоимости хранения не получены от API и заменены демо-данными.</div>}
            {isDemo.averageSales && <div>• Данные о средних продажах не получены от API и заменены демо-данными.</div>}
            <div className="mt-1">Нажмите "Обновить данные", чтобы попробовать загрузить реальные данные.</div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="inventory" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="inventory" className="flex items-center justify-center">
            <ClipboardListIcon className="h-4 w-4 mr-2" />
            <span>Инвентарь</span>
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center justify-center">
            <PackageOpen className="h-4 w-4 mr-2" />
            <span>Поставки</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center justify-center">
            <DollarSign className="h-4 w-4 mr-2" />
            <span>Хранение</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {!selectedStore ? renderNoStoreSelected() : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center">
                      Остатки товаров на складах
                      {renderLastUpdated('remains')}
                      {renderDemoBadge(isDemo.remains)}
                    </h2>
                    <p className="text-sm text-muted-foreground">Актуальная информация о количестве товаров</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-1">
                          <Book className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium">Как работать с разделом "Инвентарь":</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Здесь отображаются все ваши товары на складах Wildberries</li>
                            <li>Таблица показывает количество, стоимость и дневные продажи</li>
                            <li>Анализ рентабельности помогает выявить "залежавшиеся" товары</li>
                            <li>При отсутствии данных API показываются демо-данные</li>
                          </ol>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshData}
                  disabled={loading.remains}
                  className="flex items-center gap-2"
                >
                  {loading.remains ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Обновить данные
                </Button>
              </div>

              {loading.remains ? (
                <div className="grid gap-4">
                  <Skeleton className="h-[400px] w-full" />
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : (
                <>
                  <WarehouseRemains 
                    data={warehouseRemains} 
                    isLoading={loading.remains} 
                  />
                  
                  <div className="mt-8">
                    {loading.paidStorage ? (
                      <Skeleton className="h-[400px] w-full" />
                    ) : (
                      <StorageProfitabilityAnalysis 
                        warehouseItems={warehouseRemains}
                        paidStorageData={paidStorageData}
                        averageDailySalesRate={averageDailySales}
                        dailyStorageCost={dailyStorageCosts}
                        isDemo={isDemo.averageSales || isDemo.paidStorage}
                      />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="supplies" className="space-y-4">
          {!selectedStore ? renderNoStoreSelected() : (
            <>
              <div className="flex justify-between items-center mb-4">
