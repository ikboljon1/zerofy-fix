
-- Создаем начальную структуру базы данных

-- Обновленная таблица настроек email
CREATE TABLE IF NOT EXISTS email_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL,
  smtp_user TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  smtp_secure INTEGER DEFAULT 1,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  pop3_host TEXT,
  pop3_port INTEGER,
  pop3_user TEXT,
  pop3_password TEXT,
  pop3_secure INTEGER DEFAULT 1,
  leave_on_server INTEGER DEFAULT 1,
  auto_check_interval INTEGER DEFAULT 15
);

-- Настройки приложения
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_name TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем базовые настройки верификации
INSERT OR IGNORE INTO app_settings (setting_name, setting_value) VALUES ('verification_method', 'email');
INSERT OR IGNORE INTO app_settings (setting_name, setting_value) VALUES ('verification_enabled', 'true');
