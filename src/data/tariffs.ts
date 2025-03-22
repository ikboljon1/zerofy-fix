
import { supabase } from '@/integrations/supabase/client';

export interface Tariff {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  description: string;
  features: string[];
  isPopular?: boolean;
  isActive?: boolean;
  storeLimit?: number;
}

// Initial tariffs data - used as fallback
export const initialTariffs: Tariff[] = [
  {
    id: '1',
    name: 'Базовый',
    price: 990,
    period: 'monthly',
    description: 'Идеально для начинающих продавцов',
    features: [
      'Доступ к основным отчетам',
      'Управление до 100 товаров',
      'Базовая аналитика',
      'Email поддержка'
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 1
  },
  {
    id: '2',
    name: 'Профессиональный',
    price: 1990,
    period: 'monthly',
    description: 'Для растущих магазинов',
    features: [
      'Все функции Базового тарифа',
      'Управление до 1000 товаров',
      'Расширенная аналитика',
      'Приоритетная поддержка',
      'API интеграции'
    ],
    isPopular: true,
    isActive: true,
    storeLimit: 2
  },
  {
    id: '3',
    name: 'Бизнес',
    price: 4990,
    period: 'monthly',
    description: 'Комплексное решение для крупных продавцов',
    features: [
      'Все функции Профессионального тарифа',
      'Неограниченное количество товаров',
      'Персональный менеджер',
      'Расширенный API доступ',
      'Белая метка (White Label)',
      'Приоритетные обновления'
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 10
  }
];

// Functions to interact with tariffs
export const getTariffs = async (): Promise<Tariff[]> => {
  try {
    // Return the initial tariffs instead of fetching from Supabase
    // This avoids TypeScript errors until the tariffs table is properly created
    return initialTariffs;
  } catch (error) {
    console.error('Error fetching tariffs:', error);
    return initialTariffs;
  }
};

export const getTariff = async (id: string): Promise<Tariff | null> => {
  try {
    // Find the tariff in initial tariffs
    const tariff = initialTariffs.find(t => t.id === id);
    return tariff || null;
  } catch (error) {
    console.error(`Error fetching tariff with ID ${id}:`, error);
    return null;
  }
};

// Helper function to handle trial expiration
export const handleTrialExpiration = (userData: any): any => {
  if (!userData) return userData;
  
  if (userData.isInTrial && userData.trialEndsAt) {
    const trialEndDate = new Date(userData.trialEndsAt);
    const now = new Date();
    
    if (now > trialEndDate) {
      // Trial has expired
      return {
        ...userData,
        isInTrial: false,
        isSubscriptionActive: false,
        tariffId: '1' // Downgrade to basic plan
      };
    }
  }
  
  return userData;
};

// Apply tariff restrictions based on tariff ID
export const applyTariffRestrictions = (tariffId: string): { storeLimit: number } => {
  switch (tariffId) {
    case '1':
      return { storeLimit: 1 };
    case '2':
      return { storeLimit: 2 };
    case '3':
      return { storeLimit: 10 };
    case '4':
      return { storeLimit: 100 };
    default:
      return { storeLimit: 1 };
  }
};

// Load tariffs (used by admin components)
export const loadTariffs = async (): Promise<Tariff[]> => {
  try {
    // For now, just return the initial tariffs
    return initialTariffs;
  } catch (error) {
    console.error('Error loading tariffs:', error);
    return initialTariffs;
  }
};

// Save tariffs (used by admin components)
export const saveTariffs = async (tariffs: Tariff[]): Promise<boolean> => {
  try {
    // For now, just log that we would save the tariffs
    console.log('Would save tariffs:', tariffs);
    return true;
  } catch (error) {
    console.error('Error saving tariffs:', error);
    return false;
  }
};

export const createOrUpdateTariffs = async (): Promise<void> => {
  try {
    // Function left intentionally empty until tariffs table is created
    console.log('Tariffs table not yet available in Supabase');
  } catch (error) {
    console.error('Error creating/updating tariffs:', error);
  }
};

export default {
  getTariffs,
  getTariff,
  createOrUpdateTariffs
};
