const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Создание базы данных и таблиц
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Обновляем таблицу users добавляя необходимые поля
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    phone TEXT UNIQUE,
    company TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    subscription_type TEXT DEFAULT 'free',
    subscription_expiry DATETIME,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    store_count INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS email_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    smtp_host TEXT NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_user TEXT NOT NULL,
    smtp_password TEXT NOT NULL,
    pop3_host TEXT NOT NULL,
    pop3_port INTEGER NOT NULL,
    pop3_user TEXT NOT NULL,
    pop3_password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expiry DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    payment_date DATETIME NOT NULL,
    amount REAL NOT NULL,
    subscription_type TEXT NOT NULL,
    payment_method TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Создаем таблицы для хранения данных от API
  db.run(`CREATE TABLE IF NOT EXISTS store_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    date_from TEXT NOT NULL,
    date_to TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )`);

  // Таблица для хранения заказов
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    date_from TEXT NOT NULL,
    date_to TEXT NOT NULL,
    orders TEXT NOT NULL,
    warehouse_distribution TEXT NOT NULL,
    region_distribution TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )`);

  // Таблица для хранения продаж
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    date_from TEXT NOT NULL,
    date_to TEXT NOT NULL,
    sales TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )`);

  // Таблица для хранения данных о товарах
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    products TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )`);

  // Таблица для хранения детальной аналитики
  db.run(`CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    date_from TEXT NOT NULL,
    date_to TEXT NOT NULL,
    data TEXT NOT NULL,
    penalties TEXT NOT NULL,
    returns TEXT NOT NULL,
    deductions TEXT NOT NULL,
    deductions_timeline TEXT NOT NULL,
    product_advertising_data TEXT NOT NULL,
    advertising_breakdown TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )`);

  // Таблица для хранения данных о себестоимости
  db.run(`CREATE TABLE IF NOT EXISTS cost_price (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    total_cost_price REAL NOT NULL,
    total_sold_items INTEGER NOT NULL,
    avg_cost_price REAL NOT NULL,
    last_update_date TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  )`);

  // Обновляем таблицу user_stores для хранения связи пользователей с магазинами
  db.run(`CREATE TABLE IF NOT EXISTS user_stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    store_id TEXT NOT NULL,
    marketplace TEXT NOT NULL,
    store_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_fetch_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, store_id)
  )`);
  
  // Обновляем таблицу product_advertising добавляя поле user_id
  db.run(`CREATE TABLE IF NOT EXISTS product_advertising (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    user_id INTEGER,
    product_advertising_data TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Добавляем таблицу для настроек приложения
  db.run(`CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Проверим, есть ли настройка верификации, если нет - добавим со значением по умолчанию (email)
  db.get("SELECT * FROM app_settings WHERE setting_name = 'verification_method'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO app_settings (setting_name, setting_value) VALUES ('verification_method', 'email')");
    }
  });
});

// Регистрация пользователя
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  const query = 'INSERT INTO users (email, password) VALUES (?, ?)';
  db.run(query, [email, password], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
    }
    res.json({ id: this.lastID });
  });
});

// Авторизация пользователя
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }
  const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.get(query, [email, password], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при авторизации' });
    }
    if (!row) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    res.json({ id: row.id, email: row.email, role: row.role, status: row.status });
  });
});

// Получение информации о пользователе по ID
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT id, email, role, status, subscription_type, subscription_expiry FROM users WHERE id = ?';
  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при получении информации о пользователе' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json(row);
  });
});

// Обновление информации о пользователе
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { role, status, subscription_type, subscription_expiry } = req.body;
  
    // Проверяем, что хотя бы одно из полей для обновления присутствует в запросе
    if (!role && !status && !subscription_type && !subscription_expiry) {
      return res.status(400).json({ error: 'Необходимо указать хотя бы одно поле для обновления' });
    }
  
    let query = 'UPDATE users SET ';
    const updates = [];
    const values = [];
  
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (subscription_type) {
      updates.push('subscription_type = ?');
      values.push(subscription_type);
    }
    if (subscription_expiry) {
      updates.push('subscription_expiry = ?');
      values.push(subscription_expiry);
    }
  
    query += updates.join(', ');
    query += ' WHERE id = ?';
    values.push(userId);
  
    db.run(query, values, function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Ошибка при обновлении информации о пользователе' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      res.json({ message: 'Информация о пользователе успешно обновлена' });
    });
  });

// Настройка SMTP
app.post('/api/email-settings', (req, res) => {
  const { smtp_host, smtp_port, smtp_user, smtp_password, pop3_host, pop3_port, pop3_user, pop3_password } = req.body;
  const query = `INSERT INTO email_settings (smtp_host, smtp_port, smtp_user, smtp_password, pop3_host, pop3_port, pop3_user, pop3_password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(query, [smtp_host, smtp_port, smtp_user, smtp_password, pop3_host, pop3_port, pop3_user, pop3_password], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при настройке SMTP' });
    }
    res.json({ id: this.lastID });
  });
});

