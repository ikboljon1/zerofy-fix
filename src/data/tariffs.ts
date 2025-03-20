import { getTariffs, getProfiles, supabase } from "@/integrations/supabase/client-wrapper";
import type { Tariff as SupabaseTariff } from "@/types/supabase-custom";

export interface Tariff {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly' | 'weekly' | 'daily';
  description: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  storeLimit: number;
}

export const initialTariffs: Tariff[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
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
    id: '00000000-0000-0000-0000-000000000002',
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
    id: '00000000-0000-0000-0000-000000000003',
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

export const TARIFFS_STORAGE_KEY = "app_tariffs";

export const loadTariffs = async (): Promise<Tariff[]> => {
  try {
    const { data: tariffsData, error } = await getTariffs()
      .select('*')
      .order('price');
    
    if (error) {
      throw new Error(`Ошибка при загрузке тарифов из Supabase: ${error.message}`);
    }
    
    if (tariffsData && tariffsData.length > 0) {
      const tariffs: Tariff[] = tariffsData.map(tariff => ({
        id: tariff.id,
        name: tariff.name,
        price: tariff.price,
        period: tariff.period,
        description: tariff.description,
        features: Array.isArray(tariff.features) ? tariff.features : [],
        isPopular: tariff.is_popular,
        isActive: tariff.is_active,
        storeLimit: tariff.store_limit
      }));
      
      localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(tariffs));
      
      return tariffs;
    } else {
      localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(initialTariffs));
      return initialTariffs;
    }
  } catch (error) {
    console.warn('Ошибка при загрузке тарифов:', error);
    
    const savedTariffs = localStorage.getItem(TARIFFS_STORAGE_KEY);
    if (savedTariffs) {
      try {
        return JSON.parse(savedTariffs);
      } catch (e) {
        console.error('Ошибка при парсинге тарифов из localStorage:', e);
      }
    }
    
    localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(initialTariffs));
    return initialTariffs;
  }
};

export const saveTariffs = async (tariffs: Tariff[]): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('Пользователь не авторизован');
    }
    
    const { data: profileData, error: profileError } = await getProfiles()
      .select('role')
      .eq('id', userData.user.id)
      .single();
    
    if (profileError || !profileData || profileData.role !== 'admin') {
      throw new Error('Нет прав для изменения тарифов');
    }
    
    for (const tariff of tariffs) {
      const { error } = await getTariffs()
        .upsert({
          id: tariff.id,
          name: tariff.name,
          price: tariff.price,
          period: tariff.period,
          description: tariff.description,
          features: tariff.features,
          is_popular: tariff.isPopular,
          is_active: tariff.isActive,
          store_limit: tariff.storeLimit,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        throw new Error(`Ошибка при сохранении тарифа ${tariff.name}: ${error.message}`);
      }
    }
    
    localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(tariffs));
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении тарифов:', error);
    
    localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(tariffs));
    return false;
  }
};

export const getTariffById = async (tariffId: string): Promise<Tariff | undefined> => {
  try {
    const { data, error } = await getTariffs()
      .select('*')
      .eq('id', tariffId)
      .single();
    
    if (error) {
      throw new Error(`Ошибка при получении тарифа из Supabase: ${error.message}`);
    }
    
    if (data) {
      return {
        id: data.id,
        name: data.name,
        price: data.price,
        period: data.period,
        description: data.description,
        features: Array.isArray(data.features) ? data.features : [],
        isPopular: data.is_popular,
        isActive: data.is_active,
        storeLimit: data.store_limit
      };
    }
    
    const tariffs = await loadTariffs();
    return tariffs.find(tariff => tariff.id === tariffId);
  } catch (error) {
    console.error('Ошибка при получении тарифа по ID:', error);
    
    const tariffs = await loadTariffs();
    return tariffs.find(tariff => tariff.id === tariffId);
  }
};

export const handleTrialExpiration = async (userData: any): Promise<any> => {
  if (userData.isInTrial && new Date(userData.trialEndDate) < new Date()) {
    try {
      const { error } = await getProfiles()
        .update({
          is_in_trial: false,
          tariff_id: '00000000-0000-0000-0000-000000000001',
          is_subscription_active: false
        })
        .eq('id', userData.id);
      
      if (error) {
        throw new Error(`Ошибка при обновлении профиля пользователя: ${error.message}`);
      }
      
      const updatedUserData = {
        ...userData,
        isInTrial: false,
        tariffId: "00000000-0000-0000-0000-000000000001",
        isSubscriptionActive: false
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      return updatedUserData;
    } catch (error) {
      console.error('Ошибка при обновлении статуса пробного периода:', error);
    }
  }
  
  return userData;
};

export const applyTariffRestrictions = async (tariffId: string): Promise<{ 
  storeLimit: number,
  canUseAIAnalysis: boolean,
  canUseAdvancedReports: boolean,
  canUseAPIIntegrations: boolean
}> => {
  try {
    const tariff = await getTariffById(tariffId);
    
    if (tariff) {
      return {
        storeLimit: tariff.storeLimit,
        canUseAIAnalysis: tariff.id === '00000000-0000-0000-0000-000000000003',
        canUseAdvancedReports: ['00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'].includes(tariff.id),
        canUseAPIIntegrations: ['00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'].includes(tariff.id)
      };
    }
  } catch (error) {
    console.error('Ошибка при получении ограничений тарифа:', error);
  }
  
  const restrictions = {
    storeLimit: 1,
    canUseAIAnalysis: false,
    canUseAdvancedReports: false,
    canUseAPIIntegrations: false
  };
  
  switch (tariffId) {
    case "00000000-0000-0000-0000-000000000001":
      restrictions.storeLimit = 1;
      break;
    case "00000000-0000-0000-0000-000000000002":
      restrictions.storeLimit = 2;
      restrictions.canUseAdvancedReports = true;
      restrictions.canUseAPIIntegrations = true;
      break;
    case "00000000-0000-0000-0000-000000000003":
      restrictions.storeLimit = 10;
      restrictions.canUseAIAnalysis = true;
      restrictions.canUseAdvancedReports = true;
      restrictions.canUseAPIIntegrations = true;
      break;
    default:
      restrictions.storeLimit = 1;
  }
  
  return restrictions;
};
