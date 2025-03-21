
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, activateSubscription } from "@/services/userService";
import { initialTariffs } from "@/data/tariffs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SubscriptionExpiredAlertProps {
  user: User | null;
  onUserUpdated: (updatedUser: User) => void;
}

const SubscriptionExpiredAlert: React.FC<SubscriptionExpiredAlertProps> = ({ user, onUserUpdated }) => {
  const [selectedTariff, setSelectedTariff] = useState<string>("2"); // Default to professional plan
  const [subscriptionMonths, setSubscriptionMonths] = useState(1);
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  if (!user) return null;

  const handleActivateSubscription = async () => {
    setIsActivating(true);
    try {
      const result = await activateSubscription(user.id, selectedTariff, subscriptionMonths);
      
      if (result.success && result.user) {
        onUserUpdated(result.user);
        
        toast({
          title: "Подписка активирована",
          description: "Теперь у вас есть полный доступ к функциям платформы",
          variant: "default",
        });
      } else {
        toast({
          title: "Ошибка",
          description: result.message || "Не удалось активировать подписку",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error activating subscription:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось активировать подписку. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const getStatusMessage = () => {
    if (user.isInTrial) {
      return "Ваш пробный период истек";
    } else if (user.isSubscriptionActive && user.subscriptionEndDate) {
      return `Срок вашей подписки истек ${new Date(user.subscriptionEndDate).toLocaleDateString()}`;
    } else {
      return "У вас нет активной подписки";
    }
  };

  // Determine which tariffs to show (all active ones)
  const availableTariffs = initialTariffs.filter(tariff => tariff.isActive);

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader className="bg-muted/50">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
          <div>
            <CardTitle>Требуется активация подписки</CardTitle>
            <CardDescription className="mt-1.5">{getStatusMessage()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <div className="grid gap-6">
          <div className="grid gap-3">
            <label className="text-sm font-medium leading-none">Выберите тариф</label>
            <Select
              value={selectedTariff}
              onValueChange={setSelectedTariff}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите тариф" />
              </SelectTrigger>
              <SelectContent>
                {availableTariffs.map((tariff) => (
                  <SelectItem key={tariff.id} value={tariff.id}>
                    {tariff.name} - {tariff.price} ₽/мес.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium leading-none">Срок подписки</label>
            <Select
              value={subscriptionMonths.toString()}
              onValueChange={(value) => setSubscriptionMonths(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите срок подписки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 месяц</SelectItem>
                <SelectItem value="3">3 месяца (скидка 5%)</SelectItem>
                <SelectItem value="6">6 месяцев (скидка 10%)</SelectItem>
                <SelectItem value="12">12 месяцев (скидка 15%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Преимущества выбранного тарифа:</h3>
            <ul className="space-y-2">
              {availableTariffs.find(t => t.id === selectedTariff)?.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-3 border-t bg-muted/30 px-6 py-4">
        <Button 
          onClick={handleActivateSubscription} 
          disabled={isActivating}
          className="w-full sm:w-auto"
        >
          {isActivating ? 'Активация...' : 'Активировать подписку'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionExpiredAlert;
