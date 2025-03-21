import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, ArrowUpDown, Package, TrendingDown, Banknote, WarehouseIcon, AlertTriangle, Clock, ArrowDown, ArrowUp, BarChart4, TrendingUp, Calculator, Truck, Percent, ArrowRight, RefreshCw, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { WarehouseRemainItem, PaidStorageItem } from '@/types/supplies';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchFullPaidStorageReport } from '@/services/suppliesApi';
import { format } from 'date-fns';
import { fetchAverageDailySalesFromAPI } from '@/components/analytics/data/demoData';

interface StorageProfitabilityAnalysisProps {
  warehouseItems: WarehouseRemainItem[];
  paidStorageData?: PaidStorageItem[];
  averageDailySalesRate?: Record<number, number>;
  dailyStorageCost?: Record<number, number>;
}

interface AnalysisResult {
  remainItem: WarehouseRemainItem;
  costPrice: number;
  sellingPrice: number;
  dailySales: number;
  dailyStorageCost: number;
  dailyStorageCostTotal: number;
  daysOfInventory: number;
  totalStorageCost: number;
  recommendedDiscount: number;
  profitWithoutDiscount: number;
  profitWithDiscount: number;
  savingsWithDiscount: number;
  action: 'sell' | 'discount' | 'keep';
  lowStock: boolean;
  stockLevel: 'low' | 'medium' | 'high';
  stockLevelPercentage: number;
  lastReplanishmentDate?: Date;
  projectedStockoutDate?: Date;
  profitMarginPercentage: number;
  newSalesRate: number;
  newDaysOfInventory: number;
  discountedStorageCost: number;
  discountedPrice: number;
  storageCostToRevenueRatio: number;
  logisticsCost: number;
  wbCommission: number;
}

interface SalesDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFetchData: (startDate: Date, endDate: Date) => Promise<void>;
  isLoading: boolean;
}

