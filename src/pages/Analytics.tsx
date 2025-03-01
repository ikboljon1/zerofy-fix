
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Percent,
  PackageX,
  Truck,
  WarehouseIcon,
  AlertCircle,
  PieChart as PieChartIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { fetchWildberriesStats } from "@/services/wildberriesApi";

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#6366F1'];

const Analytics = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [dateFrom, setDateFrom] = useState<Date>(() => subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);

  // Демонстрационные данные для детализации штрафов и удержаний
  const penaltiesData = [
    { name: "Брак товара", value: 5000 },
    { name: "Недопоставка", value: 3500 },
    { name: "Нарушение упаковки", value: 2800 },
    { name: "Нарушение маркировки", value: 1200 },
    { name: "Другие причины", value: 2500 }
  ];

  const returnsData = [
    { name: "Не подошел размер", value: 12000 },
    { name: "Не соответствует описанию", value: 8500 },
    { name: "Брак", value: 6300 },
    { name: "Передумал", value: 4200 },
    { name: "Другие причины", value: 3000 }
  ];

  // Данные по удержаниям по дням
  const deductionsTimelineData = [
    { date: "01.05.2024", logistic: 1200, storage: 800, penalties: 500 },
    { date: "02.05.2024", logistic: 1100, storage: 900, penalties: 300 },
    { date: "03.05.2024", logistic: 1500, storage: 750, penalties: 800 },
    { date: "04.05.2024", logistic: 1300, storage: 850, penalties: 200 },
    { date: "05.05.2024", logistic: 1400, storage: 950, penalties: 600 },
    { date: "06.05.2024", logistic: 1250, storage: 700, penalties: 400 },
    { date: "07.05.2024", logistic: 1600, storage: 800, penalties: 350 }
  ];

  const getSelectedStore = () => {
    const stores = JSON.parse(localStorage.getItem('marketplace_stores') || '[]');
    return stores.find((store: any) => store.isSelected) || null;
  };

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const selectedStore = getSelectedStore();
      
      if (!selectedStore) {
        toast({
          title: "Внимание",
          description: "Выберите основной магазин в разделе 'Магазины'",
          variant: "destructive"
        });
        return;
      }

      const data = await fetchWildberriesStats(selectedStore.apiKey, dateFrom, dateTo);
      setStatsData(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderDatePicker = (date: Date, onChange: (date: Date) => void, label: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && onChange(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );

  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return '0%';
    const change = ((current - previous) / previous) * 100;
    return `${Math.abs(change).toFixed(1)}%`;
  };

  // Временные демонстрационные данные
  const demoData = {
    currentPeriod: {
      sales: 1250000,
      expenses: {
        total: 125000,
        logistics: 45000,
        storage: 35000,
        penalties: 15000
      },
      netProfit: 875000,
      acceptance: 30000
    },
    dailySales: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      sales: Math.floor(Math.random() * 50000) + 20000
    })),
    productSales: [
      { subject_name: "Футболки", quantity: 150 },
      { subject_name: "Джинсы", quantity: 120 },
      { subject_name: "Куртки", quantity: 80 },
      { subject_name: "Обувь", quantity: 200 },
      { subject_name: "Аксессуары", quantity: 95 }
    ],
    topProfitableProducts: [
      { name: "Платье летнее", price: "1,200 ₽", profit: "+25,000 ₽", image: "https://storage.googleapis.com/a1aa/image/Fo-j_LX7WQeRkTq3s3S37f5pM6wusM-7URWYq2Rq85w.jpg" },
      { name: "Кроссовки спортивные", price: "3,500 ₽", profit: "+18,000 ₽", image: "https://storage.googleapis.com/a1aa/image/Fo-j_LX7WQeRkTq3s3S37f5pM6wusM-7URWYq2Rq85w.jpg" },
      { name: "Джинсы классические", price: "2,800 ₽", profit: "+15,500 ₽", image: "https://storage.googleapis.com/a1aa/image/Fo-j_LX7WQeRkTq3s3S37f5pM6wusM-7URWYq2Rq85w.jpg" }
    ],
    topUnprofitableProducts: [
      { name: "Шарф зимний", price: "800 ₽", profit: "-5,200 ₽", image: "https://storage.googleapis.com/a1aa/image/OVMl1GnzKz6bgDAEJKScyzvR2diNKk-j6FoazEY-XRI.jpg" },
      { name: "Рубашка офисная", price: "1,500 ₽", profit: "-3,800 ₽", image: "https://storage.googleapis.com/a1aa/image/OVMl1GnzKz6bgDAEJKScyzvR2diNKk-j6FoazEY-XRI.jpg" },
      { name: "Перчатки кожаные", price: "1,200 ₽", profit: "-2,900 ₽", image: "https://storage.googleapis.com/a1aa/image/OVMl1GnzKz6bgDAEJKScyzvR2diNKk-j6FoazEY-XRI.jpg" }
    ]
  };

  // Используем демонстрационные данные, если API данные не загружены
  const data = statsData || demoData;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {renderDatePicker(dateFrom, setDateFrom, "Выберите начальную дату")}
        {renderDatePicker(dateTo, setDateTo, "Выберите конечную дату")}
        <Button onClick={fetchStats} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            "Обновить"
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Ключевые показатели */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-200 dark:border-purple-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Общая сумма продаж</p>
                <h3 className="text-2xl font-bold">{data.currentPeriod.sales.toLocaleString()} ₽</h3>
                <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>+12.5% с прошлого периода</span>
                </div>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/60 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Количество заказов</p>
                <h3 className="text-2xl font-bold">{(data.currentPeriod.sales / 2500).toFixed(0)}</h3>
                <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>+8.2% с прошлого периода</span>
                </div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/60 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-200 dark:border-red-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Общие удержания</p>
                <h3 className="text-2xl font-bold">{data.currentPeriod.expenses.total.toLocaleString()} ₽</h3>
                <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span>+3.7% с прошлого периода</span>
                </div>
              </div>
              <div className="bg-red-100 dark:bg-red-900/60 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-200 dark:border-green-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Чистая прибыль</p>
                <h3 className="text-2xl font-bold">{data.currentPeriod.netProfit.toLocaleString()} ₽</h3>
                <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>+15.3% с прошлого периода</span>
                </div>
              </div>
              <div className="bg-green-100 dark:bg-green-900/60 p-3 rounded-full">
                <Percent className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Графики доходов и расходов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Динамика продаж</h3>
              <div className="bg-purple-100 dark:bg-purple-900/60 p-2 rounded-md">
                <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailySales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}.${date.getMonth() + 1}`;
                    }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toLocaleString()} ₽`, 'Продажи']}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return format(date, 'dd.MM.yyyy');
                    }}
                    contentStyle={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="Продажи"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Структура удержаний по дням</h3>
              <div className="bg-red-100 dark:bg-red-900/60 p-2 rounded-md">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deductionsTimelineData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value} />
                  <Tooltip
                    formatter={(value: any) => [`${value.toLocaleString()} ₽`, '']}
                    contentStyle={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="logistic" name="Логистика" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="storage" name="Хранение" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="penalties" name="Штрафы" fill="#EC4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Детальная разбивка удержаний и штрафов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Детализация по штрафам</h3>
              <div className="bg-purple-100 dark:bg-purple-900/60 p-2 rounded-md">
                <AlertCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={penaltiesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {penaltiesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value.toLocaleString()} ₽`, '']}
                      contentStyle={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {penaltiesData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value.toLocaleString()} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Причины возвратов</h3>
              <div className="bg-red-100 dark:bg-red-900/60 p-2 rounded-md">
                <PackageX className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={returnsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {returnsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value.toLocaleString()} ₽`, '']}
                      contentStyle={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {returnsData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value.toLocaleString()} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Детальный анализ расходов */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-6">Структура расходов</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-medium">Логистика</h4>
                <div className="bg-purple-100 dark:bg-purple-900/60 p-2 rounded-md">
                  <Truck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{data.currentPeriod.expenses.logistics.toLocaleString()} ₽</p>
              <span className="text-xs text-muted-foreground mt-1">
                {((data.currentPeriod.expenses.logistics / data.currentPeriod.expenses.total) * 100).toFixed(1)}% от общих расходов
              </span>
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Доставка до клиента</span>
                    <span className="font-medium">{(data.currentPeriod.expenses.logistics * 0.65).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Доставка на склад</span>
                    <span className="font-medium">{(data.currentPeriod.expenses.logistics * 0.35).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₽</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-medium">Хранение</h4>
                <div className="bg-blue-100 dark:bg-blue-900/60 p-2 rounded-md">
                  <WarehouseIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{data.currentPeriod.expenses.storage.toLocaleString()} ₽</p>
              <span className="text-xs text-muted-foreground mt-1">
                {((data.currentPeriod.expenses.storage / data.currentPeriod.expenses.total) * 100).toFixed(1)}% от общих расходов
              </span>
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Хранение на складах</span>
                    <span className="font-medium">{(data.currentPeriod.expenses.storage * 0.8).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Обработка товаров</span>
                    <span className="font-medium">{(data.currentPeriod.expenses.storage * 0.2).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₽</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-base font-medium">Штрафы</h4>
                <div className="bg-red-100 dark:bg-red-900/60 p-2 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{data.currentPeriod.expenses.penalties.toLocaleString()} ₽</p>
              <span className="text-xs text-muted-foreground mt-1">
                {((data.currentPeriod.expenses.penalties / data.currentPeriod.expenses.total) * 100).toFixed(1)}% от общих расходов
              </span>
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800/50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Брак и повреждения</span>
                    <span className="font-medium">{(data.currentPeriod.expenses.penalties * 0.45).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Нарушение правил</span>
                    <span className="font-medium">{(data.currentPeriod.expenses.penalties * 0.55).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Самые прибыльные и убыточные товары */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Самые прибыльные товары</h3>
            <div className="space-y-4">
              {data.topProfitableProducts?.map((product: any, index: number) => (
                <div key={index} className="flex items-center p-3 rounded-lg border dark:border-muted">
                  <div className="w-12 h-12 rounded overflow-hidden mr-4 bg-gray-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.price}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{product.profit}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Самые убыточные товары</h3>
            <div className="space-y-4">
              {data.topUnprofitableProducts?.map((product: any, index: number) => (
                <div key={index} className="flex items-center p-3 rounded-lg border dark:border-muted">
                  <div className="w-12 h-12 rounded overflow-hidden mr-4 bg-gray-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.price}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{product.profit}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
