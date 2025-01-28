import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Bell,
  Search,
  Share,
  User,
  ArrowUp,
  ArrowDown,
  DollarSign,
  ShoppingCart,
  RefreshCcw,
  Percent,
} from "lucide-react";

const salesData = [
  { name: "Jan", value: 300000 },
  { name: "Feb", value: 320000 },
  { name: "Mar", value: 310000 },
  { name: "Apr", value: 325000 },
  { name: "May", value: 330000 },
  { name: "Jun", value: 348261 },
];

const returnsData = [
  { name: "Jan", returns: 120 },
  { name: "Feb", returns: 150 },
  { name: "Mar", returns: 140 },
  { name: "Apr", returns: 130 },
  { name: "May", returns: 145 },
  { name: "Jun", returns: 150 },
];

const profitData = [
  { name: "Jan", profit: 50000 },
  { name: "Feb", profit: 55000 },
  { name: "Mar", profit: 53000 },
  { name: "Apr", profit: 54000 },
  { name: "May", profit: 56000 },
  { name: "Jun", profit: 58000 },
];

const salesTableData = [
  {
    name: "Product 1",
    sku: "SKU12345",
    quantity: 100,
    sales: 10000,
    avgPrice: 100,
    profit: 2000,
    profitMargin: "20%",
    orders: 120,
    returns: 10,
    returnRate: "8.33%",
  },
  {
    name: "Product 2",
    sku: "SKU67890",
    quantity: 50,
    sales: 5000,
    avgPrice: 100,
    profit: 1000,
    profitMargin: "20%",
    orders: 60,
    returns: 5,
    returnRate: "8.33%",
  },
];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur p-4 flex items-center justify-between border-b">
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              className="pl-8 bg-secondary"
            />
          </div>
          <Button variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Поделиться
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Общий анализ продаж</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex justify-between items-start mb-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div className="flex items-center text-green-500">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>8.35%</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Общий объем продаж
              </h3>
              <p className="text-2xl font-bold">$348,261</p>
              <p className="text-sm text-muted-foreground">
                По сравнению с прошлым месяцем
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <div className="flex items-center text-green-500">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span>5.25%</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Количество заказов
              </h3>
              <p className="text-2xl font-bold">1,200</p>
              <p className="text-sm text-muted-foreground">
                По сравнению с прошлым месяцем
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-red-500">
              <div className="flex justify-between items-start mb-2">
                <RefreshCcw className="h-5 w-5 text-red-500" />
                <div className="flex items-center text-red-500">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  <span>2.75%</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Количество возвратов
              </h3>
              <p className="text-2xl font-bold">150</p>
              <p className="text-sm text-muted-foreground">
                По сравнению с прошлым месяцем
              </p>
            </Card>

            <Card className="p-4 border-l-4 border-l-purple-500">
              <div className="flex justify-between items-start mb-2">
                <Percent className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Процент возврата
              </h3>
              <p className="text-2xl font-bold">12.5%</p>
              <p className="text-sm text-muted-foreground">
                По сравнению с прошлым месяцем
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">График динамики продаж</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8B5CF6"
                      fill="#8B5CF680"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                Анализ продаж по товарам
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Название товара</th>
                      <th className="text-left p-2">Артикул</th>
                      <th className="text-right p-2">Количество</th>
                      <th className="text-right p-2">Сумма продаж</th>
                      <th className="text-right p-2">Средняя цена</th>
                      <th className="text-right p-2">Прибыль</th>
                      <th className="text-right p-2">Рентабельность</th>
                      <th className="text-right p-2">Заказы</th>
                      <th className="text-right p-2">Возвраты</th>
                      <th className="text-right p-2">% возврата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesTableData.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.sku}</td>
                        <td className="text-right p-2">{item.quantity}</td>
                        <td className="text-right p-2">${item.sales}</td>
                        <td className="text-right p-2">${item.avgPrice}</td>
                        <td className="text-right p-2">${item.profit}</td>
                        <td className="text-right p-2">{item.profitMargin}</td>
                        <td className="text-right p-2">{item.orders}</td>
                        <td className="text-right p-2">{item.returns}</td>
                        <td className="text-right p-2">{item.returnRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                График динамики возвратов
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={returnsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="returns"
                      stroke="#EC4899"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">
                График динамики прибыли
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#10B981"
                      fill="#10B98180"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;