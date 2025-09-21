#!/usr/bin/env node

/**
 * 🎭 DEMO TELEGRAM BOT SERVER
 * 
 * Демонстрационный сервер, который симулирует работу Telegram бота
 * и показывает интеграцию с Mini App
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3005;
const MINI_APP_URL = 'http://localhost:3001/telegram-mini-app';

app.use(express.json());
app.use(express.static('public'));

console.log('🎭 Запуск Demo Telegram Bot Server...');
console.log('📱 Mini App URL:', MINI_APP_URL);

// Имитируем данные Telegram пользователя
const mockUsers = [
  {
    id: 123456789,
    first_name: 'Демо',
    last_name: 'Пользователь',
    username: 'demo_user',
    language_code: 'ru'
  },
  {
    id: 987654321,
    first_name: 'Test',
    last_name: 'User',
    username: 'test_user',
    language_code: 'en'
  }
];

// Главная страница демо
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎭 Demo Telegram Bot - Gongbu</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
        }
        h1 { margin-bottom: 30px; }
        .status {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        .status.online { border-left: 4px solid #4CAF50; }
        .btn {
            display: inline-block;
            padding: 15px 30px;
            margin: 10px;
            background: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #1976D2;
            transform: translateY(-2px);
        }
        .btn.success { background: #4CAF50; }
        .btn.success:hover { background: #45a049; }
        .integration-demo {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 15px;
        }
        .user-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .iframe-container {
            margin: 20px 0;
            border-radius: 15px;
            overflow: hidden;
            height: 600px;
            background: white;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 Demo Telegram Bot Server</h1>
        <p>Демонстрация интеграции Telegram бота с Mini App</p>
        
        <div class="status online">
            <span><strong>📱 Telegram Mini App:</strong></span>
            <span>✅ ONLINE на порту 3001</span>
        </div>
        
        <div class="status online">
            <span><strong>🎭 Demo Bot Server:</strong></span>
            <span>✅ ONLINE на порту ${PORT}</span>
        </div>
        
        <div class="integration-demo">
            <h3>🔗 Демонстрация интеграции</h3>
            <p>Выберите пользователя для входа в Mini App:</p>
            
            ${mockUsers.map(user => `
                <div class="user-card">
                    <div>
                        <strong>${user.first_name} ${user.last_name}</strong><br>
                        <small>@${user.username} (${user.language_code})</small>
                    </div>
                    <a href="${MINI_APP_URL}/?user_id=${user.id}&first_name=${user.first_name}&last_name=${user.last_name}&username=${user.username}" 
                       class="btn success" target="_blank">
                        🚀 Открыть Mini App
                    </a>
                </div>
            `).join('')}
        </div>
        
        <div class="iframe-container">
            <h3>📱 Предварительный просмотр Mini App:</h3>
            <iframe src="${MINI_APP_URL}/" title="Telegram Mini App Preview"></iframe>
        </div>
        
        <div style="margin-top: 30px;">
            <a href="/api/status" class="btn">📊 API Status</a>
            <a href="/api/webhook" class="btn">🔗 Webhook Info</a>
            <a href="${MINI_APP_URL}/" class="btn success" target="_blank">📱 Open Mini App</a>
        </div>
        
        <div style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
            <p>🔧 <strong>Техническая информация:</strong></p>
            <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                <li>Mini App работает на localhost:3001</li>
                <li>Demo Bot Server на localhost:${PORT}</li>
                <li>Интеграция через WebApp API</li>
                <li>Поддержка 3 языков (EN, KO, RU)</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `;
  res.send(html);
});

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    bot_status: 'online',
    mini_app_url: MINI_APP_URL,
    server_time: new Date().toISOString(),
    users: mockUsers.length,
    version: '1.0.0-demo'
  });
});

app.get('/api/webhook', (req, res) => {
  res.json({
    webhook_url: `http://localhost:${PORT}/webhook`,
    status: 'active',
    mini_app_integration: 'enabled',
    supported_languages: ['en', 'ko', 'ru']
  });
});

// Webhook endpoint (симуляция)
app.post('/webhook', (req, res) => {
  console.log('📨 Webhook получен:', JSON.stringify(req.body, null, 2));
  res.json({ ok: true, status: 'received' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Demo Bot Server запущен на http://localhost:${PORT}`);
  console.log(`📱 Telegram Mini App: ${MINI_APP_URL}`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
  console.log('\n🎉 Откройте http://localhost:' + PORT + ' в браузере для демонстрации!');
});
