
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateUser, User, getUserSubscriptionData, activateSubscription, SubscriptionData, getTrialDaysRemaining } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Clock, CreditCard, User as UserIcon, Wallet } from "lucide-react";
import { format } from 'date-fns';
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { TARIFF_STORE_LIMITS } from "@/services/userService";
import { initialTariffs } from "@/data/tariffs";
import { getPaymentHistory, saveTariffData, supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserDetailsProps {
  user: User;
  onBack: () => void;
  onUserUpdated: (user: User) => void;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  subscription_type: string;
  status: string;
  payment_method?: string;
}

const UserDetails = ({ user, onBack, onUserUpdated }: UserDetailsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [tariffId, setTariffId] = useState('1');
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<Date | undefined>(undefined);
  const [subscriptionMonths, setSubscriptionMonths] = useState(1);
  const [selectedTariff, setSelectedTariff] = useState<string | undefined>(undefined);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone || '');
        setCompany(user.company || '');
        setStatus(user.status || 'active');
        setRole(user.role || 'user');
        setTariffId(user.tariffId);
        setIsSubscriptionActive(user.isSubscriptionActive);
        setSubscriptionEndDate(user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : undefined);
        setSelectedTariff(user.tariffId);
        
        const subData = await getUserSubscriptionData(user.id);
        setSubscriptionData(subData);
        
        if (user.isInTrial) {
          const trialDays = getTrialDaysRemaining(user);
          setTrialDaysRemaining(trialDays);
        }
        
        // Загружаем историю платежей пользователя
        loadPaymentHistory();
      } catch (error) {
        console.error("Failed to load user data:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные пользователя",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user, toast]);
  
  const loadPaymentHistory = async () => {
    setIsLoadingPayments(true);
    try {
      const payments = await getPaymentHistory(user.id);
      setPaymentHistory(payments || []);
    } catch (error) {
      console.error("Error loading payment history:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить историю платежей",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };
  
  const handleActivateSubscription = async () => {
    setIsActivating(true);
    try {
      // Находим выбранный тариф
      const tariff = initialTariffs.find(t => t.id === selectedTariff);
      if (!tariff) {
        throw new Error("Тариф не найден");
      }
      
      // Рассчитываем стоимость с учетом скидки
      let priceWithDiscount = tariff.price * subscriptionMonths;
      
      if (subscriptionMonths === 3) {
        priceWithDiscount *= 0.95; // 5% скидка
      } else if (subscriptionMonths === 6) {
        priceWithDiscount *= 0.90; // 10% скидка
      } else if (subscriptionMonths === 12) {
        priceWithDiscount *= 0.85; // 15% скидка
      }
      
      const amount = Math.round(priceWithDiscount);
      
      console.log(`Admin processing payment of ${amount} for ${subscriptionMonths} months of ${tariff.name} plan`);
      
      // Сохраняем информацию о платеже в Supabase через Admin интерфейс
      const result = await saveTariffData(
        selectedTariff || user.tariffId, 
        user.id, 
        subscriptionMonths,
        amount
      );
      
      if (result && result.success && result.user) {
        // Обновляем локального пользователя
        const updatedUser = {
          ...user,
          tariffId: selectedTariff || user.tariffId,
          isSubscriptionActive: true,
          subscriptionEndDate: result.user.subscription_expiry
        };
        
        onUserUpdated(updatedUser);
        
        // Обновляем историю платежей
        loadPaymentHistory();
        
        toast({
          title: "Успешно",
          description: `Подписка активирована до ${formatDate(result.user.subscription_expiry || '')}`,
        });
      } else {
        throw new Error(result?.error || "Не удалось активировать подписку");
      }
    } catch (error) {
      console.error("Failed to activate subscription:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось активировать подписку",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser: Partial<User> = {
        name,
        email,
        phone,
        company,
        status,
        role,
        tariffId,
        isSubscriptionActive,
        subscriptionEndDate: subscriptionEndDate ? subscriptionEndDate.toISOString() : undefined,
      };

      const result = await updateUser(user.id, updatedUser);

      if (result) {
        onUserUpdated(result);
        
        toast({
          title: "Успешно",
          description: "Данные пользователя успешно обновлены",
        });
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить данные пользователя",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные пользователя",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return 'N/A';
    }
  };
  
  const getStoreLimit = () => {
    if (!tariffId) return 1;
    return tariffId in TARIFF_STORE_LIMITS ? TARIFF_STORE_LIMITS[tariffId] : 1;
  };

  const getTariffName = (id: string): string => {
    const tariff = initialTariffs.find(t => t.id === id);
    return tariff ? tariff.name : `Тариф ${id}`;
  };

  if (isLoading) {
    return <Card>
      <CardContent>Загрузка...</CardContent>
    </Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Редактирование пользователя</CardTitle>
            <CardDescription>Измените данные пользователя</CardDescription>
          </div>
          <Button variant="outline" onClick={onBack}>Назад</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile" className="flex items-center">
              <UserIcon className="mr-2 h-4 w-4" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              Подписка
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center">
              <Wallet className="mr-2 h-4 w-4" />
              История платежей
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">ФИО</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="company">Компания</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Статус</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Неактивен</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Роль</Label>
                <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'user')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="user">Пользователь</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-4">
            {user.isInTrial && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h3 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                  Пробный период
                </h3>
                <p>Активирован с тарифом "{getTariffName('3')}"</p>
                <p>Осталось дней: {trialDaysRemaining}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="tariff">Тариф</Label>
              <Select value={selectedTariff} onValueChange={setSelectedTariff}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  {initialTariffs.map(tariff => (
                    <SelectItem key={tariff.id} value={tariff.id}>{tariff.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-4 flex items-center space-x-2">
              <Checkbox
                id="isSubscriptionActive"
                checked={isSubscriptionActive}
                onCheckedChange={(checked) => setIsSubscriptionActive(!!checked)}
              />
              <Label htmlFor="isSubscriptionActive">Подписка активна</Label>
            </div>
            
            <div className="mt-4">
              <Label>Дата окончания подписки</Label>
              <DatePicker
                value={subscriptionEndDate}
                onValueChange={setSubscriptionEndDate}
              />
            </div>
            
            <div className="mt-4">
              <Label htmlFor="subscriptionMonths">Продлить на (месяцев)</Label>
              <Select 
                value={subscriptionMonths.toString()}
                onValueChange={(value) => setSubscriptionMonths(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 месяц</SelectItem>
                  <SelectItem value="3">3 месяца (скидка 5%)</SelectItem>
                  <SelectItem value="6">6 месяцев (скидка 10%)</SelectItem>
                  <SelectItem value="12">12 месяцев (скидка 15%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="mt-4 w-full" 
              onClick={handleActivateSubscription} 
              disabled={isActivating}
            >
              {isActivating ? 'Активация...' : 'Активировать подписку'}
            </Button>
            
            <div className="flex justify-end mt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тариф</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Метод оплаты</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPayments ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Загрузка платежей...</TableCell>
                    </TableRow>
                  ) : paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">Нет платежей</TableCell>
                    </TableRow>
                  ) : (
                    paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell>{getTariffName(payment.subscription_type)}</TableCell>
                        <TableCell>{payment.amount} ₽</TableCell>
                        <TableCell>{payment.payment_method || 'Карта'}</TableCell>
                        <TableCell>
                          {payment.status === 'completed' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Выполнен
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {payment.status}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={loadPaymentHistory} variant="outline">
                Обновить историю
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserDetails;
