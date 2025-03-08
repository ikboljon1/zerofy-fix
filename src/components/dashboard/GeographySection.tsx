
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Package, Info, ShoppingBag, MapPin, Tag, Loader2 } from "lucide-react";
import { WildberriesSale } from "@/types/store";
import { Period } from "./PeriodSelector";
import { getAdvertCosts } from "@/services/advertisingApi";

interface ProductSalesDistribution {
  name: string;
  count: number;
  percentage: number;
}

interface PieChartData {
  name: string;
  value: number;
  percentage?: string;
  color?: string;
}

interface GeographySectionProps {
  warehouseDistribution: any[];
  regionDistribution: any[];
  sales?: WildberriesSale[];
  period?: Period;
  apiKey?: string;
}

const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#FF8042", "#A86EE7"];

const GeographySection: React.FC<GeographySectionProps> = ({
  warehouseDistribution,
  regionDistribution,
  sales = [],
  period = "week",
  apiKey
}) => {
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [advertisingData, setAdvertisingData] = useState<PieChartData[]>([]);

  // Process sales data to get product quantity distribution
  const getProductSalesDistribution = (): ProductSalesDistribution[] => {
    if (!sales || sales.length === 0) return [];

    const productCounts: Record<string, number> = {};
    let totalProducts = 0;

    sales.forEach(sale => {
      const productName = sale.subject || "Неизвестный товар";
      productCounts[productName] = (productCounts[productName] || 0) + 1;
      totalProducts += 1;
    });

    return Object.entries(productCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalProducts) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  useEffect(() => {
    const fetchAdvertisingData = async () => {
      if (!apiKey) return;
      
      setIsLoadingAds(true);
      
      try {
        // Calculate date range based on period
        const dateTo = new Date();
        let dateFrom = new Date();
        
        switch (period) {
          case "today":
            // Same day
            break;
          case "yesterday":
            dateFrom = new Date(dateTo);
            dateFrom.setDate(dateFrom.getDate() - 1);
            dateTo.setDate(dateTo.getDate() - 1);
            break;
          case "week":
            dateFrom.setDate(dateFrom.getDate() - 7);
            break;
          case "2weeks":
            dateFrom.setDate(dateFrom.getDate() - 14);
            break;
          case "4weeks":
            dateFrom.setDate(dateFrom.getDate() - 28);
            break;
        }
        
        const costs = await getAdvertCosts(dateFrom, dateTo, apiKey);
        
        if (costs && costs.length > 0) {
          // Group by campaign name
          const campaignCosts: Record<string, number> = {};
          
          costs.forEach(cost => {
            if (!campaignCosts[cost.campName]) {
              campaignCosts[cost.campName] = 0;
            }
            campaignCosts[cost.campName] += cost.updSum;
          });
          
          // Convert to array and sort
          let adsData = Object.entries(campaignCosts)
            .map(([name, value], index) => ({
              name,
              value,
              color: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);
          
          // Take top 5 campaigns
          let topCampaigns = adsData.slice(0, 4);
          const otherCampaigns = adsData.slice(4);
          
          // Group remaining campaigns as "Other campaigns"
          if (otherCampaigns.length > 0) {
            const otherSum = otherCampaigns.reduce((sum, item) => sum + item.value, 0);
            topCampaigns.push({
              name: "Другие кампании",
              value: otherSum,
              color: COLORS[4]
            });
          }
          
          // Calculate percentages
          const totalValue = topCampaigns.reduce((sum, item) => sum + item.value, 0);
          topCampaigns = topCampaigns.map(item => ({
            ...item,
            percentage: ((item.value / totalValue) * 100).toFixed(1)
          }));
          
          setAdvertisingData(topCampaigns);
        }
      } catch (error) {
        console.error("Error fetching advertising data:", error);
      } finally {
        setIsLoadingAds(false);
      }
    };
    
    fetchAdvertisingData();
  }, [apiKey, period]);

  const productSalesDistribution = getProductSalesDistribution();

  const renderPieChart = (data: ProductSalesDistribution[] | PieChartData[], dataKey: string) => {
    if (!data || data.length === 0) return null;

    const chartData = data.map((item: any, index) => ({
      name: item.name,
      value: item.value || item.count,
      percentage: item.percentage ? 
        (typeof item.percentage === 'string' ? item.percentage : item.percentage.toFixed(1)) 
        : "0",
      fill: item.color || COLORS[index % COLORS.length]
    }));

    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percentage }) => `${name}: ${percentage}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [`${value} ${dataKey === "count" ? "шт." : "₽"}`, name]}
            contentStyle={{ borderRadius: "8px" }}
          />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderDistributionList = (items: ProductSalesDistribution[] | PieChartData[], valueKey: "count" | "value" = "count") => {
    if (!items || items.length === 0) {
      return <p className="text-muted-foreground text-center py-4">Нет данных</p>;
    }

    return (
      <div className="space-y-4">
        {items.map((item: any, index) => {
          const value = valueKey === "count" ? item.count : item.value;
          const percentage = typeof item.percentage === 'string' 
            ? item.percentage 
            : item.percentage.toFixed(1);
          
          return (
            <div key={index} className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {value} {valueKey === "count" ? "шт." : "₽"}
                </div>
              </div>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Количество проданных товаров
            </CardTitle>
            <CardDescription>
              Топ 5 самых продаваемых товаров по количеству
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {renderPieChart(productSalesDistribution, "count")}
            <div className="mt-4 px-4">
              {renderDistributionList(productSalesDistribution)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Распределение по складам
            </CardTitle>
            <CardDescription>
              Топ 5 складов по количеству отправленных товаров
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {renderPieChart(warehouseDistribution, "count")}
            <div className="mt-4 px-4">
              {renderDistributionList(warehouseDistribution)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {apiKey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="mr-2 h-5 w-5" />
              Расходы на рекламу
            </CardTitle>
            <CardDescription>
              Распределение расходов на рекламу по кампаниям
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            {isLoadingAds ? (
              <div className="flex justify-center items-center h-[280px]">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {renderPieChart(advertisingData, "value")}
                <div className="mt-4 px-4">
                  {renderDistributionList(advertisingData, "value")}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
      
      <Card className="bg-muted/50 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Info className="mr-2 h-4 w-4 text-blue-500" />
            Как рассчитываются данные
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Данные собираются из ваших продаж Wildberries с помощью API:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Для проданных товаров мы группируем продажи по названию товара из ответа API</li>
            <li>Для складов мы используем данные о физическом местоположении складов Wildberries</li>
            <li>Мы подсчитываем количество каждого товара/склада и расчитываем проценты</li>
            <li>Диаграммы отображают 5 лучших товаров и 5 наиболее активных складов</li>
            <li>Данные о рекламе получаются напрямую из API рекламы за выбранный период</li>
          </ul>
          <p className="pt-2">
            Эти данные предоставляют ценную информацию о том, какие товары наиболее популярны у ваших клиентов
            и из каких складов чаще всего отправляются ваши товары, что помогает оптимизировать логистику.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeographySection;
