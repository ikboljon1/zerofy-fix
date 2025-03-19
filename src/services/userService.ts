
import axios from 'axios';

// Interface definitions
export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export interface Pop3Settings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  leaveOnServer: boolean;
  autoCheckInterval: number;
}

export interface EmailSettings {
  smtp: SmtpSettings;
  pop3?: Pop3Settings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'user';
  status?: 'active' | 'inactive';
  registeredAt: string;
  avatar?: string;
  tariffId: string;
  isSubscriptionActive?: boolean;
  subscriptionEndDate?: string;
  isInTrial?: boolean;
  trialEndDate?: string;
  storeCount?: number;
}

export interface SubscriptionData {
  tariffId: string;
  endDate: string;
  isActive: boolean;
  planName: string;
}

export interface PaymentHistoryItem {
  id: string;
  userId: string;
  tariffId: string;
  amount: number;
  months: number;
  paymentDate: string;
  status: 'success' | 'failed' | 'pending';
  description?: string;
}

// Store limits by tariff
export const TARIFF_STORE_LIMITS: { [key: string]: number } = {
  "1": 1,    // Starter
  "2": 3,    // Business
  "3": 10,   // Premium
  "4": 999,  // Enterprise
};

// SMTP and POP3 functions
export const testSmtpConnection = async (settings: SmtpSettings): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post('http://localhost:3001/api/test-smtp-connection', settings);
    return response.data;
  } catch (error) {
    console.error('Error testing SMTP connection:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при тестировании SMTP соединения'
    };
  }
};

export const testPop3Connection = async (settings: Pop3Settings): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post('http://localhost:3001/api/test-pop3-connection', settings);
    return response.data;
  } catch (error) {
    console.error('Error testing POP3 connection:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при тестировании POP3 соединения'
    };
  }
};

export const getSmtpSettings = async (): Promise<EmailSettings | null> => {
  try {
    const response = await axios.get('http://localhost:3001/api/email-settings');
    return response.data;
  } catch (error) {
    console.error('Error getting SMTP settings:', error);
    return null;
  }
};

export const saveSmtpSettings = async (settings: EmailSettings): Promise<boolean> => {
  try {
    await axios.post('http://localhost:3001/api/email-settings/save', settings);
    return true;
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    throw error;
  }
};

// Verification methods
export const updateVerificationMethod = async (method: 'email' | 'phone', enabled: boolean): Promise<boolean> => {
  try {
    await axios.put('http://localhost:3001/api/settings/verification-method', { method, enabled });
    return true;
  } catch (error) {
    console.error('Error updating verification method:', error);
    throw error;
  }
};

export const getVerificationMethod = async (): Promise<{ method: 'email' | 'phone', enabled: boolean }> => {
  try {
    const response = await axios.get('http://localhost:3001/api/settings/verification-method');
    return response.data;
  } catch (error) {
    console.error('Error getting verification method:', error);
    // Default to email and enabled
    return { method: 'email', enabled: true };
  }
};

// User authentication and management functions
export const authenticate = async (email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  errorMessage?: string;
}> => {
  try {
    // In a real application, this would be an API call
    const response = await axios.post('http://localhost:3001/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      errorMessage: 'Неверный логин или пароль'
    };
  }
};

export const registerUser = async (userData: Partial<User>): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> => {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при регистрации'
    };
  }
};

export const requestPasswordReset = async (email: string): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/request-password-reset', { email });
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при запросе сброса пароля'
    };
  }
};

export const resetPassword = async (email: string, token: string, newPassword: string): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/reset-password', {
      email,
      token,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при сбросе пароля'
    };
  }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/change-password', {
      userId,
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Password change error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при изменении пароля'
    };
  }
};

export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    const response = await axios.get(`http://localhost:3001/api/auth/check-phone?phone=${encodeURIComponent(phone)}`);
    return response.data.exists;
  } catch (error) {
    console.error('Check phone error:', error);
    return false;
  }
};

// User management functions
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get('http://localhost:3001/api/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const addUser = async (userData: Partial<User>): Promise<User> => {
  try {
    const response = await axios.post('http://localhost:3001/api/admin/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await axios.put(`http://localhost:3001/api/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Subscription and payment functions
export const getSubscriptionStatus = (user: User): SubscriptionData => {
  if (!user) {
    return {
      tariffId: '1',
      endDate: '',
      isActive: false,
      planName: 'Стартовый'
    };
  }

  const isActive = user.isSubscriptionActive || user.isInTrial || false;
  
  let planName = 'Стартовый';
  if (user.tariffId === '2') planName = 'Бизнес';
  else if (user.tariffId === '3') planName = 'Премиум';
  else if (user.tariffId === '4') planName = 'Корпоративный';
  
  return {
    tariffId: user.tariffId || '1',
    endDate: user.subscriptionEndDate || '',
    isActive,
    planName
  };
};

export const getTrialDaysRemaining = (user: User): number => {
  if (!user || !user.isInTrial || !user.trialEndDate) {
    return 0;
  }

  const trialEndDate = new Date(user.trialEndDate);
  const today = new Date();
  
  // Calculate days remaining
  const diffTime = trialEndDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

export const activateSubscription = async (
  userId: string,
  tariffId: string,
  months: number
): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> => {
  try {
    const response = await axios.post('http://localhost:3001/api/subscriptions/activate', {
      userId,
      tariffId,
      months
    });
    return response.data;
  } catch (error) {
    console.error('Error activating subscription:', error);
    return {
      success: false,
      message: 'Ошибка при активации подписки'
    };
  }
};

export const getUserSubscriptionData = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    const response = await axios.get(`http://localhost:3001/api/subscriptions/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting subscription data:', error);
    return null;
  }
};

export const getPaymentHistory = async (userId: string): Promise<PaymentHistoryItem[]> => {
  try {
    const response = await axios.get(`http://localhost:3001/api/payments/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting payment history:', error);
    return [];
  }
};

export const addPaymentRecord = async (
  userId: string,
  tariffId: string,
  amount: number,
  months: number
): Promise<PaymentHistoryItem> => {
  try {
    const response = await axios.post('http://localhost:3001/api/payments/add', {
      userId,
      tariffId,
      amount,
      months
    });
    return response.data;
  } catch (error) {
    console.error('Error adding payment record:', error);
    throw error;
  }
};
