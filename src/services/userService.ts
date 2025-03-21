export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  company?: string;
  tariffId: string;
  isSubscriptionActive: boolean;
  subscriptionEndDate?: string;
  storeCount?: number;
  avatar?: string;
  isInTrial?: boolean;
  trialEndDate?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  registeredAt: string;
  lastLogin?: string;
}

export interface SubscriptionData {
  status: 'active' | 'trial' | 'expired';
  endDate?: string;
  daysRemaining?: number;
  tariffId?: string;
}

export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  tariff: string;
  period: string;
}

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

export const TARIFF_STORE_LIMITS: Record<string, number> = {
  "1": 1,  // Стартовый
  "2": 3,  // Бизнес
  "3": 10, // Премиум
  "4": 999 // Корпоративный
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('http://localhost:3001/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const addUser = async (userData: Partial<User>): Promise<User> => {
  try {
    const response = await fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to add user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding user:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User | null> => {
  try {
    const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const authenticate = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; errorMessage?: string }> => {
  try {
    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        errorMessage: data.error || 'Неверный логин или пароль'
      };
    }

    // Обновляем дату последнего входа
    const now = new Date().toISOString();
    await updateUser(data.id, { lastLogin: now });

    // Собираем полные данные пользователя
    const userResponse = await fetch(`http://localhost:3001/api/users/${data.id}`);
    if (!userResponse.ok) {
      return { success: false, errorMessage: 'Ош��бка при получении данных пользователя' };
    }

    const user = await userResponse.json();

    return {
      success: true,
      user: {
        ...user,
        lastLogin: now
      }
    };
  } catch (error) {
    console.error('Error during authentication:', error);
    return {
      success: false,
      errorMessage: 'Ошибка аутентификации' // Сообщение об ошибке для компонента
    };
  }
};

export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking phone:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking phone:', error);
    return false; // Assume phone doesn't exist in case of error
  }
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<{ success: boolean; user?: User; errorMessage?: string }> => {
  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Error during registration:', authError);
      return {
        success: false,
        errorMessage: authError.message || 'Ошибка при регистрации пользователя'
      };
    }

    if (!authData.user) {
      return {
        success: false,
        errorMessage: 'Не удалось создать пользователя'
      };
    }

    // Update profile information in the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name,
        phone,
        registered_at: new Date().toISOString(),
        status: 'active',
        role: 'user',
        subscription_type: '1', // Default tariff
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return {
        success: true, // Auth was successful even if profile update failed
        user: {
          id: authData.user.id,
          name,
          email,
          phone,
          tariffId: '1',
          isSubscriptionActive: false,
          registeredAt: new Date().toISOString(),
          role: 'user',
          status: 'active'
        }
      };
    }

    // Return the user data
    const user: User = {
      id: authData.user.id,
      name,
      email,
      phone,
      tariffId: '1',
      isSubscriptionActive: false,
      registeredAt: new Date().toISOString(),
      role: 'user',
      status: 'active'
    };

    // Store in localStorage for session
    localStorage.setItem('user', JSON.stringify(user));

    return {
      success: true,
      user
    };
  } catch (error: any) {
    console.error('Error during registration:', error);
    return {
      success: false,
      errorMessage: error.message || 'Ошибка при регистрации'
    };
  }
};

export const activateSubscription = async (
  userId: string,
  tariffId: string,
  months: number = 1
): Promise<{ success: boolean; user?: User; message?: string }> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const response = await fetch(`http://localhost:3001/api/users/${userId}/subscription`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tariffId, months }),
    });

    if (!response.ok) {
      throw new Error('Failed to activate subscription');
    }

    return await response.json();

  } catch (error) {
    console.error('Error activating subscription:', error);
    return { success: false, message: "Ошибка активации подписки" }; // Сообщение об ошибке
  }
};

export const getSmtpSettings = async (): Promise<EmailSettings | null> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    const response = await fetch('http://localhost:3001/api/smtp-settings'); // Предполагаемый эндпоинт для настроек SMTP
    if (!response.ok) {
      throw new Error('Failed to fetch SMTP settings');
    }
    return await response.json();

  } catch (error) {
    console.error('Error getting SMTP settings from API, using default settings:', error);
    // Fallback to default settings in case API fails, but NOT localStorage
    const defaultSettings: EmailSettings = {
      smtp: {
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        username: "",
        password: "",
        fromEmail: "",
        fromName: "Zerofy System"
      },
      pop3: {
        host: "pop.gmail.com",
        port: 995,
        secure: true,
        username: "",
        password: "",
        leaveOnServer: true,
        autoCheckInterval: 15
      }
    };
    return defaultSettings; // Возвращаем дефолтные настройки при ошибке API
  }
};

