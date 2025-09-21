#!/usr/bin/env node

/**
 * 🌐 Стартер для BrowserTools MCP Server
 * 
 * Запускает браузерный сервер для просмотра страниц через MCP
 * Альтернатива неработающему Puppeteer в WSL окружении
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 ========== ЗАПУСК BROWSERTOOLS MCP ==========\n');

// Информация для пользователя
console.log('📦 BrowserTools MCP - современное решение для браузерной автоматизации:');
console.log('   • Работает через расширение Chrome (не требует библиотек)');
console.log('   • Захват скриншотов и анализ DOM в реальном времени');
console.log('   • Проверки доступности, SEO, производительности');
console.log('   • Интеграция с Lighthouse для глубокого анализа');
console.log('   • Полная приватность - все данные локально');
console.log('');

console.log('⚙️ ТРЕБОВАНИЯ ДЛЯ РАБОТЫ:');
console.log('   1. 🌐 Установить расширение Chrome: BrowserTools MCP');
console.log('   2. 🔧 Запустить этот сервер (выполняется сейчас)');
console.log('   3. 🖥️ Открыть Chrome DevTools на нужной странице');
console.log('   4. 📊 Активировать панель BrowserTools MCP в DevTools');
console.log('');

console.log('🔗 ССЫЛКИ:');
console.log('   • Расширение: https://chrome.google.com/webstore/search/browsertools%20mcp');
console.log('   • Документация: https://mcpbro.com/ru/mcp/browsertools-mcp');
console.log('');

// Запускаем браузерный сервер
console.log('🎯 ЗАПУСК БРАУЗЕРНОГО СЕРВЕРА...\n');

const server = spawn('npx', ['@agentdeskai/browser-tools-server'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('error', (error) => {
  console.error('❌ Ошибка запуска браузерного сервера:', error.message);
  process.exit(1);
});

server.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Браузерный сервер завершен успешно');
  } else {
    console.log(`\n❌ Браузерный сервер завершен с кодом: ${code}`);
  }
});

// Обработка сигналов завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  server.kill('SIGTERM');
});
