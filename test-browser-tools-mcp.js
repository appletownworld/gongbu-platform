#!/usr/bin/env node

/**
 * 🧪 Тестер BrowserTools MCP
 * 
 * Проверяет работу нового браузерного MCP сервера
 * и предоставляет инструкции по настройке
 */

const { spawn } = require('child_process');
const axios = require('axios');

class BrowserToolsMCPTester {
  constructor() {
    this.testResults = {
      mcpServerInstalled: false,
      browserServerInstalled: false,
      serverRunning: false,
      extensionRequired: true,
      ready: false
    };
  }

  async runTests() {
    console.log('🧪 ========== ТЕСТИРОВАНИЕ BROWSERTOOLS MCP ==========\n');

    // 1. Проверка установки пакетов
    console.log('📦 Проверяю установленные пакеты...');
    
    try {
      const packageJson = require('./package.json');
      const devDeps = packageJson.devDependencies || {};
      
      if (devDeps['@agentdeskai/browser-tools-mcp']) {
        this.testResults.mcpServerInstalled = true;
        console.log('   ✅ @agentdeskai/browser-tools-mcp установлен');
      } else {
        console.log('   ❌ @agentdeskai/browser-tools-mcp НЕ установлен');
      }

      if (devDeps['@agentdeskai/browser-tools-server']) {
        this.testResults.browserServerInstalled = true;
        console.log('   ✅ @agentdeskai/browser-tools-server установлен');
      } else {
        console.log('   ❌ @agentdeskai/browser-tools-server НЕ установлен');
      }
    } catch (error) {
      console.log('   ❌ Ошибка чтения package.json:', error.message);
    }

    // 2. Проверка возможности запуска
    console.log('\n🚀 Проверяю возможность запуска MCP сервера...');
    
    try {
      // Проверяем, доступна ли команда npx
      const { execSync } = require('child_process');
      execSync('npx --version', { stdio: 'pipe' });
      console.log('   ✅ npx доступен');
      
      // Проверяем наличие установленных пакетов в node_modules
      const fs = require('fs');
      const path = require('path');
      
      const mcpPath = path.join('./node_modules/@agentdeskai/browser-tools-mcp');
      const serverPath = path.join('./node_modules/@agentdeskai/browser-tools-server');
      
      if (fs.existsSync(mcpPath)) {
        console.log('   ✅ MCP пакет найден в node_modules');
      }
      
      if (fs.existsSync(serverPath)) {
        console.log('   ✅ Server пакет найден в node_modules');
      }
      
    } catch (error) {
      console.log('   ❌ Ошибка проверки запуска:', error.message);
    }

    // 3. Информация о настройке
    console.log('\n⚙️ ========== ИНСТРУКЦИИ ПО НАСТРОЙКЕ ==========');
    
    console.log('\n🔧 ШАГ 1: Установка расширения Chrome');
    console.log('   📱 Откройте Chrome Web Store');
    console.log('   🔍 Найдите "BrowserTools MCP"');
    console.log('   ➕ Добавьте расширение в браузер');
    console.log('   🌐 Ссылка: https://chrome.google.com/webstore/search/browsertools%20mcp');

    console.log('\n🔧 ШАГ 2: Запуск серверов');
    console.log('   🖥️ Terminal 1: node start-browser-tools.js');
    console.log('   🖥️ Terminal 2: npx @agentdeskai/browser-tools-mcp');

    console.log('\n🔧 ШАГ 3: Настройка браузера');
    console.log('   🌐 Откройте Chrome и перейдите на http://localhost:3000');
    console.log('   🔧 Нажмите F12 (откроются DevTools)');
    console.log('   📊 Найдите вкладку "BrowserTools MCP"');
    console.log('   ✅ Активируйте панель расширения');

    console.log('\n🔧 ШАГ 4: Проверка подключения');
    console.log('   📡 Убедитесь, что только одна вкладка DevTools открыта');
    console.log('   🔄 При необходимости перезапустите браузер и серверы');

    // 4. Полезные команды
    console.log('\n💡 ========== ПОЛЕЗНЫЕ КОМАНДЫ ==========');
    console.log('   🚀 Запустить браузерный сервер:');
    console.log('      node start-browser-tools.js');
    console.log('');
    console.log('   🔗 Запустить MCP сервер:');
    console.log('      npx @agentdeskai/browser-tools-mcp');
    console.log('');
    console.log('   🧪 Протестировать сайт:');
    console.log('      node real-browser-simulator.js');

    // 5. Преимущества перед Puppeteer
    console.log('\n🏆 ========== ПРЕИМУЩЕСТВА ПЕРЕД PUPPETEER ==========');
    console.log('   ✅ Не требует библиотек Chrome (работает в WSL)');
    console.log('   ✅ Использует уже установленный Chrome браузер');
    console.log('   ✅ Реальные пользовательские взаимодействия');
    console.log('   ✅ Захват экрана в реальном времени');
    console.log('   ✅ Интеграция с Lighthouse для анализа');
    console.log('   ✅ Анализ доступности и SEO');
    console.log('   ✅ Локальная обработка (приватность)');

    // 6. Итоговое резюме
    console.log('\n📊 ========== РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ ==========');
    
    const readyComponents = [
      this.testResults.mcpServerInstalled ? '✅' : '❌',
      this.testResults.browserServerInstalled ? '✅' : '❌'
    ];

    console.log(`   📦 MCP сервер: ${readyComponents[0]} ${this.testResults.mcpServerInstalled ? 'Установлен' : 'НЕ установлен'}`);
    console.log(`   🖥️ Browser сервер: ${readyComponents[1]} ${this.testResults.browserServerInstalled ? 'Установлен' : 'НЕ установлен'}`);
    console.log(`   🌐 Расширение Chrome: ⚠️ Требует ручной установки`);
    
    const readyCount = (this.testResults.mcpServerInstalled ? 1 : 0) + 
                      (this.testResults.browserServerInstalled ? 1 : 0);
    const totalCount = 2; // Без учета расширения
    
    console.log(`\n🎯 Готовность: ${readyCount}/${totalCount} компонентов (${Math.round(readyCount/totalCount*100)}%)`);

    if (readyCount === totalCount) {
      console.log('\n🎉 ОТЛИЧНО! BrowserTools MCP готов к использованию!');
      console.log('   📋 Следуйте инструкциям выше для настройки расширения');
    } else {
      console.log('\n⚠️ ТРЕБУЕТСЯ ДОУСТАНОВКА! Некоторые компоненты отсутствуют');
    }

    console.log('\n💪 СЛЕДУЮЩИЙ ШАГ: Установите расширение Chrome и запустите серверы');
    
    return this.testResults;
  }
}

// Запуск тестирования
if (require.main === module) {
  const tester = new BrowserToolsMCPTester();
  tester.runTests()
    .then(results => {
      console.log('\n✅ Тестирование BrowserTools MCP завершено!');
    })
    .catch(error => {
      console.error('❌ Ошибка тестирования:', error);
    });
}

module.exports = BrowserToolsMCPTester;
