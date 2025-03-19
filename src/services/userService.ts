
import axios from 'axios';

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

// Тестирование SMTP соединения
export const testSmtpConnection = async (settings: SmtpSettings): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post('http://localhost:3001/api/test-smtp-connection', settings);
    return response.data;
  } catch (error) {
    console.error('Error testing SMTP connection:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при тестировании SMTP соединения'
    };
  }
};

// Тестирование POP3 соединения
export const testPop3Connection = async (settings: Pop3Settings): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post('http://localhost:3001/api/test-pop3-connection', settings);
    return response.data;
  } catch (error) {
    console.error('Error testing POP3 connection:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Ошибка при тестировании POP3 соединения'
    };
  }
};

// Получение настроек SMTP
export const getSmtpSettings = async (): Promise<EmailSettings | null> => {
  try {
    const response = await axios.get('http://localhost:3001/api/email-settings');
    return response.data;
  } catch (error) {
    console.error('Error getting SMTP settings:', error);
    return null;
  }
};

// Сохранение настроек SMTP
export const saveSmtpSettings = async (settings: EmailSettings): Promise<boolean> => {
  try {
    await axios.post('http://localhost:3001/api/email-settings/save', settings);
    return true;
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    throw error;
  }
};

// API для обновления метода верификации
export const updateVerificationMethod = async (method: 'email' | 'phone', enabled: boolean): Promise<boolean> => {
  try {
    await axios.put('http://localhost:3001/api/settings/verification-method', { method, enabled });
    return true;
  } catch (error) {
    console.error('Error updating verification method:', error);
    throw error;
  }
};

// API для получения метода верификации
export const getVerificationMethod = async (): Promise<{ method: 'email' | 'phone', enabled: boolean }> => {
  try {
    const response = await axios.get('http://localhost:3001/api/settings/verification-method');
    return response.data;
  } catch (error) {
    console.error('Error getting verification method:', error);
    // По умолчанию возвращаем email и включено
    return { method: 'email', enabled: true };
  }
};
