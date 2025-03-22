import { supabase } from '@/integrations/supabase/client';

// User type definition with role information
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  isSubscriptionActive: boolean;
  isInTrial: boolean;
  trialEndsAt?: string;
  tariffId?: string;
  createdAt?: string;
  // Add missing properties for components
  phone?: string;
  company?: string;
  avatar?: string;
  status?: string;
  storeCount?: number;
  subscriptionEndDate?: string;
  lastLogin?: string;
  registeredAt?: string;
}

// Authentication response
export interface AuthResponse {
  success: boolean;
  user?: User | null;
  errorMessage?: string;
}

// Payment History Item interface
export interface PaymentHistoryItem {
  id?: string;
  userId: string;
  tariff: string;
  amount: number;
  period: number;
  date: string;
  description?: string;
}

// Subscription Data interface
export interface SubscriptionData {
  isActive: boolean;
  isInTrial: boolean;
  trialEndsAt?: string;
  endDate?: string;
  daysRemaining: number;
  tariffId?: string;
  tariffName?: string;
}

// Tariff store limits
export const TARIFF_STORE_LIMITS: { [key: string]: number } = {
  '1': 1,  // Basic plan
  '2': 2,  // Professional plan
  '3': 10, // Business plan
  '4': 100 // Enterprise plan
};

// Email settings interfaces
export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail?: string;
  fromName?: string;
}

export interface Pop3Settings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  leaveOnServer?: boolean;
  autoCheckInterval?: number;
}

export interface EmailSettings {
  smtp: SmtpSettings;
  pop3: Pop3Settings;
  supportEmail: string;
}

// Admin user credentials (fixed for demo purposes)
const ADMIN_CREDENTIALS = {
  email: 'zerofy',
  password: 'Zerofy2025'
};

// Authenticate user function
export const authenticate = async (email: string, password: string): Promise<AuthResponse> => {
  // Check if trying to log in as admin
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    // Admin authentication - create admin user object
    const adminUser: User = {
      id: 'admin-user',
      email: 'admin@zerofy.app',
      name: 'Administrator',
      role: 'admin',
      isSubscriptionActive: true,
      isInTrial: false,
      status: 'active',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    };
    
    return {
      success: true,
      user: adminUser
    };
  }
  
  try {
    // Regular user authentication through Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        errorMessage: error.message
      };
    }

    if (authData && authData.user) {
      // Fetch user profile from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      // Determine user role - default to 'user' if no role specified
      const role = profileData?.role as 'user' | 'admin' || 'user';
      
      // Check subscription status
      const isSubscriptionActive = profileData?.subscription_type !== 'free' || false;
      const isInTrial = profileData?.subscription_type === 'trial' || false;
      const trialEndsAt = profileData?.trial_ends_at;
      const tariffId = profileData?.tariff_id;
      
      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: profileData?.name || authData.user.email?.split('@')[0] || '',
        role,
        isSubscriptionActive,
        isInTrial,
        trialEndsAt,
        tariffId,
        createdAt: authData.user.created_at,
        // Additional properties
        phone: profileData?.phone || '',
        company: profileData?.company || '',
        status: profileData?.status || 'active',
        subscriptionEndDate: profileData?.subscription_expiry,
        lastLogin: profileData?.last_login,
        registeredAt: profileData?.registered_at,
        storeCount: profileData?.store_count || 0,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`
      };

      return {
        success: true,
        user
      };
    }

    return {
      success: false,
      errorMessage: 'Неизвестная ошибка при аутентификации'
    };
  } catch (error: any) {
    console.error('Error during authentication:', error);
    return {
      success: false,
      errorMessage: error.message || 'Ошибка аутентификации'
    };
  }
};

// Register user function
export const registerUser = async (
  email: string, 
  password: string, 
  name?: string,
  phone?: string
): Promise<AuthResponse> => {
  try {
    // Register user with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('Registration error:', signUpError);
      return {
        success: false,
        errorMessage: signUpError.message
      };
    }

    if (authData && authData.user) {
      // Create user profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: name || email.split('@')[0],
            email,
            phone: phone || '',
            role: 'user',
            status: 'active',
            subscription_type: 'trial',
            subscription_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
            is_subscription_active: false,
            registered_at: new Date().toISOString(),
            store_count: 0
          }
        ]);

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Continue anyway, as the auth user was created
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email || '',
        name: name || email.split('@')[0],
        role: 'user',
        isSubscriptionActive: false,
        isInTrial: true,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        createdAt: authData.user.created_at,
        phone: phone || '',
        registeredAt: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.id}`
      };

      return {
        success: true,
        user
      };
    }

    return {
      success: false,
      errorMessage: 'Неизвестная ошибка при регистрации'
    };
  } catch (error: any) {
    console.error('Error during registration:', error);
    return {
      success: false,
      errorMessage: error.message || 'Ошибка регистрации'
    };
  }
};

