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
}

// Authentication response
export interface AuthResponse {
  success: boolean;
  user?: User | null;
  errorMessage?: string;
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
      isInTrial: false
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
      const role = profileData?.role || 'user';
      
      // Check subscription status
      const isSubscriptionActive = profileData?.is_subscription_active || false;
      const isInTrial = profileData?.is_in_trial || false;
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
        createdAt: authData.user.created_at
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
  name?: string
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
            role: 'user',
            is_in_trial: true,
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
            is_subscription_active: false
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
        createdAt: authData.user.created_at
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
): Promise<boolean> => {
  try {
    // Update user password
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      console.error('Password update error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error completing password reset:', error);
    return false;
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
    
    return {
      id: data.user.id,
      email: data.user.email || '',
      name: profileData?.name || data.user.email?.split('@')[0] || '',
      role: profileData?.role || 'user',
      isSubscriptionActive: profileData?.is_subscription_active || false,
      isInTrial: profileData?.is_in_trial || false,
      trialEndsAt: profileData?.trial_ends_at,
      tariffId: profileData?.tariff_id,
      createdAt: data.user.created_at
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

// Calculate trial days left
export const calculateTrialDaysLeft = (trialEndsAt?: string): number => {
  if (!trialEndsAt) return 0;
  
  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};
