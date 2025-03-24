
import { supabase } from "@/integrations/supabase/client";

export interface Tariff {
  id: string;
  name: string;
  description: string;
  price: number;
  period: "monthly" | "yearly";
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  billingPeriod: string;
  storeLimit: number;
}

// Initial tariffs data - will be used as fallback if database fetch fails
export const initialTariffs: Tariff[] = [
  {
    id: "1",
    name: "Базовый",
    description: "Для небольших магазинов",
    price: 1500,
    period: "monthly",
    billingPeriod: "Ежемесячно",
    features: [
      "Базовая аналитика",
      "Подключение 1 магазина",
      "Отчеты о продажах"
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 1,
  },
  {
    id: "2",
    name: "Профессиональный",
    description: "Для растущих магазинов",
    price: 3500,
    period: "monthly",
    billingPeriod: "Ежемесячно",
    features: [
      "Расширенная аналитика",
      "Подключение до 3 магазинов",
      "Отчеты о продажах",
      "Аналитика конверсии",
      "Оптимизация цен"
    ],
    isPopular: true,
    isActive: true,
    storeLimit: 3,
  },
  {
    id: "3",
    name: "Бизнес",
    description: "Для профессиональных продавцов",
    price: 7500,
    period: "monthly",
    billingPeriod: "Ежемесячно",
    features: [
      "Полная аналитика",
      "Подключение до 10 магазинов",
      "Прогнозирование продаж",
      "AI-рекомендации",
      "Приоритетная поддержка"
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 10,
  },
  {
    id: "4",
    name: "Корпоративный",
    description: "Для крупных компаний",
    price: 15000,
    period: "monthly",
    billingPeriod: "Ежемесячно",
    features: [
      "Полная аналитика",
      "Подключение неограниченного числа магазинов",
      "Прогнозирование продаж",
      "AI-рекомендации",
      "Персональный менеджер",
      "API доступ",
      "Интеграция с ERP"
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 999,
  },
];

// Function to fetch tariffs from Supabase
export const fetchTariffs = async (): Promise<Tariff[]> => {
  try {
    const { data, error } = await supabase
      .from('tariffs')
      .select('*');
    
    if (error) {
      console.error('Error fetching tariffs:', error);
      return initialTariffs;
    }
    
    if (!data || data.length === 0) {
      return initialTariffs;
    }
    
    // Map the database fields to our Tariff interface
    return data.map(tariff => ({
      id: tariff.id,
      name: tariff.name,
      description: tariff.description || '',
      price: parseFloat(tariff.price),
      period: tariff.period as "monthly" | "yearly",
      features: Array.isArray(tariff.features) ? tariff.features : [],
      isPopular: !!tariff.is_popular,
      isActive: !!tariff.is_active,
      billingPeriod: tariff.billing_period || (tariff.period === 'monthly' ? 'Ежемесячно' : 'Ежегодно'),
      storeLimit: tariff.store_limit || 1
    }));
  } catch (error) {
    console.error('Error in fetchTariffs:', error);
    return initialTariffs;
  }
};

// Function to update a tariff in Supabase
export const updateTariff = async (tariff: Tariff): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tariffs')
      .update({
        name: tariff.name,
        description: tariff.description,
        price: tariff.price,
        period: tariff.period,
        features: tariff.features,
        is_popular: tariff.isPopular,
        is_active: tariff.isActive,
        store_limit: tariff.storeLimit,
        billing_period: tariff.billingPeriod
      })
      .eq('id', tariff.id);
    
    if (error) {
      console.error('Error updating tariff:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateTariff:', error);
    return false;
  }
};

// Function to create a new tariff in Supabase
export const createTariff = async (tariff: Omit<Tariff, 'id'>): Promise<Tariff | null> => {
  try {
    const { data, error } = await supabase
      .from('tariffs')
      .insert({
        name: tariff.name,
        description: tariff.description,
        price: tariff.price,
        period: tariff.period,
        features: tariff.features,
        is_popular: tariff.isPopular,
        is_active: tariff.isActive,
        store_limit: tariff.storeLimit,
        billing_period: tariff.billingPeriod
      })
      .select();
    
    if (error) {
      console.error('Error creating tariff:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Return the newly created tariff
    return {
      id: data[0].id,
      name: data[0].name,
      description: data[0].description || '',
      price: parseFloat(data[0].price),
      period: data[0].period as "monthly" | "yearly",
      features: Array.isArray(data[0].features) ? data[0].features : [],
      isPopular: !!data[0].is_popular,
      isActive: !!data[0].is_active,
      billingPeriod: data[0].billing_period || (data[0].period === 'monthly' ? 'Ежемесячно' : 'Ежегодно'),
      storeLimit: data[0].store_limit || 1
    };
  } catch (error) {
    console.error('Error in createTariff:', error);
    return null;
  }
};

// Function to delete a tariff from Supabase
export const deleteTariff = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tariffs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting tariff:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteTariff:', error);
    return false;
  }
};

// This function applies restrictions based on the user's tariff ID
export const applyTariffRestrictions = (tariffId: string): { storeLimit: number; } => {
  // Find the tariff in initialTariffs
  const tariff = initialTariffs.find(t => t.id === tariffId);
  
  if (tariff) {
    return {
      storeLimit: tariff.storeLimit
    };
  }
  
  // Default values for unknown tariffs
  return {
    storeLimit: 1 // Default to basic plan limit
  };
};

// Function to handle trial expiration and update user data
export const handleTrialExpiration = (userData: any): any => {
  if (!userData || !userData.isInTrial) {
    return userData;
  }
  
  // Check if trial has expired
  const trialEndDate = userData.trialEndDate ? new Date(userData.trialEndDate) : null;
  const now = new Date();
  
  if (trialEndDate && now > trialEndDate) {
    // Trial has expired, update user data
    const updatedUser = {
      ...userData,
      isInTrial: false,
      tariffId: '1', // Downgrade to basic plan
    };
    
    // Save updated user data to localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  }
  
  return userData;
};
