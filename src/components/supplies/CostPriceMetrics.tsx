
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatCurrency";
import { Store } from "@/types/store";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, Wallet } from "lucide-react";

interface CostPriceMetricsProps {
  selectedStore?: Store | null;
}

interface ProductData {
  nmID?: number;
  nm_id?: number | string;
  sa_name?: string;
  supplierArticle?: string;
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
      console.log(`CostPriceMetrics: Инициализация для магазина ${selectedStore.id}`);
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

  const loadCostPriceData = () => {
    if (!selectedStore) return;

    try {
      console.log(`--------- ЗАГРУЗКА ДАННЫХ О СЕБЕСТОИМОСТИ ---------`);
      console.log(`Загрузка данных о себестоимости для магазина: ${selectedStore.id}`);
      
      // ПРОВЕРКА ДАННЫХ В ХРАНИЛИЩЕ: Более подробное логирование всех ключей в localStorage
      console.log('Все ключи в localStorage, связанные с продуктами:');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('product') || key.includes('cost') || key.includes(selectedStore.id)) {
          console.log(`${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
        }
      });
      
      // Try to load from both possible keys
      let products = JSON.parse(localStorage.getItem(`products_${selectedStore.id}`) || "[]");
      console.log(`Продукты из хранилища products_: ${products.length} элементов`);
      
      if (products.length > 0) {
        console.log("Пример первых 3 продуктов из хранилища products_:", products.slice(0, 3));
        console.log("Поля в первом продукте:", Object.keys(products[0]));
        // Проверяем наличие себестоимости
        const withCostPrice = products.filter((p: any) => p.costPrice !== undefined && p.costPrice > 0);
        console.log(`Из них с себестоимостью: ${withCostPrice.length} элементов`);
        if (withCostPrice.length > 0) {
          console.log("Пример продуктов с себестоимостью:", withCostPrice.slice(0, 3));
        }
      }
      
      if (products.length === 0) {
        // Try alternative storage key (costPrices)
        const costPrices = JSON.parse(localStorage.getItem(`costPrices_${selectedStore.id}`) || "{}");
        console.log(`Данные о себестоимости из costPrices_: ${Object.keys(costPrices).length} записей`);
        
        const costPricesList = Object.entries(costPrices).map(([nmId, costPrice]) => ({
          nmID: parseInt(nmId, 10),
          nm_id: parseInt(nmId, 10),
          costPrice
        }));
        
        if (costPricesList.length > 0) {
          products = costPricesList;
          console.log(`Найдено ${products.length} продуктов в хранилище costPrices_`);
          if (products.length > 0) {
            console.log("Пример данных о себестоимости из costPrices_:", products.slice(0, 3));
          }
        } else {
          // Try another alternative storage key (products_cost_price)
          const altProducts = JSON.parse(localStorage.getItem(`products_cost_price_${selectedStore.id}`) || "[]");
          console.log(`Данные из products_cost_price_: ${altProducts.length} записей`);
          
          if (altProducts.length > 0) {
            products = altProducts.map((item: any) => ({
              nmID: item.nmId,
              nm_id: item.nmId,
              costPrice: item.costPrice
            }));
            console.log(`Найдено ${products.length} продуктов в хранилище products_cost_price_`);
            if (products.length > 0) {
              console.log("Пример данных о себестоимости из products_cost_price_:", products.slice(0, 3));
            }
          } else {
            console.log("Не найдено продуктов ни в одном из хранилищ");
            return;
          }
        }
      }

      // Get sales data to match with cost prices
      const salesData = getSalesData(selectedStore.id);
      console.log(`Получено данных о продажах: ${salesData.length} элементов`);
      
      if (salesData.length > 0) {
        console.log("Пример первых 3 записей о продажах:", salesData.slice(0, 3));
        console.log("Поля в первой записи о продаже:", Object.keys(salesData[0]));
        
        // Проверяем наличие ключевых полей
        const withNmId = salesData.filter((s: any) => s.nmId !== undefined || s.nm_id !== undefined);
        const withSaName = salesData.filter((s: any) => s.sa_name !== undefined);
        const withSupplierArticle = salesData.filter((s: any) => s.supplierArticle !== undefined);
        const withQuantity = salesData.filter((s: any) => s.quantity !== undefined && s.quantity > 0);
        
        console.log(`Продажи с nmId/nm_id: ${withNmId.length} из ${salesData.length}`);
        console.log(`Продажи с sa_name: ${withSaName.length} из ${salesData.length}`);
        console.log(`Продажи с supplierArticle: ${withSupplierArticle.length} из ${salesData.length}`);
        console.log(`Продажи с quantity > 0: ${withQuantity.length} из ${salesData.length}`);
        
        // Проверим наличие ключей в первых 10 элементах более детально
        console.log("Детальная проверка полей в первых 10 записях продаж:");
        salesData.slice(0, 10).forEach((sale: any, index: number) => {
          console.log(`Запись #${index+1}:`, {
            hasNmId: Boolean(sale.nmId),
            hasNm_id: Boolean(sale.nm_id),
            nmIdValue: sale.nmId || sale.nm_id,
            hasSaName: Boolean(sale.sa_name),
            saNameValue: sale.sa_name,
            hasSupplierArticle: Boolean(sale.supplierArticle),
            supplierArticleValue: sale.supplierArticle,
            hasQuantity: Boolean(sale.quantity),
            quantityValue: sale.quantity
          });
        });
      }
      
      let totalCost = 0;
      let itemsSold = 0;
      let matchedCount = 0;
      
      // Create maps for faster lookups
      const productByNmId: Record<string, ProductData> = {};
      const productBySupplierArticle: Record<string, ProductData> = {};
      const productBySaName: Record<string, ProductData> = {};
      
      // Index products by various identifiers
      products.forEach((product: ProductData) => {
        if (product.nmID) {
          productByNmId[product.nmID.toString()] = product;
        }
        if (product.nm_id) {
          productByNmId[product.nm_id.toString()] = product;
        }
        if (product.supplierArticle) {
          productBySupplierArticle[product.supplierArticle] = product;
        }
        if (product.sa_name) {
          productBySaName[product.sa_name] = product;
        }
      });
      
      console.log("Продукты проиндексированы по идентификаторам:", {
        byNmId: Object.keys(productByNmId).length,
        bySupplierArticle: Object.keys(productBySupplierArticle).length,
        bySaName: Object.keys(productBySaName).length
      });
      
      // Выведем примеры ключей для каждого типа идентификатора
      if (Object.keys(productByNmId).length > 0) {
        console.log("Примеры nmId:", Object.keys(productByNmId).slice(0, 5));
      }
      if (Object.keys(productBySupplierArticle).length > 0) {
        console.log("Примеры supplierArticle:", Object.keys(productBySupplierArticle).slice(0, 5));
      }
      if (Object.keys(productBySaName).length > 0) {
        console.log("Примеры sa_name:", Object.keys(productBySaName).slice(0, 5));
      }

      // Match sales with cost prices and calculate totals
      salesData.forEach((sale: any) => {
        const quantity = sale.quantity || 0;
        let costPrice = 0;
        let matched = false;
        let matchMethod = '';
        
        // Try to match by nm_id
        if ((sale.nmId || sale.nm_id) && (productByNmId[sale.nmId?.toString()] || productByNmId[sale.nm_id?.toString()])) {
          const productKey = sale.nmId?.toString() || sale.nm_id?.toString();
          costPrice = productByNmId[productKey]?.costPrice || 0;
          matched = costPrice > 0;
          matchMethod = 'nmId';
        }
        
        // Try to match by supplierArticle
        if (!matched && sale.supplierArticle && productBySupplierArticle[sale.supplierArticle]) {
          costPrice = productBySupplierArticle[sale.supplierArticle].costPrice || 0;
          matched = costPrice > 0;
          matchMethod = 'supplierArticle';
        }
        
        // Try to match by sa_name
        if (!matched && sale.sa_name && productBySaName[sale.sa_name]) {
          costPrice = productBySaName[sale.sa_name].costPrice || 0;
          matched = costPrice > 0;
          matchMethod = 'sa_name';
        }
        
        if (matched) {
          matchedCount++;
          if (matchedCount <= 5) {
            console.log(`УСПЕШНОЕ СОПОСТАВЛЕНИЕ (${matchMethod}): ${JSON.stringify({
              nmId: sale.nmId || sale.nm_id,
              sa_name: sale.sa_name,
              supplierArticle: sale.supplierArticle,
              quantity,
              costPrice
            })}`);
          }
          
          if (quantity > 0 && costPrice > 0) {
            totalCost += quantity * costPrice;
            itemsSold += quantity;
          }
        } else if (matchedCount <= 5) {
          console.log(`НЕ НАЙДЕНО СОВПАДЕНИЕ для: ${JSON.stringify({
            nmId: sale.nmId || sale.nm_id,
            sa_name: sale.sa_name,
            supplierArticle: sale.supplierArticle,
            quantity
          })}`);
        }
      });

      console.log(`Сопоставлено ${matchedCount} из ${salesData.length} записей о продажах`);
      console.log(`Итоговая себестоимость: ${totalCost}, продано товаров: ${itemsSold}, средняя себестоимость: ${totalCost / (itemsSold || 1)}`);
      
      setTotalCostPrice(totalCost);
      setTotalSoldItems(itemsSold);
      setAvgCostPrice(itemsSold > 0 ? totalCost / itemsSold : 0);
      
      setLastUpdateDate(new Date().toISOString());
      console.log(`--------- КОНЕЦ ЗАГРУЗКИ ДАННЫХ О СЕБЕСТОИМОСТИ ---------`);
    } catch (error) {
      console.error("Ошибка при загрузке данных о себестоимости:", error);
    }
  };

  const getSalesData = (storeId: string): any[] => {
    try {
      // Try to get sales data from multiple sources
      console.log("Попытка получить данные о продажах из различных источников для магазина", storeId);
      
      // First, check if we have analytics data with product sales
      const analyticsKey = `marketplace_analytics_${storeId}`;
      const analyticsData = JSON.parse(localStorage.getItem(analyticsKey) || "{}");
      console.log(`Проверка наличия данных в ключе ${analyticsKey}:`, Boolean(analyticsData.data));
      
      if (analyticsData.data?.productSales && analyticsData.data.productSales.length > 0) {
        console.log(`Found ${analyticsData.data.productSales.length} sales items in analytics data`);
        return analyticsData.data.productSales;
      }
      
      // Next, check if we have top profitable products
      if (analyticsData.data?.topProfitableProducts && analyticsData.data.topProfitableProducts.length > 0) {
        console.log(`Found ${analyticsData.data.topProfitableProducts.length} top profitable products`);
        return analyticsData.data.topProfitableProducts;
      }
      
      // Finally, check if we have stats data for the store
      const statsKey = `marketplace_stats_${storeId}`;
      const statsData = JSON.parse(localStorage.getItem(statsKey) || "{}");
      console.log(`Проверка наличия данных в ключе ${statsKey}:`, Boolean(statsData.productSales));
      
      if (statsData.productSales && statsData.productSales.length > 0) {
        console.log(`Found ${statsData.productSales.length} sales items in stats data`);
        return statsData.productSales;
      }
      
      // Last resort, check if there's reports data
      const reportsKey = `wb_reports_${storeId}`;
      const reportsData = JSON.parse(localStorage.getItem(reportsKey) || "[]");
      console.log(`Проверка наличия данных в ключе ${reportsKey}:`, reportsData.length);
      
      if (reportsData.length > 0) {
        console.log(`Found ${reportsData.length} items in reports data`);
        return reportsData.filter((item: any) => item.doc_type_name === "Продажа");
      }
      
      // Try to get from regular products storage to extract quantities
      const products = JSON.parse(localStorage.getItem(`products_${storeId}`) || "[]");
      console.log(`Проверка наличия данных в products_${storeId}:`, products.length);
      
      const productsWithQuantity = products.filter((p: any) => p.quantity && p.quantity > 0);
      
      if (productsWithQuantity.length > 0) {
        console.log(`Found ${productsWithQuantity.length} products with quantity`);
        return productsWithQuantity;
      }
      
      console.log("No sales data found in any storage");
      return [];
    } catch (error) {
      console.error("Error retrieving sales data:", error);
      return [];
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
