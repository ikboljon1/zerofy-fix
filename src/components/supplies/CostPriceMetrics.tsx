
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { Store } from "@/types/store";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, Wallet } from "lucide-react";
import { getCostPriceByNmId, getCostPriceBySubjectName } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

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

const CostPriceMetrics: React.FC<CostPriceMetricsProps> = ({ selectedStore }) => {
  const [totalCostPrice, setTotalCostPrice] = useState<number>(0);
  const [totalSoldItems, setTotalSoldItems] = useState<number>(0);
  const [avgCostPrice, setAvgCostPrice] = useState<number>(0);
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);
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

  const calculateAverageCostPriceBySubject = (products: ProductData[], subjectName: string): number => {
    const matchingProducts = products.filter(
      p => (p.subject === subjectName || p.subject_name === subjectName) && p.costPrice && p.costPrice > 0
    );
    
    if (matchingProducts.length === 0) return 0;
    
    const totalCost = matchingProducts.reduce((sum, p) => sum + (p.costPrice || 0), 0);
    return totalCost / matchingProducts.length;
  };

  const loadCostPriceData = async () => {
    if (!selectedStore) return;

    try {
      const products = JSON.parse(localStorage.getItem(`products_${selectedStore.id}`) || "[]");
      if (products.length === 0) {
        console.log("No products found in localStorage");
        toast({
          title: "Нет данных о товарах",
          description: "Не найдены данные о товарах в локальном хранилище",
          variant: "default",
        });
        return;
      }

      console.log(`Loaded ${products.length} products from localStorage`);
      
      const analyticsData = JSON.parse(localStorage.getItem(`marketplace_analytics_${selectedStore.id}`) || "{}");
      
      if (!analyticsData || !analyticsData.data || !analyticsData.data.productSales || analyticsData.data.productSales.length === 0) {
        console.log("No product sales data found in analytics");
        toast({
          title: "Нет данных о продажах",
          description: "Не найдены данные о продажах товаров в аналитике",
          variant: "default",
        });
        return;
      }
      
      const productSales: ProductSale[] = analyticsData.data.productSales;
      console.log(`Found ${productSales.length} product sales categories in analytics data:`, productSales);
      
      let totalCost = 0;
      let totalItems = 0;
      let processedCategories = 0;
      let skippedCategories = 0;
      
      // Создадим дебаг-информацию для анализа nm_id
      console.log("Анализ nm_id в данных о продажах:");
      productSales.forEach((sale, index) => {
        console.log(`[${index}] subject_name: ${sale.subject_name}, quantity: ${sale.quantity}, nm_id:`, sale.nm_id);
      });
      
      // Проверим формат nm_id в продуктах
      console.log("Формат nm_id в первых 5 продуктах:");
      products.slice(0, 5).forEach((product: any, index: number) => {
        console.log(`[${index}] nmId: ${product.nmId}, тип: ${typeof product.nmId}, costPrice: ${product.costPrice}`);
      });
      
      for (const sale of productSales) {
        const subjectName = sale.subject_name;
        const quantity = sale.quantity || 0;
        // Убедимся, что nm_id имеет правильный формат (число)
        const nmId = sale.nm_id ? Number(sale.nm_id) : undefined;
        
        if (quantity <= 0) {
          console.log(`Skipping category "${subjectName}" with zero quantity`);
          continue;
        }
        
        console.log(`Processing category: "${subjectName}", quantity: ${quantity}, nm_id: ${nmId || 'undefined'}`);
        
        let costPrice = 0;
        
        // Сначала ищем по nm_id, если он доступен
        if (nmId) {
          console.log(`Trying to get cost price by nmId ${nmId} for category "${subjectName}"`);
          
          // Сначала ищем напрямую в products по nmId
          const productWithNmId = products.find((p: any) => Number(p.nmId) === nmId);
          if (productWithNmId && productWithNmId.costPrice > 0) {
            costPrice = productWithNmId.costPrice;
            console.log(`Found product directly with nmId ${nmId}: costPrice = ${costPrice}`);
          } else {
            // Если не нашли напрямую, используем API
            costPrice = await getCostPriceByNmId(nmId, selectedStore.id);
            console.log(`Result from getCostPriceByNmId for ${nmId}: ${costPrice}`);
          }
        }
        
        // Если по nm_id не нашли, пробуем по subject_name
        if (costPrice === 0) {
          console.log(`No cost price found by nmId, trying by subject_name: "${subjectName}"`);
          costPrice = calculateAverageCostPriceBySubject(products, subjectName);
          if (costPrice > 0) {
            console.log(`Found average cost price for category "${subjectName}": ${costPrice}`);
          } else {
            // Если и локально не нашли, запрашиваем через API по subject_name
            costPrice = await getCostPriceBySubjectName(subjectName, selectedStore.id);
            console.log(`Result from getCostPriceBySubjectName for "${subjectName}": ${costPrice}`);
          }
        }
        
        if (costPrice > 0) {
          const categoryCost = costPrice * quantity;
          totalCost += categoryCost;
          totalItems += quantity;
          processedCategories++;
          
          console.log(`Successfully calculated for "${subjectName}": ${quantity} x ${costPrice} = ${categoryCost}`);
        } else {
          console.log(`Could not determine cost price for category "${subjectName}"`);
          skippedCategories++;
        }
      }
      
      console.log(`Processed ${processedCategories} categories, skipped ${skippedCategories} categories`);
      console.log(`Total cost: ${totalCost}, Total items: ${totalItems}`);
      
      setTotalCostPrice(totalCost);
      setTotalSoldItems(totalItems);
      setAvgCostPrice(totalItems > 0 ? totalCost / totalItems : 0);
      setLastUpdateDate(new Date().toISOString());
      
      if (analyticsData && analyticsData.data && analyticsData.data.currentPeriod && analyticsData.data.currentPeriod.expenses) {
        analyticsData.data.currentPeriod.expenses.costPrice = totalCost;
        localStorage.setItem(`marketplace_analytics_${selectedStore.id}`, JSON.stringify(analyticsData));
        console.log(`Updated analytics data with cost price: ${totalCost}`);
      }
      
      if (skippedCategories > 0) {
        toast({
          title: "Внимание",
          description: `Не удалось определить себестоимость для ${skippedCategories} категорий товаров`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error loading cost price data:", error);
      toast({
        title: "Ошибка загрузки данных",
        description: "Произошла ошибка при загрузке данных о себестоимости",
        variant: "destructive",
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
        {lastUpdateDate && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Последнее обновление: {new Date(lastUpdateDate).toLocaleString('ru-RU')}
          </Badge>
        )}
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
