
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, ArrowUpDown, Package, TrendingDown, Banknote, WarehouseIcon, AlertTriangle, Clock, ArrowDown, ArrowUp } from 'lucide-react';
import { 
  formatCurrency, 
  calculateDiscountSavings, 
  calculateOptimalDiscount, 
  determineRecommendedAction,
  roundToTwoDecimals
} from '@/utils/formatCurrency';
import { WarehouseRemainItem, PaidStorageItem } from '@/types/supplies';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface StorageProfitabilityAnalysisProps {
  warehouseItems: WarehouseRemainItem[];
  paidStorageData?: PaidStorageItem[]; // Add paidStorageData prop
  averageDailySalesRate?: Record<number, number>; // nmId -> average daily sales
  dailyStorageCost?: Record<number, number>; // nmId -> daily storage cost
}

interface AnalysisResult {
  remainItem: WarehouseRemainItem;
  costPrice: number;
  sellingPrice: number;
  dailySales: number;
  dailyStorageCost: number;
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
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 30)) // Default to 30 days in the future
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AnalysisResult | '',
    direction: 'asc' | 'desc'
  }>({ key: '', direction: 'asc' });

  // Initialize with stored values if available
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

    // Initialize daily sales and storage costs
    const initialDailySales: Record<number, number> = {};
    const initialStorageCosts: Record<number, number> = {};
    const initialDiscountLevels: Record<number, number> = {};
    const initialLowStockThresholds: Record<number, number> = {};

    warehouseItems.forEach(item => {
      // Try to get actual storage cost from paidStorageData if available
      let itemStorageCost = dailyStorageCost[item.nmId] || 5; // Default to 5 rubles per day
      
      // If we have paidStorageData, try to find actual cost for this item
      const matchingStorageItems = paidStorageData.filter(psi => psi.nmId === item.nmId);
      if (matchingStorageItems.length > 0) {
        // Calculate average daily cost from all matching storage items
        const totalCost = matchingStorageItems.reduce((sum, psi) => sum + psi.warehousePrice, 0);
        itemStorageCost = totalCost / matchingStorageItems.length;
      }
      
      initialDailySales[item.nmId] = averageDailySalesRate[item.nmId] || 0.1; // Default to 0.1 items per day
      initialStorageCosts[item.nmId] = itemStorageCost;
      
      // Вычисляем оптимальную скидку для каждого товара
      const optimalDiscount = calculateOptimalDiscount(
        item.price || 0,
        costPrices[item.nmId] || 0,
        item.quantityWarehousesFull || 0,
        itemStorageCost,
        averageDailySalesRate[item.nmId] || 0.1
      );
      initialDiscountLevels[item.nmId] = optimalDiscount; // Используем рассчитанное значение вместо фиксированных 30%
      
      // Calculate low stock threshold (default: 7 days of sales)
      const salesRate = averageDailySalesRate[item.nmId] || 0.1;
      initialLowStockThresholds[item.nmId] = Math.max(3, Math.ceil(salesRate * 7));
    });

    setDailySalesRates(prevState => ({...prevState, ...initialDailySales}));
    setStorageCostRates(prevState => ({...prevState, ...initialStorageCosts}));
    setDiscountLevels(prevState => ({...prevState, ...initialDiscountLevels}));
    setLowStockThreshold(prevState => ({...prevState, ...initialLowStockThresholds}));
  }, [warehouseItems, averageDailySalesRate, dailyStorageCost, paidStorageData, costPrices]);

  // Calculate profitability analysis
  const analysisResults = useMemo(() => {
    return warehouseItems.map(item => {
      const nmId = item.nmId;
      const costPrice = costPrices[nmId] || 0;
      const sellingPrice = sellingPrices[nmId] || (item.price || 0);
      const dailySales = dailySalesRates[nmId] || 0.1;
      const storageCost = storageCostRates[nmId] || 5;
      const discountPercentage = discountLevels[nmId] || 30;
      const threshold = lowStockThreshold[nmId] || Math.ceil(dailySales * 7); // Default 7 days worth of stock
      
      // Calculate current stock level
      const currentStock = item.quantityWarehousesFull || 0;
      
      // Calculate days of inventory based on current stock and sales rate
      const daysOfInventory = dailySales > 0 ? Math.round(currentStock / dailySales) : 999;
      
      // Calculate total storage cost for the entire inventory period
      const totalStorageCost = storageCost * daysOfInventory;
      
      // Calculate profit without discount
      const profitPerItem = sellingPrice - costPrice;
      const profitWithoutDiscount = profitPerItem * currentStock - totalStorageCost;
      
      // Calculate profit with recommended discount
      const discountedPrice = sellingPrice * (1 - discountPercentage / 100);
      const profitWithDiscountPerItem = discountedPrice - costPrice;
      
      // Calculate storage cost savings with quicker sales (assuming faster sales with discount)
      // Используем коэффициент 1.5 для скорости продаж со скидкой (в 1.5 раза быстрее)
      const salesAccelerationFactor = 1.5;
      const discountedDaysOfInventory = Math.round(daysOfInventory / salesAccelerationFactor);
      const discountedStorageCost = storageCost * discountedDaysOfInventory;
      
      // Calculate total profit with discount (including reduced storage costs)
      const profitWithDiscount = profitWithDiscountPerItem * currentStock - discountedStorageCost;
      
      // Calculate storage cost savings
      const storageSavings = totalStorageCost - discountedStorageCost;
      
      // Используем новую функцию для расчета экономии от скидки
      const savingsWithDiscount = calculateDiscountSavings(
        sellingPrice,
        discountPercentage,
        currentStock,
        storageCost,
        dailySales,
        salesAccelerationFactor
      );
      
      // Determine low stock status
      const lowStock = currentStock <= threshold;
      
      // Calculate stock level percentage (for visualization)
      let stockLevelPercentage = Math.min(100, (currentStock / (threshold * 2)) * 100);
      stockLevelPercentage = Math.max(0, Math.round(stockLevelPercentage));
      
      // Determine stock level category
      let stockLevel: 'low' | 'medium' | 'high';
      if (currentStock <= threshold) {
        stockLevel = 'low';
      } else if (currentStock <= threshold * 3) {
        stockLevel = 'medium';
      } else {
        stockLevel = 'high';
      }
      
      // Calculate projected stockout date
      const projectedStockoutDate = dailySales > 0 
        ? new Date(Date.now() + (daysOfInventory * 24 * 60 * 60 * 1000))
        : undefined;
      
      // Используем функцию для определения рекомендуемого действия
      const action = determineRecommendedAction(
        daysOfInventory,
        savingsWithDiscount,
        profitWithDiscount,
        profitWithoutDiscount
      );
      
      return {
        remainItem: item,
        costPrice,
        sellingPrice,
        dailySales,
        dailyStorageCost: storageCost,
        daysOfInventory,
        totalStorageCost,
        recommendedDiscount: discountPercentage,
        profitWithoutDiscount,
        profitWithDiscount,
        savingsWithDiscount,
        action,
        lowStock,
        stockLevel,
        stockLevelPercentage,
        projectedStockoutDate
      };
    });
  }, [warehouseItems, costPrices, sellingPrices, dailySalesRates, storageCostRates, discountLevels, lowStockThreshold]);

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let results = [...analysisResults];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      results = results.filter(result => 
        result.remainItem.brand.toLowerCase().includes(search) ||
        (result.remainItem.subjectName && result.remainItem.subjectName.toLowerCase().includes(search)) ||
        (result.remainItem.vendorCode && result.remainItem.vendorCode.toLowerCase().includes(search)) ||
        result.remainItem.nmId.toString().includes(search)
      );
    }
    
    // Apply tab filter
    if (selectedTab === 'discount') {
      results = results.filter(result => result.action === 'discount' || result.action === 'sell');
    } else if (selectedTab === 'keep') {
      results = results.filter(result => result.action === 'keep');
    } else if (selectedTab === 'low-stock') {
      results = results.filter(result => result.lowStock);
    }
    
    // Apply sorting
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

  // Get stats for summary cards
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

    // Items that will stock out before the target date
    const itemsStockingOutBeforeTarget = targetDate ? 
      analysisResults.filter(item => 
        item.projectedStockoutDate && item.projectedStockoutDate <= targetDate
      ).length : 0;
    
    // ROI от оптимизации запасов
    const totalInvestment = analysisResults.reduce((sum, item) => {
      return sum + (item.costPrice * (item.remainItem.quantityWarehousesFull || 0));
    }, 0);
    
    const currentROI = totalInvestment > 0 ? 
      (analysisResults.reduce((sum, item) => sum + item.profitWithoutDiscount, 0) / totalInvestment) * 100 : 0;
    
    const optimizedROI = totalInvestment > 0 ? 
      (analysisResults.reduce((sum, item) => {
        // Используем профит с учетом скидки только если действие - "discount" или "sell"
        const profit = (item.action === 'discount' || item.action === 'sell') ? 
          item.profitWithDiscount : item.profitWithoutDiscount;
        return sum + profit;
      }, 0) / totalInvestment) * 100 : 0;
    
    const roiImprovement = optimizedROI - currentROI;
    
    return {
      totalItems,
      lowStockItems,
      discountItems,
      sellItems,
      keepItems,
      totalStorageCost,
      potentialSavings,
      itemsStockingOutBeforeTarget,
      currentROI: roundToTwoDecimals(currentROI),
      optimizedROI: roundToTwoDecimals(optimizedROI),
      roiImprovement: roundToTwoDecimals(roiImprovement)
    };
  }, [analysisResults, targetDate]);

  // Handle sorting
  const requestSort = (key: keyof AnalysisResult) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Save data updates to localStorage
  const savePriceData = () => {
    localStorage.setItem('product_cost_prices', JSON.stringify(costPrices));
    localStorage.setItem('product_selling_prices', JSON.stringify(sellingPrices));
    localStorage.setItem('product_low_stock_thresholds', JSON.stringify(lowStockThreshold));
    
    toast.success('Данные успешно сохранены');
  };

  // Update cost price for a product
  const updateCostPrice = (nmId: number, value: number) => {
    setCostPrices(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  // Update selling price for a product
  const updateSellingPrice = (nmId: number, value: number) => {
    setSellingPrices(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  // Update daily sales rate for a product
  const updateDailySales = (nmId: number, value: number) => {
    setDailySalesRates(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  // Update storage cost for a product
  const updateStorageCost = (nmId: number, value: number) => {
    setStorageCostRates(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  // Update discount level for a product
  const updateDiscountLevel = (nmId: number, value: number[]) => {
    setDiscountLevels(prev => ({
      ...prev,
      [nmId]: value[0]
    }));
  };

  // Update low stock threshold for a product
  const updateLowStockThreshold = (nmId: number, value: number) => {
    setLowStockThreshold(prev => ({
      ...prev,
      [nmId]: value
    }));
  };

  // Get badge color based on action
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

  // Get stock level indicator
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

  // Format a date for display
  const formatDate = (date?: Date) => {
    if (!date) return "Не определено";
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate ROI improvement
  const calculateROIimprovement = (result: AnalysisResult) => {
    const investment = result.costPrice * (result.remainItem.quantityWarehousesFull || 0);
    if (investment <= 0) return 0;
    
    const currentROI = (result.profitWithoutDiscount / investment) * 100;
    const optimizedROI = (result.profitWithDiscount / investment) * 100;
    
    return roundToTwoDecimals(optimizedROI - currentROI);
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
      <CardHeader className="bg-white/50 dark:bg-background/50 backdrop-blur-sm border-b pb-8">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Banknote className="h-6 w-6 text-primary" />
          Анализ рентабельности хранения товаров
        </CardTitle>
        <CardDescription className="text-base">
          Оптимизация запасов и анализ затрат на хранение для максимизации прибыли
        </CardDescription>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-blue-900/10 border border-blue-100 dark:border-blue-800/30 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Всего товаров</p>
                  <h3 className="text-2xl font-bold mt-1">{analysisSummary.totalItems}</h3>
                </div>
                <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-800/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs">На складах</span>
                  <span className="text-xs font-medium">{warehouseItems.reduce((sum, item) => sum + (item.quantityWarehousesFull || 0), 0)} шт.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-amber-900/10 border border-amber-100 dark:border-amber-800/30 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Товары на скидку</p>
                  <h3 className="text-2xl font-bold mt-1">{analysisSummary.discountItems}</h3>
                </div>
                <div className="bg-amber-100 dark:bg-amber-800/30 p-2 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-amber-100 dark:border-amber-800/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Потенциальная экономия</span>
                  <span className="text-xs font-medium text-green-600">{formatCurrency(analysisSummary.potentialSavings)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-rose-900/10 border border-rose-100 dark:border-rose-800/30 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Низкий запас</p>
                  <h3 className="text-2xl font-bold mt-1">{analysisSummary.lowStockItems}</h3>
                </div>
                <div className="bg-rose-100 dark:bg-rose-800/30 p-2 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-rose-100 dark:border-rose-800/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Требуется докупка</span>
                  <span className="text-xs font-medium text-rose-600">{analysisSummary.lowStockItems} шт.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-purple-900/10 border border-purple-100 dark:border-purple-800/30 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Рентабельность</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {analysisSummary.optimizedROI.toFixed(2)}%
                    {analysisSummary.roiImprovement > 0 && (
                      <span className="text-sm text-green-600 ml-2">+{analysisSummary.roiImprovement.toFixed(2)}%</span>
                    )}
                  </h3>
                </div>
                <div className="bg-purple-100 dark:bg-purple-800/30 p-2 rounded-lg">
                  <WarehouseIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Текущая</span>
                  <span className="text-xs font-medium">{analysisSummary.currentROI.toFixed(2)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {analysisSummary.lowStockItems > 0 && (
          <Alert variant="destructive" className="mt-6 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Внимание! Низкий уровень запаса</AlertTitle>
            <AlertDescription>
              У вас {analysisSummary.lowStockItems} товаров с низким уровнем запаса. Рекомендуется пополнить запасы.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по бренду, артикулу или названию..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex w-full md:w-auto items-end">
                <div className="w-full md:w-auto">
                  <Label htmlFor="targetDate" className="text-xs mb-1 block">Показать товары с запасом до</Label>
                  <DatePicker 
                    value={targetDate} 
                    onValueChange={setTargetDate} 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={savePriceData} className="whitespace-nowrap">
                Сохранить изменения
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Все товары</TabsTrigger>
              <TabsTrigger value="low-stock">Низкий запас ({analysisSummary.lowStockItems})</TabsTrigger>
              <TabsTrigger value="discount">Товары для скидки ({analysisSummary.discountItems})</TabsTrigger>
              <TabsTrigger value="keep">Сохранить цены ({analysisSummary.keepItems})</TabsTrigger>
            </TabsList>
          </Tabs>

          {targetDate && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-amber-500 mr-2" />
                <span>
                  К {formatDate(targetDate)} требуется пополнить запасы по {analysisSummary.itemsStockingOutBeforeTarget} товарам
                </span>
              </div>
              <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => setTargetDate(undefined)}>
                Сбросить
              </Button>
            </div>
          )}

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/80 dark:bg-gray-900/20">
                <TableRow>
                  <TableHead className="w-[300px]">Товар</TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => requestSort('daysOfInventory')}
                  >
                    <div className="flex items-center">
                      Остаток запаса
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort('totalStorageCost')}
                  >
                    <div className="flex items-center">
                      Расходы на хранение
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => requestSort('savingsWithDiscount')}
                  >
                    <div className="flex items-center">
                      Выгода от скидки
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Рекомендация</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Нет данных для отображения</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResults.map((result) => (
                    <TableRow key={result.remainItem.nmId} className={`group ${
                      result.lowStock ? 'bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/60 dark:hover:bg-rose-950/20' : ''
                    }`}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium truncate max-w-[300px]">
                            {result.remainItem.brand} - {result.remainItem.subjectName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Артикул: {result.remainItem.vendorCode} | ID: {result.remainItem.nmId}
                          </div>
                          
                          {/* Stock level indicator */}
                          <div className="mt-1">
                            {getStockLevelIndicator(result)}
                          </div>
                          
                          <div className="pt-2 space-y-3 opacity-70 group-hover:opacity-100 transition-opacity">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Себестоимость:</Label>
                                <Input
                                  type="number"
                                  value={result.costPrice}
                                  onChange={(e) => updateCostPrice(result.remainItem.nmId, Number(e.target.value))}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Цена продажи:</Label>
                                <Input
                                  type="number"
                                  value={result.sellingPrice}
                                  onChange={(e) => updateSellingPrice(result.remainItem.nmId, Number(e.target.value))}
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Продаж в день:</Label>
                                <Input
                                  type="number"
                                  value={result.dailySales}
                                  step="0.1"
                                  onChange={(e) => updateDailySales(result.remainItem.nmId, Number(e.target.value))}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Порог низкого запаса (шт):</Label>
                                <Input
                                  type="number"
                                  value={lowStockThreshold[result.remainItem.nmId] || Math.ceil(result.dailySales * 7)}
                                  onChange={(e) => updateLowStockThreshold(result.remainItem.nmId, Number(e.target.value))}
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Стоимость хранения в день:</Label>
                                <Input
                                  type="number"
                                  value={result.dailyStorageCost}
                                  onChange={(e) => updateStorageCost(result.remainItem.nmId, Number(e.target.value))}
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Рекомендуемая скидка: {result.recommendedDiscount}%</Label>
                                <Slider
                                  value={[result.recommendedDiscount]}
                                  min={0}
                                  max={90}
                                  step={5}
                                  onValueChange={(value) => updateDiscountLevel(result.remainItem.nmId, value)}
                                  className="py-2"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium flex items-center">
                          {result.daysOfInventory} 
                          {result.daysOfInventory < 7 && <AlertTriangle className="ml-1 h-4 w-4 text-red-500" />}
                          {result.daysOfInventory > 60 && <AlertTriangle className="ml-1 h-4 w-4 text-amber-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          В наличии: {result.remainItem.quantityWarehousesFull} шт.
                        </div>
                        {result.projectedStockoutDate && (
                          <div className="text-xs mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <Popover>
                              <PopoverTrigger className="underline text-xs cursor-help">
                                Закончится: {formatDate(result.projectedStockoutDate)}
                              </PopoverTrigger>
                              <PopoverContent className="w-60 p-2">
                                <p className="text-xs">
                                  При текущей скорости продаж ({result.dailySales} шт./день) запасы этого товара закончатся {formatDate(result.projectedStockoutDate)}.
                                </p>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(result.totalStorageCost)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(result.dailyStorageCost)} в день
                        </div>
                        {result.totalStorageCost > (result.remainItem.price || 0) * 0.1 * result.remainItem.quantityWarehousesFull && (
                          <div className="text-xs text-amber-600 mt-1 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Высокие затраты
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${result.savingsWithDiscount > 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                          {result.savingsWithDiscount > 0 
                            ? <><ArrowUp className="h-3 w-3 mr-1" />{formatCurrency(result.savingsWithDiscount)}</>
                            : <><ArrowDown className="h-3 w-3 mr-1" />{formatCurrency(Math.abs(result.savingsWithDiscount))}</>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          При скидке {result.recommendedDiscount}%
                        </div>
                        <div className="text-xs mt-1">
                          ROI: {(result.action === 'discount' || result.action === 'sell') && calculateROIimprovement(result) > 0 && (
                            <span className="text-green-600">+{calculateROIimprovement(result)}%</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(result.action)}
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.action === 'sell' && 'Продать быстрее даже с убытком'}
                          {result.action === 'discount' && `Скидка ${result.recommendedDiscount}% сэкономит на хранении`}
                          {result.action === 'keep' && 'Скидка не принесет выгоды'}
                        </div>
                        {result.lowStock && (
                          <div className="mt-1 text-xs text-rose-600 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Требуется пополнение
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageProfitabilityAnalysis;
