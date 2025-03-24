
import { initialTariffs } from "@/data/tariffs";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  registeredAt: string;
  isInTrial: boolean;
  trialEndDate: string;
  isSubscriptionActive: boolean;
  tariffId: string;
};

export const authenticate = async (email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  errorMessage?: string;
}> => {
  // Для тестирования - если логин admin@admin.com и пароль admin, то это администратор
  if (email === "admin@admin.com" && password === "admin") {
    return {
      success: true,
      user: {
        id: "1",
        name: "Администратор",
        email: "admin@admin.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        role: "admin",
        status: "active",
        registeredAt: new Date().toISOString(),
        isInTrial: false,
        trialEndDate: "",
        isSubscriptionActive: true,
        tariffId: "3"
      }
    };
  }
  
  // Для тестирования - если логин user@user.com и пароль user, то это обычный пользователь
  if (email === "user@user.com" && password === "user") {
    return {
      success: true,
      user: {
        id: "2",
        name: "Тестовый пользователь",
        email: "user@user.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
        role: "user",
        status: "active",
        registeredAt: new Date().toISOString(),
        isInTrial: true,
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isSubscriptionActive: false,
        tariffId: "1"
      }
    };
  }
  
  // Остальные комбинации логина и пароля считаем неверными
  return {
    success: false,
    errorMessage: "Неверный логин или пароль"
  };
};

export const hasFeatureAccess = (feature: string, userData?: User | null): boolean => {
  if (!userData) return false;
  
  // Если пользователь администратор, у него есть доступ ко всем функциям
  if (userData.role === 'admin') return true;
  
  // Если пробный период активен или подписка активна, проверяем доступность функции
  if (userData.isInTrial || userData.isSubscriptionActive) {
    const tariffId = userData.tariffId;
    
    switch (feature) {
      case 'advancedMetrics':
        return ['2', '3'].includes(tariffId);
      case 'aiAnalysis':
        return tariffId === '3';
      case 'createStore':
        // Проверка лимита магазинов уже реализована в компоненте
        return true;
      default:
        return false;
    }
  }
  
  return false;
};

export const getTrialDaysRemaining = (userData: User): number => {
  if (!userData.isInTrial || !userData.trialEndDate) return 0;
  
  const trialEnd = new Date(userData.trialEndDate);
  const now = new Date();
  
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};