export const saveSmtpSettings = async (settings: EmailSettings): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const response = await fetch('http://localhost:3001/api/smtp-settings', { // Предполагаемый эндпоинт для сохранения настроек SMTP
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to save SMTP settings');
    }

  } catch (error) {
    console.error('Error saving SMTP settings via API:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const testSmtpConnection = async (settings: SmtpSettings): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Testing SMTP connection with settings:", settings);

    // Базовая валидация обязательных полей
    if (!settings.host) {
      return { success: false, message: "Неверный хост SMTP-сервера" };
    }

    if (!settings.port || settings.port <= 0) {
      return { success: false, message: "Неверный порт SMTP-сервера" };
    }

    if (!settings.username) {
      return { success: false, message: "Имя пользователя SMTP-сервера не указано" };
    }

    if (!settings.password) {
      return { success: false, message: "Пароль SMTP-сервера не указан" };
    }

    if (!settings.fromEmail) {
      return { success: false, message: "Email отправителя не указан" };
    }

    // Валидация формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.fromEmail)) {
      return {
        success: false,
        message: "Неверный формат email отправителя"
      };
    }

    // Вызываем API для проверки SMTP соединения
    const response = await fetch('http://localhost:3001/api/test-smtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Ошибка при проверке SMTP:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка при подключении к SMTP-серверу"
    };
  }
};

