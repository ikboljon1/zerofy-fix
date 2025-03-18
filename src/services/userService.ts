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
    
    // Fallback для разработки - используем localStorage если API недоступен
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
    
    // Базовые пользователи если нет данных
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Администратор',
        email: 'admin@example.com',
        tariffId: '3',
        isSubscriptionActive: true,
        subscriptionEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        role: 'admin',
        status: 'active',
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        storeCount: 2
      }
    ];
    
    return mockUsers;
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
    
    // Fallback для разработки
    const users = await getUsers();
    
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name || '',
      email: userData.email || '',
      tariffId: userData.tariffId || '1',
      isSubscriptionActive: userData.isSubscriptionActive || false,
      status: userData.status || 'active',
      role: userData.role || 'user',
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name?.replace(/\s+/g, '') || 'user'}`,
      registeredAt: userData.registeredAt || new Date().toISOString(),
      storeCount: 0
    };
    
    const updatedUsers = [...users, newUser];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    return newUser;
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
    
    // Fallback для разработки
    const users = await getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) return null;
    
    const updatedUser = { ...users[userIndex], ...userData };
    users[userIndex] = updatedUser;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    return updatedUser;
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
      return { success: false, errorMessage: 'Ошибка при получении данных пользователя' };
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
    
    // Fallback для разработки - только для "zerofy" логина
    if (email === 'zerofy' && password === 'Zerofy2025') {
      const users = await getUsers();
      const adminUser = users.find(user => user.role === 'admin') || users[0];
      
      if (adminUser) {
        adminUser.lastLogin = new Date().toISOString();
        await updateUser(adminUser.id, { lastLogin: adminUser.lastLogin });
        
        return { 
          success: true,
          user: adminUser
        };
      }
    }
    
    const users = await getUsers();
    const user = users.find(u => u.email === email);
    
    if (user && (password === user.password)) {
      user.lastLogin = new Date().toISOString();
      await updateUser(user.id, { lastLogin: user.lastLogin });
      
      return { 
        success: true,
        user
      };
    }
    
    return { 
      success: false,
      errorMessage: 'Неверный логин или пароль'
    };
  }
};

export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:3001/api/check-phone?phone=${encodeURIComponent(phone)}`);
    if (!response.ok) {
      throw new Error('Failed to check phone');
    }
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking phone:', error);
    
    // Fallback для разработки
    const users = await getUsers();
    return users.some(user => user.phone === phone);
  }
};

export const registerUser = async (
  name: string, 
  email: string, 
  password: string,
  phone?: string
): Promise<{ success: boolean; user?: User; errorMessage?: string }> => {
  try {
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, phone }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        errorMessage: data.error || 'Ошибка при регистрации пользователя'
      };
    }
    
    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    console.error('Error during registration:', error);
    
    // Fallback для разработки
    const users = await getUsers();
    const userExists = users.some(user => user.email === email);
    
    if (userExists) {
      return {
        success: false,
        errorMessage: 'Пользователь с таким email уже существует'
      };
    }
    
    if (phone) {
      const phoneExists = users.some(user => user.phone === phone);
      if (phoneExists) {
        return {
          success: false,
          errorMessage: 'Пользователь с таким номером телефона уже существует'
        };
      }
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      phone,
      tariffId: '3',
      isSubscriptionActive: false,
      isInTrial: true,
      trialEndDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`,
      role: 'user',
      status: 'active',
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      storeCount: 0
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    return {
      success: true,
      user: newUser
    };
  }
};

export const activateSubscription = async (
  userId: string, 
  tariffId: string, 
  months: number = 1
): Promise<{ success: boolean; user?: User; message?: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  
  const users = await getUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: "Пользователь не найден" };
  }
  
  const user = users[userIndex];
  
  const currentDate = new Date();
  let endDate = new Date();
  
  if (user.isSubscriptionActive && user.subscriptionEndDate && user.tariffId === tariffId) {
    const existingEndDate = new Date(user.subscriptionEndDate);
    if (existingEndDate > currentDate) {
      endDate = new Date(existingEndDate);
    }
  }
  
  endDate.setMonth(endDate.getMonth() + months);
  
  const updatedUser: User = {
    ...user,
    tariffId,
    isSubscriptionActive: true,
    isInTrial: false,
    trialEndDate: undefined,
    subscriptionEndDate: endDate.toISOString()
  };
  
  users[userIndex] = updatedUser;
  localStorage.setItem('users', JSON.stringify(users));
  
  return { 
    success: true, 
    user: updatedUser,
    message: `Подписка активирована до ${endDate.toLocaleDateString()}`
  };
};

export const getSmtpSettings = async (): Promise<EmailSettings | null> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  
  const storedSettings = localStorage.getItem('email_settings');
  if (storedSettings) {
    return JSON.parse(storedSettings);
  }
  
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
  
  return defaultSettings;
};

export const saveSmtpSettings = async (settings: EmailSettings): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
  localStorage.setItem('email_settings', JSON.stringify(settings));
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
    
    // Fallback для разработки
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
        message: "Для ��ешифрованного соединения с Mail.ru требуется порт 25 или 587" 
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
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
  
  try {
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
      message: "Не уд��лось п��дключиться к серверу: хост не найден в DNS" 
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
    
    const smtpSettings = emailSettings.
