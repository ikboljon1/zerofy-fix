
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesChart from "./SalesChart";
import SalesMetrics from "./SalesMetrics";
import SalesTable from "./SalesTable";
import { PeriodSelector } from "./PeriodSelector";

type Period = "week" | "month" | "quarter" | "year";

const SalesAnalytics = () => {
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);

  // Генерируем демо-данные
  useEffect(() => {
    setLoading(true);
    
    // Имитация загрузки данных с API
    setTimeout(() => {
      // Генерация данных на основе выбранного периода
      const data = generateSalesData(period);
      setSalesData(data);
      setLoading(false);
    }, 500);
  }, [period]);

  const generateSalesData = (period: string) => {
    const now = new Date();
    const data = [];
    
    let daysToGenerate = 30;
    
    if (period === "week") {
      daysToGenerate = 7;
    } else if (period === "month") {
      daysToGenerate = 30;
    } else if (period === "quarter") {
      daysToGenerate = 90;
    } else if (period === "year") {
      daysToGenerate = 365;
    }
    
    // Генерируем данные за указанный период
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date();
      date.setDate(now.getDate() - (daysToGenerate - i - 1));
      
      const revenue = Math.floor(Math.random() * 50000) + 10000;
      const orders = Math.floor(Math.random() * 100) + 20;
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue,
        orders,
        avgOrderValue: Math.round(revenue / orders)
      });
    }
    
    return data;
  };

  // Расчет метрик для отображения
  const calculateMetrics = () => {
    if (!salesData.length) return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      returnsRate: 0,
      topSellingProducts: []
    };
    
    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalRevenue / totalOrders,
      returnsRate: Math.random() * 5, // Рандомная ставка возврата
      topSellingProducts: generateTopProducts()
    };
  };

  const generateTopProducts = () => {
    const products = [
      { name: "Футболка мужская", sales: Math.floor(Math.random() * 100) + 50, revenue: Math.floor(Math.random() * 25000) + 5000 },
      { name: "Джинсы женские", sales: Math.floor(Math.random() * 100) + 50, revenue: Math.floor(Math.random() * 25000) + 5000 },
      { name: "Куртка зимняя", sales: Math.floor(Math.random() * 100) + 50, revenue: Math.floor(Math.random() * 25000) + 5000 },
      { name: "Кроссовки спортивные", sales: Math.floor(Math.random() * 100) + 50, revenue: Math.floor(Math.random() * 25000) + 5000 },
      { name: "Платье вечернее", sales: Math.floor(Math.random() * 100) + 50, revenue: Math.floor(Math.random() * 25000) + 5000 }
    ];
    
    return products.sort((a, b) => b.revenue - a.revenue);
  };
  
  // Генерация данных о продажах
  const generateSalesTableData = () => {
    const salesItems = [];
    
    for (let i = 0; i < 20; i++) {
      salesItems.push({
        saleID: `S${100000 + i}`,
        supplierArticle: `ART-${1000 + i}`,
        subject: "Одежда",
        category: i % 3 === 0 ? "Мужская" : "Женская",
        brand: ["Nike", "Adidas", "Puma", "Reebok", "H&M"][i % 5],
        techSize: ["S", "M", "L", "XL"][i % 4],
        barcode: `${9000000000000 + i}`,
        totalPrice: Math.floor(Math.random() * 5000) + 1000,
        priceWithDisc: Math.floor(Math.random() * 4000) + 800,
        salePercent: Math.floor(Math.random() * 30) + 10,
        warehouseName: ["Коледино", "Электросталь", "Пушкино"][i % 3],
        regionName: ["Москва", "Санкт-Петербург", "Казань", "Владивосток"][i % 4],
        saleDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        quantity: Math.floor(Math.random() * 5) + 1,
        isReturn: i % 10 === 0
      });
    }
    
    return salesItems;
  };

  const metrics = calculateMetrics();
  const chartData = salesData;
  const tableData = generateSalesTableData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <CardTitle className="text-xl">Продажи</CardTitle>
        <PeriodSelector period={period} onPeriodChange={(newPeriod) => setPeriod(newPeriod as Period)} />
      </div>

      <SalesMetrics 
        totalRevenue={metrics.totalRevenue}
        totalOrders={metrics.totalOrders}
        averageOrderValue={metrics.averageOrderValue}
        returnsRate={metrics.returnsRate}
        topSellingProducts={metrics.topSellingProducts}
        loading={loading}
      />

      <Card>
        <CardHeader>
          <CardTitle>Динамика продаж</CardTitle>
          <CardDescription>Динамика продаж и заказов в выбранном периоде</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart 
            chartData={chartData}
            isLoading={loading}
            dataKey="revenue"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детальные продажи</CardTitle>
          <CardDescription>Список продаж за выбранный период</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesTable 
            tableData={tableData}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;