// Получение настроек SMTP
app.get('/api/email-settings', (req, res) => {
  db.get('SELECT * FROM email_settings ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при получении настроек SMTP' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Настройки SMTP не найдены' });
    }
    res.json(row);
  });
});

// Запрос на сброс пароля
app.post('/api/password-reset-request', (req, res) => {
  const { email } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  db.get(query, [email], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при запросе на сброс пароля' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }

    // Генерация токена и сохранение в базе данных
    const token = require('crypto').randomBytes(20).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // Токен действителен 1 час
    const insertQuery = 'INSERT INTO password_reset_tokens (user_id, token, expiry) VALUES (?, ?, ?)';
    db.run(insertQuery, [row.id, token, expiry.toISOString()], function(insertErr) {
      if (insertErr) {
        console.error(insertErr);
        return res.status(500).json({ error: 'Ошибка при сохранении токена сброса пароля' });
      }

      // Отправка email с токеном
      db.get('SELECT * FROM email_settings ORDER BY id DESC LIMIT 1', (emailSettingsErr, emailSettings) => {
        if (emailSettingsErr) {
          console.error(emailSettingsErr);
          return res.status(500).json({ error: 'Ошибка при получении настроек SMTP' });
        }
        if (!emailSettings) {
          return res.status(400).json({ error: 'Настройки SMTP не найдены' });
        }

        const transporter = nodemailer.createTransport({
          host: emailSettings.smtp_host,
          port: emailSettings.smtp_port,
          secure: true,
          auth: {
            user: emailSettings.smtp_user,
            pass: emailSettings.smtp_password
          }
        });

        const mailOptions = {
          from: emailSettings.smtp_user,
          to: email,
          subject: 'Сброс пароля',
          text: `Для сброса пароля перейдите по ссылке: http://localhost:3000/reset-password/${token}`
        };

        transporter.sendMail(mailOptions, (sendErr, info) => {
          if (sendErr) {
            console.error(sendErr);
            return res.status(500).json({ error: 'Ошибка при отправке email' });
          }
          console.log('Email sent: ' + info.response);
          res.json({ message: 'Инструкции по сбросу пароля отправлены на ваш email' });
        });
      });
    });
  });
});

// Сброс пароля
app.post('/api/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  const query = 'SELECT * FROM password_reset_tokens WHERE token = ? AND expiry > ?';
  db.get(query, [token, new Date().toISOString()], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при сбросе пароля' });
    }
    if (!row) {
      return res.status(400).json({ error: 'Неверный или устаревший токен' });
    }

    // Обновление пароля пользователя
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
    db.run(updateQuery, [newPassword, row.user_id], function(updateErr) {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ error: 'Ошибка при обновлении пароля' });
      }

      // Удаление токена из базы данных
      const deleteQuery = 'DELETE FROM password_reset_tokens WHERE token = ?';
      db.run(deleteQuery, [token], function(deleteErr) {
        if (deleteErr) {
          console.error(deleteErr);
          return res.status(500).json({ error: 'Ошибка при удалении токена сброса пароля' });
        }

        res.json({ message: 'Пароль успешно сброшен' });
      });
    });
  });
});

