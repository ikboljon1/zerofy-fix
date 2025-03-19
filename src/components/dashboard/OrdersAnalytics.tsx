
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WildberriesOrder } from "@/types/store";
import { formatCurrency } from "@/utils/formatCurrency";
import { Crown, Trophy, Award, Star } from "lucide-react";

interface OrdersAnalyticsProps {
  orders: WildberriesOrder[];
}

const OrdersAnalytics: React.FC<OrdersAnalyticsProps> = ({
  orders
}) => {
  const topSellingProducts = useMemo(() => {
    if (!orders.length) return [];
    const productDetails: Record<string, {
      name: string;
      article: string;
      count: number;
      revenue: number;
      avgPrice: number;
      rank: number;
    }> = {};
    orders.forEach(order => {
      const name = order.subject || "Неизвестный товар";
      const article = order.supplierArticle || "";
      const key = `${name} (${article})`;
      if (!productDetails[key]) {
        productDetails[key] = {
          name,
          article,
          count: 0,
          revenue: 0,
          avgPrice: 0,
          rank: 0
        };
      }
      productDetails[key].count += 1;
      productDetails[key].revenue += Number(order.priceWithDisc || 0);
    });
    Object.values(productDetails).forEach(product => {
      product.avgPrice = product.revenue / product.count;
    });
    return Object.values(productDetails).sort((a, b) => b.count - a.count).slice(0, 10).map((product, index) => ({
      ...product,
      rank: index + 1
    }));
  }, [orders]);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 text-blue-400" />;
    }
  };
  
  const getCardVariant = (rank: number) => {
    switch (rank % 4) {
      case 0: return "card-pink";
      case 1: return "card-blue";
      case 2: return "card-amber";
      case 3: return "card-emerald";
      default: return "card-pink";
    }
  };
  
  if (!orders.length) {
    return null;
  }
  
  return (
    <Card className="overflow-hidden border-0 shadow-xl analytics-card dark:from-gray-900 dark:to-amber-950/30 hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100/80 dark:bg-amber-900/50 shadow-inner">
            <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-amber-700 dark:text-amber-400 font-bold">
            Рейтинг товаров по популярности
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topSellingProducts.map((product) => (
            <div 
              key={product.article} 
              className={`relative flex items-start gap-3 p-3 rounded-lg overflow-hidden border transition-all duration-300 ${
                product.rank <= 3 
                  ? 'border-amber-200 bg-amber-50 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800/30' 
                  : `border-gray-200 ${getCardVariant(product.rank)} dark:bg-gray-800/30 dark:border-gray-700/30`
              } hover:shadow-lg hover:-translate-y-1`}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 ${
                product.rank <= 3 ? 'opacity-10' : 'opacity-5'
              }`}>
                {getRankIcon(product.rank)}
              </div>
              
              <div className={`flex items-center justify-center w-8 h-8 mt-1 rounded-full ${
                product.rank === 1 ? 'bg-yellow-100 dark:bg-yellow-900/50' :
                product.rank === 2 ? 'bg-gray-100 dark:bg-gray-800/50' :
                product.rank === 3 ? 'bg-amber-100 dark:bg-amber-900/50' :
                'bg-blue-50 dark:bg-blue-900/30'
              }`}>
                {getRankIcon(product.rank)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm line-clamp-2 pr-4">{product.name}</h4>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    product.rank === 1 ? 'bg-yellow-500 text-white' :
                    product.rank === 2 ? 'bg-gray-400 text-white' :
                    product.rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                  } text-xs font-bold`}>
                    {product.rank}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-1">Артикул: {product.article}</p>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white/80 dark:bg-gray-800/50 rounded p-1 text-center backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground">Заказов</p>
                    <p className="font-semibold">{product.count}</p>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/50 rounded p-1 text-center backdrop-blur-sm">
                    <p className="text-xs text-muted-foreground">Доход</p>
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersAnalytics;
