
import { supabase } from "@/integrations/supabase/client";

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

// Начальные тарифы для демонстрации
export const initialTariffs: Tariff[] = [
  {
    id: "free",
    name: "Бесплатный",
    description: "Базовый функционал для небольшого магазина",
    price: 0,
    period: "monthly",
    billingPeriod: "месяц",
    features: [
      "Доступ к базовым отчетам",
      "Один подключенный магазин",
      "Базовая аналитика",
      "Email поддержка",
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 1
  },
  {
    id: "basic",
    name: "Базовый",
    description: "Расширенный функционал для стабильного бизнеса",
    price: 990,
    period: "monthly",
    billingPeriod: "месяц",
    features: [
      "Все возможности бесплатного тарифа",
      "До 3-х подключенных магазинов",
      "Расширенная аналитика",
      "Прогнозирование продаж",
      "Приоритетная поддержка",
    ],
    isPopular: true,
    isActive: true,
    storeLimit: 3
  },
  {
    id: "pro",
    name: "Про",
    description: "Полный набор инструментов для растущего бизнеса",
    price: 1990,
    period: "monthly",
    billingPeriod: "месяц",
    features: [
      "Все возможности базового тарифа",
      "До 10 подключенных магазинов",
      "Продвинутая аналитика",
      "AI-рекомендации",
      "Интеграции с ERP-системами",
      "Премиум поддержка 24/7",
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 10
  },
  {
    id: "unlimited",
    name: "Безлимитный",
    description: "Для крупного бизнеса с множеством магазинов",
    price: 5990,
    period: "monthly",
    billingPeriod: "месяц",
    features: [
      "Неограниченное количество магазинов",
      "Эксклюзивные аналитические отчеты",
      "Автоматизация бизнес-процессов",
      "Персональный менеджер",
      "Интеграция с любыми системами",
      "Выделенная поддержка 24/7",
    ],
    isPopular: false,
    isActive: true,
    storeLimit: 100
  }
];

// Загрузка тарифов из базы данных
export const loadTariffs = async (): Promise<Tariff[]> => {
  try {
    const { data, error } = await supabase
      .from('tariffs')
      .select('*');

    if (error) {
      console.error('Ошибка при загрузке тарифов:', error);
      return initialTariffs;
    }

    if (!data || data.length === 0) {
      return initialTariffs;
    }

    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      period: item.period,
      billingPeriod: item.billing_period,
      features: item.features,
      isPopular: item.is_popular,
      isActive: item.is_active,
      storeLimit: item.store_limit
    }));
  } catch (error) {
    console.error('Ошибка при загрузке тарифов:', error);
    return initialTariffs;
  }
};

// Сохранение тарифов в базу данных
export const saveTariffs = async (tariffs: Tariff[]): Promise<boolean> => {
  try {
    // Сначала удаляем все существующие тарифы
    await supabase.from('tariffs').delete().neq('id', '0');

    // Вставляем новые тарифы
    for (const tariff of tariffs) {
      const { error } = await supabase.from('tariffs').upsert({
        id: tariff.id,
        name: tariff.name,
        description: tariff.description,
        price: tariff.price,
        period: tariff.period,
        billing_period: tariff.billingPeriod,
        features: tariff.features,
        is_popular: tariff.isPopular,
        is_active: tariff.isActive,
        store_limit: tariff.storeLimit
      });

      if (error) {
        console.error('Ошибка при сохранении тарифов:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Ошибка при сохранении тарифов:', error);
    return false;
  }
};

// Применение ограничений тарифа
export const applyTariffRestrictions = (user: any): boolean => {
  // В будущем здесь может быть сложная логика проверки ограничений тарифа
  // Пока просто возвращаем true - ограничений нет
  return true;
};

// Обработка истечения пробного периода
export const handleTrialExpiration = (user: any): void => {
  // Логика обработки истечения пробного периода
  console.log('Проверка истечения пробного периода для пользователя:', user?.email);
};

// По умолчанию экспортируем начальные тарифы
export default initialTariffs;
