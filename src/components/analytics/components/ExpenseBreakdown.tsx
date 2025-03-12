
import { Card } from "@/components/ui/card";
import { Truck, AlertCircle, WarehouseIcon, Target, Inbox, Coins, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { getCostPriceByNmId } from "@/services/api";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ExpenseBreakdownProps {
  data: {
    currentPeriod: {
      expenses: {
        total: number;
        logistics: number;
        storage: number;
        penalties: number;
        acceptance: number;
        advertising: number;
        deductions?: number;
        costPrice?: number;
      };
    };
  };
  advertisingBreakdown?: {
    search: number;
  };
}

const ExpenseBreakdown = ({ data, advertisingBreakdown }: ExpenseBreakdownProps) => {
  const [totalCostPrice, setTotalCostPrice] = useState(data.currentPeriod.expenses.costPrice || 0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadCostPrices = async () => {
      try {
        setIsLoading(true);
        console.log('Начинаем расчет себестоимости...');
        
        // Получаем данные о магазине из localStorage
        const storeId = localStorage.getItem('selectedStoreId');
        if (!storeId) {
          console.log('Не найден ID выбранного магазина');
          setIsLoading(false);
          return;
        }
        
        // Используем существующие данные о себестоимости, если они доступны
        if (data.currentPeriod.expenses.costPrice && data.currentPeriod.expenses.costPrice > 0) {
          console.log('Используем существующую себестоимость из данных:', data.currentPeriod.expenses.costPrice);
          setTotalCostPrice(data.currentPeriod.expenses.costPrice);
          setIsLoading(false);
          return;
        }
        
        // Загружаем данные аналитики из localStorage
        const analyticsData = JSON.parse(localStorage.getItem(`marketplace_analytics_${storeId}`) || "{}");
        console.log('Данные аналитики из localStorage:', !!analyticsData);
        
        // Проверяем наличие данных о продажах с nmId
        if (analyticsData?.data?.productSales) {
          const productSales = analyticsData.data.productSales;
          console.log(`Найдено ${productSales.length} категорий продаж:`, productSales);
          
          // Загружаем данные о себестоимости из localStorage
          const costPrices = JSON.parse(localStorage.getItem(`costPrices_${storeId}`) || "{}");
          console.log('Загруженные данные о себестоимости:', costPrices);
          
          let totalCost = 0;
          let processedCategories = 0;
          
          for (const sale of productSales) {
            if (!sale.nm_id) {
              console.log(`Пропускаем категорию "${sale.subject_name}" - нет nm_id`);
              continue;
            }
            
            const nmId = Number(sale.nm_id);
            const quantity = sale.quantity || 0;
            
            if (quantity <= 0) {
              console.log(`Пропускаем категорию "${sale.subject_name}" с нулевым количеством`);
              continue;
            }
            
            console.log(`Обработка товара с nmId ${nmId}, категория: "${sale.subject_name}", количество: ${quantity}`);
            
            // Ищем себестоимость сначала в costPrices
            let costPrice = 0;
            
            if (costPrices[nmId] && typeof costPrices[nmId] === 'number') {
              costPrice = costPrices[nmId];
              console.log(`Найдена себестоимость в costPrices для nmId ${nmId}: ${costPrice}`);
            } else {
              // Если не нашли в costPrices, ищем в products
              const products = JSON.parse(localStorage.getItem(`products_${storeId}`) || "[]");
              const product = products.find((p: any) => Number(p.nmId) === nmId);
              
              if (product && product.costPrice > 0) {
                costPrice = product.costPrice;
                console.log(`Найден товар напрямую с nmId ${nmId}: costPrice = ${costPrice}`);
                
                // Сохраняем найденную себестоимость в costPrices
                costPrices[nmId] = costPrice;
                localStorage.setItem(`costPrices_${storeId}`, JSON.stringify(costPrices));
              }
            }
            
            if (costPrice > 0) {
              const categoryCost = costPrice * quantity;
              totalCost += categoryCost;
              processedCategories++;
              
              console.log(`Успешно рассчитано для "${sale.subject_name}": ${quantity} x ${costPrice} = ${categoryCost}`);
            } else {
              console.log(`Не удалось определить себестоимость для nmId ${nmId} (категория "${sale.subject_name}")`);
            }
          }
          
          console.log(`Обработано ${processedCategories} категорий из ${productSales.length}`);
          console.log(`Общая себестоимость: ${totalCost}`);
          
          if (totalCost > 0) {
            setTotalCostPrice(totalCost);
            
            // Сохраняем результат в localStorage
            if (analyticsData.data && analyticsData.data.currentPeriod && analyticsData.data.currentPeriod.expenses) {
              analyticsData.data.currentPeriod.expenses.costPrice = totalCost;
              localStorage.setItem(`marketplace_analytics_${storeId}`, JSON.stringify(analyticsData));
              console.log('Обновлены данные аналитики с себестоимостью в localStorage');
            }
            
            toast({
              title: "Себестоимость рассчитана",
              description: `Общая себестоимость проданных товаров: ${formatCurrency(totalCost)}`,
            });
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки себестоимости:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось рассчитать себестоимость товаров",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCostPrices();
  }, [data]);

  
  // Используем общую сумму расходов для расчета процентов
  const totalExpenses = data.currentPeriod.expenses.total + totalCostPrice;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Структура расходов</h3>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <div className="flex flex-col bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border border-purple-200 dark:border-purple-800 rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium">Логистика</h4>
            <div className="bg-purple-100 dark:bg-purple-900/60 p-1 rounded-md">
              <Truck className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.currentPeriod.expenses.logistics)}</p>
          <span className="text-xs text-muted-foreground mt-0.5">
            {totalExpenses > 0 ? ((data.currentPeriod.expenses.logistics / totalExpenses) * 100).toFixed(1) : '0'}%
          </span>
        </div>

        <div className="flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border border-blue-200 dark:border-blue-800 rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium">Хранение</h4>
            <div className="bg-blue-100 dark:bg-blue-900/60 p-1 rounded-md">
              <WarehouseIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.currentPeriod.expenses.storage)}</p>
          <span className="text-xs text-muted-foreground mt-0.5">
            {totalExpenses > 0 ? ((data.currentPeriod.expenses.storage / totalExpenses) * 100).toFixed(1) : '0'}%
          </span>
        </div>

        <div className="flex flex-col bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border border-red-200 dark:border-red-800 rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium">Штрафы</h4>
            <div className="bg-red-100 dark:bg-red-900/60 p-1 rounded-md">
              <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.currentPeriod.expenses.penalties)}</p>
          <span className="text-xs text-muted-foreground mt-0.5">
            {totalExpenses > 0 ? ((data.currentPeriod.expenses.penalties / totalExpenses) * 100).toFixed(1) : '0'}%
          </span>
        </div>

        <div className="flex flex-col bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background border border-amber-200 dark:border-amber-800 rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium">Реклама</h4>
            <div className="bg-amber-100 dark:bg-amber-900/60 p-1 rounded-md">
              <Target className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.currentPeriod.expenses.advertising)}</p>
          <span className="text-xs text-muted-foreground mt-0.5">
            {totalExpenses > 0 ? ((data.currentPeriod.expenses.advertising / totalExpenses) * 100).toFixed(1) : '0'}%
          </span>
        </div>

        <div className="flex flex-col bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border border-orange-200 dark:border-orange-800 rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium">Удержания</h4>
            <div className="bg-orange-100 dark:bg-orange-900/60 p-1 rounded-md">
              <Coins className="h-3 w-3 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-lg font-bold">{formatCurrency(data.currentPeriod.expenses.deductions || 0)}</p>
          <span className="text-xs text-muted-foreground mt-0.5">
            {totalExpenses > 0 ? (((data.currentPeriod.expenses.deductions || 0) / totalExpenses) * 100).toFixed(1) : '0'}%
          </span>
        </div>
        
        <div className="flex flex-col bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border border-green-200 dark:border-green-800 rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-medium">Себестоимость</h4>
            <div className="bg-green-100 dark:bg-green-900/60 p-1 rounded-md">
              <ShoppingCart className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-lg font-bold">{formatCurrency(totalCostPrice)}</p>
          <span className="text-xs text-muted-foreground mt-0.5">
            {totalExpenses > 0 ? ((totalCostPrice / totalExpenses) * 100).toFixed(1) : '0'}%
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ExpenseBreakdown;