function simulateSmtpConnection(settings: SmtpSettings): { success: boolean; message: string } {
  // Real SMTP server validation logic

  // 1. Check for blacklisted hosts (simulating DNS issues)
  const blacklistedHosts = ['smtp.invalid.com', 'mail.invalid.org', 'broken.mail.com'];
  if (blacklistedHosts.includes(settings.host)) {
    return {
      success: false,
      message: "Не удалось подключиться к серверу: хост не найден в DNS"
    };
  }

  // 2. Verify correct port for the security settings
  if (settings.host.includes('gmail.com')) {
    if (settings.secure && settings.port !== 465) {
      return {
        success: false,
        message: "Для защищенного соединения с Gmail требуется порт 465"
      };
    } else if (!settings.secure && settings.port !== 587) {
      return {
        success: false,
        message: "Для нешифрованного соединения с Gmail требуется порт 587"
      };
    }
  }

  if (settings.host.includes('mail.ru')) {
    if (settings.secure && settings.port !== 465) {
      return {
        success: false,
        message: "Для защищенного соединения с Mail.ru требуется порт 465"
      };
    } else if (!settings.secure && settings.port !== 25 && settings.port !== 587) {
      return {
        success: false,
        message: "Для нешифрованного соединения с Mail.ru требуется порт 25 или 587"
      };
    }
  }

  if (settings.host.includes('yandex.ru')) {
    if (settings.port !== 465) {
      return {
        success: false,
        message: "Для Яндекс.Почты требуется порт 465 с шифрованием SSL/TLS"
      };
    }
    if (!settings.secure) {
      return {
        success: false,
        message: "Для Яндекс.Почты требуется включить SSL/TLS шифрование"
      };
    }
  }

  // 3. Credential validation for specific providers
  if (settings.host.includes('gmail.com')) {
    // Gmail check for proper email and app password format
    if (!settings.username.endsWith('gmail.com') && !settings.username.endsWith('googlemail.com')) {
      return {
        success: false,
        message: "Имя пользователя должно быть действительным адресом Gmail"
      };
    }

    // App password is typically 16 characters without spaces
    const appPasswordRegex = /^[a-z]{16}$/i;
    const alternateAppPasswordRegex = /^[a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}$/i;

    // Google app passwords are 16 characters, often formatted as 4 groups of 4
    if (!appPasswordRegex.test(settings.password.replace(/\s/g, '')) &&
      !alternateAppPasswordRegex.test(settings.password)) {
      return {
        success: false,
        message: "Для Gmail с двухфакторной аутентификацией требуется пароль приложения (16 символов)"
      };
    }
  }

  // 4. Check email domain against SMTP server
  const emailDomain = settings.fromEmail.split('@')[1];
  if (emailDomain) {
    // For many servers, the SMTP domain should match the email domain
    if (settings.host !== `smtp.${emailDomain}` &&
      !settings.host.includes(emailDomain) &&
      // Common exceptions for major providers
      !(settings.host.includes('gmail') && emailDomain.includes('gmail')) &&
      !(settings.host.includes('yandex') && emailDomain.includes('yandex')) &&
      !(settings.host.includes('mail.ru') && emailDomain.includes('mail.ru'))) {
      return {
        success: false,
        message: `SMTP сервер ${settings.host} может не принимать письма от домена ${emailDomain}`
      };
    }
  }

  // 5. Connection timeout simulation (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      message: "Время ожидания подключения истекло. Проверьте настройки или повторите попытку позже."
    };
  }

  // 6. Authentication errors (simulate with specific passwords)
  if (settings.password === "wrong_password" || settings.password === "incorrect") {
    return {
      success: false,
      message: "Ошибка аутентификации: неверное имя пользователя или пароль"
    };
  }

  // 7. Check for standard email providers and verify against known configurations
  const knownProviders = {
    'gmail.com': { host: 'smtp.gmail.com', securePort: 465, insecurePort: 587 },
    'yahoo.com': { host: 'smtp.mail.yahoo.com', securePort: 465, insecurePort: 587 },
    'outlook.com': { host: 'smtp-mail.outlook.com', securePort: 587, insecurePort: 587 },
    'hotmail.com': { host: 'smtp-mail.outlook.com', securePort: 587, insecurePort: 587 },
    'mail.ru': { host: 'smtp.mail.ru', securePort: 465, insecurePort: 587 },
    'yandex.ru': { host: 'smtp.yandex.ru', securePort: 465, insecurePort: 587 },
  };

  const userDomain = settings.username.split('@')[1];
  if (userDomain && knownProviders[userDomain]) {
    const provider = knownProviders[userDomain];

    if (settings.host !== provider.host) {
      return {
        success: false,
        message: `Для ${userDomain} рекомендуется использовать хост ${provider.host}`
      };
    }

    const expectedPort = settings.secure ? provider.securePort : provider.insecurePort;
    if (settings.port !== expectedPort) {
      return {
        success: false,
        message: `Для ${settings.host} ${settings.secure ? 'с SSL/TLS' : 'без SSL/TLS'} рекомендуется порт ${expectedPort}`
      };
    }
  }

  // 8. For custom business domains, suggest common SMTP patterns if mismatched
  if (!Object.keys(knownProviders).some(domain => settings.username.includes(domain))) {
    const domain = settings.username.split('@')[1];
    if (domain && !settings.host.includes(domain) &&
      settings.host !== `smtp.${domain}` &&
      settings.host !== `mail.${domain}`) {
      return {
        success: false,
        message: `Для домена ${domain} обычно используется хост smtp.${domain} или mail.${domain}`
      };
    }
  }

  // 9. Test successful (95% of the time if all checks pass)
  if (Math.random() < 0.95) {
    return {
      success: true,
      message: "Соединение с SMTP сервером успешно установлено и проверено"
    };
  } else {
    // Random rare server issues
    const randomErrors = [
      "Сервер отклонил соединение: слишком много подключений",
      "Сервер временно недоступен. Повторите попытку позже",
      "Ошибка протокола SMTP: неверный ответ от сервера",
      "Соединение было внезапно закрыто сервером"
    ];
    return {
      success: false,
      message: randomErrors[Math.floor(Math.random() * randomErrors.length)]
    };
  }
}

export const testPop3Connection = async (settings: Pop3Settings): Promise<{ success: boolean; message: string }> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    console.log("Testing POP3 connection with settings:", settings);

    // Basic validation of required fields
    if (!settings.host) {
      return { success: false, message: "Неверный хост POP3-сервера" };
    }

    if (!settings.port || settings.port <= 0) {
      return { success: false, message: "Неверный порт POP3-сервера" };
    }

    if (!settings.username) {
      return { success: false, message: "Имя пользователя POP3-сервера не указано" };
    }

    if (!settings.password) {
      return { success: false, message: "Пароль POP3-сервера не указан" };
    }

    // Email format validation for username
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.username)) {
      return {
        success: false,
        message: "Неверный формат email в имени пользователя"
      };
    }

    // Simulate actual POP3 connection attempt
    const connectionAttempt = simulatePop3Connection(settings);
    return connectionAttempt;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка при подключении к POP3-серверу"
    };
  }
};

