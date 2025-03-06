import { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { AlertCircle, Target, PackageX, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import DateRangePicker from "./components/DateRangePicker";
import KeyMetrics from "./components/KeyMetrics";
import SalesChart from "./components/SalesChart";
import DeductionsChart from "./components/DeductionsChart";
import PieChartCard from "./components/PieChartCard";
import ExpenseBreakdown from "./components/ExpenseBreakdown";
import ProductList from "./components/ProductList";
import GeographySection from "./components/GeographySection";
import { useIsMobile } from "@/hooks/use-mobile";

import { fetchWildberriesStats } from "@/services/wildberriesApi";
import { getAdvertCosts, getAdvertBalance, getAdvertPayments } from "@/services/advertisingApi";
import { getAnalyticsData } from "@/utils/storeUtils";

import { 
  demoData, 
  deductionsTimelineData,
  advertisingData
} from "./data/demoData";

const ANALYTICS_STORAGE_KEY = 'marketplace_analytics';

interface AnalyticsData {
  currentPeriod: {
    sales: number;
    transferred: number;
    expenses: {
      total: number;
      logistics: number;
      storage: number;
      penalties: number;
      advertising: number;
      acceptance: number;
    };
    netProfit: number;
    acceptance: number;
  };
  dailySales: Array<{
    date: string;
    sales: number;
    previousSales: number;
  }>;
  productSales: Array<{
    subject_name: string;
    quantity: number;
  }>;
  productReturns: Array<{
    name: string;
    value: number;
  }>;
  topProfitableProducts?: Array<{
    name: string;
    price: string;
    profit: string;
    image: string;
    quantitySold?: number;
    margin?: number;
    returnCount?: number;
    category?: string;
  }>;
  topUnprofitableProducts?: Array<{
    name: string;
    price: string;
    profit: string;
    image: string;
    quantitySold?: number;
    margin?: number;
    returnCount?: number;
    category?: string;
  }>;
  orders?: WildberriesOrder[];
}

interface AdvertisingBreakdown {
  search: number;
}

interface StoredAnalyticsData {
  storeId: string;
  dateFrom: string;
  dateTo: string;
  data: AnalyticsData;
  penalties: Array<{name: string, value: number}>;
  returns: Array<{name: string, value: number}>;
  deductionsTimeline: Array<{
    date: string; 
    logistic: number; 
    storage: number; 
    penalties: number;
    acceptance: number;
    advertising: number;
  }>;
  productAdvertisingData: Array<{name: string, value: number}>;
  advertisingBreakdown: AdvertisingBreakdown;
  timestamp: number; // Добавляем timestamp для отслеживания обновлений
}

interface DeductionsTimelineItem {
  date: string;
  logistic: number;
  storage: number;
  penalties: number;
  acceptance: number;
  advertising: number;
}

const AnalyticsSection = () => {
  const [dateFrom, setDateFrom] = useState<Date>(() => subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>(demoData);
  const [penalties, setPenalties] = useState<Array<{name: string, value: number}>>([]);
  const [returns, setReturns] = useState<Array<{name: string, value: number}>>([]);
  const [deductionsTimeline, setDeductionsTimeline] = useState<DeductionsTimelineItem[]>(deductionsTimelineData);
  const [productAdvertisingData, setProductAdvertisingData] = useState<Array<{name: string, value: number}>>([]);
  const [advertisingBreakdown, setAdvertisingBreakdown] = useState<AdvertisingBreakdown>({
    search: 0
  });
  const [dataTimestamp, setDataTimestamp] = useState<number>(Date.now());
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const getSelectedStore = () => {
    const stores = JSON.parse(localStorage.getItem('marketplace_stores') || '[]');
    return stores.find((store: any) => store.isSelected) || null;
  };

  const saveAnalyticsData = (storeId: string) => {
    // Обновляем timestamp при каждом сохранении
    const timestamp = Date.now();
    setDataTimestamp(timestamp);
    
    const analyticsData: StoredAnalyticsData = {
      storeId,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      data,
      penalties,
      returns,
      deductionsTimeline,
      productAdvertisingData,
      advertisingBreakdown,
      timestamp
    };
    
    localStorage.setItem(`${ANALYTICS_STORAGE_KEY}_${storeId}`, JSON.stringify(analyticsData));
    console.log('Analytics data saved to localStorage with timestamp:', timestamp);
  };

  const loadStoredAnalyticsData = (storeId: string, forceRefresh?: boolean) => {
    try {
      // Используем новую функцию getAnalyticsData для получения данных с проверками и поддержкой forceRefresh
      const analyticsData = getAnalyticsData(storeId, forceRefresh);
      
      if (analyticsData) {
        // Устанавливаем данные с проверками на существование
        setDateFrom(new Date(analyticsData.dateFrom || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
        setDateTo(new Date(analyticsData.dateTo || new Date()));
        
        if (analyticsData.data) {
          setData(analyticsData.data);
        }
        
        // Используем проверенные данные
        setPenalties(analyticsData.penalties || []);
        setReturns(analyticsData.returns || []);
        setDeductionsTimeline(analyticsData.deductionsTimeline || []);
        setProductAdvertisingData(analyticsData.productAdvertisingData || []);
        
        if (analyticsData.advertisingBreakdown) {
          setAdvertisingBreakdown(analyticsData.advertisingBreakdown);
        }
        
        if (analyticsData.timestamp) {
          setDataTimestamp(analyticsData.timestamp);
        }
        
        console.log('Analytics data loaded from localStorage with timestamp:', analyticsData.timestamp);
        return true;
      }
    } catch (error) {
      console.error('Error parsing stored analytics data:', error);
    }
    return false;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const selectedStore = getSelectedStore();
      
      if (!selectedStore) {
        toast({
          title: "Внимание",
          description: "Выберите основной магазин в разделе 'Магазины'",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const statsData = await fetchWildberriesStats(selectedStore.apiKey, dateFrom, dateTo);
      
      // Try-catch block for advertising API to prevent it from breaking everything else
      let totalAdvertisingCost = 0;
      try {
        const advertCosts = await getAdvertCosts(dateFrom, dateTo, selectedStore.apiKey);
        
        if (advertCosts && advertCosts.length > 0) {
          totalAdvertisingCost = advertCosts.reduce((sum, cost) => sum + cost.updSum, 0);
          
          setAdvertisingBreakdown({
            search: totalAdvertisingCost
          });
          
          const campaignCosts: Record<string, number> = {};
          
          advertCosts.forEach(cost => {
            if (!campaignCosts[cost.campName]) {
              campaignCosts[cost.campName] = 0;
            }
            campaignCosts[cost.campName] += cost.updSum;
          });
          
          const advertisingDataArray = Object.entries(campaignCosts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
          
          let topProducts = advertisingDataArray.slice(0, 4);
          const otherProducts = advertisingDataArray.slice(4);
          
          if (otherProducts.length > 0) {
            const otherSum = otherProducts.reduce((sum, item) => sum + item.value, 0);
            topProducts.push({ name: "Другие товары", value: otherSum });
          }
          
          setProductAdvertisingData(topProducts.length > 0 ? topProducts : []);
        } else {
          if (productAdvertisingData.length === 0) {
            setProductAdvertisingData(advertisingData);
          }
          
          setAdvertisingBreakdown({
            search: demoData.currentPeriod.expenses.advertising
          });
          totalAdvertisingCost = demoData.currentPeriod.expenses.advertising;
        }
      } catch (error) {
        console.error('Error fetching advertising data:', error);
        // If advertising API fails, use demo data for advertising
        setProductAdvertisingData(advertisingData);
        setAdvertisingBreakdown({
          search: demoData.currentPeriod.expenses.advertising
        });
        totalAdvertisingCost = demoData.currentPeriod.expenses.advertising;
      }
      
      if (statsData) {
        const modifiedData: AnalyticsData = {
          currentPeriod: {
            ...statsData.currentPeriod,
            expenses: {
              ...statsData.currentPeriod.expenses,
              advertising: totalAdvertisingCost,
              acceptance: statsData.currentPeriod.expenses.acceptance || 0
            }
          },
          dailySales: statsData.dailySales,
          productSales: statsData.productSales,
          productReturns: statsData.productReturns || [],
          topProfitableProducts: statsData.topProfitableProducts,
          topUnprofitableProducts: statsData.topUnprofitableProducts
        };
        
        modifiedData.currentPeriod.expenses.total =
          modifiedData.currentPeriod.expenses.logistics +
          modifiedData.currentPeriod.expenses.storage +
          modifiedData.currentPeriod.expenses.penalties +
          modifiedData.currentPeriod.expenses.advertising +
          (modifiedData.currentPeriod.expenses.acceptance || 0);
        
        setData(modifiedData);
        
        // Set real penalties data if available
        if (statsData.penaltiesData && statsData.penaltiesData.length > 0) {
          setPenalties(statsData.penaltiesData);
        } else {
          // Clear penalties if none exist (don't use demo data)
          setPenalties([]);
        }
        
        if (statsData.productReturns && statsData.productReturns.length > 0) {
          setReturns(statsData.productReturns);
        } else {
          setReturns([]);
        }
        
        // Создаем данные для графика удержаний на основе ежедневных данных
        let newDeductionsTimeline = [];
        if (statsData.dailySales && statsData.dailySales.length > 0) {
          const daysCount = statsData.dailySales.length;
          newDeductionsTimeline = statsData.dailySales.map((day: any) => {
            const logistic = modifiedData.currentPeriod.expenses.logistics / daysCount;
            const storage = modifiedData.currentPeriod.expenses.storage / daysCount;
            const penalties = modifiedData.currentPeriod.expenses.penalties / daysCount;
            const acceptance = modifiedData.currentPeriod.expenses.acceptance / daysCount || 0;
            const advertising = modifiedData.currentPeriod.expenses.advertising / daysCount || 0;
            
            return {
              date: typeof day.date === 'string' ? day.date.split('T')[0] : new Date().toISOString().split('T')[0],
              logistic,
              storage,
              penalties,
              acceptance,
              advertising
            };
          });
        } else {
          // Создаем базовые данные для графика, если нет ежедневных данных
          newDeductionsTimeline = Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            logistic: modifiedData.currentPeriod.expenses.logistics / 7,
            storage: modifiedData.currentPeriod.expenses.storage / 7, 
            penalties: modifiedData.currentPeriod.expenses.penalties / 7,
            acceptance: modifiedData.currentPeriod.expenses.acceptance / 7 || 0,
            advertising: modifiedData.currentPeriod.expenses.advertising / 7 || 0
          }));
        }
        
        setDeductionsTimeline(newDeductionsTimeline);
        
        // Вызываем saveAnalyticsData с принудительным обновлением timestamp
        saveAnalyticsData(selectedStore.id);
        
        toast({
          title: "Успех",
          description: "Аналитические данные успешно обновлены",
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аналитические данные",
        variant: "destructive"
      });
      
      // Устанавливаем базовые данные для графика удержаний при ошибке
      setDeductionsTimeline(Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logistic: 0, 
        storage: 0, 
        penalties: 0,
        acceptance: 0,
        advertising: 0
      })));
      
      setPenalties([]);
      setReturns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const selectedStore = getSelectedStore();
    if (selectedStore) {
      // Загружаем данные сначала без принудительного обновления
      const hasStoredData = loadStoredAnalyticsData(selectedStore.id);
      
      if (!hasStoredData) {
        setPenalties([]);
        setProductAdvertisingData([]);
        setReturns([]);
        // Если нет сохраненных данных, загружаем новые
        fetchData();
      } else {
        setIsLoading(false);
      }
    } else {
      // Устанавливаем базовые данные для графика удержаний, если нет выбранного магазина
      setDeductionsTimeline(Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logistic: 0, 
        storage: 0, 
        penalties: 0,
        acceptance: 0,
        advertising: 0
      })));
      
      setPenalties([]);
      setProductAdvertisingData([]);
      setReturns([]);
      setIsLoading(false);
    }
  }, []);

  const hasAdvertisingData = productAdvertisingData && productAdvertisingData.length > 0;
  const hasPenaltiesData = penalties && penalties.length > 0;

  const handleDateChange = () => {
    fetchData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-800/30 shadow-lg">
        <DateRangePicker 
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          onApplyDateRange={handleDateChange}
          onUpdate={handleDateChange}
        />
      </div>

      <div className="space-y-8">
        <KeyMetrics data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart data={data} />
          <DeductionsChart data={deductionsTimeline} />
        </div>
        
        <GeographySection orders={data?.orders || []} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PieChartCard 
            title="Детализация по штрафам"
            icon={<AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            data={penalties}
            emptyMessage="Штрафы отсутствуют"
          />
          <PieChartCard 
            title="Возврат товаров"
            icon={<PackageX className="h-4 w-4 text-red-600 dark:text-red-400" />}
            data={returns}
            showCount={true}
            emptyMessage="Возвраты отсутствуют"
          />
        </div>

        <ExpenseBreakdown data={data} advertisingBreakdown={advertisingBreakdown} />

        {hasAdvertisingData && (
          <PieChartCard 
            title="Расходы на рекламу по товарам"
            icon={<Tag className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            data={productAdvertisingData}
            emptyMessage="Нет данных о расходах на рекламу"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductList 
            title="Самые прибыльные товары"
            products={data.topProfitableProducts}
            isProfitable={true}
          />
          <ProductList 
            title="Самые убыточные товары"
            products={data.topUnprofitableProducts}
            isProfitable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
