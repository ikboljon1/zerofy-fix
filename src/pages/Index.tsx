import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/components/dashboard/Dashboard";
import OrdersAnalytics from "@/components/dashboard/OrdersAnalytics";
import SalesAnalytics from "@/components/dashboard/SalesAnalytics";
import GeographySection from "@/components/dashboard/GeographySection";
import WarehouseEfficiencyChart from "@/components/dashboard/WarehouseEfficiencyChart";
import TipsSection from "@/components/dashboard/TipsSection";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SubscriptionExpiredAlert from "@/components/subscription/SubscriptionExpiredAlert";
import { hasFeatureAccess, getTrialDaysRemaining } from "@/services/userService";
import { PlusCircle } from "lucide-react";

const Index = () => {
  const [userData, setUserData] = useState<any>(null);
  const [isLimited, setIsLimited] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Загрузка данных пользователя
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setUserData(user);

        // Проверка доступа к функциям
        const canAccessAdvancedMetrics = hasFeatureAccess('advancedMetrics', user);
        setIsLimited(!canAccessAdvancedMetrics);
      } catch (error) {
        console.error('Ошибка при парсинге данных пользователя:', error);
      }
    } else {
      // Если пользователь не авторизован, перенаправляем на главную
      navigate('/');
    }
  }, [navigate]);

  // Если данные пользователя еще не загружены, показываем загрузку
  if (!userData) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10 flex justify-center items-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  // Функция для обработки создания нового магазина
  const handleCreateStore = () => {
    if (hasFeatureAccess('createStore', userData)) {
      navigate('/stores');
    } else {
      // Если у пользователя нет доступа к созданию магазина, показываем сообщение
      console.log('Недостаточно прав для создания магазина');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Дашборд</h1>
            <p className="text-muted-foreground">
              Аналитика и основные показатели вашего бизнеса
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 md:mt-0">
            <Button 
              variant="default" 
              onClick={handleCreateStore}
              className="bg-blue-600 hover:bg-blue-700 gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Подключить магазин</span>
            </Button>
          </div>
        </div>
        
        {/* Уведомление об истечении подписки, если применимо */}
        {userData && userData.isSubscriptionActive === false && !userData.isInTrial && (
          <SubscriptionExpiredAlert 
            user={userData} 
            onUserUpdated={(updatedUser) => setUserData(updatedUser)} 
          />
        )}

        {/* Основной контент дашборда */}
        <div className="space-y-8">
          <Dashboard />
          
          <Tabs defaultValue="orders" className="mt-8">
            <TabsList>
              <TabsTrigger value="orders">Заказы</TabsTrigger>
              <TabsTrigger value="sales">Продажи</TabsTrigger>
              <TabsTrigger value="geography">География</TabsTrigger>
              <TabsTrigger value="warehouse">Склады</TabsTrigger>
            </TabsList>
            <TabsContent value="orders">
              <OrdersAnalytics />
            </TabsContent>
            <TabsContent value="sales">
              <SalesAnalytics />
            </TabsContent>
            <TabsContent value="geography">
              <GeographySection />
            </TabsContent>
            <TabsContent value="warehouse">
              <Card>
                <CardHeader>
                  <CardTitle>Эффективность складов</CardTitle>
                  <CardDescription>
                    Анализ эффективности работы различных складов
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WarehouseEfficiencyChart />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <TipsSection />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
