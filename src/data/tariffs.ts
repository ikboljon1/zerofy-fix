
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
