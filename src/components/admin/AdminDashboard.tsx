
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersRound, ShoppingCart, DollarSign, BarChart3, TrendingUp, Star, Bell, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  revenue: number;
  newUsersToday: number;
  conversionRate: number;
  avgOrderValue: number;
  userSatisfaction: number;
}

interface RegistrationData {
  date: string;
  count: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    revenue: 0,
    newUsersToday: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    userSatisfaction: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const [registrationData, setRegistrationData] = useState<number[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchStats();
    fetchRegistrationData(timeRange);
  }, [timeRange]);
  
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from an actual API
      // For now, we'll use mock data to ensure the UI renders properly
      setTimeout(() => {
        setStats({
          totalUsers: 1250,
          activeUsers: 780,
          totalOrders: 5320,
          revenue: 1250000,
          newUsersToday: 28,
          conversionRate: 3.5,
          avgOrderValue: 2350,
          userSatisfaction: 4.7
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить статистику панели управления",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const fetchRegistrationData = async (period: "day" | "week" | "month") => {
    try {
      // Mock data for different time periods
      const mockData = {
        day: [5, 8, 12, 10, 15, 6, 9, 11, 7, 14, 9, 6],
        week: [28, 35, 42, 30, 45, 38, 52],
        month: [120, 145, 160, 130, 170, 155, 140, 165, 180, 150, 172, 190, 160, 175, 165, 180, 195, 170, 185, 200, 175, 190, 165, 180, 170, 190, 210, 195, 180, 200]
      };
      
      setRegistrationData(mockData[period]);
    } catch (error) {
      console.error("Error fetching registration data:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные о регистрациях",
        variant: "destructive",
      });
    }
  };
  
  const primaryStatCards = [
    {
      title: "Всего пользователей",
      value: stats.totalUsers,
      icon: UsersRound,
      color: "bg-blue-500",
      trend: "+12.5%",
      description: "Общее количество зарегистрированных пользователей"
    },
    {
      title: "Активные пользователи",
      value: stats.activeUsers,
      icon: UsersRound,
      color: "bg-green-500",
      trend: "+5.2%",
      description: "Количество активных пользователей за последние 30 дней"
    },
    {
      title: "Общие заказы",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-purple-500",
      trend: "+8.9%",
      description: "Общее количество оформленных заказов"
    },
    {
      title: "Доход",
      value: `${stats.revenue.toLocaleString()} ₽`,
      icon: DollarSign,
      color: "bg-amber-500",
      trend: "+15.3%",
      description: "Общий доход платформы"
    }
  ];
  
  const secondaryStatCards = [
    {
      title: "Новые пользователи сегодня",
      value: stats.newUsersToday,
      icon: UserPlus,
      color: "bg-emerald-500",
      trend: "+3.2%"
    },
    {
      title: "Конверсия",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: "bg-pink-500",
      trend: "+2.1%"
    },
    {
      title: "Средний чек",
      value: `${stats.avgOrderValue} ₽`,
      icon: ShoppingCart,
      color: "bg-indigo-500",
      trend: "+4.7%"
    },
    {
      title: "Удовлетворенность",
      value: `${stats.userSatisfaction}/5`,
      icon: Star,
      color: "bg-orange-500",
      trend: "+0.3%"
    }
  ];
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {primaryStatCards.map((stat, index) => (
          <Card key={index} className="border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: stat.color.replace('bg-', '') }}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold">{isLoading ? "-" : stat.value}</h3>
                  <p className="text-xs text-green-500 mt-1">{stat.trend} за месяц</p>
                </div>
                <div className={`p-2 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {secondaryStatCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                  <h4 className="text-xl font-semibold mt-1">{isLoading ? "-" : stat.value}</h4>
                </div>
                <div className={`p-2 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-green-500">{stat.trend}</span>
                <span className="text-muted-foreground ml-1">за неделю</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Регистрации пользователей</CardTitle>
              <CardDescription>Количество новых пользователей</CardDescription>
            </div>
            <Tabs 
              value={timeRange} 
              onValueChange={(value) => setTimeRange(value as "day" | "week" | "month")}
              className="w-auto"
            >
              <TabsList className="grid w-[200px] grid-cols-3">
                <TabsTrigger value="day">День</TabsTrigger>
                <TabsTrigger value="week">Неделя</TabsTrigger>
                <TabsTrigger value="month">Месяц</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : registrationData.length > 0 ? (
              <div className="flex items-end justify-between h-full px-2">
                {registrationData.map((value, i) => {
                  const maxValue = Math.max(...registrationData, 1); // Avoid division by zero
                  const height = Math.floor((value / maxValue) * 80);
                  const isHighestValue = value === Math.max(...registrationData);
                  const isLowestValue = value === Math.min(...registrationData);
                  
                  let colorClass = "bg-blue-500 hover:bg-blue-600";
                  if (isHighestValue) colorClass = "bg-green-500 hover:bg-green-600";
                  if (isLowestValue) colorClass = "bg-gray-400 hover:bg-gray-500";
                  
                  return (
                    <div key={i} className="flex flex-col items-center group">
                      <div className="relative">
                        <div
                          className={`w-7 ${colorClass} rounded-t-sm transition-colors relative`}
                          style={{ height: `${height}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded transition-opacity">
                            {value} {timeRange === "day" ? "пользователя" : "пользователей"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] mt-1">
                        {timeRange === "day" ? `${i}h` : 
                         timeRange === "week" ? `${["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i]}` : 
                         `${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Нет данных для отображения</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
