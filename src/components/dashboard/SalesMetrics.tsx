
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WildberriesSale } from "@/types/store";
import { ShoppingCart, CreditCard, BarChart3, Tag, PackageX, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface SalesMetricsProps {
  sales: WildberriesSale[];
  costPrice?: number;
}

const SalesMetrics: React.FC<SalesMetricsProps> = ({ sales, costPrice = 0 }) => {
  // Calculate metrics
  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + sale.priceWithDisc, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.forPay, 0);
  const netProfit = totalProfit - costPrice;
  const avgSaleValue = totalSales > 0 ? totalAmount / totalSales : 0;
  const returnedItems = sales.filter(sale => sale.priceWithDisc < 0).length; // Возвраты имеют отрицательную цену
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center text-indigo-700 dark:text-indigo-400">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Всего продаж
          </CardTitle>
          <CardDescription className="text-indigo-600/70 dark:text-indigo-400/70">
            За выбранный период
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{totalSales}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center text-amber-700 dark:text-amber-400">
            <BarChart3 className="mr-2 h-4 w-4" />
            Выручка
          </CardTitle>
          <CardDescription className="text-amber-600/70 dark:text-amber-400/70">
            Общая стоимость
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {formatCurrency(totalAmount)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center text-green-700 dark:text-green-400">
            <CreditCard className="mr-2 h-4 w-4" />
            К получению
          </CardTitle>
          <CardDescription className="text-green-600/70 dark:text-green-400/70">
            После вычета комиссий
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totalProfit)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 border-red-200 dark:border-red-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center text-red-700 dark:text-red-400">
            <DollarSign className="mr-2 h-4 w-4" />
            Себестоимость
          </CardTitle>
          <CardDescription className="text-red-600/70 dark:text-red-400/70">
            Стоимость товаров
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {formatCurrency(costPrice)}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/40 dark:to-cyan-900/20 border-cyan-200 dark:border-cyan-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center text-cyan-700 dark:text-cyan-400">
            <Tag className="mr-2 h-4 w-4" />
            Чистая прибыль
          </CardTitle>
          <CardDescription className="text-cyan-600/70 dark:text-cyan-400/70">
            С учетом себестоимости
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
            {formatCurrency(netProfit)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesMetrics;
