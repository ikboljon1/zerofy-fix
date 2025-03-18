import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { loadStores, getOrdersData, getSalesData, fetchAndUpdateOrders, fetchAndUpdateSales, ensureStoreSelectionPersistence, getSelectedStore } from "@/utils/storeUtils";
import OrdersTable from "./OrdersTable";
import OrdersChart from "./OrdersChart";
import GeographySection from "./GeographySection";
import Stats from "@/components/Stats";
import PeriodSelector, { Period } from "./PeriodSelector";
import { WildberriesOrder, WildberriesSale } from "@/types/store";
import OrderMetrics from "./OrderMetrics";
import SalesMetrics from "./SalesMetrics";
import SalesChart from "./SalesChart";
import TipsSection from "./TipsSection";
import AIAnalysisSection from "@/components/ai/AIAnalysisSection";
import SalesTable from "./SalesTable";
import { fetchAverageDailySalesFromAPI } from "@/components/analytics/data/demoData";
import { format } from 'date-fns';
import RateLimitHandler from "./RateLimitHandler";
import LimitExceededMessage from "@/components/analytics/components/LimitExceededMessage";

const Dashboard = () => {
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("orders");
  const [period, setPeriod] = useState<Period>("today");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [orders, setOrders] = useState<WildberriesOrder[]>([]);
  const [sales, setSales] = useState<WildberriesSale[]>([]);
  const [warehouseDistribution, setWarehouseDistribution] = useState<any[]>([]);
  const [regionDistribution, setRegionDistribution] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [nextRetryTime, setNextRetryTime] = useState<Date | undefined>(undefined);
  const [isDemoData, setIsDemoData] = useState(false);

  const filterDataByPeriod = useCallback((date: string, period: Period) => {
    const now = new Date();
    const itemDate = new Date(date);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    switch (period) {
      case "today":
        return itemDate >= todayStart;
      case "yesterday":
        return itemDate >= yesterdayStart && itemDate < todayStart;
      case "week":
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
      case "2weeks":
        const twoWeeksAgo = new Date(todayStart);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return itemDate >= twoWeeksAgo;
      case "4weeks":
        const fourWeeksAgo = new Date(todayStart);
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        return itemDate >= fourWeeksAgo;
      case "3months":
        const threeMonthsAgo = new Date(todayStart);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return itemDate >= threeMonthsAgo;
      case "6months":
        const sixMonthsAgo = new Date(todayStart);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return itemDate >= sixMonthsAgo;
      default:
        return true;
    }
  }, []);

  const getFilteredOrders = (orders: WildberriesOrder[]) => {
    const filteredOrders = orders.filter(order => filterDataByPeriod(order.date, period));
    const warehouseCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};
    const totalOrders = filteredOrders.length;
    filteredOrders.forEach(order => {
      if (order.warehouseName) {
        warehouseCounts[order.warehouseName] = (warehouseCounts[order.warehouseName] || 0) + 1;
      }
      if (order.regionName) {
        regionCounts[order.regionName] = (regionCounts[order.regionName] || 0) + 1;
      }
    });
    const newWarehouseDistribution = Object.entries(warehouseCounts).map(([name, count]) => ({
      name,
      count,
      percentage: count / totalOrders * 100
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    const newRegionDistribution = Object.entries(regionCounts).map(([name, count]) => ({
      name,
      count,
      percentage: count / totalOrders * 100
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    return {
      orders: filteredOrders,
      warehouseDistribution: newWarehouseDistribution,
      regionDistribution: newRegionDistribution
    };
  };

  const getFilteredSales = (sales: WildberriesSale[]) => {
    return sales.filter(sale => filterDataByPeriod(sale.date, period));
  };

  const filteredOrdersData = useMemo(() => {
    return getFilteredOrders(orders);
  }, [orders, period]);

  const filteredSalesData = useMemo(() => {
    return getFilteredSales(sales);
  }, [sales, period]);

  const calculateBackoffTime = (retryCount: number): number => {
    const baseDelay = 5000;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const maxDelay = 5 * 60 * 1000;
    return Math.min(exponentialDelay, maxDelay);
  };

  const handleApiRateLimit = () => {
    console.log(`[Dashboard] API rate limit detected. Retry count: ${retryCount}`);
    setIsRateLimited(true);
    setIsDemoData(true);
    setIsLoading(false);
    const nextRetry = new Date();
    const backoffTime = calculateBackoffTime(retryCount);
    nextRetry.setTime(nextRetry.getTime() + backoffTime);
    setNextRetryTime(nextRetry);
    console.log(`[Dashboard] Setting next retry in ${backoffTime}ms (${nextRetry.toISOString()})`);
    toast({
      title: "Превышен лимит запросов",
      description: `Wildberries API временно ограничило доступ. Повторная попытка через ${Math.round(backoffTime / 1000)} секунд.`,
      variant: "destructive"
    });
    setTimeout(() => {
      console.log('[Dashboard] Attempting auto-retry after backoff');
      retryFetchData();
    }, backoffTime);
  };

  const retryFetchData = () => {
    console.log('[Dashboard] Retrying data fetch');
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    fetchData().catch(error => {
      console.error('[Dashboard] Retry fetch failed:', error);
      if (error.message?.includes('429') || error.status === 429) {
        handleApiRateLimit();
      }
    }).finally(() => {
      setIsRetrying(false);
    });
  };

  const resetRateLimitState = () => {
    setIsRateLimited(false);
    setRetryCount(0);
    setNextRetryTime(undefined);
  };

  const fetchData = useCallback(async () => {
    try {
      console.log("[Dashboard] Starting data fetch...");
      setIsLoading(true);
      
      toast({
        title: "Загрузка данных",
        description: "Пожалуйста, подождите, идет получение информации...",
      });
      
      const userData = localStorage.getItem('user');
      const currentUserId = userData ? JSON.parse(userData).id : null;
      console.log(`[Dashboard] Current user ID: ${currentUserId || 'not logged in'}`);
      const allStores = loadStores();
      console.log(`[Dashboard] Loaded ${allStores.length} stores from localStorage`);
      const userStores = currentUserId ? allStores.filter(store => store.userId === currentUserId) : allStores;
      console.log(`[Dashboard] User has ${userStores.length} stores`);
      const selectedStore = userStores.find(store => store.isSelected) || (userStores.length > 0 ? userStores[0] : null);
      if (!selectedStore) {
        console.log("[Dashboard] No store selected");
        toast({
          title: "Внимание",
          description: "Выберите основной магазин в разделе 'Магазины'",
          variant: "destructive"
        });
        return;
      }
      console.log(`[Dashboard] Selected store: ${selectedStore.name} (ID: ${selectedStore.id})`);
      console.log(`[Dashboard] API key available: ${!!selectedStore.apiKey}`);
      if (selectedStore.id !== selectedStoreId) {
        console.log(`[Dashboard] Store ID changed from ${selectedStoreId} to ${selectedStore.id}`);
        setSelectedStoreId(selectedStore.id);
      }
      console.log("[Dashboard] Fetching orders and sales data...");
      try {
        const [ordersResult, salesResult] = await Promise.all([fetchAndUpdateOrders(selectedStore), fetchAndUpdateSales(selectedStore)]);
        resetRateLimitState();
        setIsDemoData(false);
        if (ordersResult) {
          console.log(`[Dashboard] Received ${ordersResult.orders.length} orders from API`);
          setOrders(ordersResult.orders);
          setWarehouseDistribution(ordersResult.warehouseDistribution);
          setRegionDistribution(ordersResult.regionDistribution);
        } else {
          console.log("[Dashboard] No orders from API, trying local storage");
          const savedOrdersData = await getOrdersData(selectedStore.id);
          if (savedOrdersData) {
            console.log(`[Dashboard] Loaded ${savedOrdersData.orders?.length || 0} orders from storage`);
            setOrders(savedOrdersData.orders || []);
            setWarehouseDistribution(savedOrdersData.warehouseDistribution || []);
            setRegionDistribution(savedOrdersData.regionDistribution || []);
            setIsDemoData(true);
          } else {
            console.log("[Dashboard] No orders found in storage");
            setIsDemoData(true);
          }
        }
        if (salesResult) {
          console.log(`[Dashboard] Received ${salesResult.length} sales from API`);
          setSales(salesResult);
        } else {
          console.log("[Dashboard] No sales from API, trying local storage");
          const savedSalesData = await getSalesData(selectedStore.id);
          if (savedSalesData) {
            console.log(`[Dashboard] Loaded ${savedSalesData.sales?.length || 0} sales from storage`);
            setSales(savedSalesData.sales || []);
            setIsDemoData(true);
          } else {
            console.log("[Dashboard] No sales found in storage");
            setIsDemoData(true);
          }
        }
        if (selectedStore.apiKey) {
          const now = new Date();
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          const dateFrom = format(thirtyDaysAgo, 'yyyy-MM-dd');
          const dateTo = format(now, 'yyyy-MM-dd');
          console.log(`[Dashboard] Запрашиваем данные о средних продажах с ${dateFrom} по ${dateTo}`);
          console.log(`[Dashboard] Ключ кэша для периода: ${dateFrom}_${dateTo}`);
          console.log(`[Dashboard] API ключ: ${selectedStore.apiKey ? selectedStore.apiKey.substring(0, 5) + '...' + selectedStore.apiKey.substring(selectedStore.apiKey.length - 5) : 'отсутствует'}`);
          fetchAverageDailySalesFromAPI(selectedStore.apiKey, dateFrom, dateTo).then(data => {
            console.log('[Dashboard] Получены данные о средних продажах:', `${Object.keys(data).length} товаров`);
            const sampleEntries = Object.entries(data).slice(0, 3);
            if (sampleEntries.length > 0) {
              console.log('[Dashboard] Примеры данных:', sampleEntries);
            } else {
              console.log('[Dashboard] Нет данных о средних продажах');
              setIsDemoData(true);
            }
          }).catch(error => {
            console.error('[Dashboard] Ошибка при получении данных о средних продажах:', error);
            if (error instanceof Error) {
              console.error(`[Dashboard] Сообщение ошибки: ${error.message}`);
              console.error(`[Dashboard] Стек вызовов: ${error.stack}`);
            }
            if (error.message?.includes('429') || error.status === 429) {
              console.log('[Dashboard] Rate limit detected during fetchAverageDailySalesFromAPI');
              setIsDemoData(true);
              toast({
                title: "Ограничение API",
                description: "Не удалось получить данные о средних продажах из-за ограничений API",
                variant: "destructive"
              });
            }
          });
        } else {
          console.log("[Dashboard] Нет API ключа для запроса средних продаж");
          setIsDemoData(true);
        }
      } catch (error) {
        console.error('[Dashboard] Error in API calls:', error);
        if (error.message?.includes('429') || error.status === 429 || error.response?.status === 429 || error.detail?.includes('too many requests')) {
          handleApiRateLimit();
          return;
        }
        toast({
          title: "Ошибка API",
          description: error.detail || "Произошла ошибка при получении данных",
          variant: "destructive"
        });
        console.log("[Dashboard] Falling back to cached data due to API error");
        const savedOrdersData = await getOrdersData(selectedStore.id);
        const savedSalesData = await getSalesData(selectedStore.id);
        if (savedOrdersData) {
          setOrders(savedOrdersData.orders || []);
          setWarehouseDistribution(savedOrdersData.warehouseDistribution || []);
          setRegionDistribution(savedOrdersData.regionDistribution || []);
        }
        if (savedSalesData) {
          setSales(savedSalesData.sales || []);
        }
        setIsDemoData(true);
      }
      console.log("[Dashboard] Data fetch completed successfully");
      setIsLoading(false);
    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error);
      if (error instanceof Error) {
        console.error(`[Dashboard] Сообщение ошибки: ${error.message}`);
        console.error(`[Dashboard] Стек вызовов: ${error.stack}`);
      }
      if (error.message?.includes('429') || error.status === 429) {
        handleApiRateLimit();
        return;
      }
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
        variant: "destructive"
      });
      setIsLoading(false);
      setIsDemoData(true);
    }
  }, [selectedStoreId, toast]);

  useEffect(() => {
    const selectedStore = getSelectedStore();
    if (selectedStore && selectedStore.id !== selectedStoreId) {
      setSelectedStoreId(selectedStore.id);
      fetchData();
    }
  }, [selectedStoreId, fetchData]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    const handleStoreSelectionChange = () => {
      console.log('Store selection changed, refreshing data...');
      fetchData();
    };
    if (selectedStoreId) {
      window.addEventListener('store-selection-changed', handleStoreSelectionChange);
      refreshInterval = setInterval(fetchData, 60000);
    }
    return () => {
      window.removeEventListener('store-selection-changed', handleStoreSelectionChange);
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [selectedStoreId, fetchData]);

  return <div className="space-y-4">
      {isRateLimited && <RateLimitHandler isVisible={isRateLimited} onRetry={retryFetchData} isRetrying={isRetrying} retryCount={retryCount} nextRetryTime={nextRetryTime} />}
      
      {isDemoData && !isRateLimited && (
        <LimitExceededMessage 
          onRefresh={fetchData} 
          isLoading={isLoading}
          title="Демо-данные"
          message="В настоящий момент отображаются демонстрационные данные для ознакомления с функциональностью."
          showDemoDataInfo={true}
          section="general"
        />
      )}

      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-lg flex items-center justify-center space-x-3">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          <p className="text-blue-700 dark:text-blue-300 font-medium">Загрузка данных...</p>
        </div>
      )}

      <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`${isMobile ? 'w-full grid grid-cols-4 gap-1' : ''}`}>
          <TabsTrigger value="orders" className={isMobile ? 'text-xs py-1 px-1' : ''}>Заказы</TabsTrigger>
          <TabsTrigger value="sales" className={isMobile ? 'text-xs py-1 px-1' : ''}>Продажи</TabsTrigger>
          <TabsTrigger value="geography" className={isMobile ? 'text-xs py-1 px-1' : ''}>География</TabsTrigger>
          <TabsTrigger value="ai-analysis" className={isMobile ? 'text-xs py-1 px-1' : ''}>AI-анализ</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className={`mb-4 ${isMobile ? 'w-full' : 'flex items-center gap-4'}`}>
            <PeriodSelector value={period} onChange={setPeriod} />
            <div className="flex-grow"></div>
          </div>
          
          {orders.length > 0 && <OrderMetrics orders={filteredOrdersData.orders} />}
          
          {orders.length > 0 && <OrdersChart orders={filteredOrdersData.orders} sales={filteredSalesData} />}
          
          <OrdersTable orders={filteredOrdersData.orders} />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className={`mb-4 ${isMobile ? 'w-full' : 'flex items-center gap-4'}`}>
            <PeriodSelector value={period} onChange={setPeriod} />
            <div className="flex-grow"></div>
          </div>
          
          {sales.length > 0 && <SalesMetrics sales={filteredSalesData} />}
          
          <SalesTable sales={filteredSalesData} />
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className={`mb-4 ${isMobile ? 'w-full' : 'flex items-center gap-4'}`}>
            <PeriodSelector value={period} onChange={setPeriod} />
            <div className="flex-grow"></div>
          </div>
          <GeographySection warehouseDistribution={warehouseDistribution} regionDistribution={regionDistribution} sales={filteredSalesData} />
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-4">
          <AIAnalysisSection />
        </TabsContent>
      </Tabs>
    </div>;
};

export default React.memo(Dashboard);
