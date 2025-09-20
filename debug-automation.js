#!/usr/bin/env node

/**
 * 🔍 Автоматизированная отладка Gongbu Mini App
 * Использует Puppeteer для автоматического тестирования в браузере
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class GongbuDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3000';
  }

  async init() {
    console.log('🚀 Запуск автоматизированной отладки...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Показывать браузер для визуальной отладки
      devtools: true,  // Открыть DevTools
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Настройка viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Включаем логирование консоли
    this.page.on('console', msg => {
      console.log('📱 [BROWSER]:', msg.text());
    });
    
    // Перехват ошибок
    this.page.on('pageerror', err => {
      console.error('❌ [PAGE ERROR]:', err.message);
    });
    
    // Перехват network запросов
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.error(`🌐 [NETWORK ERROR]: ${response.status()} ${response.url()}`);
      }
    });
  }

  async navigateToApp() {
    console.log(`📍 Переходим на ${this.baseUrl}`);
    
    try {
      await this.page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      // Ждем загрузки React приложения
      await this.page.waitForSelector('#root', { timeout: 5000 });
      console.log('✅ Приложение загружено успешно');
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка загрузки приложения:', error.message);
      return false;
    }
  }

  async analyzePageStructure() {
    console.log('🔍 Анализ структуры страницы...');
    
    const pageInfo = await this.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyClasses: document.body.className,
        scripts: Array.from(document.scripts).length,
        stylesheets: Array.from(document.styleSheets).length,
        elements: {
          totalElements: document.querySelectorAll('*').length,
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          forms: document.querySelectorAll('form').length,
          images: document.querySelectorAll('img').length
        },
        reactRoot: !!document.querySelector('#root'),
        viteHMR: !!window.__vite_plugin_react_preamble_installed__
      };
    });
    
    console.log('📋 Информация о странице:', JSON.stringify(pageInfo, null, 2));
    return pageInfo;
  }

  async checkConsoleErrors() {
    console.log('🔍 Проверка ошибок консоли...');
    
    const logs = await this.page.evaluate(() => {
      // Перехватываем ошибки React
      const originalError = console.error;
      const errors = [];
      
      console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      return new Promise(resolve => {
        setTimeout(() => resolve(errors), 1000);
      });
    });
    
    if (logs.length > 0) {
      console.log('⚠️ Найденные ошибки консоли:');
      logs.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ Ошибок консоли не найдено');
    }
    
    return logs;
  }

  async testInteractivity() {
    console.log('🖱️ Тестирование интерактивности...');
    
    try {
      // Ищем интерактивные элементы
      const interactive = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
          type: 'button',
          text: btn.textContent.trim(),
          enabled: !btn.disabled
        }));
        
        const links = Array.from(document.querySelectorAll('a')).map(link => ({
          type: 'link',
          text: link.textContent.trim(),
          href: link.href
        }));
        
        return { buttons, links };
      });
      
      console.log('🔘 Найдено кнопок:', interactive.buttons.length);
      interactive.buttons.forEach(btn => 
        console.log(`  - "${btn.text}" (${btn.enabled ? 'активна' : 'неактивна'})`));
      
      console.log('🔗 Найдено ссылок:', interactive.links.length);
      interactive.links.slice(0, 5).forEach(link => 
        console.log(`  - "${link.text}" → ${link.href}`));
      
      return interactive;
    } catch (error) {
      console.error('❌ Ошибка при тестировании интерактивности:', error.message);
      return null;
    }
  }

  async takeScreenshot() {
    const screenshotPath = path.join(__dirname, 'debug-screenshots', 
      `gongbu-debug-${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
    
    // Создаем папку если её нет
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    
    await this.page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`📸 Скриншот сохранен: ${screenshotPath}`);
    return screenshotPath;
  }

  async runFullDiagnostic() {
    console.log('\n🚀 =========== АВТОМАТИЗИРОВАННАЯ ОТЛАДКА GONGBU ===========\n');
    
    const results = {
      timestamp: new Date().toISOString(),
      success: false,
      pageInfo: null,
      errors: [],
      interactive: null,
      screenshot: null
    };
    
    try {
      // 1. Инициализация браузера
      await this.init();
      
      // 2. Переход к приложению
      const loaded = await this.navigateToApp();
      if (!loaded) {
        throw new Error('Не удалось загрузить приложение');
      }
      
      // 3. Анализ структуры
      results.pageInfo = await this.analyzePageStructure();
      
      // 4. Проверка ошибок
      results.errors = await this.checkConsoleErrors();
      
      // 5. Тестирование интерактивности
      results.interactive = await this.testInteractivity();
      
      // 6. Скриншот
      results.screenshot = await this.takeScreenshot();
      
      results.success = true;
      
      console.log('\n✅ =============== ОТЛАДКА ЗАВЕРШЕНА УСПЕШНО ===============\n');
      
    } catch (error) {
      console.error('\n❌ =============== ОШИБКА ОТЛАДКИ ===============\n');
      console.error('Ошибка:', error.message);
      results.errors.push(error.message);
    }
    
    // Сохранение отчета
    const reportPath = path.join(__dirname, 'debug-reports', 
      `debug-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`📄 Отчет сохранен: ${reportPath}`);
    
    return results;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔚 Браузер закрыт');
    }
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  const autoDebugger = new GongbuDebugger();
  
  autoDebugger.runFullDiagnostic()
    .then(results => {
      console.log('\n📊 ИТОГОВЫЙ РЕЗУЛЬТАТ:');
      console.log(`✅ Успех: ${results.success}`);
      console.log(`📱 Элементы на странице: ${results.pageInfo?.elements.totalElements || 'N/A'}`);
      console.log(`❌ Ошибок найдено: ${results.errors.length}`);
      console.log(`🔘 Интерактивных элементов: ${
        (results.interactive?.buttons.length || 0) + (results.interactive?.links.length || 0)
      }`);
    })
    .catch(console.error)
    .finally(() => {
      setTimeout(() => {
        autoDebugger.close();
        process.exit(0);
      }, 5000); // Даем 5 секунд посмотреть результат
    });
}

module.exports = GongbuDebugger;
