
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesChart from "./SalesChart";
import SalesTable from "./SalesTable";
import SalesMetrics from "./SalesMetrics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, subDays } from "date-fns";
import PeriodSelector from "./PeriodSelector";

// Mock data for sales
const mockSalesData = [
  { date: '2023-01-01', revenue: 5000, orders: 50, avgOrderValue: 100 },
  { date: '2023-01-02', revenue: 6200, orders: 62, avgOrderValue: 100 },
  { date: '2023-01-03', revenue: 5800, orders: 58, avgOrderValue: 100 },
  { date: '2023-01-04', revenue: 7000, orders: 70, avgOrderValue: 100 },
  { date: '2023-01-05', revenue: 7500, orders: 75, avgOrderValue: 100 },
  { date: '2023-01-06', revenue: 8000, orders: 80, avgOrderValue: 100 },
  { date: '2023-01-07', revenue: 9000, orders: 90, avgOrderValue: 100 },
  { date: '2023-01-08', revenue: 8500, orders: 85, avgOrderValue: 100 },
  { date: '2023-01-09', revenue: 8200, orders: 82, avgOrderValue: 100 },
  { date: '2023-01-10', revenue: 8800, orders: 88, avgOrderValue: 100 },
  { date: '2023-01-11', revenue: 9200, orders: 92, avgOrderValue: 100 },
  { date: '2023-01-12', revenue: 9500, orders: 95, avgOrderValue: 100 },
  { date: '2023-01-13', revenue: 9800, orders: 98, avgOrderValue: 100 },
  { date: '2023-01-14', revenue: 10000, orders: 100, avgOrderValue: 100 },
];

// Mock sales entries
const mockSalesEntries = Array(20).fill(0).map((_, index) => ({
  saleID: `sale-${index}`,
  supplierArticle: `SA-${1000 + index}`,
  subject: ['Футболка', 'Джинсы', 'Платье', 'Куртка', 'Свитер'][Math.floor(Math.random() * 5)],
  category: ['Одежда', 'Обувь', 'Аксессуары'][Math.floor(Math.random() * 3)],
  brand: ['Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance'][Math.floor(Math.random() * 5)],
  techSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
  barcode: `${9000000000000 + index}`,
  totalPrice: Math.floor(Math.random() * 5000) + 1000,
  priceWithDisc: Math.floor(Math.random() * 4000) + 800,
  salePercent: Math.floor(Math.random() * 50),
  reportDate: format(subDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd'),
  quantity: 1,
  isSupply: false,
  isRealization: true,
  orderId: `order-${2000 + index}`,
  promoCodeDiscount: Math.floor(Math.random() * 500),
  warehouseName: ['Коледино', 'Подольск', 'Электросталь'][Math.floor(Math.random() * 3)],
  countryName: 'Россия',
  oblastName: ['Московская', 'Ленинградская', 'Новосибирская'][Math.floor(Math.random() * 3)],
  incomeID: `income-${3000 + index}`,
  odid: `odid-${4000 + index}`,
  spp: Math.floor(Math.random() * 10),
  forPay: Math.floor(Math.random() * 3000) + 500,
  finishedPrice: Math.floor(Math.random() * 3500) + 700,
  priceWithDiscPercent: Math.floor(Math.random() * 40),
  isCancel: false,
  sticker: `sticker-${5000 + index}`,
  srid: `srid-${6000 + index}`,
  gNumber: `g-${7000 + index}`,
  isReturn: Math.random() > 0.9,
}));

// Mock sales metrics
const mockSalesMetrics = {
  totalRevenue: 150000,
  totalOrders: 1500,
  averageOrderValue: 100,
  returnsRate: 5.2,
  topSellingProducts: [
    { name: 'Футболка Nike', sales: 120, revenue: 12000 },
    { name: 'Джинсы Levi\'s', sales: 95, revenue: 9500 },
    { name: 'Куртка Columbia', sales: 80, revenue: 16000 },
  ],
};

// Mock periods
const mockPeriods = [
  { label: 'За сегодня', value: 'today' },
  { label: 'За неделю', value: 'week' },
  { label: 'За месяц', value: 'month' },
  { label: 'За 3 месяца', value: 'quarter' },
  { label: 'За год', value: 'year' },
  { label: 'Все время', value: 'all' },
];

interface SalesAnalyticsProps {
  isLimited?: boolean;
}

const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ isLimited = false }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [salesData, setSalesData] = useState(mockSalesData);
  const [salesEntries, setSalesEntries] = useState(mockSalesEntries);
  const [salesMetrics, setSalesMetrics] = useState(mockSalesMetrics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real application, we would fetch the data based on the selected period
    // For now, we'll just simulate a loading state
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [selectedPeriod]);

  // Mock function to handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Анализ продаж</h2>
          <p className="text-muted-foreground">
            Подробная статистика по продажам и возвратам
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <PeriodSelector 
            value={selectedPeriod} 
            onChange={handlePeriodChange} 
            periods={mockPeriods}
          />
          <Select value={selectedMetric} onValueChange={handleMetricChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите метрику" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Выручка</SelectItem>
              <SelectItem value="orders">Заказы</SelectItem>
              <SelectItem value="avgOrderValue">Ср. чек</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SalesMetrics metrics={salesMetrics} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedMetric === 'revenue' 
              ? 'Динамика выручки' 
              : selectedMetric === 'orders' 
                ? 'Динамика заказов' 
                : 'Динамика среднего чека'}
          </CardTitle>
          <CardDescription>
            {selectedMetric === 'revenue' 
              ? 'График выручки за выбранный период' 
              : selectedMetric === 'orders' 
                ? 'График количества заказов за выбранный период' 
                : 'График среднего чека за выбранный период'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesChart 
            data={salesData} 
            loading={loading}
            dataKey={selectedMetric}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детализация продаж</CardTitle>
          <CardDescription>
            Список продаж с детальной информацией за выбранный период
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalesTable 
            data={salesEntries} 
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesAnalytics;
