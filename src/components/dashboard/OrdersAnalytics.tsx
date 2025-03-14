import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WildberriesOrder } from "@/types/store";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/utils/formatCurrency";
import { MapPin, Package, TrendingUp, ShoppingBag, Trophy, Crown, Award, Star } from "lucide-react";

interface OrdersAnalyticsProps {
  orders: WildberriesOrder[];
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

const OrdersAnalytics: React.FC<OrdersAnalyticsProps> = ({ orders }) => {
  const regionData = useMemo(() => {
    if (!orders.length) return [];
    
    const regionCounts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.regionName) {
        regionCounts[order.regionName] = (regionCounts[order.regionName] || 0) + 1;
      }
    });
    
    return Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders]);
  
  const productData = useMemo(() => {
    if (!orders.length) return [];
    
    const productCounts: Record<string, { count: number, revenue: number }> = {};
    orders.forEach(order => {
      const key = `${order.subject} (${order.supplierArticle})`;
      productCounts[key] = productCounts[key] || { count: 0, revenue: 0 };
      productCounts[key].count += 1;
      productCounts[key].revenue += Number(order.priceWithDisc || 0);
    });
    
    return Object.entries(productCounts)
      .map(([name, { count, revenue }]) => ({ 
        name, 
        count, 
        revenue 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);
  
  const warehouseData = useMemo(() => {
    if (!orders.length) return [];
    
    const warehouseCounts: Record<string, number> = {};
    orders.forEach(order => {
      if (order.warehouseName) {
        warehouseCounts[order.warehouseName] = (warehouseCounts[order.warehouseName] || 0) + 1;
      }
    });
    
    return Object.entries(warehouseCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [orders]);
  
  const topSellingProducts = useMemo(() => {
    if (!orders.length) return [];
    
    const productDetails: Record<string, {
      name: string,
      article: string,
      count: number,
      revenue: number,
      avgPrice: number,
      rank: number
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
    
    return Object.values(productDetails)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((product, index) => ({
        ...product,
        rank: index + 1
      }));
  }, [orders]);
  
  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-700" />;
      default: return <Star className="h-5 w-5 text-blue-400" />;
    }
  };

  if (!orders.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/40 dark:from-gray-900 dark:to-purple-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100/80 dark:bg-purple-900/50 shadow-inner">
                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-purple-400 dark:to-indigo-400 font-bold">
                Топ регионов
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} заказов`, 'Количество']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50/40 dark:from-gray-900 dark:to-indigo-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 shadow-inner">
                <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-700 dark:from-indigo-400 dark:to-blue-400 font-bold">
                Топ товаров
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 17)}...` : value} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      return name === 'count' 
                        ? [`${value} заказов`, 'Количество'] 
                        : [`${formatCurrency(value)} ₽`, 'Доход'];
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="count" name="Количество" fill="#8884d8" />
                  <Bar dataKey="revenue" name="Доход (₽)" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-amber-50/40 dark:from-gray-900 dark:to-amber-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100/80 dark:bg-amber-900/50 shadow-inner">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-700 to-yellow-600 dark:from-amber-400 dark:to-yellow-300 font-bold">
              Рейтинг товаров по популярности
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSellingProducts.map((product) => (
              <div 
                key={product.article} 
                className={`relative flex items-start gap-3 p-3 rounded-lg overflow-hidden border ${
                  product.rank <= 3 
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800/30' 
                    : 'border-gray-200 bg-white/80 dark:bg-gray-800/30 dark:border-gray-700/30'
                }`}
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
                    <div className="bg-white/80 dark:bg-gray-800/50 rounded p-1 text-center">
                      <p className="text-xs text-muted-foreground">Заказов</p>
                      <p className="font-semibold">{product.count}</p>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/50 rounded p-1 text-center">
                      <p className="text-xs text-muted-foreground">Доход</p>
                      <p className="font-semibold">{formatCurrency(product.revenue)} ₽</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50/40 dark:from-gray-900 dark:to-emerald-950/30 md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100/80 dark:bg-emerald-900/50 shadow-inner">
              <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-green-700 dark:from-emerald-400 dark:to-green-400 font-bold">
              Распределение по складам
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={warehouseData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value} заказов`, 'Количество']} />
                <Legend />
                <Bar dataKey="value" name="Количество заказов" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersAnalytics;
