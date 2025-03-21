import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, ArrowUpDown, Package, TrendingDown, Banknote, WarehouseIcon, AlertTriangle, Clock, ArrowDown, ArrowUp, BarChart4, TrendingUp, Calculator, Truck, Percent, ArrowRight, RefreshCw, Download, Megaphone } from 'lucide-react';
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
  action: 'sell' | 'discount' | 'keep' | 'advertise';
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
  advertisingCost?: number;
  advertisingROI?: number;
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
      let action: 'sell' | 'discount' | 'keep' | 'advertise' = 'keep';
      
      const isLowMargin = profitMarginPercentage < 15;
      const isHighStorageCost = storageCostToRevenueRatio > 0.1;
      const isSlowMoving = stockTurnoverDays > 60;
      const isVerySlowMoving = stockTurnoverDays > 90;
      const isHighMargin = profitMarginPercentage > 25;
      
      // Calculate advertising metrics
      const advertisingCost = Math.round(sellingPrice * 0.15); // Estimate ad cost as 15% of item price
      const advertisingSalesMultiplier = 1.8; // Ads increase sales by 80%
      const newSalesWithAds = dailySales * advertisingSalesMultiplier;
      const newDaysOfInventoryWithAds = Math.round(currentStock / newSalesWithAds);
      const advertisingStorageCost = averageStock * newDaysOfInventoryWithAds * storageCost;
      const totalAdvertisingCost = advertisingCost * currentStock;
      const profitWithAdvertising = (profitPerItem * currentStock) - advertisingStorageCost - totalAdvertisingCost;
      const advertisingROI = totalAdvertisingCost > 0 ? (profitWithAdvertising - netProfit) / totalAdvertisingCost : 0;
      
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
      
      // Consider advertising as an option
      if (isVerySlowMoving && isHighMargin && advertisingROI > 0.2) {
        action = 'advertise';
        recommendedDiscount = 0;
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
      
      // Extra logic for decision making
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
      
      // Check if advertising would be more profitable than discounting
      if ((action === 'discount' || action === 'sell') && advertisingROI > 0.3 && isHighMargin) {
        action = 'advertise';
        recommendedDiscount = 0;
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
        wbCommission,
        advertisingCost,
        advertisingROI
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

  const getActionBadge = (action: 'sell' | 'discount' | 'keep' | 'advertise') => {
    switch (action) {
      case 'sell':
        return <Badge variant="destructive">Быстрая продажа</Badge>;
      case 'discount':
        return <Badge variant="warning" className="bg-amber-500">Снизить цену</Badge>;
      case 'keep':
        return <Badge variant="outline">Сохранить цену</Badge>;
      case 'advertise':
        return <Badge variant="secondary" className="bg-purple-500 hover:bg-purple-600 text-white">Дать рекламу</Badge>;
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
    }
    
    if (result.storageCostToRevenueRatio > 0.1) {
      factors.push({
        label: "Высокие затраты на хранение",
        description: "Затраты на хранение превышают 10% от выручки",
        value: `${(result.storageCostToRevenueRatio * 100).toFixed(1)}%`,
        status: "warning",
        icon: <WarehouseIcon className="h-3.5 w-3.5 text-amber-500" />
      });
    }
    
    if (result.daysOfInventory > 60) {
      factors.push({
        label: "Низкая оборачиваемость",
        description: "Товар находится на складе более 60 дней",
        value: formatDaysOfInventory(result.daysOfInventory),
        status: "warning",
        icon: <Clock className="h-3.5 w-3.5 text-amber-500" />
      });
    }
    
    if (result.advertisingROI && result.advertisingROI > 0.2) {
      factors.push({
        label: "Подходит для рекламы",
        description: "Потенциальный ROI рекламы > 20%",
        value: `${(result.advertisingROI * 100).toFixed(1)}%`,
        status: "success",
        icon: <Megaphone className="h-3.5 w-3.5 text-emerald-500" />
      });
    }
    
    return factors;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Анализ рентабельности хранения</CardTitle>
          <CardDescription>
            Оценка экономической эффективности хранения товаров и рекомендация по управлению запасами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mb-4">
            <div className="relative w-full sm:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по артикулу, бренду или категории..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2 items-center">
              <Label htmlFor="targetDate" className="whitespace-nowrap">Целевая дата:</Label>
              <DatePicker
                id="targetDate"
                value={targetDate}
                onValueChange={setTargetDate}
                placeholder="Выберите дату"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSalesDataDialogOpen(true)}
              className="whitespace-nowrap"
            >
              <Download className="h-4 w-4 mr-2" />
              Данные о продажах
            </Button>
            <Button onClick={savePriceData} size="sm" className="whitespace-nowrap">
              Сохранить изменения
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 mb-6">
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Товаров на складе</p>
                    <p className="text-2xl font-bold">{analysisSummary.totalItems}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Затраты на хранение</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysisSummary.totalStorageCost)} ₽</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Потенциальная экономия</p>
                    <p className="text-2xl font-bold">{formatCurrency(analysisSummary.potentialSavings)} ₽</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Заканчиваются до {formatDate(targetDate)}</p>
                    <p className="text-2xl font-bold">{analysisSummary.itemsStockingOutBeforeTarget}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="all" onValueChange={(value) => setSelectedTab(value as any)}>
            <TabsList>
              <TabsTrigger value="all">Все товары ({analysisSummary.totalItems})</TabsTrigger>
              <TabsTrigger value="discount">
                Рекомендации ({analysisSummary.discountItems + analysisSummary.sellItems})
              </TabsTrigger>
              <TabsTrigger value="keep">Оставить как есть ({analysisSummary.keepItems})</TabsTrigger>
              <TabsTrigger value="low-stock">Низкий запас ({analysisSummary.lowStockItems})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Товар</TableHead>
                    <TableHead className="text-right w-[150px]">
                      <div className="flex items-center justify-end cursor-pointer" onClick={() => requestSort('sellingPrice')}>
                        <span>Цена</span>
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[150px]">
                      <div className="flex items-center justify-end cursor-pointer" onClick={() => requestSort('costPrice')}>
                        <span>Себестоимость</span>
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[130px]">
                      <div className="flex items-center justify-end cursor-pointer" onClick={() => requestSort('daysOfInventory')}>
                        <span>Оборот</span>
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[120px]">Запас</TableHead>
                    <TableHead className="text-right w-[170px]">
                      <div className="flex items-center justify-end cursor-pointer" onClick={() => requestSort('totalStorageCost')}>
                        <span>Затраты на хранение</span>
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[150px]">Рекомендация</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.remainItem.nmId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">{result.remainItem.brand}</span>
                          <span className="text-sm text-muted-foreground">{result.remainItem.subjectName || result.remainItem.category}</span>
                          <span className="text-xs text-muted-foreground">Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <Input
                            type="number"
                            value={sellingPrices[result.remainItem.nmId] ?? ''}
                            onChange={(e) => updateSellingPrice(result.remainItem.nmId, e.target.value)}
                            className="w-24 text-right"
                          />
                          <span className="text-xs text-muted-foreground mt-1">Текущая: {formatCurrency(result.remainItem.price || 0)} ₽</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={costPrices[result.remainItem.nmId] ?? ''}
                          onChange={(e) => updateCostPrice(result.remainItem.nmId, e.target.value)}
                          className="w-24 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end space-y-1">
                          <span className="font-medium">{formatDaysOfInventory(result.daysOfInventory)}</span>
                          <div className="w-24">
                            <Input
                              type="number"
                              value={dailySalesRates[result.remainItem.nmId] ?? ''}
                              onChange={(e) => updateDailySales(result.remainItem.nmId, e.target.value)}
                              className="text-right"
                              placeholder="Продаж/день"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {result.projectedStockoutDate ? `До ${formatDate(result.projectedStockoutDate)}` : 'Неизвестно'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-2">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{result.remainItem.quantityWarehousesFull || 0} шт.</span>
                          </div>
                          {getStockLevelIndicator(result)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end space-y-1">
                          <span className="font-medium">{formatCurrency(result.totalStorageCost)} ₽</span>
                          <div className="w-20">
                            <Input
                              type="number"
                              value={storageCostRates[result.remainItem.nmId] ?? ''}
                              onChange={(e) => updateStorageCost(result.remainItem.nmId, e.target.value)}
                              className="text-right"
                              placeholder="₽/день"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{formatCurrency(result.dailyStorageCostTotal)} ₽/день</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end space-y-2">
                          {getActionBadge(result.action)}
                          
                          {result.action === 'discount' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs">-{result.recommendedDiscount}%</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                    <Calculator className="h-3.5 w-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-3">
                                    <h4 className="font-medium">Расчет экономии</h4>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-1 text-sm">
                                      <span className="text-muted-foreground">Текущая цена:</span>
                                      <span className="text-right font-medium">{formatCurrency(result.sellingPrice)} ₽</span>
                                      <span className="text-muted-foreground">Цена со скидкой:</span>
                                      <span className="text-right font-medium">{formatCurrency(result.discountedPrice)} ₽</span>
                                      <span className="text-muted-foreground">Период оборачиваемости:</span>
                                      <span className="text-right font-medium">{formatDaysOfInventory(result.daysOfInventory)} → {formatDaysOfInventory(result.newDaysOfInventory)}</span>
                                      <span className="text-muted-foreground">Затраты на хранение:</span>
                                      <span className="text-right font-medium">{formatCurrency(result.totalStorageCost)} ₽ → {formatCurrency(result.discountedStorageCost)} ₽</span>
                                      <span className="text-muted-foreground">Прибыль без скидки:</span>
                                      <span className="text-right font-medium">{formatCurrency(result.profitWithoutDiscount)} ₽</span>
                                      <span className="text-muted-foreground">Прибыль со скидкой:</span>
                                      <span className="text-right font-medium">{formatCurrency(result.profitWithDiscount)} ₽</span>
                                      <Separator className="col-span-2 my-1" />
                                      <span className="font-medium">Экономия:</span>
                                      <span className={`text-right font-medium ${result.savingsWithDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {result.savingsWithDiscount > 0 ? '+' : ''}{formatCurrency(result.savingsWithDiscount)} ₽
                                      </span>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                          
                          {result.action === 'advertise' && result.advertisingROI !== undefined && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs">ROI: {(result.advertisingROI * 100).toFixed(1)}%</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                    <Calculator className="h-3.5 w-3.5" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-3">
                                    <h4 className="font-medium">Расчет эффективности рекламы</h4>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-1 text-sm">
                                      <span className="text-muted-foreground">Текущие продажи:</span>
                                      <span className="text-right font-medium">{result.dailySales.toFixed(1)} ед./день</span>
                                      <span className="text-muted-foreground">Продажи с рекламой:</span>
                                      <span className="text-right font-medium">{result.newSalesRate.toFixed(1)} ед./день</span>
                                      <span className="text-muted-foreground">Период оборачиваемости:</span>
                                      <span className="text-right font-medium">{formatDaysOfInventory(result.daysOfInventory)} → {formatDaysOfInventory(result.newDaysOfInventory)}</span>
                                      <span className="text-muted-foreground">Затраты на рекламу:</span>
                                      <span className="text-right font-medium">~{formatCurrency(result.advertisingCost || 0)} ₽/ед.</span>
                                      <span className="text-muted-foreground">Прибыль без рекламы:</span>
                                      <span className="text-right font-medium">{formatCurrency(result.profitWithoutDiscount)} ₽</span>
                                      <span className="text-muted-foreground">Прибыль с рекламой:</span>
                                      <span className="text-right font-medium">{result.profitWithDiscount && formatCurrency(result.profitWithDiscount)} ₽</span>
                                      <Separator className="col-span-2 my-1" />
                                      <span className="font-medium">ROI рекламы:</span>
                                      <span className={`text-right font-medium ${(result.advertisingROI || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {((result.advertisingROI || 0) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="discount" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Товар</TableHead>
                    <TableHead className="text-right w-[150px]">Цена</TableHead>
                    <TableHead className="text-right w-[120px]">Рекомендуемая скидка</TableHead>
                    <TableHead className="text-right w-[130px]">Потенциальная экономия</TableHead>
                    <TableHead className="text-right w-[120px]">Запас</TableHead>
                    <TableHead className="text-right w-[170px]">Оборачиваемость</TableHead>
                    <TableHead className="text-right w-[150px]">Дополнительно</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.remainItem.nmId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">{result.remainItem.brand}</span>
                          <span className="text-sm text-muted-foreground">{result.remainItem.subjectName || result.remainItem.category}</span>
                          <span className="text-xs text-muted-foreground">Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{formatCurrency(result.sellingPrice)} ₽</span>
                          {result.action === 'discount' && (
                            <span className="text-xs text-muted-foreground">→ {formatCurrency(result.discountedPrice)} ₽</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          {getActionBadge(result.action)}
                          {result.action === 'discount' && (
                            <span className="text-xs text-amber-500 font-medium mt-1">-{result.recommendedDiscount}%</span>
                          )}
                          {result.action === 'advertise' && result.advertisingROI !== undefined && (
                            <span className="text-xs text-purple-500 font-medium mt-1">ROI: {(result.advertisingROI * 100).toFixed(1)}%</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${result.savingsWithDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {result.savingsWithDiscount > 0 ? '+' : ''}{formatCurrency(result.savingsWithDiscount)} ₽
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-2">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{result.remainItem.quantityWarehousesFull || 0} шт.</span>
                          </div>
                          {getStockLevelIndicator(result)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{formatDaysOfInventory(result.daysOfInventory)}</span>
                          {(result.action === 'discount' || result.action === 'advertise') && (
                            <span className="text-xs text-emerald-500">→ {formatDaysOfInventory(result.newDaysOfInventory)}</span>
                          )}
                          <span className="text-xs text-muted-foreground mt-1">
                            Затраты: {formatCurrency(result.totalStorageCost)} ₽
                            {(result.action === 'discount' || result.action === 'advertise') && (
                              <> → {formatCurrency(result.discountedStorageCost)} ₽</>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Calculator className="h-3.5 w-3.5 mr-2" />
                              Расчет
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-3">
                              <h4 className="font-medium">Анализ рентабельности</h4>
                              <Separator />
                              <div className="space-y-2">
                                {getAnalysisStatusIndicator(result).map((factor, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                      {factor.icon}
                                      <span className="ml-2">{factor.label}</span>
                                    </div>
                                    <span className="font-medium">{factor.value}</span>
                                  </div>
                                ))}
                              </div>
                              <Separator />
                              <div className="grid grid-cols-2 gap-1 text-sm">
                                <span className="text-muted-foreground">Себестоимость:</span>
                                <span className="text-right font-medium">{formatCurrency(result.costPrice)} ₽</span>
                                <span className="text-muted-foreground">Комиссия WB:</span>
                                <span className="text-right font-medium">{result.wbCommission}%</span>
                                <span className="text-muted-foreground">Логистика:</span>
                                <span className="text-right font-medium">{formatCurrency(result.logisticsCost)} ₽</span>
                                <span className="text-muted-foreground">Хранение (в день):</span>
                                <span className="text-right font-medium">{formatCurrency(result.dailyStorageCost)} ₽</span>
                                <span className="text-muted-foreground">Маржинальность:</span>
                                <span className="text-right font-medium">{result.profitMarginPercentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="keep" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Товар</TableHead>
                    <TableHead className="text-right w-[150px]">Цена</TableHead>
                    <TableHead className="text-right w-[120px]">Маржа</TableHead>
                    <TableHead className="text-right w-[120px]">Запас</TableHead>
                    <TableHead className="text-right w-[170px]">Оборачиваемость</TableHead>
                    <TableHead className="text-right w-[150px]">Хранение</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.remainItem.nmId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">{result.remainItem.brand}</span>
                          <span className="text-sm text-muted-foreground">{result.remainItem.subjectName || result.remainItem.category}</span>
                          <span className="text-xs text-muted-foreground">Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{formatCurrency(result.sellingPrice)} ₽</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{result.profitMarginPercentage.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-2">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{result.remainItem.quantityWarehousesFull || 0} шт.</span>
                          </div>
                          {getStockLevelIndicator(result)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{formatDaysOfInventory(result.daysOfInventory)}</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            Продажи: {result.dailySales.toFixed(1)} ед./день
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{formatCurrency(result.totalStorageCost)} ₽</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(result.dailyStorageCostTotal)} ₽/день
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="low-stock" className="mt-4">
              <Alert variant="warning" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Низкий уровень запасов</AlertTitle>
                <AlertDescription>
                  Отображены товары, запас которых ниже порогового значения. Эти товары могут закончиться в ближайшее время.
                </AlertDescription>
              </Alert>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Товар</TableHead>
                    <TableHead className="text-right w-[150px]">Текущий запас</TableHead>
                    <TableHead className="text-right w-[150px]">Пороговое значение</TableHead>
                    <TableHead className="text-right w-[150px]">Продажи в день</TableHead>
                    <TableHead className="text-right w-[150px]">Прогноз окончания</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.remainItem.nmId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">{result.remainItem.brand}</span>
                          <span className="text-sm text-muted-foreground">{result.remainItem.subjectName || result.remainItem.category}</span>
                          <span className="text-xs text-muted-foreground">Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-rose-500">{result.remainItem.quantityWarehousesFull || 0} шт.</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Input
                            type="number"
                            className="w-16 text-right"
                            value={lowStockThreshold[result.remainItem.nmId] || ""}
                            onChange={(e) => {
                              setLowStockThreshold(prev => ({
                                ...prev,
                                [result.remainItem.nmId]: Number(e.target.value)
                              }));
                            }}
                          />
                          <span className="text-xs">шт.</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Input
                            type="number"
                            className="w-16 text-right"
                            value={dailySalesRates[result.remainItem.nmId] || ""}
                            onChange={(e) => updateDailySales(result.remainItem.nmId, e.target.value)}
                          />
                          <span className="text-xs">ед./день</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {result.dailySales > 0 ? (
                          <span className="font-medium">{formatDate(result.projectedStockoutDate)}</span>
                        ) : (
                          <span className="text-muted-foreground">Неизвестно</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <SalesDataDialog
        open={salesDataDialogOpen}
        onOpenChange={setSalesDataDialogOpen}
        onFetchData={fetchSalesAndStorageData}
        isLoading={isLoading}
      />
    </div>
  );
};

export default StorageProfitabilityAnalysis;
