
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

// Initial tariff data that will be used both in admin panel and landing page
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

// Константы для локального хранения
export const TARIFFS_STORAGE_KEY = "app_tariffs";

// Функция для загрузки тарифов (из базы данных или локального хранилища)
export const loadTariffs = async (): Promise<Tariff[]> => {
  try {
    // Сначала пытаемся получить данные из API (базы данных)
    const response = await fetch('/api/tariffs');
    
    if (response.ok) {
      const data = await response.json();
      // Сохраняем полученные данные в localStorage для оффлайн-доступа
      localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(data));
      return data;
    } else {
      throw new Error('Не удалось загрузить тарифы из API');
    }
  } catch (error) {
    console.warn('Ошибка при загрузке тарифов из API:', error);
    
    // Пробуем загрузить из localStorage если API недоступен
    const savedTariffs = localStorage.getItem(TARIFFS_STORAGE_KEY);
    if (savedTariffs) {
      try {
        return JSON.parse(savedTariffs);
      } catch (e) {
        console.error('Ошибка при парсинге тарифов из localStorage:', e);
      }
    }
    
    // Если и localStorage пуст или некорректен, возвращаем начальные данные
    localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(initialTariffs));
    return initialTariffs;
  }
};

// Функция для обновления тарифов (в базе данных и локальном хранилище)
export const saveTariffs = async (tariffs: Tariff[]): Promise<boolean> => {
  try {
    // Сначала пытаемся сохранить в API (базу данных)
    const response = await fetch('/api/tariffs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tariffs),
    });
    
    if (response.ok) {
      // При успехе обновляем и localStorage
      localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(tariffs));
      return true;
    } else {
      throw new Error('Не удалось сохранить тарифы в API');
    }
  } catch (error) {
    console.error('Ошибка при сохранении тарифов в API:', error);
    
    // Даже если не удалось сохранить в API, обновляем localStorage
    localStorage.setItem(TARIFFS_STORAGE_KEY, JSON.stringify(tariffs));
    return false;
  }
};

// Функция для получения тарифа по ID
export const getTariffById = async (tariffId: string): Promise<Tariff | undefined> => {
  const tariffs = await loadTariffs();
  return tariffs.find(tariff => tariff.id === tariffId);
};

// Функция для обработки окончания пробного периода
export const handleTrialExpiration = (userData: any): any => {
  // Проверяем, был ли у пользователя пробный период и закончился ли он
  if (userData.isInTrial && new Date(userData.trialEndDate) < new Date()) {
    // После окончания пробного периода переводим на базовый тариф
    const updatedUserData = {
      ...userData,
      isInTrial: false,
      tariffId: "1", // Базовый тариф
      isSubscriptionActive: false
    };
    
    // Сохраняем обновленные данные пользователя
    localStorage.setItem('user', JSON.stringify(updatedUserData));
    return updatedUserData;
  }
  
  return userData;
};

// Функция для проверки и применения ограничений тарифа
export const applyTariffRestrictions = (tariffId: string): { 
  storeLimit: number,
  canUseAIAnalysis: boolean,
  canUseAdvancedReports: boolean,
  canUseAPIIntegrations: boolean
} => {
  const restrictions = {
    storeLimit: 1,
    canUseAIAnalysis: false,
    canUseAdvancedReports: false,
    canUseAPIIntegrations: false
  };
  
  switch (tariffId) {
    case "1": // Базовый
      restrictions.storeLimit = 1;
      restrictions.canUseAIAnalysis = false;
      restrictions.canUseAdvancedReports = false;
      restrictions.canUseAPIIntegrations = false;
      break;
    case "2": // Профессиональный
      restrictions.storeLimit = 2;
      restrictions.canUseAIAnalysis = false;
      restrictions.canUseAdvancedReports = true;
      restrictions.canUseAPIIntegrations = true;
      break;
    case "3": // Бизнес
      restrictions.storeLimit = 10;
      restrictions.canUseAIAnalysis = true;
      restrictions.canUseAdvancedReports = true;
      restrictions.canUseAPIIntegrations = true;
      break;
    case "4": // Корпоративный (если такой есть)
      restrictions.storeLimit = 999; // Практически без ограничений
      restrictions.canUseAIAnalysis = true;
      restrictions.canUseAdvancedReports = true;
      restrictions.canUseAPIIntegrations = true;
      break;
    default:
      // По умолчанию базовый тариф
      restrictions.storeLimit = 1;
  }
  
  return restrictions;
};