// История платежей
app.post('/api/payment-history', (req, res) => {
  const { user_id, payment_date, amount, subscription_type, payment_method } = req.body;
  const query = `INSERT INTO payment_history (user_id, payment_date, amount, subscription_type, payment_method)
                 VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [user_id, payment_date, amount, subscription_type, payment_method], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при добавлении записи в историю платежей' });
    }
    res.json({ id: this.lastID });
  });
});

// Получение истории платежей пользователя
app.get('/api/payment-history/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const query = 'SELECT * FROM payment_history WHERE user_id = ?';
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Ошибка при получении истории платежей' });
    }
    res.json(rows);
  });
});

// API для работы с данными от Wildberries
// Сохранение статистики магазина
app.post('/api/store-stats', (req, res) => {
  const { storeId, dateFrom, dateTo, data } = req.body;
  
  if (!storeId || !data) {
    return res.status(400).json({ error: 'Необходимо указать storeId и data' });
  }

  const timestamp = Date.now();
  const query = `INSERT INTO store_stats (store_id, date_from, date_to, data, timestamp) 
                 VALUES (?, ?, ?, ?, ?)`;
  
  db.run(query, [storeId, dateFrom, dateTo, JSON.stringify(data), timestamp], function(err) {
    if (err) {
      console.error('Error saving store stats:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении статистики магазина' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Получение статистики магазина
app.get('/api/store-stats/:storeId', (req, res) => {
  const { storeId } = req.params;
  
  db.get('SELECT * FROM store_stats WHERE store_id = ? ORDER BY timestamp DESC LIMIT 1', [storeId], (err, row) => {
    if (err) {
      console.error('Error getting store stats:', err);
      return res.status(500).json({ error: 'Ошибка при получении статистики магазина' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Статистика не найдена' });
    }

    try {
      row.data = JSON.parse(row.data);
      res.json(row);
    } catch (e) {
      console.error('Error parsing JSON data:', e);
      res.status(500).json({ error: 'Ошибка при обработке данных' });
    }
  });
});

// Сохранение заказов
app.post('/api/orders', (req, res) => {
  const { storeId, dateFrom, dateTo, orders, warehouseDistribution, regionDistribution } = req.body;
  
  if (!storeId || !orders) {
    return res.status(400).json({ error: 'Необходимо указать storeId и orders' });
  }

  const timestamp = Date.now();
  const query = `INSERT INTO orders (store_id, date_from, date_to, orders, warehouse_distribution, region_distribution, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [
    storeId, 
    dateFrom, 
    dateTo, 
    JSON.stringify(orders), 
    JSON.stringify(warehouseDistribution || []), 
    JSON.stringify(regionDistribution || []), 
    timestamp
  ], function(err) {
    if (err) {
      console.error('Error saving orders:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении заказов' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Получение заказов
app.get('/api/orders/:storeId', (req, res) => {
  const { storeId } = req.params;
  
  db.get('SELECT * FROM orders WHERE store_id = ? ORDER BY timestamp DESC LIMIT 1', [storeId], (err, row) => {
    if (err) {
      console.error('Error getting orders:', err);
      return res.status(500).json({ error: 'Ошибка при получении заказов' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Заказы не найдены' });
    }

    try {
      row.orders = JSON.parse(row.orders);
      row.warehouse_distribution = JSON.parse(row.warehouse_distribution);
      row.region_distribution = JSON.parse(row.region_distribution);
      res.json(row);
    } catch (e) {
      console.error('Error parsing JSON data:', e);
      res.status(500).json({ error: 'Ошибка при обработке данных' });
    }
  });
});

// Сохранение продаж
app.post('/api/sales', (req, res) => {
  const { storeId, dateFrom, dateTo, sales } = req.body;
  
  if (!storeId || !sales) {
    return res.status(400).json({ error: 'Необходимо указать storeId и sales' });
  }

  const timestamp = Date.now();
  const query = `INSERT INTO sales (store_id, date_from, date_to, sales, timestamp) 
                 VALUES (?, ?, ?, ?, ?)`;
  
  db.run(query, [storeId, dateFrom, dateTo, JSON.stringify(sales), timestamp], function(err) {
    if (err) {
      console.error('Error saving sales:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении продаж' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Получение продаж
app.get('/api/sales/:storeId', (req, res) => {
  const { storeId } = req.params;
  
  db.get('SELECT * FROM sales WHERE store_id = ? ORDER BY timestamp DESC LIMIT 1', [storeId], (err, row) => {
    if (err) {
      console.error('Error getting sales:', err);
      return res.status(500).json({ error: 'Ошибка при получении продаж' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Продажи не найдены' });
    }

    try {
      row.sales = JSON.parse(row.sales);
      res.json(row);
    } catch (e) {
      console.error('Error parsing JSON data:', e);
      res.status(500).json({ error: 'Ошибка при обработке данных' });
    }
  });
});

// Сохранение товаров
app.post('/api/products', (req, res) => {
  const { storeId, products } = req.body;
  
  if (!storeId || !products) {
    return res.status(400).json({ error: 'Необходимо указать storeId и products' });
  }

  const timestamp = Date.now();
  const query = `INSERT INTO products (store_id, products, timestamp) 
                 VALUES (?, ?, ?)`;
  
  db.run(query, [storeId, JSON.stringify(products), timestamp], function(err) {
    if (err) {
      console.error('Error saving products:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении товаров' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Получение товаров
app.get('/api/products/:storeId', (req, res) => {
  const { storeId } = req.params;
  
  db.get('SELECT * FROM products WHERE store_id = ? ORDER BY timestamp DESC LIMIT 1', [storeId], (err, row) => {
    if (err) {
      console.error('Error getting products:', err);
      return res.status(500).json({ error: 'Ошибка при получении товаров' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Товары не найдены' });
    }

    try {
      row.products = JSON.parse(row.products);
      res.json(row);
    } catch (e) {
      console.error('Error parsing JSON data:', e);
      res.status(500).json({ error: 'Ошибка при обработке данных' });
    }
  });
});

// Сохранение аналитики
app.post('/api/analytics', (req, res) => {
  const { 
    storeId, 
    dateFrom, 
    dateTo, 
    data, 
    penalties, 
    returns, 
    deductions,
    deductionsTimeline, 
    productAdvertisingData, 
    advertisingBreakdown 
  } = req.body;
  
  if (!storeId || !data) {
    return res.status(400).json({ error: 'Необходимо указать storeId и data' });
  }

  const timestamp = Date.now();
  const query = `INSERT INTO analytics (
    store_id, date_from, date_to, data, penalties, returns, deductions,
    deductions_timeline, product_advertising_data, advertising_breakdown, timestamp
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [
    storeId, 
    dateFrom, 
    dateTo, 
    JSON.stringify(data), 
    JSON.stringify(penalties || []), 
    JSON.stringify(returns || []),
    JSON.stringify(deductions || []),
    JSON.stringify(deductionsTimeline || []), 
    JSON.stringify(productAdvertisingData || []), 
    JSON.stringify(advertisingBreakdown || {}),
    timestamp
  ], function(err) {
    if (err) {
      console.error('Error saving analytics:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении аналитики' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Получение аналитики
app.get('/api/analytics/:storeId', (req, res) => {
  const { storeId } = req.params;
  
  db.get('SELECT * FROM analytics WHERE store_id = ? ORDER BY timestamp DESC LIMIT 1', [storeId], (err, row) => {
    if (err) {
      console.error('Error getting analytics:', err);
      return res.status(500).json({ error: 'Ошибка при получении аналитики' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Аналитика не найдена' });
    }

    try {
      row.data = JSON.parse(row.data);
      row.penalties = JSON.parse(row.penalties);
      row.returns = JSON.parse(row.returns);
      row.deductions = JSON.parse(row.deductions);
      row.deductions_timeline = JSON.parse(row.deductions_timeline);
      row.product_advertising_data = JSON.parse(row.product_advertising_data);
      row.advertising_breakdown = JSON.parse(row.advertising_breakdown);
      res.json(row);
    } catch (e) {
      console.error('Error parsing JSON data:', e);
      res.status(500).json({ error: 'Ошибка при обработке данных' });
    }
  });
});

// API для работы с данными о себестоимости
app.post('/api/cost-price', (req, res) => {
  const { storeId, totalCostPrice, totalSoldItems, avgCostPrice, lastUpdateDate } = req.body;
  
  if (!storeId) {
    return res.status(400).json({ error: 'Необходимо указать storeId' });
  }

  const timestamp = Date.now();
  const query = `INSERT INTO cost_price (store_id, total_cost_price, total_sold_items, avg_cost_price, last_update_date, timestamp) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [storeId, totalCostPrice, totalSoldItems, avgCostPrice, lastUpdateDate, timestamp], function(err) {
    if (err) {
      console.error('Error saving cost price data:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении данных о себестоимости' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Получение данных о себестоимости
app.get('/api/cost-price/:storeId', (req, res) => {
  const { storeId } = req.params;
  
  db.get('SELECT * FROM cost_price WHERE store_id = ? ORDER BY timestamp DESC LIMIT 1', [storeId], (err, row) => {
    if (err) {
      console.error('Error getting cost price data:', err);
      return res.status(500).json({ error: 'Ошибка при получении данных о себестоимости' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Данные о себестоимости не найдены' });
    }

    res.json({
      totalCostPrice: row.total_cost_price,
      totalSoldItems: row.total_sold_items,
      avgCostPrice: row.avg_cost_price,
      lastUpdateDate: row.last_update_date
    });
  });
});

// API для работы с данными о рекламе товаров
app.post('/api/product-advertising', (req, res) => {
  const { storeId, userId, productAdvertisingData } = req.body;
  
  if (!storeId || !productAdvertisingData) {
    return res.status(400).json({ error: 'Необходимо указать storeId и productAdvertisingData' });
  }

  const timestamp = Date.now();
  const query = `INSERT INTO product_advertising (store_id, user_id, product_advertising_data, timestamp) 
                 VALUES (?, ?, ?, ?)`;
  
  db.run(query, [storeId, userId, JSON.stringify(productAdvertisingData), timestamp], function(err) {
    if (err) {
      console.error('Error saving product advertising data:', err);
      return res.status(500).json({ error: 'Ошибка при сохранении данных о рекламе товаров' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Получение данных о рекламе товаров
app.get('/api/product-advertising/:storeId', (req, res) => {
  const { storeId } = req.params;
  const { userId } = req.query;
  
  let query = 'SELECT * FROM product_advertising WHERE store_id = ?';
  let params = [storeId];

  // Если передан userId, добавляем его в условие запроса
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  
  query += ' ORDER BY timestamp DESC LIMIT 1';
  
  db.get(query, params, (err, row) => {
    if (err) {
      console.error('Error getting product advertising data:', err);
      return res.status(500).json({ error: 'Ошибка при получении данных о рекламе товаров' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Данные о рекламе товаров не найдены' });
    }

    try {
      row.product_advertising_data = JSON.parse(row.product_advertising_data);
      res.json({
        storeId: row.store_id,
        productAdvertisingData: row.product_advertising_data,
        timestamp: row.timestamp
      });
    } catch (e) {
      console.error('Error parsing JSON data:', e);
      res.status(500).json({ error: 'Ошибка при обработке данных' });
    }
  });
});

// API для управления магазинами пользователя
app.post('/api/user-stores', (req, res) => {
  const { userId, storeId, marketplace, storeName, apiKey, isSelected, lastFetchDate } = req.body;
  
  if (!userId || !storeId || !marketplace || !storeName || !apiKey) {
    return res.status(400).json({ error: 'Необходимо указать userId, storeId, marketplace, storeName и apiKey' });
  }

  const query = `INSERT OR REPLACE INTO user_stores 
                (user_id, store_id, marketplace, store_name, api_key, is_selected, last_fetch_date)