const SalesDataDialog: React.FC<SalesDataDialogProps> = ({
  open,
  onOpenChange,
  onFetchData,
  isLoading
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const handleFetchData = async () => {
    if (startDate && endDate) {
      await onFetchData(startDate, endDate);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Получение данных о продажах</DialogTitle>
          <DialogDescription>
            Выберите период для получения средних показателей продаж
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="startDate">Дата начала</Label>
              <DatePicker value={startDate} onValueChange={setStartDate} placeholder="Выберите дату начала" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="endDate">Дата окончания</Label>
              <DatePicker value={endDate} onValueChange={setEndDate} placeholder="Выберите дату окончания" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleFetchData} disabled={isLoading || !startDate || !endDate}>
            {isLoading ? <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </> : <>
                <Download className="mr-2 h-4 w-4" />
                Получить данные
              </>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};

const StorageProfitabilityAnalysis: React.FC<StorageProfitabilityAnalysisProps> = ({
  warehouseItems,
  paidStorageData = [],
  averageDailySalesRate = {},
  dailyStorageCost = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'discount' | 'keep' | 'low-stock'>('all');
  const [costPrices, setCostPrices] = useState<Record<number, number | null>>({});
  const [sellingPrices, setSellingPrices] = useState<Record<number, number | null>>({});
  const [dailySalesRates, setDailySalesRates] = useState<Record<number, number | null>>({});
  const [storageCostRates, setStorageCostRates] = useState<Record<number, number | null>>({});
  const [discountLevels, setDiscountLevels] = useState<Record<number, number>>({});
  const [lowStockThreshold, setLowStockThreshold] = useState<Record<number, number>>({});
  const [logisticsCosts, setLogisticsCosts] = useState<Record<number, number | null>>({});
  const [wbCommissions, setWbCommissions] = useState<Record<number, number | null>>({});
  const [targetDate, setTargetDate] = useState<Date | undefined>(new Date(new Date().setDate(new Date().getDate() + 30)));
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AnalysisResult | '';
    direction: 'asc' | 'desc';
  }>({
    key: '',
    direction: 'asc'
  });
  const [salesDataDialogOpen, setSalesDataDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [storageData, setStorageData] = useState<PaidStorageItem[]>([]);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('wb_api_key') || '');
  const {
    toast
  } = useToast();

  useEffect(() => {
    const storedCostPrices = localStorage.getItem('product_cost_prices');
    if (storedCostPrices) {
      setCostPrices(JSON.parse(storedCostPrices));
    }
    const storedSellingPrices = localStorage.getItem('product_selling_prices');
    if (storedSellingPrices) {
      setSellingPrices(JSON.parse(storedSellingPrices));
    }
    const storedLowStockThresholds = localStorage.getItem('product_low_stock_thresholds');
    if (storedLowStockThresholds) {
      setLowStockThreshold(JSON.parse(storedLowStockThresholds));
    }
    const storedLogisticsCosts = localStorage.getItem('product_logistics_costs');
    if (storedLogisticsCosts) {
      setLogisticsCosts(JSON.parse(storedLogisticsCosts));
    }
    const storedWbCommissions = localStorage.getItem('product_wb_commissions');
    if (storedWbCommissions) {
      setWbCommissions(JSON.parse(storedWbCommissions));
    }
    const initialDailySales: Record<number, number | null> = {};
    const initialStorageCosts: Record<number, number | null> = {};
    const initialDiscountLevels: Record<number, number> = {};
    const initialLowStockThresholds: Record<number, number> = {};
    const initialCostPrices: Record<number, number | null> = {};
    const initialSellingPrices: Record<number, number | null> = {};
    const initialLogisticsCosts: Record<number, number | null> = {};
    const initialWbCommissions: Record<number, number | null> = {};
    warehouseItems.forEach(item => {
      const nmId = item.nmId;
      if (!costPrices[nmId]) {
        initialCostPrices[nmId] = 0;
      }
      if (!sellingPrices[nmId]) {
        initialSellingPrices[nmId] = item.price || 0;
      }
      let itemStorageCost = dailyStorageCost[nmId] || 5;
      const matchingStorageItems = paidStorageData.filter(psi => psi.nmId === nmId);
      if (matchingStorageItems.length > 0) {
        const totalCost = matchingStorageItems.reduce((sum, psi) => sum + psi.warehousePrice, 0);
        itemStorageCost = totalCost / matchingStorageItems.length;
      }
      if (!dailySalesRates[nmId]) {
        initialDailySales[nmId] = averageDailySalesRate[nmId] || 0.1;
      }
      if (!storageCostRates[nmId]) {
        initialStorageCosts[nmId] = itemStorageCost;
      }
      if (!discountLevels[nmId]) {
        initialDiscountLevels[nmId] = 30;
      }
      if (!logisticsCosts[nmId]) {
        initialLogisticsCosts[nmId] = 150;
      }
      if (!wbCommissions[nmId]) {
        initialWbCommissions[nmId] = 15;
      }
      const salesRate = averageDailySalesRate[nmId] || 0.1;
      if (!lowStockThreshold[nmId]) {
        initialLowStockThresholds[nmId] = Math.max(3, Math.ceil(salesRate * 7));
      }
    });
    setCostPrices(prevState => ({
      ...prevState,
      ...initialCostPrices
    }));
    setSellingPrices(prevState => ({
      ...prevState,
      ...initialSellingPrices
    }));
    setDailySalesRates(prevState => ({
      ...prevState,
      ...initialDailySales
    }));
    setStorageCostRates(prevState => ({
      ...prevState,
      ...initialStorageCosts
    }));
    setDiscountLevels(prevState => ({
      ...prevState,
      ...initialDiscountLevels
    }));
    setLowStockThreshold(prevState => ({
      ...prevState,
      ...initialLowStockThresholds
    }));
    setLogisticsCosts(prevState => ({
      ...prevState,
      ...initialLogisticsCosts
    }));
    setWbCommissions(prevState => ({
      ...prevState,
      ...initialWbCommissions
    }));
  }, [warehouseItems, averageDailySalesRate, dailyStorageCost, paidStorageData]);

  useEffect(() => {
    const loadInitialSalesData = async () => {
      if (apiKey && Object.keys(averageDailySalesRate).length === 0) {
        try {
          setIsLoading(true);
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - 30);
          
          await fetchSalesAndStorageData(startDate, endDate);
        } catch (error) {
          console.error("Ошибка при автоматической загрузке данных о продажах:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (apiKey) {
      loadInitialSalesData();
    }
    
    const handleSalesDataUpdate = (event: CustomEvent<any>) => {
      if (event.detail?.averageSalesPerDay) {
        setDailySalesRates(event.detail.averageSalesPerDay);
      }
    };
    
    window.addEventListener('salesDataUpdated', handleSalesDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('salesDataUpdated', handleSalesDataUpdate as EventListener);
    };
  }, [warehouseItems, averageDailySalesRate, dailyStorageCost, paidStorageData, apiKey]);

  const formatDaysOfInventory = (days: number): string => {
    if (days >= 300) {
      return `${Math.round(days / 30)} мес.`;
    } else if (days > 60) {
      return `${Math.round(days / 7)} нед.`;
    } else {
      return `${days} дн.`;
    }
  };

  const analysisResults = useMemo(() => {
    return warehouseItems.map(item => {
      const nmId = item.nmId;
      const costPrice = costPrices[nmId] || 0;
      const sellingPrice = sellingPrices[nmId] || item.price || 0;
      const dailySales = dailySalesRates[nmId] || 0.1;
      const storageCost = storageCostRates[nmId] || 5;
      const currentStock = item.quantityWarehousesFull || 0;
      const threshold = lowStockThreshold[nmId] || Math.ceil(dailySales * 7);
      const logisticsCost = logisticsCosts[nmId] || 150;
      const wbCommission = wbCommissions[nmId] || 15;
      const dailyStorageCostTotal = storageCost * currentStock;
      const daysOfInventory = dailySales > 0 ? Math.round(currentStock / dailySales) : 999;
      const averageStock = currentStock / 2;
      const totalStorageCost = averageStock * daysOfInventory * storageCost;
      const commissionAmount = sellingPrice * (wbCommission / 100);
      const totalLogisticsCost = logisticsCost * currentStock;
      const profitPerItem = sellingPrice - costPrice - commissionAmount - logisticsCost;
      const profitMarginPercentage = sellingPrice > 0 ? profitPerItem / sellingPrice * 100 : 0;
      const grossProfit = profitPerItem * currentStock;
      const netProfit = grossProfit - totalStorageCost;
      const stockTurnoverDays = daysOfInventory;
      const storageROI = totalStorageCost > 0 ? netProfit / totalStorageCost : 0;
      const storageCostToRevenueRatio = sellingPrice * currentStock > 0 ? totalStorageCost / (sellingPrice * currentStock) : 0;
      let recommendedDiscount = 0;
      let action: 'sell' | 'discount' | 'keep' = 'keep';
      const isLowMargin = profitMarginPercentage < 15;
      const isHighStorageCost = storageCostToRevenueRatio > 0.1;
      const isSlowMoving = stockTurnoverDays > 60;
      if (isSlowMoving && isHighStorageCost) {
        recommendedDiscount = 40;
        action = 'sell';
      } else if (isLowMargin && isHighStorageCost) {
        recommendedDiscount = discountLevels[nmId] || 25;
        action = 'discount';
      } else if (isSlowMoving && !isLowMargin) {
        recommendedDiscount = discountLevels[nmId] || 15;
        action = 'discount';
      } else {
        recommendedDiscount = 0;
        action = 'keep';
      }
      const discountedPrice = sellingPrice * (1 - recommendedDiscount / 100);
      const discountedCommissionAmount = discountedPrice * (wbCommission / 100);
      const profitWithDiscountPerItem = discountedPrice - costPrice - discountedCommissionAmount - logisticsCost;
      const salesAccelerationFactor = 1 + recommendedDiscount / 100;
      const newSalesRate = dailySales * salesAccelerationFactor;
      const newDaysOfInventory = Math.round(daysOfInventory / salesAccelerationFactor);
      const discountedStorageCost = averageStock * newDaysOfInventory * storageCost;
      const profitWithoutDiscount = profitPerItem * currentStock - totalStorageCost;
      const profitWithDiscount = profitWithDiscountPerItem * currentStock - discountedStorageCost;
      const savingsWithDiscount = profitWithDiscount - profitWithoutDiscount;
      if (profitWithDiscount < 0 && profitWithoutDiscount < 0 && profitWithDiscount < profitWithoutDiscount) {
        action = 'keep';
        recommendedDiscount = 0;
      }
      if (savingsWithDiscount < 0) {
        if (isSlowMoving && daysOfInventory > 180) {
          action = 'discount';
          recommendedDiscount = Math.min(15, discountLevels[nmId] || 15);
        } else {
          action = 'keep';
          recommendedDiscount = 0;
        }
      }
      if (profitWithoutDiscount < 0 && profitWithDiscount > 0) {
        action = 'discount';
      }
      if (profitWithDiscount < 0 && recommendedDiscount > 0) {
        if (Math.abs(profitWithDiscount) > profitWithDiscountPerItem * currentStock * 0.5) {
          if (profitWithDiscount > profitWithoutDiscount) {
            action = 'sell';
            recommendedDiscount = Math.min(50, discountLevels[nmId] || 50);
          } else {
            action = 'keep';
            recommendedDiscount = 0;
          }
        }
      }
      if (savingsWithDiscount > 0 && action === 'keep') {
        action = 'discount';
        recommendedDiscount = discountLevels[nmId] || 15;
      }
      const lowStock = currentStock <= threshold;
      if (lowStock && stockTurnoverDays < 90) {
        action = 'keep';
        recommendedDiscount = 0;
      }
      const stockLevelPercentage = Math.min(100, Math.max(0, Math.round(currentStock / (threshold * 2) * 100)));
      let stockLevel: 'low' | 'medium' | 'high';
      if (currentStock <= threshold) {
        stockLevel = 'low';
      } else if (currentStock <= threshold * 3) {
        stockLevel = 'medium';
      } else {
        stockLevel = 'high';
      }
      const projectedStockoutDate = dailySales > 0 ? new Date(Date.now() + daysOfInventory * 24 * 60 * 60 * 1000) : undefined;
      return {
        remainItem: item,
        costPrice,
        sellingPrice,
        dailySales,
        dailyStorageCost: storageCost,
        dailyStorageCostTotal,
        daysOfInventory,
        totalStorageCost,
        recommendedDiscount,
        profitWithoutDiscount,
        profitWithDiscount,
        savingsWithDiscount,
        action,
        lowStock,
        stockLevel,
        stockLevelPercentage,
        projectedStockoutDate,
        profitMarginPercentage,
        newSalesRate,
        newDaysOfInventory,
        discountedStorageCost,
        discountedPrice,
        storageCostToRevenueRatio,
        logisticsCost,
        wbCommission
      };
    });
  }, [warehouseItems, costPrices, sellingPrices, dailySalesRates, storageCostRates, discountLevels, lowStockThreshold, logisticsCosts, wbCommissions]);

  const filteredResults = useMemo(() => {
    let results = [...analysisResults];
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(result => result.remainItem.brand.toLowerCase().includes(search) || result.remainItem.subjectName && result.remainItem.subjectName.toLowerCase().includes(search) || result.remainItem.vendorCode && result.remainItem.vendorCode.toLowerCase().includes(search) || result.remainItem.nmId.toString().includes(search));
    }
    if (selectedTab === 'discount') {
      results = results.filter(result => result.action === 'discount' || result.action === 'sell');
    } else if (selectedTab === 'keep') {
      results = results.filter(result => result.action === 'keep');
    } else if (selectedTab === 'low-stock') {
      results = results.filter(result => result.lowStock);
    }
    if (sortConfig.key) {
      results.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return results;
  }, [analysisResults, searchTerm, selectedTab, sortConfig]);

  const analysisSummary = useMemo(() => {
    const totalItems = analysisResults.length;
    const lowStockItems = analysisResults.filter(item => item.lowStock).length;
    const discountItems = analysisResults.filter(item => item.action === 'discount').length;
    const sellItems = analysisResults.filter(item => item.action === 'sell').length;
    const keepItems = analysisResults.filter(item => item.action === 'keep').length;
    const totalStorageCost = analysisResults.reduce((sum, item) => sum + item.totalStorageCost, 0);
    const potentialSavings = analysisResults.reduce((sum, item) => {
      return sum + (item.savingsWithDiscount > 0 ? item.savingsWithDiscount : 0);
    }, 0);
    const itemsStockingOutBeforeTarget = targetDate ? analysisResults.filter(item => item.projectedStockoutDate && item.projectedStockoutDate <= targetDate).length : 0;
    return {
      totalItems,
      lowStockItems,
      discountItems,
      sellItems,
      keepItems,
      totalStorageCost,
      potentialSavings,
      itemsStockingOutBeforeTarget
    };
  }, [analysisResults, targetDate]);

  const requestSort = (key: keyof AnalysisResult) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({
      key,
      direction
    });
  };

  const savePriceData = () => {
    localStorage.setItem('product_cost_prices', JSON.stringify(costPrices));
    localStorage.setItem('product_selling_prices', JSON.stringify(sellingPrices));
    localStorage.setItem('product_low_stock_thresholds', JSON.stringify(lowStockThreshold));
    localStorage.setItem('product_logistics_costs', JSON.stringify(logisticsCosts));
    localStorage.setItem('product_wb_commissions', JSON.stringify(wbCommissions));
    toast({
      title: "Данные сохранены",
      description: "Все изменения успешно сохранены в локальное хранилище"
    });
  };

  const updateCostPrice = (nmId: number, value: string) => {
    setCostPrices(prev => {
      const newPrices = {
        ...prev
      };
      newPrices[nmId] = value === "" ? null : Number(value);
      return newPrices;
    });
  };

  const updateSellingPrice = (nmId: number, value: string) => {
    setSellingPrices(prev => {
      const newPrices = {
        ...prev
      };
      newPrices[nmId] = value === "" ? null : Number(value);
      return newPrices;
    });
  };

  const updateDailySales = (nmId: number, value: string) => {
    setDailySalesRates(prev => {
      const newRates = {
        ...prev
      };
      newRates[nmId] = value === "" ? null : Number(value);
      return newRates;
    });
  };

  const updateStorageCost = (nmId: number, value: string) => {
    setStorageCostRates(prev => {
      const newRates = {
        ...prev
      };
      newRates[nmId] = value === "" ? null : Number(value);
      return newRates;
    });
  };

  const updateLogisticsCost = (nmId: number, value: string) => {
    setLogisticsCosts(prev => {
      const newCosts = {
        ...prev
      };
      newCosts[nmId] = value === "" ? null : Number(value);
      return newCosts;
    });
  };

  const updateWbCommission = (nmId: number, value: string) => {
    setWbCommissions(prev => {
      const newCommissions = {
        ...prev
      };
      newCommissions[nmId] = value === "" ? null : Number(value);
      return newCommissions;
    });
  };

  const fetchSalesAndStorageData = async (startDate: Date, endDate: Date) => {
    if (!apiKey) {
      toast({
        title: "Ошибка авторизации",
        description: 'Необходим API-ключ для загрузки данных о продажах',
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const dateFrom = format(startDate, 'yyyy-MM-dd');
      const dateTo = format(endDate, 'yyyy-MM-dd');
      
      const { fetchAverageDailySalesFromAPI } = await import('@/components/analytics/data/demoData');
      
      const salesData = await fetchAverageDailySalesFromAPI(apiKey, dateFrom, dateTo);
      
      if (Object.keys(salesData).length > 0) {
        setDailySalesRates(prevRates => ({
          ...prevRates,
          ...salesData
        }));
        
        console.log('Обновлены данные о средних продажах:', Object.keys(salesData).length);
        
        try {
          const storageData = await loadPaidStorageData();
          
          if (storageData && storageData.length > 0) {
            const storageCostsData: Record<number, number> = {};
            
            const storageByProduct: Record<number, { totalCost: number, uniqueDays: Set<string> }> = {};
            
            storageData.forEach((storage: any) => {
              if (storage.nmId) {
                const nmId = storage.nmId;
                const storageDate = storage.date_from || new Date().toISOString().split('T')[0];
                
                if (!storageByProduct[nmId]) {
                  storageByProduct[nmId] = { totalCost: 0, uniqueDays: new Set() };
                }
                
                storageByProduct[nmId].totalCost += storage.warehousePrice || 0;
                storageByProduct[nmId].uniqueDays.add(storageDate);
              }
            });
            
            Object.entries(storageByProduct).forEach(([nmIdStr, data]) => {
              const nmId = parseInt(nmIdStr);
              const daysCount = Math.max(1, data.uniqueDays.size);
              const averageStorageCost = data.totalCost / daysCount;
              
              storageCostsData[nmId] = parseFloat(averageStorageCost.toFixed(2));
            });
            
            setStorageCostRates(prevCosts => ({
              ...prevCosts,
              ...storageCostsData
            }));
          }
        } catch (storageError) {
          console.error("Ошибка при загрузке данных о хранении:", storageError);
        }
        
        setSalesDataDialogOpen(false);
        
        toast({
          title: "Данные получены",
          description: `Данные о продажах за период ${format(startDate, 'dd.MM.yyyy')} - ${format(endDate, 'dd.MM.yyyy')} успешно загружены`,
        });
      } else {
        toast({
          title: "Нет данных",
          description: "За выбранный период не найдено данных о продажах",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error("Ошибка при получении данных:", error);
      toast({
        title: "Ошибка получения данных",
        description: error.message || "Не удалось получить данные о продажах. Пожалуйста, проверьте API-ключ и попробуйте снова.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaidStorageData = async (): Promise<PaidStorageItem[]> => {
    if (!apiKey) {
      return [];
    }
    
    try {
      setIsLoadingStorage(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const dateFrom = startDate.toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];
      
      const data = await fetchFullPaidStorageReport(apiKey, dateFrom, dateTo);
      setStorageData(data);
      return data;
    } catch (error: any) {
      console.error('Ошибка при загрузке данных о платном хранении:', error);
      return [];
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const getActionBadge = (action: 'sell' | 'discount' | 'keep') => {
    switch (action) {
      case 'sell':
        return <Badge variant="destructive">Быстрая продажа</Badge>;
      case 'discount':
        return <Badge variant="warning" className="bg-amber-500">Снизить цену</Badge>;
      case 'keep':
        return <Badge variant="outline">Сохранить цену</Badge>;
      default:
        return null;
    }
  };

  const getStockLevelIndicator = (result: AnalysisResult) => {
    switch (result.stockLevel) {
      case 'low':
        return <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-500 font-medium flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> Низкий запас
              </span>
              <span className="text-xs">{result.stockLevelPercentage}%</span>
            </div>
            <Progress value={result.stockLevelPercentage} className="h-1.5 bg-rose-100" indicatorClassName="bg-rose-500" />
          </div>;
      case 'medium':
        return <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-500 font-medium">Средний запас</span>
              <span className="text-xs">{result.stockLevelPercentage}%</span>
            </div>
            <Progress value={result.stockLevelPercentage} className="h-1.5 bg-amber-100" indicatorClassName="bg-amber-500" />
          </div>;
      case 'high':
        return <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-500 font-medium">Высокий запас</span>
              <span className="text-xs">{result.stockLevelPercentage}%</span>
            </div>
            <Progress value={result.stockLevelPercentage} className="h-1.5 bg-emerald-100" indicatorClassName="bg-emerald-500" />
          </div>;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Не определено";
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getAnalysisStatusIndicator = (result: AnalysisResult) => {
    const factors = [];
    if (result.profitMarginPercentage < 15) {
      factors.push({
        label: "Низкая маржа",
        description: "Маржинальность товара ниже 15%",
        value: `${result.profitMarginPercentage.toFixed(1)}%`,
        status: "warning",
        icon: <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
      });
    } else {
      factors.push({
        label: "Высокая маржа",
        description: "Маржинальность товара выше 15%",
        value: `${result.profitMarginPercentage.toFixed(1)}%`,
        status: "positive",
        icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
      });
    }
    if (result.storageCostToRevenueRatio > 0.1) {
      factors.push({
        label: "Высокие затраты на хранение",
        description: "Затраты на хранение >10% от выручки",
        value: `${(result.storageCostToRevenueRatio * 100).toFixed(1)}%`,
        status: "warning",
        icon: <WarehouseIcon className="h-3.5 w-3.5 text-amber-500" />
      });
    } else {
      factors.push({
        label: "Оптимальные затраты на хранение",
        description: "Затраты на хранение <10% от выручки",
        value: `${(result.storageCostToRevenueRatio * 100).toFixed(1)}%`,
        status: "positive",
        icon: <WarehouseIcon className="h-3.5 w-3.5 text-emerald-500" />
      });
    }
    if (result.daysOfInventory > 60) {
      factors.push({
        label: "Медленные продажи",
        description: "Более 60 дней на распродажу запаса",
        value: formatDaysOfInventory(result.daysOfInventory),
        status: "warning",
        icon: <Clock className="h-3.5 w-3.5 text-amber-500" />
      });
    } else {
      factors.push({
        label: "Быстрые продажи",
        description: "Менее 60 дней на распродажу запаса",
        value: formatDaysOfInventory(result.daysOfInventory),
        status: "positive",
        icon: <Clock className="h-3.5 w-3.5 text-emerald-500" />
      });
    }
    return <div className="space-y-2">
        {factors.map((factor, index) => <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {factor.icon}
              <span className={`font-medium ${factor.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {factor.label}
              </span>
            </div>
            <span className={`${factor.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'} font-medium`}>
              {factor.value}
            </span>
          </div>)}
      </div>;
  };

  const DetailedAnalysis = ({
    result
  }: {
    result: AnalysisResult;
  }) => {
    return <div className="p-5 max-w-md space-y-6 text-sm">
        <div>
          <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Расчет рентабельности хранения
          </h3>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 mb-4">
            {getAnalysisStatusIndicator(result)}
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2 text-xs text-muted-foreground">СРАВНЕНИЕ СЦЕНАРИЕВ</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2 border rounded-lg p-3 bg-white dark:bg-slate-950">
                <div className="text-xs text-muted-foreground">Текущая цена</div>
                <div className="font-medium">{formatCurrency(result.sellingPrice)}</div>
              </div>
              
              <div className="space-y-2 border border-amber-200 dark:border-amber-800 rounded-lg p-3 bg-amber-50 dark:bg-amber-950/30">
                <div className="text-xs text-amber-600 dark:text-amber-400">Со скидкой {result.recommendedDiscount}%</div>
                <div className="font-medium">{formatCurrency(result.discountedPrice)}</div>
              </div>
              
              <div className="space-y-2 border rounded-lg p-3 bg-white dark:bg-slate-950">
                <div className="text-xs text-muted-foreground">Себестоимость</div>
                <div className="font-medium">{formatCurrency(result.costPrice)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs text-muted-foreground mb-1">ПРОДАЖИ И ОБОРАЧИВАЕМОСТЬ</h4>
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="py-1 text-muted-foreground">Текущие продажи в день</td>
                      <td className="py-1 text-right font-medium">{result.dailySales.toFixed(2)} шт</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-muted-foreground">Продажи со скидкой</td>
                      <td className="py-1 text-right font-medium">{result.newSalesRate.toFixed(2)} шт</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-muted-foreground">Текущий запас</td>
                      <td className="py-1 text-right font-medium">{result.remainItem.quantityWarehousesFull} шт</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-1 text-muted-foreground">Дней до распродажи</td>
                      <td className="py-1 text-right font-medium">{formatDaysOfInventory(result.daysOfInventory)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-muted-foreground">Со скидкой</td>
                      <td className="py-1 text-right font-medium">{formatDaysOfInventory(result.newDaysOfInventory)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h4 className="text-xs text-muted-foreground mb-1">ЗАТРАТЫ НА ХРАНЕНИЕ</h4>
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="py-1 text-muted-foreground">Стоимость хранения в день</td>
                      <td className="py-1 text-right font-medium">{formatCurrency(result.dailyStorageCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-muted-foreground">В день на весь запас</td>
                      <td className="py-1 text-right font-medium">{formatCurrency(result.dailyStorageCostTotal)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-1 text-muted-foreground">Общие затраты на хранение</td>
                      <td className="py-1 text-right font-medium">{formatCurrency(result.totalStorageCost)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-muted-foreground">Со скидкой</td>
                      <td className="py-1 text-right font-medium">{formatCurrency(result.discountedStorageCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-xs text-muted-foreground mb-1">ДОПОЛНИТЕЛЬНЫЕ ЗАТРАТЫ</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 text-muted-foreground">Логистика (за единицу)</td>
                    <td className="py-1 text-right font-medium">{formatCurrency(result.logisticsCost)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-muted-foreground">Логистика (на весь запас)</td>
                    <td className="py-1 text-right font-medium">{formatCurrency(result.logisticsCost * result.remainItem.quantityWarehousesFull)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-muted-foreground">Комиссия WB</td>
                    <td className="py-1 text-right font-medium">{result.wbCommission}%</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-muted-foreground">Комиссия в деньгах (за единицу)</td>
                    <td className="py-1 text-right font-medium">{formatCurrency(result.sellingPrice * (result.wbCommission / 100))}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-muted-foreground">Комиссия (на весь запас)</td>
                    <td className="py-1 text-right font-medium">{formatCurrency(result.sellingPrice * (result.wbCommission / 100) * result.remainItem.quantityWarehousesFull)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Separator />
            
            <div>
              <h4 className="text-xs text-muted-foreground mb-1">ИТОГОВЫЕ ФИНАНСОВЫЕ РЕЗУЛЬТАТЫ</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 text-muted-foreground">Прибыль без скидки</td>
                    <td className="py-1 text-right font-medium">{formatCurrency(result.profitWithoutDiscount)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-muted-foreground">Прибыль со скидкой</td>
                    <td className="py-1 text-right font-medium">{formatCurrency(result.profitWithDiscount)}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-1 font-medium">Разница</td>
                    <td className={`py-1 text-right font-medium ${result.savingsWithDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {result.savingsWithDiscount > 0 ? '+' : ''}{formatCurrency(result.savingsWithDiscount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <h4 className="font-medium mb-2">Рекомендация</h4>
          <div className="flex items-center gap-2 mb-3">
            {getActionBadge(result.action)}
          </div>
          
          {result.action === 'discount' && <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Рекомендуемая скидка</span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{result.recommendedDiscount}%</span>
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400">
                Снижение цены с {formatCurrency(result.sellingPrice)} до {formatCurrency(result.discountedPrice)} позволит ускорить продажи и сократить затраты на хранение.
                {result.savingsWithDiscount > 0 && <span className="block mt-1">Ожидаемая дополнительная прибыль: +{formatCurrency(result.savingsWithDiscount)}</span>}
              </div>
            </div>}
          
          {result.action === 'sell' && <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Рекомендация по распродаже</span>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">{result.recommendedDiscount}%</span>
              </div>
              <div className="text-xs text-rose-700 dark:text-rose-400">
                Рекомендуется быстрая распродажа товара со скидкой до {result.recommendedDiscount}%, так как затраты на хранение превышают потенциальную прибыль.
                {result.savingsWithDiscount > 0 && <span className="block mt-1">Это уменьшит убытки на {formatCurrency(result.savingsWithDiscount)}</span>}
              </div>
            </div>}
        </div>
      </div>;
  };

  return <Card className="border-none shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <BarChart4 className="h-5 w-5 mr-2" />
          Анализ рентабельности хранения
        </CardTitle>
        <CardDescription>
          Оценка экономической эффективности хранения товаров
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Всего товаров</p>
              <p className="text-2xl font-semibold">{analysisSummary.totalItems}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Затраты на хранение</p>
              <p className="text-2xl font-semibold">{formatCurrency(analysisSummary.totalStorageCost)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Потенциальная экономия</p>
              <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(analysisSummary.potentialSavings)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <p className="text-xs text-muted-foreground">Прогноз окончания запасов</p>
                <DatePicker value={targetDate} onValueChange={setTargetDate} />
              </div>
              <p className="text-2xl font-semibold text-amber-500">{analysisSummary.itemsStockingOutBeforeTarget}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="flex items-center justify-center bg-white dark:bg-slate-800 rounded-md py-2 border">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Badge variant="outline" className="gap-1 border-emerald-300">
                    <ArrowUp className="h-3 w-3 text-emerald-500" />
                    <span>{analysisSummary.keepItems}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Оставить как есть</p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-white dark:bg-slate-800 rounded-md py-2 border">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Badge variant="warning" className="gap-1 bg-amber-500">
                    <ArrowDown className="h-3 w-3 text-white" />
                    <span>{analysisSummary.discountItems}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Снизить цену</p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-white dark:bg-slate-800 rounded-md py-2 border">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Badge variant="destructive" className="gap-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>{analysisSummary.sellItems}</span>
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Быстро продать</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск по бренду или артикулу..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              
              <SalesDataDialog open={salesDataDialogOpen} onOpenChange={setSalesDataDialogOpen} onFetchData={fetchSalesAndStorageData} isLoading={isLoading} />
            </div>
            <Tabs value={selectedTab} onValueChange={value => setSelectedTab(value as any)} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all" className="text-xs">Все товары</TabsTrigger>
                <TabsTrigger value="discount" className="text-xs">Скидки ({analysisSummary.discountItems + analysisSummary.sellItems})</TabsTrigger>
                <TabsTrigger value="keep" className="text-xs">Без скидок ({analysisSummary.keepItems})</TabsTrigger>
                <TabsTrigger value="low-stock" className="text-xs">Низкий запас ({analysisSummary.lowStockItems})</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={savePriceData} size="sm" className="w-full md:w-auto">
              Сохранить изменения
            </Button>
          </div>

          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Товар</TableHead>
                  <TableHead>Остаток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => requestSort('sellingPrice')}>
                    <div className="flex items-center justify-end">
                      Цена
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => requestSort('costPrice')}>
                    <div className="flex items-center justify-end">
                      Себестоимость
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => requestSort('wbCommission')}>
                    <div className="flex items-center justify-end">
                      Комиссия WB
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => requestSort('dailySales')}>
                    <div className="flex items-center justify-end">
                      Продажи/день
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => requestSort('dailyStorageCost')}>
                    <div className="flex items-center justify-end">
                      Хранение в день
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => requestSort('daysOfInventory')}>
                    <div className="flex items-center justify-end">
                      Дней до распродажи
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length > 0 ? filteredResults.map(result => <TableRow key={result.remainItem.nmId} className="group">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{result.remainItem.brand}</div>
                          <div className="text-xs text-muted-foreground">
                            Арт. {result.remainItem.vendorCode || 'Н/Д'} | ID {result.remainItem.nmId}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {result.remainItem.subjectName || 'Без категории'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="font-medium">{result.remainItem.quantityWarehousesFull}</span>
                            <span className="text-xs text-muted-foreground ml-1">шт</span>
                          </div>
                          {getStockLevelIndicator(result)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(result.action)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-2">
                          <Input trackValue={true} type="number" value={sellingPrices[result.remainItem.nmId] === null ? "" : sellingPrices[result.remainItem.nmId]?.toString() || ""} onChange={e => updateSellingPrice(result.remainItem.nmId, e.target.value)} className="h-8 w-24 text-right" />
                          {result.action !== 'keep' && <div className="flex items-center justify-end gap-1 text-xs">
                              <span className="text-muted-foreground">Рек.</span>
                              <span className="font-medium">{formatCurrency(result.discountedPrice)}</span>
                            </div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input trackValue={true} type="number" value={costPrices[result.remainItem.nmId] === null ? "" : costPrices[result.remainItem.nmId]?.toString() || ""} onChange={e => updateCostPrice(result.remainItem.nmId, e.target.value)} className="h-8 w-24 text-right" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input trackValue={true} type="number" value={wbCommissions[result.remainItem.nmId] === null ? "" : wbCommissions[result.remainItem.nmId]?.toString() || ""} onChange={e => updateWbCommission(result.remainItem.nmId, e.target.value)} className="h-8 w-20 text-right" />
                        <div className="text-xs flex justify-end items-center mt-1">
                          <span>%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input trackValue={true} type="number" value={dailySalesRates[result.remainItem.nmId] === null ? "" : dailySalesRates[result.remainItem.nmId]?.toString() || ""} onChange={e => updateDailySales(result.remainItem.nmId, e.target.value)} className="h-8 w-24 text-right" step="0.1" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input trackValue={true} type="number" value={storageCostRates[result.remainItem.nmId] === null ? "" : storageCostRates[result.remainItem.nmId]?.toString() || ""} onChange={e => updateStorageCost(result.remainItem.nmId, e.target.value)} className="h-8 w-24 text-right" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="w-24">
                          <div className="text-center font-medium">
                            {formatDaysOfInventory(result.daysOfInventory)}
                          </div>
                          {result.action !== 'keep' && <div className="flex items-center justify-center gap-1 text-xs">
                              <ArrowDown className="h-3 w-3 text-amber-500" />
                              <span className="text-amber-600">{formatDaysOfInventory(result.newDaysOfInventory)}</span>
                            </div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          {result.action === 'discount' && <Badge variant="warning" className="bg-amber-500">
                              -{result.recommendedDiscount}%
                            </Badge>}
                          {result.action === 'sell' && <Badge variant="destructive">
                              -{result.recommendedDiscount}%
                            </Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100">
                              <Calculator className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <DetailedAnalysis result={result} />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                      {searchTerm ? `Товары по запросу "${searchTerm}" не найдены` : "Нет товаров для отображения"}
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>;
};

export default StorageProfitabilityAnalysis;