// Check if phone exists
export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  // Mock implementation
  return false;
};

// Password reset request
export const requestPasswordReset = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset request error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error during password reset request:', error);
    return false;
  }
};

// Reset password function
export const resetPassword = async (
  email: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}?resetEmail=${encodeURIComponent(email)}`,
    });

    if (error) {
      console.error('Password reset error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error during password reset:', error);
    return false;
  }
};

// Complete password reset function
export const completePasswordReset = async (
  email: string, 
  password: string, 
  token: string
): Promise<{success: boolean; message?: string}> => {
  try {
    // Update user password
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      console.error('Password update error:', error);
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error completing password reset:', error);
    return {
      success: false,
      message: error.message || 'Error completing password reset'
    };
  }
};

// Change password
export const changePassword = async (
  userId: string, 
  currentPassword: string, 
  newPassword: string
): Promise<{success: boolean; message?: string}> => {
  try {
    // For demo purposes, always succeed
    return {
      success: true
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error changing password'
    };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return null;
    }
    
    // Fetch user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (!profileData) return null;
    
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: profileData?.name || data.user.email?.split('@')[0] || '',
      role: (profileData?.role as 'user' | 'admin') || 'user',
      isSubscriptionActive: profileData?.subscription_type !== 'free',
      isInTrial: profileData?.subscription_type === 'trial',
      trialEndsAt: profileData?.trial_ends_at,
      tariffId: profileData?.tariff_id,
      createdAt: data.user.created_at,
      // Additional properties
      phone: profileData?.phone || '',
      company: profileData?.company || '',
      status: profileData?.status || 'active',
      subscriptionEndDate: profileData?.subscription_expiry,
      lastLogin: profileData?.last_login,
      registeredAt: profileData?.registered_at,
      storeCount: profileData?.store_count || 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        company: updates.company,
        // Map other fields as needed
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// Update user (admin function)
export const updateUser = async (
  userId: string,
  updates: Partial<User>
): Promise<boolean> => {
  // Mock implementation for demo purposes
  return true;
};

// Get users (admin function)
export const getUsers = async (): Promise<User[]> => {
  try {
    // For admin page, just return mock data for now
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('registered_at', { ascending: false });
    
    if (error || !data) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    return data.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as 'user' | 'admin',
      isSubscriptionActive: profile.subscription_type !== 'free',
      isInTrial: profile.subscription_type === 'trial',
      trialEndsAt: profile.trial_ends_at,
      tariffId: profile.tariff_id,
      phone: profile.phone,
      company: profile.company,
      status: profile.status,
      subscriptionEndDate: profile.subscription_expiry,
      lastLogin: profile.last_login,
      registeredAt: profile.registered_at,
      storeCount: profile.store_count || 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Add user (admin function)
export const addUser = async (userData: Partial<User>, password: string): Promise<User | {success: boolean; message?: string}> => {
  // Mock implementation
  return { 
    id: 'new-user-id',
    email: userData.email || '',
    role: userData.role || 'user',
    isSubscriptionActive: false,
    isInTrial: false,
    name: userData.name || '',
    status: 'active'
  };
};

// Calculate trial days left
export const calculateTrialDaysLeft = (trialEndsAt?: string): number => {
  if (!trialEndsAt) return 0;
  
  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Get trial days remaining
export const getTrialDaysRemaining = (user: User): number => {
  if (!user.isInTrial || !user.trialEndsAt) return 0;
  return calculateTrialDaysLeft(user.trialEndsAt);
};

// Get subscription status
export const getSubscriptionStatus = (user: User): SubscriptionData => {
  const isActive = user.isSubscriptionActive;
  const isInTrial = user.isInTrial;
  
  const subscriptionEndDate = user.subscriptionEndDate;
  const trialEndDate = user.trialEndsAt;
  
  const endDate = isInTrial ? trialEndDate : subscriptionEndDate;
  const daysRemaining = endDate ? calculateTrialDaysLeft(endDate) : 0;
  
  return {
    isActive: isActive || isInTrial,
    isInTrial,
    endDate,
    daysRemaining,
    tariffId: user.tariffId,
    tariffName: getTariffName(user.tariffId || '1')
  };
};

// Get tariff name helper
const getTariffName = (tariffId: string): string => {
  switch (tariffId) {
    case '1': return 'Базовый';
    case '2': return 'Профессиональный';
    case '3': return 'Бизнес';
    case '4': return 'Корпоративный';
    default: return 'Базовый';
  }
};

// Get user subscription data
export const getUserSubscriptionData = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching user subscription data:', error);
      return null;
    }
    
    const isActive = data.subscription_type !== 'free';
    const isInTrial = data.subscription_type === 'trial';
    const endDate = isInTrial ? data.trial_ends_at : data.subscription_expiry;
    const daysRemaining = endDate ? calculateTrialDaysLeft(endDate) : 0;
    
    return {
      isActive: isActive || isInTrial,
      isInTrial,
      endDate,
      daysRemaining,
      tariffId: data.tariff_id,
      tariffName: getTariffName(data.tariff_id || '1')
    };
  } catch (error) {
    console.error('Error getting user subscription data:', error);
    return null;
  }
};

// Activate subscription
export const activateSubscription = async (
  userId: string,
  tariffId: string,
  months: number
): Promise<{success: boolean; message?: string; user?: User}> => {
  try {
    // Calculate new subscription end date
    const now = new Date();
    const endDate = new Date(now.setMonth(now.getMonth() + months));
    
    // Update user profile with new subscription data
    const { data, error } = await supabase
      .from('profiles')
      .update({
        tariff_id: tariffId,
        subscription_type: 'paid',
        subscription_expiry: endDate.toISOString(),
        is_in_trial: false
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error activating subscription:', error);
      return {
        success: false,
        message: error.message
      };
    }
    
    // Return updated user profile
    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as 'user' | 'admin',
      isSubscriptionActive: true,
      isInTrial: false,
      tariffId,
      subscriptionEndDate: endDate.toISOString(),
      phone: data.phone,
      company: data.company,
      status: data.status,
      lastLogin: data.last_login,
      registeredAt: data.registered_at,
      storeCount: data.store_count || 0,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`
    };
    
    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('Error activating subscription:', error);
    return {
      success: false,
      message: error.message || 'Error activating subscription'
    };
  }
};