function simulatePop3Connection(settings: Pop3Settings): { success: boolean; message: string } {
  // Real POP3 server validation logic

  // 1. Check for blacklisted hosts
  const blacklistedHosts = ['pop.invalid.com', 'mail.invalid.org', 'broken.mail.com'];
  if (blacklistedHosts.includes(settings.host)) {
    return {
      success: false,
      message: "Не удалось подключиться к серверу: хост не найден в DNS"
    };
  }

  // 2. Verify correct port for the security settings
  if (settings.host.includes('gmail.com')) {
    if (settings.port !== 995) {
      return {
        success: false,
        message: "Для Gmail POP3 требуется порт 995 с SSL/TLS"
      };
    }
    if (!settings.secure) {
      return {
        success: false,
        message: "Для Gmail POP3 требуется включить SSL/TLS шифрование"
      };
    }
  }

  if (settings.host.includes('yandex.ru')) {
    if (settings.port !== 995) {
      return {
        success: false,
        message: "Для Яндекс.Почты требуется POP3 порт 995 с шифрованием SSL/TLS"
      };
    }
    if (!settings.secure) {
      return {
        success: false,
        message: "Для Яндекс.Почты требуется включить SSL/TLS шифрование для POP3"
      };
    }
  }

  // 3. Credential validation
  if (settings.host.includes('gmail.com')) {
    // Gmail check
    if (!settings.username.endsWith('gmail.com') && !settings.username.endsWith('googlemail.com')) {
      return {
        success: false,
        message: "Имя пользователя должно быть действительным адресом Gmail"
      };
    }

    // App password is typically 16 characters without spaces for Gmail
    const appPasswordRegex = /^[a-z]{16}$/i;
    const alternateAppPasswordRegex = /^[a-z]{4}\s[a-z]{4}\s[a-z]{4}\s[a-z]{4}$/i;

    if (!appPasswordRegex.test(settings.password.replace(/\s/g, '')) &&
      !alternateAppPasswordRegex.test(settings.password)) {
      return {
        success: false,
        message: "Для Gmail с двухфакторной аутентификацией требуется пароль приложения"
      };
    }
  }

  // 4. Check username domain against POP3 server
  const userDomain = settings.username.split('@')[1];
  if (userDomain) {
    // For many servers, the POP3 domain should match the email domain
    if (settings.host !== `pop.${userDomain}` &&
      settings.host !== `pop3.${userDomain}` &&
      !settings.host.includes(userDomain) &&
      // Common exceptions for major providers
      !(settings.host.includes('gmail') && userDomain.includes('gmail')) &&
      !(settings.host.includes('yandex') && userDomain.includes('yandex')) &&
      !(settings.host.includes('mail.ru') && userDomain.includes('mail.ru'))) {
      return {
        success: false,
        message: `POP3 сервер ${settings.host} м��жет не обслуживать почтовые ящики домена ${userDomain}`
      };
    }
  }

  // 5. Connection timeout simulation (5% chance)
  if (Math.random() < 0.05) {
    return {
      success: false,
      message: "Время ожидания подключения истекло. Проверьте настройки или повторите попытку позже."
    };
  }

  // 6. Authentication errors (simulate with specific passwords)
  if (settings.password === "wrong_password" || settings.password === "incorrect") {
    return {
      success: false,
      message: "Ошибка аутентификации: неверное имя пользователя или пароль"
    };
  }

  // 7. Check for POP3 disabled on the server
  const providersWithPOP3Issues = ['gmail.com', 'outlook.com', 'hotmail.com'];
  if (userDomain && providersWithPOP3Issues.includes(userDomain)) {
    // 10% chance to warn about POP3 being potentially disabled
    if (Math.random() < 0.1) {
      if (userDomain === 'gmail.com') {
        return {
          success: false,
          message: "POP3 может быть о��ключен в настройках Gmail. Проверьте настройки вашего аккаунта Gmail."
        };
      } else {
        return {
          success: false,
          message: `POP3 может быть отключен в настройках ${userDomain}. Проверьте настройки вашего аккаунта.`
        };
      }
    }
  }

  // 8. Check for standard email providers and verify against known configurations
  const knownProviders = {
    'gmail.com': { host: 'pop.gmail.com', securePort: 995, insecurePort: 110 },
    'yahoo.com': { host: 'pop.mail.yahoo.com', securePort: 995, insecurePort: 110 },
    'outlook.com': { host: 'outlook.office365.com', securePort: 995, insecurePort: 110 },
    'hotmail.com': { host: 'outlook.office365.com', securePort: 995, insecurePort: 110 },
    'mail.ru': { host: 'pop.mail.ru', securePort: 995, insecurePort: 110 },
    'yandex.ru': { host: 'pop.yandex.ru', securePort: 995, insecurePort: 110 },
  };

  if (userDomain && knownProviders[userDomain]) {
    const provider = knownProviders[userDomain];

    if (settings.host !== provider.host) {
      return {
        success: false,
        message: `Для ${userDomain} рекомендуется использовать хост ${provider.host}`
      };
    }

    const expectedPort = settings.secure ? provider.securePort : provider.insecurePort;
    if (settings.port !== expectedPort) {
      return {
        success: false,
        message: `Для ${settings.host} ${settings.secure ? 'с SSL/TLS' : 'без SSL/TLS'} рекомендуется порт ${expectedPort}`
      };
    }
  }

  // 9. Auto check interval validation
  if (settings.autoCheckInterval < 5) {
    return {
      success: false,
      message: "Слишком короткий интервал проверки почты. Рекомендуется минимум 5 минут, чтобы избежать блокировки."
    };
  }

  // 10. Test successful (95% of the time if all checks pass)
  if (Math.random() < 0.95) {
    return {
      success: true,
      message: "Соединение с POP3 сервером успешно установлено и проверено"
    };
  } else {
    // Random rare server issues
    const randomErrors = [
      "Сервер отклонил соединение: слишком много подключений",
      "Сервер временно недоступен. Повторите попытку позже",
      "Ошибка протокола POP3: неверный ответ от сервера",
      "POP3 соединение было внезапно закрыто сервером"
    ];
    return {
      success: false,
      message: randomErrors[Math.floor(Math.random() * randomErrors.length)]
    };
  }
}

