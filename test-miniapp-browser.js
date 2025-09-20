#!/usr/bin/env node

/**
 * 🚀 Тест Telegram Mini-App через браузер
 * Проверяет основную функциональность StudentApp
 */

const puppeteer = require('puppeteer');

async function testMiniApp() {
  console.log('🚀 Запуск тестирования Telegram Mini-App...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,  // Показать браузер
    defaultViewport: { width: 375, height: 667 } // iPhone размер
  });
  
  const page = await browser.newPage();
  
  // Эмулировать мобильное устройство
  await page.emulate(puppeteer.devices['iPhone 12']);
  
  console.log('📱 Эмуляция iPhone 12...');
  console.log('🌐 Открытие Mini-App...');
  
  try {
    // Тест 1: Открытие страницы
    console.log('\n✅ Тест 1: Загрузка страницы');
    await page.goto('https://gongbu.appletownworld.com/student/python-basics', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    await page.waitForTimeout(2000);
    console.log('   ✅ Страница загружена успешно');
    
    // Тест 2: Проверка основных элементов
    console.log('\n✅ Тест 2: Проверка элементов интерфейса');
    
    const title = await page.$eval('h1, .course-title', el => el.textContent).catch(() => null);
    if (title) {
      console.log(`   ✅ Заголовок курса найден: "${title}"`);
    } else {
      console.log('   ⚠️  Заголовок курса не найден');
    }
    
    const progressBar = await page.$('.progress, [class*="progress"]').catch(() => null);
    if (progressBar) {
      console.log('   ✅ Прогресс-бар найден');
    } else {
      console.log('   ⚠️  Прогресс-бар не найден');
    }
    
    // Тест 3: Проверка Telegram интеграции
    console.log('\n✅ Тест 3: Telegram WebApp API');
    
    const telegramAPI = await page.evaluate(() => {
      return {
        hasTelegram: !!window.Telegram,
        hasWebApp: !!window.Telegram?.WebApp,
        isExpanded: window.Telegram?.WebApp?.isExpanded || false,
        viewportHeight: window.Telegram?.WebApp?.viewportHeight || 0
      };
    });
    
    if (telegramAPI.hasTelegram) {
      console.log('   ✅ Telegram API доступен');
      console.log(`   📱 WebApp: ${telegramAPI.hasWebApp ? 'Да' : 'Нет'}`);
      console.log(`   📏 Высота: ${telegramAPI.viewportHeight}px`);
    } else {
      console.log('   ℹ️  Telegram API недоступен (нормально в браузере)');
    }
    
    // Тест 4: Скриншот
    console.log('\n✅ Тест 4: Создание скриншота');
    await page.screenshot({ 
      path: 'miniapp-test-screenshot.png',
      fullPage: true 
    });
    console.log('   ✅ Скриншот сохранен: miniapp-test-screenshot.png');
    
    // Тест 5: Интерактивность
    console.log('\n✅ Тест 5: Тестирование кнопок');
    
    const buttons = await page.$$('button');
    console.log(`   🔘 Найдено кнопок: ${buttons.length}`);
    
    if (buttons.length > 0) {
      // Попробовать кликнуть на первую кнопку
      const buttonText = await buttons[0].evaluate(el => el.textContent);
      console.log(`   🔘 Тестирование кнопки: "${buttonText}"`);
      
      try {
        await buttons[0].click();
        await page.waitForTimeout(1000);
        console.log('   ✅ Клик прошел успешно');
      } catch (error) {
        console.log(`   ⚠️  Ошибка клика: ${error.message}`);
      }
    }
    
    // Тест 6: Проверка ошибок консоли
    console.log('\n✅ Тест 6: Проверка ошибок JavaScript');
    
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (logs.length === 0) {
      console.log('   ✅ Ошибок JavaScript не найдено');
    } else {
      console.log('   ⚠️  Найдены ошибки:');
      logs.forEach(log => console.log(`      ${log}`));
    }
    
    console.log('\n🎉 Тестирование завершено!');
    console.log('📊 Результаты:');
    console.log(`   • Страница загружена: ✅`);
    console.log(`   • Элементы найдены: ${title && progressBar ? '✅' : '⚠️'}`);
    console.log(`   • JavaScript работает: ${logs.length === 0 ? '✅' : '⚠️'}`);
    console.log(`   • Скриншот создан: ✅`);
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
  
  console.log('\n🔍 Браузер остается открытым для ручного тестирования...');
  console.log('   Нажмите Ctrl+C когда закончите');
  
  // Держим браузер открытым для ручного тестирования
  await new Promise(resolve => {
    process.on('SIGINT', () => {
      console.log('\n👋 Закрытие браузера...');
      browser.close();
      resolve();
    });
  });
}

// Запуск тестов
testMiniApp().catch(console.error);
