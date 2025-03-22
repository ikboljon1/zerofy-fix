import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PasswordChangeForm from "./PasswordChangeForm";
import { useNavigate } from "react-router-dom";
import {
  TARIFF_STORE_LIMITS,
  getTrialDaysRemaining,
  getSubscriptionStatus,
  User,
  PaymentHistoryItem,
  activateSubscription,
  SubscriptionData,
  addPaymentRecord,
  getPaymentHistory
} from "@/services/userService";
import { Loader2, CheckCircle, AlertCircle, CreditCard, UserCircle, Lock, Building, Phone, Mail, FileText, ShieldCheck, Shield, LogOut, Check, Terminal, ShieldAlert } from "lucide-react";

const Profile = () => {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: "",
    email: "",
    phone: "",
    company: ""
  });
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<string>("basic");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoadingPaymentHistory, setIsLoadingPaymentHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("account");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setUserData(user);
        setEditedData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          company: user.company || ""
        });

        if (user.id) {
          loadSubscriptionData(user.id);
          loadPaymentHistory(user.id);
        }
      } catch (error) {
        console.error('Ошибка при парсинге данных пользователя:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const loadSubscriptionData = async (userId: string) => {
    try {
      const data = await getSubscriptionStatus(userId);
      setSubscriptionData(data);
    } catch (error) {
      console.error('Ошибка при загрузке данных подписки:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить информацию о подписке",
        variant: "destructive",
      });
    }
  };

  const loadPaymentHistory = async (userId: string) => {
    setIsLoadingPaymentHistory(true);
    try {
      const history = await getPaymentHistory(userId);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Ошибка при загрузке истории платежей:', error);
    } finally {
      setIsLoadingPaymentHistory(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (userData) {
        setEditedData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          company: userData.company || ""
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!userData) return;

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = {
        ...userData,
        name: editedData.name,
        email: editedData.email,
        phone: editedData.phone,
        company: editedData.company
      };

      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else if (sessionStorage.getItem('user')) {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setUserData(updatedUser);
      setIsEditing(false);

      toast({
        title: "Успешно",
        description: "Профиль успешно обновлен",
      });
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    navigate('/');
    
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из системы",
    });
  };

  const handleTariffSelection = (tariffId: string) => {
    setSelectedTariff(tariffId);
    setShowPaymentDialog(true);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
  };

  const handleProcessPayment = async () => {
    if (!userData || !selectedTariff) return;

    setIsProcessingPayment(true);
    try {
      let amount = 0;
      switch (selectedTariff) {
        case "basic":
          amount = 990;
          break;
        case "pro":
          amount = 1990;
          break;
        case "unlimited":
          amount = 5990;
          break;
        default:
          amount = 0;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = await activateSubscription(userData.id, selectedTariff);
      if (success) {
        await addPaymentRecord(userData.id, amount, selectedTariff, paymentMethod);

        const updatedUser = {
          ...userData,
          isSubscriptionActive: true,
          tariffId: selectedTariff,
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        if (localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else if (sessionStorage.getItem('user')) {
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }

        setUserData(updatedUser);
        loadSubscriptionData(userData.id);
        loadPaymentHistory(userData.id);

        toast({
          title: "Платеж обработан",
          description: "Подписка успешно активирована",
        });

        setShowPaymentDialog(false);
      } else {
        throw new Error("Ошибка активации подписки");
      }
    } catch (error) {
      console.error('Ошибка при обработке платежа:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обработать платеж",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка доступа</AlertTitle>
          <AlertDescription>
            Не удалось загрузить данные пользователя. Пожалуйста, войдите в систему.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
        </div>
      </div>
    );
  }

  const renderSubscriptionStatus = () => {
    if (userData.isSubscriptionActive) {
      return (
        <Badge variant="default" className="ml-2 bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Активна
        </Badge>
      );
    } else if (userData.isInTrial) {
      const daysRemaining = userData.trialEndsAt ? Math.max(0, Math.ceil((new Date(userData.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
      if (daysRemaining <= 0) {
        return (
          <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Пробный период истек
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Пробный период ({daysRemaining} дн.)
          </Badge>
        );
      }
    } else {
      return (
        <Badge variant="destructive" className="ml-2">
          <AlertCircle className="h-3 w-3 mr-1" />
          Неактивна
        </Badge>
      );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Не указано";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return "Неверный формат даты";
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Профиль пользователя</h1>
        <Button
          variant="ghost"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">Аккаунт</TabsTrigger>
          <TabsTrigger value="subscription">Подписка</TabsTrigger>
          <TabsTrigger value="security">Безопасность</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-blue-500" />
                  <span>Основная информация</span>
                </CardTitle>
                <CardDescription>
                  Управляйте своей личной информацией
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={userData.avatar} alt={userData.name || "Пользователь"} />
                      <AvatarFallback>{(userData.name || "U").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground mt-2">
                      ID: {userData.id.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex-grow">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-xl font-semibold">{userData.name || "Пользователь"}</h3>
                      <p className="text-muted-foreground">{userData.email}</p>
                      <div className="flex items-center mt-1">
                        <Badge variant={userData.role === 'admin' ? "default" : "outline"}>
                          {userData.role === 'admin' ? (
                            <>
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Администратор
                            </>
                          ) : (
                            <>
                              <UserCircle className="h-3 w-3 mr-1" />
                              Пользователь
                            </>
                          )}
                        </Badge>
                        {renderSubscriptionStatus()}
                      </div>
                    </div>
                    
                    <div className="text-sm space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Email: {userData.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Телефон: {userData.phone || "Не указан"}</span>
                      </div>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Компания: {userData.company || "Не указана"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">ФИО</Label>
                        <Input
                          id="name"
                          name="name"
                          value={editedData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={editedData.email}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Телефон</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={editedData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Компания</Label>
                        <Input
                          id="company"
                          name="company"
                          value={editedData.company}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Нажмите кнопку редактирования, чтобы изменить свои данные.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
                      Отмена
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Сохранить
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={handleEditToggle} className="ml-auto">
                    Ре��актировать
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span>Статистика</span>
                </CardTitle>
                <CardDescription>
                  Информация о вашей активности в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Дата регистрации:</span>
                    <span className="font-medium">{userData.registeredAt ? formatDate(userData.registeredAt) : "Не указано"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Последний вход:</span>
                    <span className="font-medium">{userData.lastLogin ? formatDate(userData.lastLogin) : "Не указано"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Статус:</span>
                    <Badge variant={userData.status === "active" ? "outline" : "destructive"} className={userData.status === "active" ? "border-green-500 text-green-600" : ""}>
                      {userData.status === "active" ? "Активен" : "Неактивен"}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Подключено магазинов:</span>
                    <div className="flex items-center">
                      <span className="font-medium">{userData.storeCount || 0}</span>
                      {userData.tariffId && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (лимит: {TARIFF_STORE_LIMITS[userData.tariffId as keyof typeof TARIFF_STORE_LIMITS] || "∞"})
                        </span>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Тип подписки:</span>
                    <Badge className="bg-blue-500">
                      {userData.tariffId 
                        ? userData.tariffId.charAt(0).toUpperCase() + userData.tariffId.slice(1) 
                        : "Бесплатная"}
                    </Badge>
                  </div>
                  {userData.isInTrial && userData.trialEndsAt && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Пробный период до:</span>
                        <span className="font-medium">{formatDate(userData.trialEndsAt)}</span>
                      </div>
                    </>
                  )}
                  {userData.isSubscriptionActive && userData.subscriptionEndDate && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Подписка активна до:</span>
                        <span className="font-medium">{formatDate(userData.subscriptionEndDate)}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  <span>Управление подпиской</span>
                </CardTitle>
                <CardDescription>
                  Просмотр и изменение тарифного плана
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Текущий тарифный план</h3>
                  <div className="flex items-center mb-4">
                    <Badge className="bg-blue-500 mr-2">
                      {userData.tariffId 
                        ? userData.tariffId.charAt(0).toUpperCase() + userData.tariffId.slice(1) 
                        : "Бесплатный"}
                    </Badge>
                    {renderSubscriptionStatus()}
                  </div>

                  {userData.isInTrial && userData.trialEndsAt && (
                    <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-700">Пробный период активен</AlertTitle>
                      <AlertDescription className="text-yellow-600">
                        Ваш пробный период истекает {formatDate(userData.trialEndsAt)}. Выберите тариф для продолжения использования всех функций.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!userData.isSubscriptionActive && !userData.isInTrial && (
                    <Alert className="mb-4 bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-700">Подписка неактивна</AlertTitle>
                      <AlertDescription className="text-red-600">
                        Для доступа ко всем возможностям системы приобретите подписку.
                      </AlertDescription>
                    </Alert>
                  )}

                  {userData.isSubscriptionActive && userData.subscriptionEndDate && (
                    <div className="mb-4">
                      <p className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Подписка активна до {formatDate(userData.subscriptionEndDate)}
                      </p>
                    </div>
                  )}

                  <Separator className="my-6" />

                  <h3 className="text-lg font-semibold mb-4">Доступные тарифы</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="relative">
                      <CardHeader className="bg-slate-50 rounded-t-lg">
                        <CardTitle className="text-center">Базовый</CardTitle>
                        <CardDescription className="text-center">
                          Оптимально для старта
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <span className="text-3xl font-bold">990 ₽</span>
                          <span className="text-muted-foreground">/месяц</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">До 3-х подключенных магазинов</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Базовая аналитика</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Email поддержка</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          variant={userData.tariffId === "basic" ? "outline" : "default"}
                          disabled={userData.tariffId === "basic" && userData.isSubscriptionActive}
                          onClick={() => handleTariffSelection("basic")}
                        >
                          {userData.tariffId === "basic" && userData.isSubscriptionActive 
                            ? "Текущий тариф" 
                            : "Выбрать тариф"}
                        </Button>
                      </CardFooter>
                      {userData.tariffId === "basic" && userData.isSubscriptionActive && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Активен
                          </Badge>
                        </div>
                      )}
                    </Card>

                    <Card className="relative border-blue-200 shadow-md">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-500">Популярный</Badge>
                      </div>
                      <CardHeader className="bg-blue-50 rounded-t-lg">
                        <CardTitle className="text-center">Про</CardTitle>
                        <CardDescription className="text-center">
                          Для растущего бизнеса
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <span className="text-3xl font-bold">1990 ₽</span>
                          <span className="text-muted-foreground">/месяц</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">До 10 подключенных магазинов</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Расширенная аналитика</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Приоритетная поддержка</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">AI-рекомендации</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          variant={userData.tariffId === "pro" ? "outline" : "default"}
                          disabled={userData.tariffId === "pro" && userData.isSubscriptionActive}
                          onClick={() => handleTariffSelection("pro")}
                        >
                          {userData.tariffId === "pro" && userData.isSubscriptionActive 
                            ? "Текущий тариф" 
                            : "Выбрать тариф"}
                        </Button>
                      </CardFooter>
                      {userData.tariffId === "pro" && userData.isSubscriptionActive && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Активен
                          </Badge>
                        </div>
                      )}
                    </Card>

                    <Card className="relative">
                      <CardHeader className="bg-slate-50 rounded-t-lg">
                        <CardTitle className="text-center">Безлимит</CardTitle>
                        <CardDescription className="text-center">
                          Для крупного бизнеса
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <span className="text-3xl font-bold">5990 ₽</span>
                          <span className="text-muted-foreground">/месяц</span>
                        </div>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Неограниченное число магазинов</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Полная аналитика</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Персональный менеджер</span>
                          </li>
                          <li className="flex items-start">
                            <Check className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Выделенная поддержка 24/7</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          variant={userData.tariffId === "unlimited" ? "outline" : "default"}
                          disabled={userData.tariffId === "unlimited" && userData.isSubscriptionActive}
                          onClick={() => handleTariffSelection("unlimited")}
                        >
                          {userData.tariffId === "unlimited" && userData.isSubscriptionActive 
                            ? "Текущий тариф" 
                            : "Выбрать тариф"}
                        </Button>
                      </CardFooter>
                      {userData.tariffId === "unlimited" && userData.isSubscriptionActive && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Активен
                          </Badge>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-semibold mb-4">История платежей</h3>
                  {isLoadingPaymentHistory ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentHistory.length > 0 ? (
                    <div className="rounded-md border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Дата
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Сумма
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Тариф
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Статус
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paymentHistory.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.paymentDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {payment.amount} ₽
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {payment.subscriptionType.charAt(0).toUpperCase() + payment.subscriptionType.slice(1)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={payment.status === "completed" ? "outline" : "destructive"} className={payment.status === "completed" ? "border-green-500 text-green-600" : ""}>
                                  {payment.status === "completed" ? "Выполнен" : "Отменен"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      История платежей пуста
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Оплата подписки</DialogTitle>
                <DialogDescription>
                  Выберите способ оплаты для активации тарифа
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Выбранный тариф</h4>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div>
                      <span className="font-medium">
                        {selectedTariff === "basic" 
                          ? "Базовый" 
                          : selectedTariff === "pro" 
                          ? "Про" 
                          : "Безлимит"}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({
                          selectedTariff === "basic" 
                            ? "990 ₽" 
                            : selectedTariff === "pro" 
                            ? "1990 ₽" 
                            : "5990 ₽"
                        }/месяц)
                      </span>
                    </div>
                    <Badge>1 месяц</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Способ оплаты</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer 
                        ${paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => handlePaymentMethodChange("card")}
                    >
                      <CreditCard className={`h-5 w-5 mb-2 ${paymentMethod === "card" ? "text-blue-500" : "text-gray-400"}`} />
                      <span className="text-sm">Карта</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer 
                        ${paymentMethod === "qr" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => handlePaymentMethodChange("qr")}
                    >
                      <Terminal className={`h-5 w-5 mb-2 ${paymentMethod === "qr" ? "text-blue-500" : "text-gray-400"}`} />
                      <span className="text-sm">СБП</span>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-3 rounded-md border cursor-pointer 
                        ${paymentMethod === "invoice" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                      onClick={() => handlePaymentMethodChange("invoice")}
                    >
                      <FileText className={`h-5 w-5 mb-2 ${paymentMethod === "invoice" ? "text-blue-500" : "text-gray-400"}`} />
                      <span className="text-sm">Счет</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="agreement"
                    checked={isAgreementAccepted}
                    onCheckedChange={setIsAgreementAccepted}
                  />
                  <Label htmlFor="agreement" className="text-xs">
                    Я согласен с <a href="/terms-of-service" target="_blank" className="text-blue-500 hover:underline">ус��овиями предоставления услуг</a> и <a href="/privacy-policy" target="_blank" className="text-blue-500 hover:underline">политикой конфиденциальности</a>
                  </Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={isProcessingPayment}>
                  Отмена
                </Button>
                <Button 
                  onClick={handleProcessPayment} 
                  disabled={!isAgreementAccepted || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    "Оплатить"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-500" />
                  <span>Смена пароля</span>
                </CardTitle>
                <CardDescription>
                  Обновите свой пароль для повышения безопасности
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm userId={userData.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-500" />
                  <span>Безопасность аккаунта</span>
                </CardTitle>
                <CardDescription>
                  Настройки безопасности и защиты вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium">Двухфакторная аутентификация</h4>
                      <p className="text-muted-foreground text-xs">
                        Дополнительный уровень защиты для вашего аккаунта
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium">Уведомления о входе</h4>
                      <p className="text-muted-foreground text-xs">
                        Получайте уведомления о входе в ваш аккаунт
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium">Журнал активности</h4>
                      <p className="text-muted-foreground text-xs">
                        История входов и действий в системе
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Просмотр
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  <Shield className="h-4 w-4 mr-2" />
                  Проверить безопасность
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
