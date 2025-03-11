import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Search, ArrowUpDown, Package, TrendingDown, Banknote, WarehouseIcon, AlertTriangle, 
  Clock, ArrowDown, ArrowUp, BarChart4, TrendingUp, Calculator, Truck, Percent, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { WarehouseRemainItem, PaidStorageItem } from '@/types/supplies';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';

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

const StorageProfitabilityAnalysis: React.FC<StorageProfitabilityAnalysisProps> = ({
  warehouseItems,
  paidStorageData = [],
  averageDailySalesRate = {},
  dailyStorageCost = {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'discount' | 'keep' | 'low-stock'>('all');
  const [costPrices, setCostPrices] = useState<Record<number, number>>({});
  const [sellingPrices, setSellingPrices] = useState<Record<number, number>>({});
  const [dailySalesRates, setDailySalesRates] = useState<Record<number, number>>({});
  const [storageCostRates, setStorageCostRates] = useState<Record<number, number>>({});
  const [discountLevels, setDiscountLevels] = useState<Record<number, number>>({});
  const [lowStockThreshold, setLowStockThreshold] = useState<Record<number, number>>({});
  const [logisticsCosts, setLogisticsCosts] = useState<Record<number, number>>({});
  const [wbCommissions, setWbCommissions] = useState<Record<number, number>>({});
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 30))
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AnalysisResult | '',
    direction: 'asc' | 'desc'
  }>({ key: '', direction: 'asc' });
  const { toast } = useToast();

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

    const initialDailySales: Record<number, number> = {};
    const initialStorageCosts: Record<number, number> = {};
    const initialDiscountLevels: Record<number, number> = {};
    const initialLowStockThresholds: Record<number, number> = {};
    const initialCostPrices: Record<number, number> = {};
    const initialSellingPrices: Record<number, number> = {};
    const initialLogisticsCosts: Record<number, number> = {};
    const initialWbCommissions: Record<number, number> = {};

    warehouseItems.forEach(item => {
      if (!costPrices[item.nmId]) {
        initialCostPrices[item.nmId] = 0;
      }
      
      if (!sellingPrices[item.nmId]) {
        initialSellingPrices[item.nmId] = item.price || 0;
      }
      
      let itemStorageCost = dailyStorageCost[item.nmId] || 5;
      
      const matchingStorageItems = paidStorageData.filter(psi => psi.nmId === item.nmId);
      if (matchingStorageItems.length > 0) {
        const totalCost = matchingStorageItems.reduce((sum, psi) => sum + psi.warehousePrice, 0);
        itemStorageCost = totalCost / matchingStorageItems.length;
      }
      
      if (!dailySalesRates[item.nmId]) {
        initialDailySales[item.nmId] = averageDailySalesRate[item.nmId] || 0.1;
      }
      
      if (!storageCostRates[item.nmId]) {
        initialStorageCosts[item.nmId] = itemStorageCost;
      }
      
      if (!discountLevels[item.nmId]) {
        initialDiscountLevels[item.nmId] = 30;
      }
      
      if (!logisticsCosts[item.nmId]) {
        initialLogisticsCosts[item.nmId] = 150;
      }
      
      if (!wbCommissions[item.nmId]) {
        initialWbCommissions[item.nmId] = 15;
      }
      
      const salesRate = averageDailySalesRate[item.nmId] || 0.1;
      if (!lowStockThreshold[item.nmId]) {
        initialLowStockThresholds[item.nmId] = Math.max(3, Math.ceil(salesRate * 7));
      }
    });

    setCostPrices(prevState => ({...prevState, ...initialCostPrices}));
    setSellingPrices(prevState => ({...prevState, ...initialSellingPrices}));
    setDailySalesRates(prevState => ({...prevState, ...initialDailySales}));
    setStorageCostRates(prevState => ({...prevState, ...initialStorageCosts}));
    setDiscountLevels(prevState => ({...prevState, ...initialDiscountLevels}));
    setLowStockThreshold(prevState => ({...prevState, ...initialLowStockThresholds}));
    setLogisticsCosts(prevState => ({...prevState, ...initialLogisticsCosts}));
    setWbCommissions(prevState => ({...prevState, ...initialWbCommissions}));
  }, [warehouseItems, averageDailySalesRate, dailyStorageCost, paidStorageData]);

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
      const costPrice = costPrices[nmId] ||.0;
      const sellingPrice = sellingPrices[nmId] || (item.price || 0);
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
      
      const profitPerItem = sellingPrice - costPrice - commissionAmount - (logisticsCost);
      const profitMarginPercentage = sellingPrice > 0 ? (profitPerItem / sellingPrice) * 100 : 0;
      
      const grossProfit = profitPerItem * currentStock;
      
      const netProfit = grossProfit - totalStorageCost;
      
      const stockTurnoverDays = daysOfInventory;
      
      const storageROI = totalStorageCost > 0 ? netProfit / totalStorageCost : 0;
      
      const storageCostToRevenueRatio = (sellingPrice * currentStock) > 0 ? 
        totalStorageCost / (sellingPrice * currentStock) : 0;
      
      let recommendedDiscount = 0;
      let action: 'sell' | 'discount' | 'keep' = 'keep';
      
      const isLowMargin = profitMarginPercentage < 15;
      const isHighStorageCost = storageCostToRevenueRatio > 0.1;
      const isSlowMoving = stockTurnoverDays > 60;
      
      if (isSlowMoving && isHighStorageCost) {
        recommendedDiscount = 40;
        action = 'sell';
      } 
      else if (isLowMargin && isHighStorageCost) {
        recommendedDiscount = discountLevels[nmId] || 25;
        action = 'discount';
      }
      else if (isSlowMoving && !isLowMargin) {
        recommendedDiscount = discountLevels[nmId] || 15;
        action = 'discount';
      }
      else {
        recommendedDiscount = 0;
        action = 'keep';
      }
      
      const discountedPrice = sellingPrice * (1 - recommendedDiscount / 100);
      
      const discountedCommissionAmount = discountedPrice * (wbCommission / 100);
      
      const profitWithDiscountPerItem = discountedPrice - costPrice - discountedCommissionAmount - (logisticsCost);
      
      const salesAccelerationFactor = 1 + (recommendedDiscount / 100);
      
      const newSalesRate = dailySales * salesAccelerationFactor;
      
      const newDaysOfInventory = Math.round(daysOfInventory / salesAccelerationFactor);
      
      const discountedStorageCost = averageStock * newDaysOfInventory * storageCost;
      
      const profitWithoutDiscount = profitPerItem * currentStock - totalStorageCost;
      
      const profitWithDiscount = (profitWithDiscountPerItem * currentStock) - discountedStorageCost;
      
      const savingsWithDiscount = profitWithDiscount - profitWithoutDiscount;
      
      if (profitWithDiscount < 0 && recommendedDiscount > 0) {
        if (Math.abs(profitWithDiscount) > profitWithDiscountPerItem * currentStock * 0.5) {
          action = 'sell';
          recommendedDiscount = Math.min(50, discountLevels[nmId] || 50);
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
      
      const stockLevelPercentage = Math.min(100, Math.max(0, Math.round((currentStock / (threshold * 2)) * 100)));
      
      let stockLevel: 'low' | 'medium' | 'high';
      if (currentStock <= threshold) {
        stockLevel = 'low';
      } else if (currentStock <= threshold * 3) {
        stockLevel = 'medium';
      } else {
        stockLevel = 'high';
      }
      
      const projectedStockoutDate = dailySales > 0 
        ? new Date(Date.now() + (daysOfInventory * 24 * 60 * 60 * 1000))
        : undefined;

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
      results = results.filter(result => 
        result.remainItem.brand.toLowerCase().includes(search) ||
        (result.remainItem.subjectName && result.remainItem.subjectName.toLowerCase().includes(search)) ||
        (result.remainItem.vendorCode && result.remainItem.vendorCode.toLowerCase().includes(search)) ||
        result.remainItem.nmId.toString().includes(search)
      );
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

    const itemsStockingOutBeforeTarget = targetDate ? 
      analysisResults.filter(item => 
        item.projectedStockoutDate && item.projectedStockoutDate <= targetDate
      ).length : 0;
    
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
    setSortConfig({ key, direction });
  };

  const savePriceData = () => {
    localStorage.setItem('product_cost_prices', JSON.stringify(costPrices));
    localStorage.setItem('product_selling_prices', JSON.stringify(sellingPrices));
    localStorage.setItem('product_low_stock_thresholds', JSON.stringify(lowStockThreshold));
    localStorage.setItem('product_logistics_costs', JSON.stringify(logisticsCosts));
    localStorage.setItem('product_wb_commissions', JSON.stringify(wbCommissions));
    
    toast({
      title: "Данные сохранены",
      description: "Все изменения успешно сохранены в локальное хранилище",
    });
  };

  const updateCostPrice = (nmId: number, value: number) => {
    setCostPrices(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  const updateSellingPrice = (nmId: number, value: number) => {
    setSellingPrices(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  const updateDailySales = (nmId: number, value: number) => {
    setDailySalesRates(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  const updateStorageCost = (nmId: number, value: number) => {
    setStorageCostRates(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  const updateLogisticsCost = (nmId: number, value: number) => {
    setLogisticsCosts(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  const updateWbCommission = (nmId: number, value: number) => {
    setWbCommissions(prev => ({
      ...prev,
      [nmId]: value
    }));
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
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-500 font-medium flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> Низкий запас
              </span>
              <span className="text-xs">{result.stockLevelPercentage}%</span>
            </div>
            <Progress value={result.stockLevelPercentage} className="h-1.5 bg-rose-100" indicatorClassName="bg-rose-500" />
          </div>
        );
      case 'medium':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-500 font-medium">Средний запас</span>
              <span className="text-xs">{result.stockLevelPercentage}%</span>
            </div>
            <Progress value={result.stockLevelPercentage} className="h-1.5 bg-amber-100" indicatorClassName="bg-amber-500" />
          </div>
        );
      case 'high':
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-500 font-medium">Высокий запас</span>
              <span className="text-xs">{result.stockLevelPercentage}%</span>
            </div>
            <Progress value={result.stockLevelPercentage} className="h-1.5 bg-emerald-100" indicatorClassName="bg-emerald-500" />
          </div>
        );
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
    
    return (
      <div className="space-y-2">
        {factors.map((factor, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {factor.icon}
              <span className={`font-medium ${factor.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {factor.label}
              </span>
            </div>
            <span className={`${factor.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'} font-medium`}>
              {factor.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const DetailedAnalysis = ({ result }: { result: AnalysisResult }) => {
    return (
      <div className="p-5 max-w-md space-y-6 text-sm">
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
          
          {result.action === 'discount' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Рекомендуемая скидка</span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{result.recommendedDiscount}%</span>
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-400">
                Такая скидка ускорит продажи и снизит затраты на хранение, увеличив итоговую прибыль.
              </div>
            </div>
          )}
          
          {result.action === 'sell' && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Рекомендуемая скидка</span>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">{result.recommendedDiscount}%</span>
              </div>
              <div className="text-xs text-rose-700 dark:text-rose-400">
                Эти товары неэффективны для хранения и продаж. Рекомендуется максимально быстро распродать остаток.
              </div>
            </div>
          )}
          
          {result.action === 'keep' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Текущая цена оптимальна</span>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                Товар хорошо продается по текущей цене. Скидка не принесет дополнительной выгоды.
              </div>
            </div>
          )}
          
          {result.lowStock && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-xs font-medium text-rose-700 dark:text-rose-400">Низкий запас товара</span>
              </div>
              <div className="text-xs text-rose-700 dark:text-rose-400">
                Запасы скоро закончатся. Прогнозируемая дата: {formatDate(result.projectedStockoutDate)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold flex items-center">
              <BarChart4 className="h-5 w-5 mr-2 text-primary" />
              Анализ рентабельности хранения
            </CardTitle>
            <CardDescription>
              Рекомендации по оптимизации затрат на хранение товаров на складе
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={savePriceData}>
            Сохранить данные
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Сводка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Общее количество товаров:</span>
                  <span className="font-medium">{analysisSummary.totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Товары с низким запасом:</span>
                  <span className="font-medium text-rose-500">{analysisSummary.lowStockItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Товары для распродажи:</span>
                  <span className="font-medium text-amber-500">{analysisSummary.discountItems + analysisSummary.sellItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Товары с нормальной ценой:</span>
                  <span className="font-medium text-emerald-500">{analysisSummary.keepItems}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Общие затраты на хранение:</span>
                  <span className="font-medium">{formatCurrency(analysisSummary.totalStorageCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Потенциальная экономия:</span>
                  <span className="font-medium text-emerald-500">{formatCurrency(analysisSummary.potentialSavings)}</span>
                </div>
                <Separator />
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">Закончатся до:</div>
                  <DatePicker 
                    date={targetDate} 
                    setDate={setTargetDate} 
                    className="w-full" 
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Товаров с окончанием запаса:</span>
                    <span className="font-medium text-rose-500">{analysisSummary.itemsStockingOutBeforeTarget}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1 xl:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Анализ товаров</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск товаров..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="all" value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
                  <div className="px-6 pt-2 border-b">
                    <TabsList className="w-full justify-start mb-2">
                      <TabsTrigger value="all" className="text-xs">
                        Все товары ({analysisResults.length})
                      </TabsTrigger>
                      <TabsTrigger value="discount" className="text-xs">
                        Для скидки ({analysisSummary.discountItems + analysisSummary.sellItems})
                      </TabsTrigger>
                      <TabsTrigger value="keep" className="text-xs">
                        Оптимальные ({analysisSummary.keepItems})
                      </TabsTrigger>
                      <TabsTrigger value="low-stock" className="text-xs">
                        Низкий запас ({analysisSummary.lowStockItems})
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="all" className="m-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Товар</TableHead>
                            <TableHead className="text-center">Остаток</TableHead>
                            <TableHead 
                              className="text-right cursor-pointer" 
                              onClick={() => requestSort('costPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Себестоимость
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('sellingPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Цена продажи
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('wbCommission')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Комиссия WB, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('logisticsCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Логистика, ₽
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('dailySales')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Продажи/день
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('daysOfInventory')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Дней хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('totalStorageCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Стоимость хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('recommendedDiscount')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Скидка, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead>Рекомендация</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">
                                Нет товаров, соответствующих критериям поиска
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredResults.map((result) => (
                              <TableRow key={result.remainItem.nmId}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span className="truncate max-w-[250px]">
                                      {result.remainItem.brand} {result.remainItem.subjectName || 'Товар'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex flex-col items-center">
                                    <span className={`font-medium ${result.lowStock ? 'text-rose-500' : ''}`}>
                                      {result.remainItem.quantityWarehousesFull}
                                    </span>
                                    <div className="w-full mt-1">
                                      {getStockLevelIndicator(result)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={costPrices[result.remainItem.nmId] || ''}
                                    onChange={(e) => updateCostPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right ml-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={sellingPrices[result.remainItem.nmId] || ''}
                                    onChange={(e) => updateSellingPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right ml-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={wbCommissions[result.remainItem.nmId] || ''}
                                    onChange={(e) => updateWbCommission(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right ml-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={logisticsCosts[result.remainItem.nmId] || ''}
                                    onChange={(e) => updateLogisticsCost(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right ml-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={dailySalesRates[result.remainItem.nmId] || ''}
                                    onChange={(e) => updateDailySales(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right ml-auto"
                                    step="0.01"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="font-medium">{formatDaysOfInventory(result.daysOfInventory)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    до {formatDate(result.projectedStockoutDate)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="font-medium">{formatCurrency(result.totalStorageCost)}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(result.dailyStorageCostTotal)} в день
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Input
                                      type="number"
                                      value={discountLevels[result.remainItem.nmId] || ''}
                                      onChange={(e) => setDiscountLevels(prev => ({
                                        ...prev,
                                        [result.remainItem.nmId]: parseFloat(e.target.value) || 0
                                      }))}
                                      className="w-16 text-right ml-auto"
                                      disabled={result.action === 'keep'}
                                    />
                                    <span className="text-muted-foreground">%</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getActionBadge(result.action)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="h-8 px-2 flex items-center gap-1.5"
                                      >
                                        <Calculator className="h-3.5 w-3.5" />
                                        <span className="sr-md:inline">Анализ</span>
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0" align="end">
                                      <DetailedAnalysis result={result} />
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="discount" className="m-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Товар</TableHead>
                            <TableHead className="text-center">Остаток</TableHead>
                            <TableHead 
                              className="text-right cursor-pointer" 
                              onClick={() => requestSort('costPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Себестоимость
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('sellingPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Цена продажи
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('wbCommission')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Комиссия WB, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('logisticsCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Логистика, ₽
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('dailySales')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Продажи/день
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('daysOfInventory')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Дней хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('totalStorageCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Стоимость хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('recommendedDiscount')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Скидка, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead>Рекомендация</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.filter(result => result.action === 'discount').map((result) => (
                            <TableRow key={result.remainItem.nmId}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="truncate max-w-[250px]">
                                    {result.remainItem.brand} {result.remainItem.subjectName || 'Товар'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className={`font-medium ${result.lowStock ? 'text-rose-500' : ''}`}>
                                    {result.remainItem.quantityWarehousesFull}
                                  </span>
                                  <div className="w-full mt-1">
                                    {getStockLevelIndicator(result)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={costPrices[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateCostPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={sellingPrices[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateSellingPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={wbCommissions[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateWbCommission(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={logisticsCosts[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateLogisticsCost(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={dailySalesRates[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateDailySales(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{formatDaysOfInventory(result.daysOfInventory)}</div>
                                <div className="text-xs text-muted-foreground">
                                  до {formatDate(result.projectedStockoutDate)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{formatCurrency(result.totalStorageCost)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(result.dailyStorageCostTotal)} в день
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Input
                                    type="number"
                                    value={discountLevels[result.remainItem.nmId] || ''}
                                    onChange={(e) => setDiscountLevels(prev => ({
                                      ...prev,
                                      [result.remainItem.nmId]: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-16 text-right ml-auto"
                                    disabled={result.action === 'keep'}
                                  />
                                  <span className="text-muted-foreground">%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getActionBadge(result.action)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2 flex items-center gap-1.5"
                                    >
                                      <Calculator className="h-3.5 w-3.5" />
                                      <span className="sr-md:inline">Анализ</span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0" align="end">
                                    <DetailedAnalysis result={result} />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="keep" className="m-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Товар</TableHead>
                            <TableHead className="text-center">Остаток</TableHead>
                            <TableHead 
                              className="text-right cursor-pointer" 
                              onClick={() => requestSort('costPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Себестоимость
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('sellingPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Цена продажи
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('wbCommission')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Комиссия WB, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('logisticsCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Логистика, ₽
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('dailySales')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Продажи/день
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('daysOfInventory')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Дней хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('totalStorageCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Стоимость хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('recommendedDiscount')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Скидка, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead>Рекомендация</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.filter(result => result.action === 'keep').map((result) => (
                            <TableRow key={result.remainItem.nmId}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="truncate max-w-[250px]">
                                    {result.remainItem.brand} {result.remainItem.subjectName || 'Товар'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className={`font-medium ${result.lowStock ? 'text-rose-500' : ''}`}>
                                    {result.remainItem.quantityWarehousesFull}
                                  </span>
                                  <div className="w-full mt-1">
                                    {getStockLevelIndicator(result)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={costPrices[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateCostPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={sellingPrices[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateSellingPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={wbCommissions[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateWbCommission(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={logisticsCosts[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateLogisticsCost(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={dailySalesRates[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateDailySales(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{formatDaysOfInventory(result.daysOfInventory)}</div>
                                <div className="text-xs text-muted-foreground">
                                  до {formatDate(result.projectedStockoutDate)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{formatCurrency(result.totalStorageCost)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(result.dailyStorageCostTotal)} в день
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Input
                                    type="number"
                                    value={discountLevels[result.remainItem.nmId] || ''}
                                    onChange={(e) => setDiscountLevels(prev => ({
                                      ...prev,
                                      [result.remainItem.nmId]: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-16 text-right ml-auto"
                                    disabled={result.action === 'keep'}
                                  />
                                  <span className="text-muted-foreground">%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getActionBadge(result.action)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2 flex items-center gap-1.5"
                                    >
                                      <Calculator className="h-3.5 w-3.5" />
                                      <span className="sr-md:inline">Анализ</span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0" align="end">
                                    <DetailedAnalysis result={result} />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="low-stock" className="m-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Товар</TableHead>
                            <TableHead className="text-center">Остаток</TableHead>
                            <TableHead 
                              className="text-right cursor-pointer" 
                              onClick={() => requestSort('costPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Себестоимость
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('sellingPrice')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Цена продажи
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('wbCommission')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Комиссия WB, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('logisticsCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Логистика, ₽
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('dailySales')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Продажи/день
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('daysOfInventory')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Дней хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('totalStorageCost')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Стоимость хранения
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead 
                              className="text-right cursor-pointer"
                              onClick={() => requestSort('recommendedDiscount')}
                            >
                              <div className="flex items-center justify-end gap-1">
                                Скидка, %
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </div>
                            </TableHead>
                            <TableHead>Рекомендация</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResults.filter(result => result.lowStock).map((result) => (
                            <TableRow key={result.remainItem.nmId}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="truncate max-w-[250px]">
                                    {result.remainItem.brand} {result.remainItem.subjectName || 'Товар'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className={`font-medium ${result.lowStock ? 'text-rose-500' : ''}`}>
                                    {result.remainItem.quantityWarehousesFull}
                                  </span>
                                  <div className="w-full mt-1">
                                    {getStockLevelIndicator(result)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={costPrices[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateCostPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={sellingPrices[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateSellingPrice(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={wbCommissions[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateWbCommission(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={logisticsCosts[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateLogisticsCost(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={dailySalesRates[result.remainItem.nmId] || ''}
                                  onChange={(e) => updateDailySales(result.remainItem.nmId, parseFloat(e.target.value) || 0)}
                                  className="w-20 text-right ml-auto"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{formatDaysOfInventory(result.daysOfInventory)}</div>
                                <div className="text-xs text-muted-foreground">
                                  до {formatDate(result.projectedStockoutDate)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">{formatCurrency(result.totalStorageCost)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(result.dailyStorageCostTotal)} в день
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Input
                                    type="number"
                                    value={discountLevels[result.remainItem.nmId] || ''}
                                    onChange={(e) => setDiscountLevels(prev => ({
                                      ...prev,
                                      [result.remainItem.nmId]: parseFloat(e.target.value) || 0
                                    }))}
                                    className="w-16 text-right ml-auto"
                                    disabled={result.action === 'keep'}
                                  />
                                  <span className="text-muted-foreground">%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getActionBadge(result.action)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2 flex items-center gap-1.5"
                                    >
                                      <Calculator className="h-3.5 w-3.5" />
                                      <span className="sr-md:inline">Анализ</span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0" align="end">
                                    <DetailedAnalysis result={result} />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center">
                <Percent className="h-5 w-5 mr-2 text-primary" />
                Рекомендуемые скидки
              </CardTitle>
              <CardDescription>
                Товары, для которых рекомендуется установить скидку для оптимизации затрат
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredResults
                  .filter(result => result.action !== 'keep' && result.recommendedDiscount > 0)
                  .slice(0, 8)
                  .map(result => (
                    <Card key={result.remainItem.nmId} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm truncate max-w-[180px]">
                            {result.remainItem.brand} {result.remainItem.subjectName || 'Товар'}
                          </CardTitle>
                          {getActionBadge(result.action)}
                        </div>
                        <CardDescription className="text-xs">
                          Артикул: {result.remainItem.vendorCode || result.remainItem.nmId}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Текущая цена</div>
                            <div className="font-medium">{formatCurrency(result.sellingPrice)}</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-amber-600">Со скидкой</div>
                            <div className="font-medium text-amber-600">
                              {formatCurrency(result.discountedPrice)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-xs text-muted-foreground">Рекомендуемая скидка</div>
                          <div className="font-medium text-amber-600">{result.recommendedDiscount}%</div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-xs text-muted-foreground">Экономия на хранении</div>
                          <div className="font-medium text-emerald-600">
                            {formatCurrency(result.totalStorageCost - result.discountedStorageCost)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-xs text-muted-foreground">Изменение прибыли</div>
                          <div className={`font-medium ${result.savingsWithDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {result.savingsWithDiscount > 0 ? '+' : ''}{formatCurrency(result.savingsWithDiscount)}
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Дней на распродажу</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs line-through text-muted-foreground">
                                {formatDaysOfInventory(result.daysOfInventory)}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {formatDaysOfInventory(result.newDaysOfInventory)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageProfitabilityAnalysis;
