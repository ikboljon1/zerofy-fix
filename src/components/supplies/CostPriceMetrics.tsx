
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { Store } from "@/types/store";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

interface CostPriceMetricsProps {
  selectedStore?: Store | null;
}

interface ProductData {
  nmId?: number;
  subject?: string;
  subject_name?: string;
  quantity?: number;
  costPrice?: number;
}

interface ProductSale {
  subject_name: string;
  quantity: number;
  nm_id?: number;
}

interface CostPriceData {
  totalCostPrice: number;
  totalSoldItems: number;
  avgCostPrice: number;
  lastUpdateDate: string;
}

const CostPriceMetrics: React.FC<CostPriceMetricsProps> = ({ selectedStore }) => {
  const [totalCostPrice, setTotalCostPrice] = useState<number>(0);
  const [totalSoldItems, setTotalSoldItems] = useState<number>(0);
  const [avgCostPrice, setAvgCostPrice] = useState<number>(0);
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedStore) {
      loadCostPriceData();
    } else {
      resetData();
    }
  }, [selectedStore]);

  const resetData = () => {
    setTotalCostPrice(0);
    setTotalSoldItems(0);
    setAvgCostPrice(0);
    setLastUpdateDate(null);
  };

  const loadCostPriceData = async () => {
    if (!selectedStore) return;

    setIsLoading(true);
    
    try {
      // Сначала пробуем загрузить данные из базы данных
      const dbData = await loadFromDatabase(selectedStore.id);
      
      if (dbData) {
        // Если данные есть в базе данных, используем их
        console.log("Загружены данные о себестоимости из базы данных:", dbData);
        setTotalCostPrice(dbData.totalCostPrice);
        setTotalSoldItems(dbData.totalSoldItems);
        setAvgCostPrice(dbData.avgCostPrice);
        setLastUpdateDate(dbData.lastUpdateDate);
        toast({
          title: "Данные загружены",
          description: "Данные о себестоимости загружены из базы данных",
        });
      } else {
        // Если данных в базе нет, рассчитываем их из localStorage
        console.log("Данные о себестоимости в базе не найдены, расчет из localStorage");
        await calculateFromLocalStorage();
      }
    } catch (error) {
      console.error("Ошибка загрузки данных о себестоимости:", error);
      toast({
        title: "Ошибка загрузки данных",
        description: "Произошла ошибка при загрузке данных о себестоимости",
        variant: "destructive",
      });
      
      // В случае ошибки пробуем рассчитать из localStorage
      await calculateFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromDatabase = async (storeId: string): Promise<CostPriceData | null> => {
    try {
      const response = await axios.get(`http://localhost:3001/api/cost-price/${storeId}`);
      if (response.data && response.status === 200) {
        return {
          totalCostPrice: response.data.totalCostPrice,
          totalSoldItems: response.data.totalSoldItems,
          avgCostPrice: response.data.avgCostPrice,
          lastUpdateDate: response.data.lastUpdateDate
        };
      }
      return null;
    } catch (error) {
      console.error("Ошибка загрузки данных из базы:", error);
      return null;
    }
  };

  const saveToDatabase = async (storeId: string, data: CostPriceData) => {
    try {
      await axios.post('http://localhost:3001/api/cost-price', {
        storeId,
        totalCostPrice: data.totalCostPrice,
        totalSoldItems: data.totalSoldItems,
        avgCostPrice: data.avgCostPrice,
        lastUpdateDate: data.lastUpdateDate
      });
      console.log("Данные о себестоимости сохранены в базу данных");
    } catch (error) {
      console.error("Ошибка сохранения данных в базу:", error);
      
      // В случае ошибки сохраняем в localStorage как резервный вариант
      localStorage.setItem(`costPriceMetrics_${storeId}`, JSON.stringify({
        totalCostPrice: data.totalCostPrice,
        totalSoldItems: data.totalSoldItems,
        avgCostPrice: data.avgCostPrice,
        lastUpdateDate: data.lastUpdateDate,
        timestamp: new Date().getTime()
      }));
      console.log("Данные сохранены в localStorage в качестве резервной копии");
    }
  };

  const calculateFromLocalStorage = async () => {
    if (!selectedStore) return;

    try {
      // Попробуем сначала загрузить расчетные данные из localStorage если они там есть
      const savedMetrics = localStorage.getItem(`costPriceMetrics_${selectedStore.id}`);
      if (savedMetrics) {
        const parsedMetrics = JSON.parse(savedMetrics);
        const timestamp = parsedMetrics.timestamp || 0;
        const oneHourAgo = new Date().getTime() - 60 * 60 * 1000;
        
        // Используем сохраненные метрики если они не старше 1 часа
        if (timestamp > oneHourAgo) {
          console.log("Используем сохраненные метрики из localStorage");
          setTotalCostPrice(parsedMetrics.totalCostPrice);
          setTotalSoldItems(parsedMetrics.totalSoldItems);
          setAvgCostPrice(parsedMetrics.avgCostPrice);
          setLastUpdateDate(parsedMetrics.lastUpdateDate);
          
          // Сохраняем в БД для следующих загрузок
          await saveToDatabase(selectedStore.id, parsedMetrics);
          return;
        }
      }
      
      // Загружаем данные о себестоимости из localStorage
      const costPrices = JSON.parse(localStorage.getItem(`costPrices_${selectedStore.id}`) || "{}");
      console.log("Загруженные данные о себестоимости:", costPrices);
      
      // Загружаем аналитические данные из localStorage
      const analyticsData = JSON.parse(localStorage.getItem(`marketplace_analytics_${selectedStore.id}`) || "{}");
      
      if (!analyticsData || !analyticsData.data || !analyticsData.data.productSales || analyticsData.data.productSales.length === 0) {
        console.log("Нет данных о продажах товаров в аналитике");
        toast({
          title: "Нет данных о продажах",
          description: "Не найдены данные о продажах товаров в аналитике",
          variant: "default",
        });
        return;
      }
      
      const productSales: ProductSale[] = analyticsData.data.productSales;
      console.log(`Найдено ${productSales.length} категорий продаж:`, productSales);
      
      // Проверяем наличие nm_id в данных о продажах
      productSales.forEach((sale, index) => {
        console.log(`[${index}] Категория: ${sale.subject_name}, Количество: ${sale.quantity}, nm_id: ${sale.nm_id}`);
      });
      
      // Загружаем продукты на случай, если costPrices не содержит данных
      const products = JSON.parse(localStorage.getItem(`products_${selectedStore.id}`) || "[]");
      
      let totalCost = 0;
      let totalItems = 0;
      let processedCategories = 0;
      let skippedCategories = 0;
      
      for (const sale of productSales) {
        if (!sale.nm_id) {
          console.log(`Пропускаем категорию "${sale.subject_name}" - нет nm_id`);
          skippedCategories++;
          continue;
        }
        
        const quantity = sale.quantity || 0;
        if (quantity <= 0) {
          console.log(`Пропускаем категорию "${sale.subject_name}" с нулевым количеством`);
          continue;
        }
        
        const nmId = Number(sale.nm_id);
        console.log(`Обработка товара с nmId ${nmId}, категория: "${sale.subject_name}", количество: ${quantity}`);
        
        // Ищем себестоимость сначала в costPrices
        let costPrice = 0;
        
        if (costPrices[nmId] && typeof costPrices[nmId] === 'number') {
          costPrice = costPrices[nmId];
          console.log(`Найдена себестоимость в costPrices для nmId ${nmId}: ${costPrice}`);
        } else {
          // Если не нашли в costPrices, ищем в products
          const productWithNmId = products.find((p: any) => Number(p.nmId) === nmId);
          if (productWithNmId && productWithNmId.costPrice > 0) {
            costPrice = productWithNmId.costPrice;
            console.log(`Найден товар напрямую с nmId ${nmId}: costPrice = ${costPrice}`);
            
            // Сохраняем найденную себестоимость в costPrices для будущего использования
            costPrices[nmId] = costPrice;
            localStorage.setItem(`costPrices_${selectedStore.id}`, JSON.stringify(costPrices));
          }
        }
        
        if (costPrice > 0) {
          const categoryCost = costPrice * quantity;
          totalCost += categoryCost;
          totalItems += quantity;
          processedCategories++;
          
          console.log(`Успешно рассчитано для "${sale.subject_name}": ${quantity} x ${costPrice} = ${categoryCost}`);
        } else {
          console.log(`Не удалось определить себестоимость для nmId ${nmId} (категория "${sale.subject_name}")`);
          skippedCategories++;
        }
      }
      
      console.log(`Обработано ${processedCategories} категорий, пропущено ${skippedCategories} категорий`);
      console.log(`Общая себестоимость: ${totalCost}, Всего проданных товаров: ${totalItems}`);
      
      const avgCost = totalItems > 0 ? totalCost / totalItems : 0;
      const currentDate = new Date().toISOString();
      
      setTotalCostPrice(totalCost);
      setTotalSoldItems(totalItems);
      setAvgCostPrice(avgCost);
      setLastUpdateDate(currentDate);
      
      // Обновляем данные аналитики с новой себестоимостью
      if (analyticsData && analyticsData.data && analyticsData.data.currentPeriod && analyticsData.data.currentPeriod.expenses) {
        analyticsData.data.currentPeriod.expenses.costPrice = totalCost;
        localStorage.setItem(`marketplace_analytics_${selectedStore.id}`, JSON.stringify(analyticsData));
        console.log(`Обновлены данные аналитики с себестоимостью: ${totalCost}`);
      }
      
      // Сохраняем рассчитанные данные в базу данных и localStorage
      const costPriceData = {
        totalCostPrice: totalCost,
        totalSoldItems: totalItems,
        avgCostPrice: avgCost,
        lastUpdateDate: currentDate
      };
      
      // Сохраняем рассчитанные данные в базу данных
      await saveToDatabase(selectedStore.id, costPriceData);
      
      // Сохраняем в localStorage в любом случае как резервную копию
      localStorage.setItem(`costPriceMetrics_${selectedStore.id}`, JSON.stringify({
        ...costPriceData,
        timestamp: new Date().getTime()
      }));
      
      if (processedCategories > 0) {
        toast({
          title: "Расчет выполнен",
          description: `Успешно рассчитана себестоимость для ${processedCategories} категорий товаров`,
          variant: "default",
        });
      }
      
      if (skippedCategories > 0) {
        toast({
          title: "Внимание",
          description: `Не удалось определить себестоимость для ${skippedCategories} категорий товаров`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Ошибка расчета себестоимости из localStorage:", error);
      toast({
        title: "Ошибка загрузки данных",
        description: "Произошла ошибка при расчете данных о себестоимости",
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    if (selectedStore) {
      setIsLoading(true);
      calculateFromLocalStorage().finally(() => {
        setIsLoading(false);
      });
    }
  };

  if (!selectedStore) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Статистика себестоимости</h2>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
              <span className="text-xs text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            <>
              {lastUpdateDate && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Обновлено: {new Date(lastUpdateDate).toLocaleString('ru-RU')}
                </Badge>
              )}
              <button 
                onClick={refreshData}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Обновить данные"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center text-blue-700 dark:text-blue-400">
              <DollarSign className="mr-2 h-4 w-4" />
              Общая себестоимость
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(totalCostPrice)}
            </div>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">
              Для всех проданных товаров
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center text-green-700 dark:text-green-400">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Продано товаров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {totalSoldItems}
            </div>
            <p className="text-sm text-green-600/70 dark:text-green-400/70 mt-1">
              Общее количество проданных единиц
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center text-amber-700 dark:text-amber-400">
              <Wallet className="mr-2 h-4 w-4" />
              Средняя себестоимость
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {formatCurrency(avgCostPrice)}
            </div>
            <p className="text-sm text-amber-600/70 dark:text-amber-400/70 mt-1">
              На единицу проданного товара
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CostPriceMetrics;
