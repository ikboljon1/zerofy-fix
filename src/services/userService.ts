import { supabase } from "@/integrations/supabase/client";

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  isSubscriptionActive: boolean;
  isInTrial: boolean;
  trialEndsAt: string | null;
  tariffId: string | null;
  subscriptionEndDate?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  company?: string;
  status?: string;
  storeCount?: number;
  registeredAt?: string;
  lastLogin?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: any;
}

export interface Tariff {
  id: string;
  name: string;
  description: string;
  price: number;
  period: "monthly" | "yearly";
  billingPeriod: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  storeLimit?: number;
}

export const TARIFF_STORE_LIMITS = {
  free: 1,
  basic: 3,
  pro: 10,
  unlimited: 100
};

export interface SubscriptionData {
  isActive: boolean;
  tariff: string;
  endDate: string | null;
  isInTrial: boolean;
  trialEndDate: string | null;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  paymentDate: string;
  status: string;
  paymentMethod: string;
  subscriptionType: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string; // Добавлено
  fromName: string;  // Добавлено
}

export interface Pop3Settings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  leaveOnServer: boolean; // Добавлено
  autoCheckInterval: number; // Добавлено
}

export interface EmailSettings {
  smtp: SmtpSettings;
  pop3: Pop3Settings;
}

// Helper function to get user from local storage
export const getLocalUser = (): User | null => {
  const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }
  return null;
};

// Fixed to handle both Supabase API response and mock data
export const authenticate = async (email: string, password: string): Promise<{ success: boolean, errorMessage?: string, user?: User }> => {
  try {
    // Специальный случай для zerofy/Zerofy2025
    if (email.toLowerCase() === 'zerofy' && password === 'Zerofy2025') {
      return {
        success: true,
        user: {
          id: 'admin-user-id',
          email: 'admin@zerofy.ru',
          name: 'Администратор',
          role: 'admin',
          isSubscriptionActive: true,
          isInTrial: false,
          trialEndsAt: null,
          tariffId: 'unlimited',
          status: 'active',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Администратор`
        }
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        errorMessage: 'Неверный логин или пароль. Пожалуйста, проверьте введенные данные.',
      };
    }

    // Адаптация полей из Supabase к нашей модели User
    const userFromDB = data.user as any;
    return {
      success: true,
      user: {
        id: userFromDB.id,
        email: userFromDB.email,
        name: userFromDB.user_metadata?.name || '',
        role: userFromDB.role || 'user',
        isSubscriptionActive: userFromDB.is_subscription_active || false, 
        isInTrial: userFromDB.is_in_trial || false,
        trialEndsAt: userFromDB.trial_ends_at || null,
        tariffId: userFromDB.tariff_id || null,
        status: 'active',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userFromDB.email}`
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      errorMessage: 'Ошибка аутентификации. Пожалуйста, проверьте введенные данные.',
    };
  }
};

// Добавляем недостающие функции
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // Здесь должен быть вызов API для запроса сброса пароля
    // Для демонстрации возвращаем успешный результат
    return {
      success: true,
      message: 'Инструкции по сбросу пароля отправлены на ваш email'
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: 'Не удалось отправить запрос на сброс пароля'
    };
  }
};

export const resetPassword = async (email: string, token: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // Здесь должен быть вызов API для сброса пароля
    // Для демонстрации возвращаем успешный результат
    return {
      success: true,
      message: 'Пароль успешно сброшен'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'Не удалось сбросить пароль'
    };
  }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // Здесь должен быть вызов API для изменения пароля
    // Для демонстрации возвращаем успешный результат
    return {
      success: true,
      message: 'Пароль успешно изменен'
    };
  } catch (error) {
    console.error('Password change error:', error);
    return {
      success: false,
      message: 'Не удалось изменить пароль'
    };
  }
};

export const getSubscriptionStatus = async (userId: string): Promise<SubscriptionData> => {
  // Демо-данные для подписки
  return {
    isActive: true,
    tariff: 'basic',
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isInTrial: false,
    trialEndDate: null
  };
};