// Add payment record
export const addPaymentRecord = async (
  userId: string,
  tariffId: string,
  amount: number,
  period: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('payment_history')
      .insert([
        {
          user_id: userId,
          subscription_type: tariffId,
          amount,
          payment_method: 'card',
          payment_date: new Date().toISOString(),
          status: 'completed'
        }
      ]);
    
    if (error) {
      console.error('Error adding payment record:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error adding payment record:', error);
    return false;
  }
};

// Get payment history
export const getPaymentHistory = async (userId: string): Promise<PaymentHistoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
    
    return data.map(payment => ({
      id: payment.id,
      userId: payment.user_id,
      tariff: getTariffName(payment.subscription_type),
      amount: payment.amount,
      period: 1, // Default to 1 month
      date: payment.payment_date,
      description: `Оплата тарифа «${getTariffName(payment.subscription_type)}»`
    }));
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
};

// Check feature access
export const hasFeatureAccess = (user: User | null, feature?: string): boolean => {
  if (!user) return false;
  if (!feature) return true; // If no feature specified, just check if user exists
  
  // Admin has access to all features
  if (user.role === 'admin') return true;
  
  // Users with active subscription or in trial have access to basic features
  if (user.isSubscriptionActive || user.isInTrial) {
    // Basic features available to all paid users
    const basicFeatures = ['dashboard', 'analytics', 'stores'];
    if (basicFeatures.includes(feature)) return true;
    
    // Premium features based on tariff
    const tariffId = user.tariffId || '1';
    
    switch (tariffId) {
      case '1': // Basic
        return ['basic_reports'].includes(feature);
      case '2': // Professional
        return ['basic_reports', 'advanced_reports', 'api'].includes(feature);
      case '3': // Business
        return ['basic_reports', 'advanced_reports', 'api', 'white_label'].includes(feature);
      case '4': // Enterprise
        return true; // Access to all features
      default:
        return false;
    }
  }
  
  // Free users have limited access
  return ['dashboard', 'profile'].includes(feature);
};

// SMTP Settings functions (mock implementations)
export const getSmtpSettings = async (): Promise<EmailSettings> => {
  return {
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      username: 'user',
      password: ''
    },
    pop3: {
      host: 'pop3.example.com',
      port: 995,
      secure: true,
      username: 'user',
      password: ''
    },
    supportEmail: 'support@example.com'
  };
};

export const saveSmtpSettings = async (settings: EmailSettings): Promise<boolean> => {
  return true;
};

export const testSmtpConnection = async (settings: SmtpSettings): Promise<{success: boolean; message?: string}> => {
  return { success: true };
};

export const testPop3Connection = async (settings: Pop3Settings): Promise<{success: boolean; message?: string}> => {
  return { success: true };
};
