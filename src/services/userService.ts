
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
  subscriptionEndDate?: string;
  phone?: string;
  company?: string;
  lastLogin?: string;
  storeCount?: number;
};

export interface SubscriptionData {
  isActive: boolean;
  endDate: string | null;
  tariffId: string;
  tariffName: string;
}

export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  method: string;
  description: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface Pop3Settings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}

export interface EmailSettings {
  smtp: SmtpSettings;
  pop3?: Pop3Settings;
  fromEmail: string;
  fromName: string;
}

// Mapping of tariff IDs to store limits
export const TARIFF_STORE_LIMITS: { [key: string]: number } = {
  "1": 1,  // Базовый
  "2": 2,  // Профессиональный
  "3": 10, // Бизнес
  "4": 20  // Корпоративный (если есть)
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
        tariffId: "3",
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        phone: "+7 (999) 123-45-67",
        company: "Admin Corp",
        lastLogin: new Date().toISOString()
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
        tariffId: "1",
        phone: "+7 (999) 987-65-43",
        company: "User Company",
        lastLogin: new Date().toISOString()
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

// Получить статус подписки пользователя
export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionData> => {
  // В демонстрационных целях, возвращаем заглушку
  return {
    isActive: true,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    tariffId: "2",
    tariffName: "Профессиональный"
  };
};

// Получить историю платежей
export const getPaymentHistory = async (userId: string): Promise<PaymentHistoryItem[]> => {
  // Демо-данные для истории платежей
  return [
    {
      id: "pay_1",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 1990,
      status: "completed",
      method: "card",
      description: "Оплата тарифа 'Профессиональный' на 1 месяц"
    },
    {
      id: "pay_2",
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 990,
      status: "completed",
      method: "card",
      description: "Оплата тарифа 'Базовый' на 1 месяц"
    }
  ];
};

// Активировать подписку
export const activateSubscription = async (
  userId: string, 
  tariffId: string, 
  months: number
): Promise<{ success: boolean; message?: string; }> => {
  // В реальном приложении, здесь должен быть код обработки оплаты
  return { success: true };
};

// Добавить запись о платеже
export const addPaymentRecord = async (
  userId: string,
  tariffId: string,
  amount: number,
  months: number
): Promise<{ success: boolean; }> => {
  return { success: true };
};

// Получить SMTP настройки
export const getSmtpSettings = async (): Promise<EmailSettings> => {
  return {
    smtp: {
      host: "smtp.example.com",
      port: 587,
      secure: false,
      username: "user@example.com",
      password: ""
    },
    fromEmail: "noreply@example.com",
    fromName: "Уведомления"
  };
};

// Сохранить SMTP настройки
export const saveSmtpSettings = async (settings: EmailSettings): Promise<{ success: boolean; }> => {
  return { success: true };
};

// Тестировать SMTP соединение
export const testSmtpConnection = async (settings: SmtpSettings): Promise<{ success: boolean; message?: string; }> => {
  return { success: true, message: "Соединение успешно установлено" };
};

// Тестировать POP3 соединение
export const testPop3Connection = async (settings: Pop3Settings): Promise<{ success: boolean; message?: string; }> => {
  return { success: true, message: "Соединение успешно установлено" };
};

// Получить список пользователей (для админа)
export const getUsers = async (): Promise<User[]> => {
  return [
    {
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
      tariffId: "3",
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      phone: "+7 (999) 123-45-67",
      company: "Admin Corp",
      lastLogin: new Date().toISOString(),
      storeCount: 10
    },
    {
      id: "2",
      name: "Тестовый пользователь",
      email: "user@user.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
      role: "user",
      status: "active",
      registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      isInTrial: true,
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isSubscriptionActive: false,
      tariffId: "1",
      phone: "+7 (999) 987-65-43",
      company: "User Company",
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      storeCount: 1
    }
  ];
};

// Обновить пользователя (для админа)
export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  // В реальном приложении здесь был бы API запрос
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error("Пользователь не найден");
  }
  
  // Обновить данные пользователя
  return { ...user, ...userData };
};

// Получить данные о подписке пользователя (для админа)
export const getUserSubscriptionData = async (userId: string): Promise<SubscriptionData> => {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    throw new Error("Пользователь не найден");
  }
  
  const tariff = initialTariffs.find(t => t.id === user.tariffId);
  
  return {
    isActive: user.isSubscriptionActive,
    endDate: user.subscriptionEndDate || null,
    tariffId: user.tariffId,
    tariffName: tariff?.name || "Неизвестный тариф"
  };
};

// Смена пароля
export const changePassword = async (
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<{ success: boolean; message?: string; }> => {
  // В демо-режиме просто имитируем успешную смену пароля
  if (currentPassword === "demo" || currentPassword === "admin" || currentPassword === "user") {
    return { success: true };
  }
  
  return { 
    success: false, 
    message: "Текущий пароль указан неверно" 
  };
};

// Запрос на сброс пароля
export const requestPasswordReset = async (email: string): Promise<{ 
  success: boolean; 
  message?: string; 
}> => {
  // В демо-режиме считаем, что email существует
  return { success: true };
};

// Сброс пароля
export const resetPassword = async (
  email: string, 
  token: string, 
  newPassword: string
): Promise<{ 
  success: boolean; 
  message?: string; 
}> => {
  // В демо-режиме всегда успешно
  return { success: true };
};

// Регистрация нового пользователя
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> => {
  // В демо-режиме просто имитируем успешную регистрацию
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    name: userData.name,
    email: userData.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
    role: "user",
    status: "active",
    registeredAt: new Date().toISOString(),
    isInTrial: true,
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isSubscriptionActive: false,
    tariffId: "1",
    phone: userData.phone,
    company: "",
    lastLogin: new Date().toISOString(),
    storeCount: 0
  };
  
  return {
    success: true,
    user: newUser
  };
};

// Проверка существования телефона
export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  // В демо-режиме считаем, что телефон не существует
  return false;
};
