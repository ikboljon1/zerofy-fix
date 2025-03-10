
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardListIcon, 
  RefreshCw, 
  Store, 
  DollarSign,
  PackageIcon,
  TagIcon
} from 'lucide-react';
import { 
  fetchAcceptanceCoefficients, 
  fetchWarehouses, 
  fetchAcceptanceOptions,
  fetchFullPaidStorageReport
} from '@/services/suppliesApi';
import {
  fetchWarehouseRemains
} from '@/services/warehouseRemainsApi';
import { 
  StorageProfitabilityAnalysis,
  PaidStorageCostReport,
  WarehouseRemains
} from '@/components/supplies';
import { 
  WarehouseRemainItem,
  PaidStorageItem,
  SupplyFormData
} from '@/types/supplies';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ensureStoreSelectionPersistence } from '@/utils/storeUtils';
import { Store as StoreType } from '@/types/store';

const Warehouses: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStorageTab, setActiveStorageTab] = useState('inventory');
  const [warehouseRemains, setWarehouseRemains] = useState<WarehouseRemainItem[]>([]);
  const [paidStorageData, setPaidStorageData] = useState<PaidStorageItem[]>([]);
  const [loading, setLoading] = useState({
    remains: false,
    paidStorage: false
  });
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);

  // Загрузка выбранного магазина из localStorage при монтировании компонента
  useEffect(() => {
    const stores = ensureStoreSelectionPersistence();
    const selected = stores.find(store => store.isSelected);
    
    if (selected) {
      setSelectedStore(selected);
      // Если есть выбранный магазин, загружаем соответствующие данные
      loadWarehouseRemains(selected.apiKey);
      loadPaidStorageData(selected.apiKey);
    } else if (stores.length > 0) {
      // Если нет выбранного магазина, но есть магазины, выбираем первый
      setSelectedStore(stores[0]);
    }
  }, []);

  const loadWarehouseRemains = async (apiKey: string) => {
    if (!apiKey) {
      toast.warning('Необходимо выбрать магазин для получения данных');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, remains: true }));
      toast.info('Запрос на формирование отчета отправлен. Это может занять некоторое время...');
      
      // Fetch warehouse remains with grouping
      const data = await fetchWarehouseRemains(apiKey, {
        groupByBrand: true,
        groupBySubject: true,
        groupBySa: true,
        groupBySize: true
      });
      
      setWarehouseRemains(data);
      toast.success('Отчет об остатках на складах успешно загружен');
    } catch (error: any) {
      console.error('Ошибка при загрузке остатков на складах:', error);
      toast.error(`Не удалось загрузить отчет: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(prev => ({ ...prev, remains: false }));
    }
  };

  const loadPaidStorageData = async (
    apiKey: string, 
    dateFrom: string = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: string = new Date().toISOString().split('T')[0]
  ) => {
    if (!apiKey) {
      toast.warning('Необходимо выбрать магазин для получения данных');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, paidStorage: true }));
      toast.info('Запрос отчета о платном хранении. Это может занять некоторое время...');
      
      const data = await fetchFullPaidStorageReport(apiKey, dateFrom, dateTo);
      setPaidStorageData(data);
      
      toast.success('Отчет о платном хранении успешно загружен');
    } catch (error: any) {
      console.error('Ошибка при загрузке отчета о платном хранении:', error);
      toast.error(`Не удалось загрузить отчет: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(prev => ({ ...prev, paidStorage: false }));
    }
  };

  const handleRefreshData = () => {
    if (!selectedStore) {
      toast.warning('Необходимо выбрать магазин для получения данных');
      return;
    }
    
    loadWarehouseRemains(selectedStore.apiKey);
    loadPaidStorageData(selectedStore.apiKey);
  };

  // Calculate average daily sales rates based on historical data
  const calculateAverageDailySales = () => {
    const result: Record<number, number> = {};
    warehouseRemains.forEach(item => {
      // Mock data - in a real app, this would be calculated from historical sales
      result[item.nmId] = Math.random() * 2; // Random value between 0 and 2
    });
    return result;
  };

  // Calculate daily storage costs
  const calculateDailyStorageCosts = () => {
    const result: Record<number, number> = {};
    warehouseRemains.forEach(item => {
      // Calculate based on item volume and a base rate
      // In a real app, this would come from actual storage costs
      const volume = item.volume || 1;
      result[item.nmId] = volume * 5; // 5 rubles per volume unit per day
    });
    return result;
  };

  const renderStorageContent = () => {
    return (
      <>
        <Tabs defaultValue="inventory" value={activeStorageTab} onValueChange={setActiveStorageTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="inventory" className="flex items-center justify-center">
              <ClipboardListIcon className="h-4 w-4 mr-2" />
              <span>Остатки</span>
            </TabsTrigger>
            <TabsTrigger value="paid-storage" className="flex items-center justify-center">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>Платное хранение</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            {loading.remains ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <WarehouseRemains 
                data={warehouseRemains} 
                isLoading={loading.remains} 
              />
            )}
          </TabsContent>

          <TabsContent value="paid-storage" className="space-y-4">
            {loading.paidStorage && paidStorageData.length === 0 ? (
              <Skeleton className="h-[600px] w-full" />
            ) : (
              <PaidStorageCostReport 
                apiKey={selectedStore?.apiKey || ''}
                storageData={paidStorageData}
                isLoading={loading.paidStorage}
                onRefresh={(apiKey) => selectedStore && loadPaidStorageData(selectedStore.apiKey)}
              />
            )}
          </TabsContent>
        </Tabs>

        {activeStorageTab === 'inventory' && warehouseRemains.length > 0 && (
          <div className="mt-8">
            <StorageProfitabilityAnalysis 
              warehouseItems={warehouseRemains}
              paidStorageData={paidStorageData}
              averageDailySalesRate={calculateAverageDailySales()}
              dailyStorageCost={calculateDailyStorageCosts()}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Управление складами</h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefreshData}
          disabled={loading.remains || loading.paidStorage}
          className="flex items-center gap-2"
        >
          {(loading.remains || loading.paidStorage) ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Обновить данные
        </Button>
      </div>

      {!selectedStore ? (
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
      ) : (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="flex items-center justify-center">
              <ClipboardListIcon className="h-4 w-4 mr-2" />
              <span>Обзор</span>
            </TabsTrigger>
            <TabsTrigger value="brands" className="flex items-center justify-center">
              <TagIcon className="h-4 w-4 mr-2" />
              <span>Бренды</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center justify-center">
              <PackageIcon className="h-4 w-4 mr-2" />
              <span>Категории</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Остатки товаров на складах</h2>
              <p className="text-sm text-muted-foreground">Актуальная информация о количестве товаров</p>
            </div>
            {renderStorageContent()}
          </TabsContent>

          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Анализ по брендам</CardTitle>
                <CardDescription>
                  Показатели эффективности по брендам
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Функциональность в разработке</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Анализ по категориям</CardTitle>
                <CardDescription>
                  Показатели эффективности по категориям товаров
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Функциональность в разработке</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Warehouses;
