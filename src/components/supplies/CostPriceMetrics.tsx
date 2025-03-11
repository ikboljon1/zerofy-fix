
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { Store } from "@/types/store";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, Wallet } from "lucide-react";
import { getCostPriceByNmId } from "@/services/api";

interface CostPriceMetricsProps {
  selectedStore?: Store | null;
}

interface ProductData {
  nmId: number;
  quantity?: number;
  costPrice?: number;
}

const CostPriceMetrics: React.FC<CostPriceMetricsProps> = ({ selectedStore }) => {
  const [totalCostPrice, setTotalCostPrice] = useState<number>(0);
  const [totalSoldItems, setTotalSoldItems] = useState<number>(0);
  const [avgCostPrice, setAvgCostPrice] = useState<number>(0);
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);

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

    try {
      // Получаем список продуктов из localStorage
      const products = JSON.parse(localStorage.getItem(`products_${selectedStore.id}`) || "[]");
      if (products.length === 0) {
        console.log("No products found in localStorage");
        return;
      }

      // Логируем первые несколько продуктов для отладки
      console.log("Loaded products sample:", products.slice(0, 3).map((p: any) => ({
        nmId: p.nmId || p.nmID,
        costPrice: p.costPrice,
        quantity: p.quantity
      })));

      // Получаем данные о продажах из хранилища аналитики
      const analyticsData = JSON.parse(localStorage.getItem(`marketplace_analytics_${selectedStore.id}`) || "{}");
      
      if (!analyticsData || !analyticsData.data || !analyticsData.data.dailySales) {
        console.log("No analytics data found in localStorage");
        
        // Если данных аналитики нет, просто используем данные о количестве товаров
        let totalCost = 0;
        let itemsSold = 0;
        
        for (const product of products) {
          const quantity = product.quantity || 0;
          let costPrice = product.costPrice || 0;
          
          // Если себестоимость не указана, пробуем получить по nmId
          if (costPrice === 0 && product.nmId) {
            costPrice = await getCostPriceByNmId(product.nmId, selectedStore.id);
          }
          
          if (quantity > 0 && costPrice > 0) {
            totalCost += quantity * costPrice;
            itemsSold += quantity;
            console.log(`Product nmId=${product.nmId}, quantity=${quantity}, costPrice=${costPrice}`);
          }
        }
        
        console.log(`Using product data only. Total cost: ${totalCost}, Total items: ${itemsSold}`);
        setTotalCostPrice(totalCost);
        setTotalSoldItems(itemsSold);
        setAvgCostPrice(itemsSold > 0 ? totalCost / itemsSold : 0);
        setLastUpdateDate(new Date().toISOString());
        return;
      }
      
      // Используем данные о продажах из аналитики
      console.log("Using analytics data for cost price calculation");
      
      // Собираем все продажи из ежедневных данных
      const allSales: any[] = [];
      analyticsData.data.dailySales.forEach((day: any) => {
        if (day && day.sales && Array.isArray(day.sales)) {
          allSales.push(...day.sales);
        }
      });
      
      console.log(`Found ${allSales.length} sales in analytics data`);
      
      // Проверяем наличие nmId в данных о продажах
      const hasNmId = allSales.some((sale: any) => 'nmId' in sale || 'nm_id' in sale);
      console.log(`Sales data contains nmId: ${hasNmId}`);
      
      if (!hasNmId) {
        console.log("No nmId found in sales data, cannot calculate cost price");
        return;
      }
      
      let totalCost = 0;
      let itemsSold = 0;
      
      // Для каждой продажи получаем себестоимость по nmId
      for (const sale of allSales) {
        const nmId = sale.nmId || sale.nm_id;
        if (!nmId) continue;
        
        const quantity = Math.abs(sale.quantity || 1); // Используем абсолютное значение количества
        const product = products.find((p: any) => (p.nmId === nmId || p.nmID === nmId));
        
        let costPrice = 0;
        if (product && product.costPrice) {
          costPrice = product.costPrice;
        } else {
          // Если товар не найден в локальном хранилище, пробуем получить себестоимость через API
          costPrice = await getCostPriceByNmId(nmId, selectedStore.id);
        }
        
        if (costPrice > 0) {
          const itemCostPrice = costPrice * quantity;
          totalCost += itemCostPrice;
          itemsSold += quantity;
          console.log(`Sale nmId=${nmId}, quantity=${quantity}, costPrice=${costPrice}, total=${itemCostPrice}`);
        }
      }

      console.log(`Total cost: ${totalCost}, Total items sold: ${itemsSold}`);
      setTotalCostPrice(totalCost);
      setTotalSoldItems(itemsSold);
      setAvgCostPrice(itemsSold > 0 ? totalCost / itemsSold : 0);
      
      // Устанавливаем дату последнего обновления
      setLastUpdateDate(new Date().toISOString());
    } catch (error) {
      console.error("Error loading cost price data:", error);
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