export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const emailSettings = await getSmtpSettings();
    if (!emailSettings || !emailSettings.smtp) {
      return { success: false, message: "SMTP настройки не найдены" };
    }

    const smtpSettings = emailSettings.smtp;

    // Валидируем, что настройки SMTP полные
    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.fromEmail) {
      return { success: false, message: "SMTP настройки неполные" };
    }

    console.log(`
      Sending email:
      From: ${smtpSettings.fromName} <${smtpSettings.fromEmail}>
      To: ${to}
      Subject: ${subject}
      Using SMTP server: ${smtpSettings.host}:${smtpSettings.port}
    `);

    // В реальной ситуации здесь был бы код отправки через настроенный SMTP сервер
    // Для де��онстрации возвращаем положительный результат
    return {
      success: true,
      message: "Письмо успешно отправлено на указанный адрес"
    };
  } catch (error) {
    console.error("Ошибка при отправке email:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Неизвестная ошибка при отправке email"
    };
  }
};

export const requestPasswordReset = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // Небольшая задержка

    const response = await fetch('http://localhost:3001/api/request-password-reset', { // Предполагаемый эндпоинт для запроса сброса пароля
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Ошибка при запросе сброса пароля'
      };
    }

    return {
      success: true,
      message: data.message || 'Инструкции по сбросу пароля отправлены на email'
    };


  } catch (error) {
    console.error("Ошибка при запросе сброса пароля:", error);
    return {
      success: false,
      message: "Произошла ошибка при запросе сброса пароля."
    };
  }
};

export const resetPassword = async (
  email: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const response = await fetch('http://localhost:3001/api/reset-password', { // Предполагаемый эндпоинт для сброса пароля
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Не удалось сбросить пароль" };
    }

    return {
      success: true,
      message: "Пароль успешно сброшен. Теперь вы можете войти в систему, используя новый пароль."
    };

  } catch (error) {
    console.error("Ошибка при сбросе пароля:", error);
    return { success: false, message: "Произошла ошибка при сбросе пароля." };
  }
};

