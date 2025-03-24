import { useState, useEffect } from "react";
import { User, updateUser } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import { initialTariffs } from "@/data/tariffs";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserCog, 
  Mail, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  CreditCard,
  Package,
  Clock,
  AlertTriangle,
  Save,
  X,
  User as UserIcon
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface UserDetailsProps {
  user: User | null;
  onClose: () => void;
  onUserUpdated?: (user: User) => void;
}

const UserDetails = ({ user, onClose, onUserUpdated }: UserDetailsProps) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "user",
    tariffId: user?.tariffId || "",
    subscriptionType: user?.subscriptionType || "monthly",
    notes: user?.notes || "",
  });
  const [status, setStatus] = useState(user?.status || 'active');
  const [isSaving, setIsSaving] = useState(false);
  const [isInTrial, setIsInTrial] = useState(user?.isInTrial || false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(user?.isSubscriptionActive || false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        tariffId: user.tariffId || "",
        subscriptionType: user.subscriptionType || "monthly",
        notes: user.notes || "",
      });
      setStatus(user.status || 'active');
      setIsInTrial(user.isInTrial || false);
      setIsSubscriptionActive(user.isSubscriptionActive || false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as 'active' | 'inactive');
  };

  const handleTariffChange = (tariffId: string) => {
    setFormData(prev => ({ ...prev, tariffId }));
  };

  const handleSubscriptionTypeChange = (subscriptionType: string) => {
    setFormData(prev => ({ ...prev, subscriptionType }));
  };

  const handleTrialToggle = () => {
    setIsInTrial(!isInTrial);
  };

  const handleSubscriptionToggle = () => {
    setIsSubscriptionActive(!isSubscriptionActive);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "PPpp", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getTariffName = (tariffId?: string): string => {
    if (!tariffId) return "Не выбран";
    const tariff = initialTariffs.find(t => t.id === tariffId);
    return tariff ? tariff.name : `Тариф ${tariffId}`;
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // Create updated user object
      const updatedUser = {
        ...user,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: status,
        tariffId: formData.tariffId,
        subscriptionType: formData.subscriptionType,
        isInTrial,
        isSubscriptionActive,
        notes: formData.notes,
      };
      
      // Call the API to update user
      // In a real application, you would make an API call here
      
      // Mock successful update
      setTimeout(() => {
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }
        setIsSaving(false);
        onClose();
        
        toast({
          title: "Успешно обновлено",
          description: "Данные пользователя успешно обновлены",
        });
      }, 500);
    } catch (error) {
      setIsSaving(false);
      console.error("Error updating user:", error);
      
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные пользователя",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserCog className="h-6 w-6 text-blue-500" />
            <span>Детали пользователя</span>
          </DialogTitle>
          <DialogDescription>
            Просмотр и редактирование информации о пользователе
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="subscription">Подписка</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 py-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Профиль</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-lg bg-blue-900 text-blue-100">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      <Badge variant={user.role === 'admin' ? "info" : "secondary"}>
                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                      </Badge>
                      <Badge variant={user.status === 'active' ? "success" : "destructive"}>
                        {user.status === 'active' ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:w-2/3 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">ID пользователя</h4>
                        <p className="font-mono text-sm">{user.id}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Дата регистрации</h4>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(user.registeredAt)}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Последний вход</h4>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{user.lastLogin ? formatDate(user.lastLogin) : "Никогда"}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Статус</h4>
                        <div className="flex items-center gap-1">
                          {user.status === 'active' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{user.status === 'active' ? 'Активен' : 'Неактивен'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Подписка</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Текущий тариф</h4>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{getTariffName(user.tariffId)}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Тип подписки</h4>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>{user.subscriptionType === 'monthly' ? 'Ежемесячная' : 'Годовая'}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Статус подписки</h4>
                        <div className="flex items-center gap-1">
                          {user.isSubscriptionActive ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{user.isSubscriptionActive ? 'Активна' : 'Неактивна'}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Пробный период</h4>
                        <div className="flex items-center gap-1">
                          {user.isInTrial ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{user.isInTrial ? 'Активен' : 'Неактивен'}</span>
                        </div>
                      </div>
                    </div>

                    {user.isInTrial && user.trialEndsAt && (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mt-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium">Пробный период истекает {formatDate(user.trialEndsAt)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Управление подпиской</CardTitle>
                <CardDescription>
                  Настройте параметры подписки пользователя
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tariffId">Тариф</Label>
                    <Select 
                      value={formData.tariffId} 
                      onValueChange={handleTariffChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тариф" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Не выбран</SelectItem>
                        {initialTariffs.map(tariff => (
                          <SelectItem key={tariff.id} value={tariff.id}>
                            {tariff.name} ({tariff.price} ₽/{tariff.period === 'monthly' ? 'мес' : 'год'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscriptionType">Тип подписки</Label>
                    <Select 
                      value={formData.subscriptionType} 
                      onValueChange={handleSubscriptionTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип подписки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Ежемесячная</SelectItem>
                        <SelectItem value="yearly">Годовая</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-md">
                    <div className="space-y-0.5">
                      <Label htmlFor="subscription-active">Подписка активна</Label>
                      <p className="text-sm text-muted-foreground">
                        Пользователь имеет доступ к платным функциям
                      </p>
                    </div>
                    <Switch
                      id="subscription-active"
                      checked={isSubscriptionActive}
                      onCheckedChange={handleSubscriptionToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-md">
                    <div className="space-y-0.5">
                      <Label htmlFor="trial-active">Пробный период</Label>
                      <p className="text-sm text-muted-foreground">
                        Пользователь находится на пробном периоде
                      </p>
                    </div>
                    <Switch
                      id="trial-active"
                      checked={isInTrial}
                      onCheckedChange={handleTrialToggle}
                    />
                  </div>
                </div>

                {user.subscriptionId && (
                  <div className="pt-4">
                    <h3 className="text-sm font-medium mb-2">ID подписки</h3>
                    <div className="p-2 bg-muted rounded-md font-mono text-sm">
                      {user.subscriptionId}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Основные настройки</CardTitle>
                <CardDescription>
                  Управление основной информацией пользователя
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">ФИО</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="role">Роль</Label>
                    <div className="relative">
                      <ShieldAlert className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Select 
                        value={formData.role} 
                        onValueChange={handleRoleChange}
                      >
                        <SelectTrigger className="pl-9">
                          <SelectValue placeholder="Выберите роль пользователя" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Администратор</SelectItem>
                          <SelectItem value="user">Пользователь</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Статус</Label>
                    <Select 
                      value={status} 
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус пользователя" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Активен</SelectItem>
                        <SelectItem value="inactive">Неактивен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Заметки</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleInputChange}
                    placeholder="Внутренние заметки о пользователе"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Отмена
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetails;
