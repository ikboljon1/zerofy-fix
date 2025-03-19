
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  Users, Layers, TrendingUp, Clock, AlertCircle, 
  Activity, User, UserCheck, UserMinus, UserPlus 
} from "lucide-react";
import { initialTariffs } from "@/data/tariffs";

// Типы данных
interface UserRegistration {
  date: string;
  count: number;
}

interface TariffDistribution {
  name: string;
  value: number;
  color: string;
}

interface UserActivity {
  date: string;
  active: number;
  inactive: number;
}

interface ConversionData {
  month: string;
  trial: number;
  converted: number;
  rate: number;
}

const UserStatistics = () => {
  const [registrationData, setRegistrationData] = useState<UserRegistration[]>([]);
  const [tariffDistribution, setTariffDistribution] = useState<TariffDistribution[]>([]);
  const [activityData, setActivityData] = useState<UserActivity[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Получение данных о регистрации пользователей
        const registrationsResponse = await fetch('/api/admin/user-registrations');
        
        if (!registrationsResponse.ok) {
          throw new Error('Не удалось загрузить данные о регистрациях');
        }
        
        const registrationsData = await registrationsResponse.json();
        setRegistrationData(registrationsData);
        
        // Получение данных о распределении пользователей по тарифам
        const tariffResponse = await fetch('/api/admin/tariff-distribution');
        
        if (!tariffResponse.ok) {
          throw new Error('Не удалось загрузить данные о распределении тарифов');
        }
        
        const tariffData = await tariffResponse.json();
        setTariffDistribution(tariffData);
        
        // Получение данных об активности пользователей
        const activityResponse = await fetch('/api/admin/user-activity');
        
        if (!activityResponse.ok) {
          throw new Error('Не удалось загрузить данные об активности пользователей');
        }
        
        const activityData = await activityResponse.json();
        setActivityData(activityData);
        
        // Получение данных о конверсии с пробного периода
        const conversionResponse = await fetch('/api/admin/trial-conversion');
        
        if (!conversionResponse.ok) {
          throw new Error('Не удалось загрузить данные о конверсии');
        }
        
        const conversionData = await conversionResponse.json();
        setConversionData(conversionData);
        
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError('Не удалось загрузить данные. Используем демо-данные.');
        
        // Используем демо-данные в случае ошибки
        generateDemoData();
        
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные статистики. Показаны демо-данные.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Функция для генерации демо-данных
  const generateDemoData = () => {
    // Данные о регистрациях за последние 30 дней
    const registrations = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 29 + i);
      return {
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1, // 1-10 регистраций в день
      };
    });
    
    setRegistrationData(registrations);
    
    // Распределение пользователей по тарифам
    const tariffColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];
    
    const tariffs = initialTariffs.map((tariff, index) => ({
      name: tariff.name,
      value: Math.floor(Math.random() * 100) + 20, // 20-120 пользователей на тарифе
      color: tariffColors[index % tariffColors.length]
    }));
    
    // Добавим пробный период
    tariffs.push({
      name: 'Пробный период',
      value: Math.floor(Math.random() * 50) + 10, // 10-60 пользователей на пробном периоде
      color: '#ff7300'
    });
    
    setTariffDistribution(tariffs);
    
    // Данные об активности пользователей за последние 30 дней
    const activity = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 29 + i);
      const active = Math.floor(Math.random() * 50) + 100; // 100-150 активных пользователей
      const inactive = Math.floor(Math.random() * 30) + 10; // 10-40 неактивных пользователей
      
      return {
        date: date.toISOString().split('T')[0],
        active,
        inactive
      };
    });
    
    setActivityData(activity);
    
    // Данные о конверсии за 6 месяцев
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'];
    const conversion = months.map(month => {
      const trial = Math.floor(Math.random() * 100) + 50; // 50-150 пользователей на пробном периоде
      const converted = Math.floor(Math.random() * trial * 0.8); // 0-80% конверсия
      const rate = Math.round((converted / trial) * 100);
      
      return {
        month,
        trial,
        converted,
        rate
      };
    });
    
    setConversionData(conversion);
  };

  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего пользователей</p>
                <h3 className="text-2xl font-bold">
                  {tariffDistribution.reduce((sum, item) => sum + item.value, 0)}
                </h3>
              </div>
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Новых за 30 дней</p>
                <h3 className="text-2xl font-bold">
                  {registrationData.reduce((sum, item) => sum + item.count, 0)}
                </h3>
              </div>
              <div className="rounded-full bg-green-100 p-2 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Активных сейчас</p>
                <h3 className="text-2xl font-bold">
                  {activityData.length > 0 ? activityData[activityData.length - 1].active : 0}
                </h3>
              </div>
              <div className="rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Конверсия с пробного</p>
                <h3 className="text-2xl font-bold">
                  {conversionData.length > 0 
                    ? `${Math.round(conversionData.reduce((sum, item) => sum + item.rate, 0) / conversionData.length)}%` 
                    : '0%'}
                </h3>
              </div>
              <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="registrations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registrations">Регистрации</TabsTrigger>
          <TabsTrigger value="distribution">Распределение</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="conversion">Конверсия</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Регистрации пользователей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={registrationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      interval={Math.ceil(registrationData.length / 10) - 1}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value} пользователей`, 'Регистрации']}
                      labelFormatter={(label) => `Дата: ${formatDate(label)}`}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Регистрации" 
                      fill="#8884d8" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                График показывает количество новых регистраций пользователей за последние 30 дней.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Распределение пользователей по тарифам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tariffDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {tariffDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name) => [`${value} пользователей`, name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                График показывает распределение пользователей по различным тарифным планам.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Активность пользователей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={activityData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      interval={Math.ceil(activityData.length / 10) - 1}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name) => [
                        `${value} пользователей`, 
                        name === 'active' ? 'Активные' : 'Неактивные'
                      ]}
                      labelFormatter={(label) => `Дата: ${formatDate(label)}`}
                    />
                    <Legend 
                      formatter={(value) => value === 'active' ? 'Активные' : 'Неактивные'}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="active" 
                      name="active" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="inactive" 
                      name="inactive" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                График показывает количество активных и неактивных пользователей за последние 30 дней.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Конверсия с пробного периода
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conversionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value: number, name, { payload }) => {
                        if (name === 'rate') {
                          return [`${payload.rate}%`, 'Процент конверсии'];
                        }
                        return [`${value} пользователей`, name === 'trial' ? 'На пробном' : 'Конвертировались'];
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="trial" 
                      name="На пробном" 
                      fill="#8884d8" 
                      yAxisId="left"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="converted" 
                      name="Конвертировались" 
                      fill="#82ca9d" 
                      yAxisId="left"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      name="Процент конверсии" 
                      stroke="#ff7300" 
                      strokeWidth={2}
                      yAxisId="right"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                График показывает конверсию пользователей с пробного периода на платные тарифы за последние 6 месяцев.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserStatistics;