export const getTrialDaysRemaining = (user: User): number => {
  if (!user.isInTrial || !user.trialEndsAt) return 0;
  
  const trialEnd = new Date(user.trialEndsAt);
  const now = new Date();
  
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const hasFeatureAccess = (feature: string, user?: User): boolean => {
  if (!user) return false;
  
  // Базовая проверка доступа к функциям на основе роли
  if (user.role === 'admin') return true;
  
  // Проверка на основе подписки и конкретной функции
  // Здесь можно добавить более сложную логику
  return user.isSubscriptionActive || user.isInTrial;
};

export const activateSubscription = async (userId: string, subscriptionType: string): Promise<boolean> => {
  try {
    // Здесь должен быть вызов API для активации подписки
    // Для демонстрации возвращаем успешный результат
    return true;
  } catch (error) {
    console.error('Subscription activation error:', error);
    return false;
  }
};

export const addPaymentRecord = async (
  userId: string, 
  amount: number, 
  subscriptionType: string, 
  paymentMethod: string
): Promise<boolean> => {
  try {
    // Здесь должен быть вызов API для добавления записи о платеже
    // Для демонстрации возвращаем успешный результат
    return true;
  } catch (error) {
    console.error('Add payment record error:', error);
    return false;
  }
};

export const getPaymentHistory = async (userId: string): Promise<PaymentHistoryItem[]> => {
  // Демо-данные истории платежей
  return [
    {
      id: '1',
      amount: 1200,
      paymentDate: new Date().toISOString(),
      status: 'completed',
      paymentMethod: 'card',
      subscriptionType: 'basic'
    }
  ];
};

export const getUsers = async (): Promise<User[]> => {
  // Демо-данные пользователей для админки
  return [
    {
      id: '1',
      email: 'user@example.com',
      name: 'Тестовый пользователь',
      role: 'user',
      isSubscriptionActive: true,
      isInTrial: false,
      trialEndsAt: null,
      tariffId: 'basic',
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user@example.com`,
      phone: '+7 (999) 123-45-67',
      company: 'ООО Тест',
      storeCount: 2,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'admin-user-id',
      email: 'admin@zerofy.ru',
      name: 'Администратор',
      role: 'admin',
      isSubscriptionActive: true,
      isInTrial: false,
      trialEndsAt: null,
      tariffId: 'unlimited',
      status: 'active',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Администратор`
    }
  ];
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
  try {
    // Здесь должен быть вызов API для обновления данных пользователя
    // Для демонстрации возвращаем успешный результат
    return true;
  } catch (error) {
    console.error('Update user error:', error);
    return false;
  }
};

export const getUserSubscriptionData = async (userId: string): Promise<SubscriptionData> => {
  // Совпадает с getSubscriptionStatus, но с другим именем для совместимости
  return await getSubscriptionStatus(userId);
};

export const addUser = async (userData: Partial<User>): Promise<User> => {
  // Демо-функция добавления пользователя
  return {
    id: Math.random().toString(36).substr(2, 9),
    email: userData.email || '',
    name: userData.name || '',
    role: userData.role || 'user',
    isSubscriptionActive: false,
    isInTrial: true,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    tariffId: 'free',
    status: userData.status || 'active',
    avatar: userData.avatar,
    phone: userData.phone,
    company: userData.company,
    storeCount: 0,
    registeredAt: new Date().toISOString(),
    lastLogin: null
  };
};

export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  // Демо-проверка существования телефона
  return false;
};

// Функции для настроек SMTP
export const getSmtpSettings = async (): Promise<EmailSettings> => {
  // Демо-данные настроек SMTP
  return {
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      username: 'user@example.com',
      password: 'password',
      fromEmail: 'noreply@example.com',
      fromName: 'Zerofy'
    },
    pop3: {
      host: 'pop3.example.com',
      port: 995,
      secure: true,
      username: 'user@example.com',
      password: 'password',
      leaveOnServer: true,
      autoCheckInterval: 15
    }
  };
};

export const saveSmtpSettings = async (settings: SmtpSettings): Promise<boolean> => {
  try {
    // Здесь должен быть вызов API для сохранения настроек SMTP
    // Для демонстрации возвращаем успешный результат
    return true;
  } catch (error) {
    console.error('Save SMTP settings error:', error);
    return false;
  }
};

export const testSmtpConnection = async (settings: SmtpSettings): Promise<{ success: boolean; message?: string }> => {
  try {
    // Здесь должен быть вызов API для тестирования соединения SMTP
    // Для демонстрации возвращаем успешный результат
    return {
      success: true,
      message: 'Соединение успешно установлено'
    };
  } catch (error) {
    console.error('Test SMTP connection error:', error);
    return {
      success: false,
      message: 'Не удалось установить соединение'
    };
  }
};

export const testPop3Connection = async (settings: Pop3Settings): Promise<{ success: boolean; message?: string }> => {
  try {
    // Здесь должен быть вызов API для тестирования соединения POP3
    // Для демонстрации возвращаем успешный результат
    return {
      success: true,
      message: 'Соединение успешно установлено'
    };
  } catch (error) {
    console.error('Test POP3 connection error:', error);
    return {
      success: false,
      message: 'Не удалось установить соединение'
    };
  }
};