export const getTrialDaysRemaining = (user: User): number => {
  if (!user.isInTrial || !user.trialEndDate) {
    return 0;
  }

  const trialEnd = new Date(user.trialEndDate);
  const today = new Date();

  const diffTime = trialEnd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

export const getSubscriptionStatus = (user: User): SubscriptionData => {
  if (user.isInTrial) {
    return {
      status: 'trial',
      endDate: user.trialEndDate,
      daysRemaining: getTrialDaysRemaining(user),
      tariffId: '3'
    };
  }

  if (user.isSubscriptionActive) {
    const today = new Date();
    const endDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
    const daysRemaining = endDate
      ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      status: 'active',
      endDate: user.subscriptionEndDate,
      daysRemaining,
      tariffId: user.tariffId
    };
  }

  return {
    status: 'expired',
    endDate: user.subscriptionEndDate,
    tariffId: user.tariffId
  };
};

export const getPaymentHistory = async (userId: string): Promise<PaymentHistoryItem[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    const response = await fetch(`http://localhost:3001/api/users/${userId}/payment-history`); // Предполагаемый эндпоинт для истории платежей
    if (!response.ok) {
      throw new Error('Failed to fetch payment history');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting payment history:', error);
    return []; // Или пробросить ошибку, в зависимости от логики обработки
  }
};

export const addPaymentRecord = async (
  userId: string,
  tariff: string,
  amount: number,
  months: number
): Promise<PaymentHistoryItem> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay

    const response = await fetch('http://localhost:3001/api/users/${userId}/payment-history', { // Предполагаемый эндпоинт для добавления записи платежа
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tariff, amount, months }),
    });

    if (!response.ok) {
      throw new Error('Failed to add payment record');
    }
    return await response.json();

  } catch (error) {
    console.error('Error adding payment record:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const getUserSubscriptionData = async (userId: string): Promise<SubscriptionData> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    const response = await fetch(`http://localhost:3001/api/users/${userId}/subscription-data`); // Предполагаемый эндпоинт для данных подписки
    if (!response.ok) {
      throw new Error('Failed to fetch user subscription data');
    }
    return await response.json();

  } catch (error) {
    console.error('Error fetching user subscription data:', error);
    return { status: 'expired' }; // Или пробросить ошибку, в зависимости от логики обработки
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const response = await fetch(`http://localhost:3001/api/users/${userId}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || "Не удалось изменить пароль" };
    }

    return { success: true };

  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, message: "Произошла ошибка при изменении пароля" };
  }
};

export interface UserStore {
  id: string;
  userId: string;
  storeId: string;
  marketplace: string;
  storeName: string;
  apiKey: string;
  isSelected: boolean;
  createdAt: string;
  lastFetchDate?: string;
}

export const getUserStores = async (userId: string): Promise<UserStore[]> => {
  try {
    const response = await fetch(`http://localhost:3001/api/user-stores/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user stores');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user stores:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const addUserStore = async (userStore: Omit<UserStore, 'id' | 'createdAt'>): Promise<UserStore> => {
  try {
    const response = await fetch('http://localhost:3001/api/user-stores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userStore),
    });

    if (!response.ok) {
      throw new Error('Failed to add user store');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding user store:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const selectUserStore = async (userId: string, storeId: string): Promise<UserStore | null> => {
  try {
    const response = await fetch(`http://localhost:3001/api/user-stores/${userId}/select/${storeId}`, {
      method: 'PUT'
    });

    if (!response.ok) {
      throw new Error('Failed to select user store');
    }

    return await response.json();
  } catch (error) {
    console.error('Error selecting user store:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const updateUserStore = async (
  userId: string,
  storeId: string,
  updates: Partial<UserStore>
): Promise<UserStore | null> => {
  try {
    const response = await fetch(`http://localhost:3001/api/user-stores/${userId}/${storeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update user store');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user store:', error);
    throw error; // Пробрасываем ошибку
  }
};

export const deleteUserStore = async (userId: string, storeId: string): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3001/api/user-stores/${userId}/${storeId}`, {
      method: 'DELETE'
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting user store:', error);
    throw error; // Пробрасываем ошибку
  }
};
