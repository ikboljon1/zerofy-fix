import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PasswordChangeForm from "@/components/PasswordChangeForm";
import {
  CreditCard,
  History,
  User,
  DollarSign,
  Mail,
  Phone,
  Building,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Clock,
  Lock,
  LogOut,
  CreditCardIcon,
  CalendarClock,
  Star,
  ShieldCheck,
  Award,
  ArrowRight,
  ShieldAlert,
  UserCog,
  Check,
  CalendarIcon,
  ShoppingBag,
  KeyRound,
  BadgePercent
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  TARIFF_STORE_LIMITS, 
  getTrialDaysRemaining, 
  getSubscriptionStatus, 
  User as UserType,
  PaymentHistoryItem,
  activateSubscription,
  addPaymentRecord,
  getPaymentHistory
} from "@/services/userService";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SavedCard {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  lastFour: string;
}

interface ProfileProps {
  user: UserType | null;
  onUserUpdated?: (user: UserType) => void;
}

const Profile = ({ user: propUser, onUserUpdated }: ProfileProps) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    plan: string;
    endDate: string;
    daysRemaining: number;
    isActive: boolean;
  } | null>(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (propUser) {
      setUserProfile(propUser);
      
      const mockSubscriptionData = {
        plan: propUser.tariffId === "3" ? "Премиум" : 
              propUser.tariffId === "2" ? "Бизнес" : 
              propUser.tariffId === "4" ? "Корпоративный" : "Стартовый",
        endDate: propUser.subscriptionEndDate || "2024-12-31T23:59:59Z",
        daysRemaining: 30,
        isActive: propUser.isSubscriptionActive || propUser.isInTrial || false
      };
      
      setCurrentSubscription(mockSubscriptionData);
      setIsSubscriptionExpired(!mockSubscriptionData.isActive);
      
      setIsLoadingHistory(true);
      getPaymentHistory(propUser.id).then((history) => {
        setPaymentHistory(history);
        setIsLoadingHistory(false);
      });
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserProfile(user);
        
        const mockSubscriptionData = {
          plan: user.tariffId === "3" ? "Премиум" : 
                user.tariffId === "2" ? "Бизнес" : 
                user.tariffId === "4" ? "Корпоративный" : "Стартовый",
          endDate: user.subscriptionEndDate || "2024-12-31T23:59:59Z",
          daysRemaining: 30,
          isActive: user.isSubscriptionActive || user.isInTrial || false
        };
        
        setCurrentSubscription(mockSubscriptionData);
        setIsSubscriptionExpired(!mockSubscriptionData.isActive);
        
        setIsLoadingHistory(true);
        getPaymentHistory(user.id).then((history) => {
          setPaymentHistory(history);
          setIsLoadingHistory(false);
        });
      }
    }
    
    const storedCard = localStorage.getItem('savedCard');
    if (storedCard) {
      setSavedCard(JSON.parse(storedCard));
    }
  }, [propUser]);

  const userData = userProfile || {
    name: "Иван Иванов",
    email: "ivan@example.com",
    phone: "+7 (999) 123-45-67",
    company: "ООО Компания",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan"
  };

  const subscriptionPlans = [
    {
      id: "1",
      name: "Стартовый",
      price: "2000 ₽/мес",
      priceValue: 2000,
      color: "bg-blue-600",
      features: ["1 магазин", "Базовая аналитика", "Email поддержка"],
      icon: ShoppingBag
    },
    {
      id: "2",
      name: "Бизнес",
      price: "5000 ₽/мес",
      priceValue: 5000,
      color: "bg-purple-600",
      features: [
        "До 3 магазинов",
        "Расширенная аналитика",
        "Приоритетная поддержка",
        "API доступ",
      ],
      icon: Star
    },
    {
      id: "3",
      name: "Премиум",
      price: "10000 ₽/мес",
      priceValue: 10000,
      color: "bg-amber-500",
      features: [
        "До 10 магазинов",
        "Полная аналитика",
        "24/7 поддержка",
        "API доступ",
        "Персональный менеджер",
      ],
      icon: Award
    },
    {
      id: "4",
      name: "Корпоративный",
      price: "30000 ₽/мес",
      priceValue: 30000,
      color: "bg-emerald-600",
      features: [
        "Неограниченное количество магазинов",
        "Корпоративные отчеты",
        "Выделенная линия поддержки",
        "Полный API доступ",
        "Команда персональных менеджеров",
        "Интеграция с корпоративными системами"
      ],
      icon: ShieldCheck
    }
  ];

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    toast({
      title: "Подписка выбрана",
      description: `Вы выбрали тариф ${planName}`,
    });
  };

  const handleProceedToPayment = () => {
    if (!selectedPlan) {
      toast({
        title: "Выберите тариф",
        description: "Пожалуйста, выберите тариф для продолжения",
        variant: "destructive",
      });
      return;
    }
    setActiveTab("payment");
  };

  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    return digits;
  };

  const getLastFourDigits = (cardNum: string): string => {
    const digits = cardNum.replace(/\D/g, '');
    return digits.slice(-4);
  };

  const handleAddCard = async () => {
    if (isAddingCard) {
      if (!cardNumber || !expiryDate || !cvv) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, заполните все поля карты",
          variant: "destructive",
        });
        return;
      }

      const cardDigits = cardNumber.replace(/\s/g, '');
      if (cardDigits.length !== 16 || !/^\d+$/.test(cardDigits)) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите корректный номер карты (16 цифр)",
          variant: "destructive",
        });
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, введите дату в формате ММ/ГГ",
          variant: "destructive",
        });
        return;
      }

      if (cvv.length !== 3 || !/^\d+$/.test(cvv)) {
        toast({
          title: "Ошибка",
          description: "CVV должен состоять из 3 цифр",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newCard: SavedCard = {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          lastFour: getLastFourDigits(cardNumber)
        };
        
        localStorage.setItem('savedCard', JSON.stringify(newCard));
        setSavedCard(newCard);
        
        toast({
          title: "Карта добавлена",
          description: "Ваша карта успешно добавлена",
        });
        
        setIsAddingCard(false);
        setCardNumber("");
        setExpiryDate("");
        setCvv("");
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось добавить карту",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    } else {
      setIsAddingCard(true);
    }
  };

  const handleDeleteCard = () => {
    localStorage.removeItem('savedCard');
    setSavedCard(null);
    toast({
      title: "Карта удалена",
      description: "Ваша карта успешно удалена",
    });
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Выберите тариф",
        description: "Пожалуйста, выберите тариф для продолжения",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!userProfile) {
        throw new Error("Пользователь не найден");
      }
      
      const selectedPlanObject = subscriptionPlans.find(plan => plan.name === selectedPlan);
      
      if (!selectedPlanObject) {
        throw new Error("Тариф не найден");
      }
      
      const result = await activateSubscription(
        userProfile.id, 
        selectedPlanObject.id, 
        selectedMonths
      );
      
      if (result.success && result.user) {
        await addPaymentRecord(
          userProfile.id,
          selectedPlanObject.id,
          calculateTotalPrice(selectedPlanObject.id),
          selectedMonths
        );
        
        setUserProfile(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        if (onUserUpdated && result.user) {
          onUserUpdated(result.user);
        }
        
        if (result.user.subscriptionEndDate) {
          const endDate = new Date(result.user.subscriptionEndDate);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setCurrentSubscription({
            plan: selectedPlan,
            endDate: result.user.subscriptionEndDate,
            daysRemaining: Math.max(0, daysRemaining),
            isActive: true
          });
        }
        
        setIsSubscriptionExpired(false);
        
        const history = await getPaymentHistory(userProfile.id);
        setPaymentHistory(history);
      }
      
      toast({
        title: "Успешно",
        description: `Подписка ${selectedPlan} успешно оформлена на ${selectedMonths} ${
          selectedMonths === 1 ? 'месяц' : selectedMonths <= 4 ? 'месяца' : 'месяцев'
        }`,
      });
      
      setActiveTab("subscription");
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить платеж",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotalPrice = (planId: string): number => {
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) return 0;
    
    let price = plan.priceValue * selectedMonths;
    
    if (discountPercentage > 0) {
      price = price * (1 - discountPercentage / 100);
    }
    
    return Math.round(price);
  };

  const handleMonthsChange = (months: number) => {
    setSelectedMonths(months);
    
    if (months === 3) {
      setDiscountPercentage(10); // 10% discount for 3 months
    } else if (months === 6) {
      setDiscountPercentage(15); // 15% discount for 6 months
    } else if (months === 12) {
      setDiscountPercentage(25); // 25% discount for 12 months
    } else {
      setDiscountPercentage(0); // No discount for 1 month
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Н/Д';
    }
  };

  const getSubscriptionProgress = (): number => {
    if (!currentSubscription) return 0;
    if (!currentSubscription.isActive) return 100;
    
    const daysInMonth = 30;
    const daysElapsed = daysInMonth - currentSubscription.daysRemaining;
    return Math.min(100, Math.max(0, (daysElapsed / daysInMonth) * 100));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({
      title: "Вы вышли из системы",
      description: "Перенаправление на страницу входа...",
    });
    
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const SubscriptionExpiredAlert = () => {
    if (!isSubscriptionExpired) return null;
    
    return (
      <Alert variant="destructive" className="mb-6">
        <Lock className="h-5 w-5" />
        <AlertDescription>
          <div className="font-bold text-lg">Ваша подписка истекла!</div>
          <p>Доступ к функциям системы ограничен. Пожалуйста, продлите подписку для восстановления полного доступа.</p>
          <Button 
            className="mt-2 w-full sm:w-auto" 
            onClick={() => setActiveTab("subscription")}
          >
            Продлить подписку
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  const getStoreLimit = () => {
    if (!userProfile || !userProfile.tariffId) return 1;
    return userProfile.tariffId in TARIFF_STORE_LIMITS ? TARIFF_STORE_LIMITS[userProfile.tariffId] : 1;
  };

  const TariffCard = ({ plan, onClick, isSelected }: { 
    plan: typeof subscriptionPlans[0], 
    onClick: () => void, 
    isSelected: boolean 
  }) => {
    const Icon = plan.icon;
    return (
      <Card 
        className={`cursor-pointer transition-all hover:border-primary ${
          isSelected ? 'border-2 border-primary shadow-md' : ''
        }`}
        onClick={onClick}
      >
        <div className={`h-2 ${plan.color}`}></div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Icon className={`h-5 w-5 ${plan.color.replace('bg-', 'text-')}`} />
              {plan.name}
            </CardTitle>
            {isSelected && (
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                <Check className="h-3 w-3 mr-1" />
                Выбрано
              </Badge>
            )}
          </div>
          <CardDescription>{plan.price}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            variant={isSelected ? "default" : "outline"} 
            className="w-full flex items-center justify-center gap-2"
            onClick={onClick}
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4" />
                Выбрано
              </>
            ) : (
              <>
                Выбрать план
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Личный кабинет</h1>
          <p className="text-muted-foreground">Управление вашим профилем и подпиской</p>
        </div>
        
        <Button 
          variant="destructive" 
          className="flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Выйти из системы
        </Button>
      </div>
      
      {userProfile?.isInTrial && (
        <Alert className="mb-6 bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300">
          <Star className="h-5 w-5" />
          <AlertDescription className="flex flex-col">
            <div className="font-bold text-lg">Пробный период</div>
            <p>У вас активирован пробный период с тарифом "Премиум". Вы можете использовать все функции системы.</p>
            <div className="flex items-center gap-2 mt-2">
              <span>Осталось дней:</span>
              <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30">
                {userProfile?.trialEndDate ? Math.max(0, Math.ceil((new Date(userProfile.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {isSubscriptionExpired && !userProfile?.isInTrial && (
        <Alert variant="destructive" className="mb-6">
          <Lock className="h-5 w-5" />
          <AlertDescription>
            <div className="font-bold text-lg">Ваша подписка истекла!</div>
            <p>Доступ к функциям системы ограничен. Пожалуйста, продлите подписку для восстановления полного доступа.</p>
            <Button 
              className="mt-2 w-full sm:w-auto" 
              onClick={() => setActiveTab("subscription")}
            >
              Продлить подписку
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile?.avatar} alt={userProfile?.name} />
                <AvatarFallback>{userProfile?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{userProfile?.name}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1 mt-1">
              <Mail className="h-3.5 w-3.5" />
              {userProfile?.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Тариф:</span>
                <Badge className={`${
                  userProfile?.tariffId === "3" ? "bg-amber-500/90" : 
                  userProfile?.tariffId === "2" ? "bg-purple-600/90" : 
                  userProfile?.tariffId === "4" ? "bg-emerald-600/90" :
                  "bg-blue-600/90"
                }`}>
                  {currentSubscription?.plan || "Стартовый"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Магазины:</span>
                <Badge variant="outline" className="flex items-center gap-1.5 bg-blue-950/30 text-blue-400 border-blue-800">
                  <ShoppingBag className="h-3 w-3" />
                  <span>{userProfile?.storeCount || 0}/{getStoreLimit()}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Статус:</span>
                {userProfile?.isInTrial ? (
                  <Badge className="bg-amber-500">Пробный</Badge>
                ) : isSubscriptionExpired ? (
                  <Badge variant="destructive">Истекла</Badge>
                ) : (
                  <Badge className="bg-green-600">Активна</Badge>
                )}
              </div>
              <Separator className="my-2" />
              <Button 
                onClick={() => setActiveTab("profile")}
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
              >
                <UserCog className="h-4 w-4" />
                Редактировать профиль
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Информация о подписке</CardTitle>
          </CardHeader>
          <CardContent>
            {currentSubscription && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg">Тарифный план:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{currentSubscription.plan}</span>
                    {userProfile?.isInTrial ? (
                      <Badge className="bg-amber-500">Пробный</Badge>
                    ) : currentSubscription.isActive ? (
                      <Badge className="bg-green-600">Активна</Badge>
                    ) : (
                      <Badge variant="destructive">Истекла</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Прогресс подписки</span>
                    <span>{Math.round(getSubscriptionProgress())}%</span>
                  </div>
                  <Progress 
                    value={getSubscriptionProgress()} 
                    className={!currentSubscription.isActive && !userProfile?.isInTrial ? "h-2 bg-red-950" : "h-2"} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="bg-card rounded-lg p-4 border flex flex-col items-center justify-center space-y-1 text-center">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">Дата окончания</span>
                    <span className="font-medium">
                      {userProfile?.isInTrial 
                        ? (userProfile.trialEndDate ? formatDate(userProfile.trialEndDate) : 'N/A')
                        : formatDate(currentSubscription.endDate)
                      }
                    </span>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border flex flex-col items-center justify-center space-y-1 text-center">
                    <Clock className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">Осталось дней</span>
                    <Badge variant="outline" className="font-medium mt-1">
                      {userProfile?.isInTrial 
                        ? (userProfile.trialEndDate ? Math.max(0, Math.ceil((new Date(userProfile.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0)
                        : currentSubscription.daysRemaining
                      }
                    </Badge>
                  </div>
                  
                  <div className="bg-card rounded-lg p-4 border flex flex-col items-center justify-center space-y-1 text-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">Лимит магазинов</span>
                    <Badge variant="outline" className="font-medium mt-1">
                      {getStoreLimit()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 mt-4">
                  <Button 
                    className="flex items-center gap-2"
                    onClick={() => setActiveTab("subscription")}
                  >
                    <Star className="h-4 w-4" />
                    {currentSubscription.isActive || userProfile?.isInTrial ? "Изменить тариф" : "Активировать подписку"}
                  </Button>
                  <Button 
                    className="flex items-center gap-2"
                    variant="outline"
                    onClick={() => setActiveTab("payment")}
                  >
                    <CreditCardIcon className="h-4 w-4" />
                    Управление платежами
                  </Button>
                  <Button 
                    className="flex items-center gap-2"
                    variant="outline"
                    onClick={() => setActiveTab("history")}
                  >
                    <History className="h-4 w-4" />
                    История платежей
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 w-full">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className={isMobile ? 'text-sm' : ''}>Профиль</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span className={isMobile ? 'text-sm' : ''}>Пароль</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className={isMobile ? 'text-sm' : ''}>Подписка</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className={isMobile ? 'text-sm' : ''}>Оплата</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className={isMobile ? 'text-sm' : ''}>История</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Личные данные</CardTitle>
              <CardDescription>
                Обновите информацию о себе и вашей компании
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ФИО</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      defaultValue={userProfile?.name}
                      className="pl-10"
                    />
                    <User className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      defaultValue={userProfile?.email}
                      className="pl-10"
                    />
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      defaultValue={userProfile?.phone || ''}
                      className="pl-10"
                    />
                    <Phone className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Компания</Label>
                  <div className="relative">
                    <Input
                      id="company"
                      defaultValue={userProfile?.company || ''}
                      className="pl-10"
                    />
                    <Building className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <Button 
                  className="w-full md:w-auto" 
                  disabled={isSubscriptionExpired && !userProfile?.isInTrial}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Сохранить изменения
                  {isSubscriptionExpired && !userProfile?.isInTrial && (
                    <Lock className="ml-2 h-4 w-4" />
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto ml-2 hidden md:flex"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти из системы
