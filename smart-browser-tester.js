#!/usr/bin/env node

/**
 * 🔍 Умный браузерный тестер для Gongbu
 * Имитирует поведение пользователя в браузере без необходимости Chrome
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

class SmartBrowserTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.session = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    this.testResults = {
      timestamp: new Date().toISOString(),
      baseUrl,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  // Тестирует конкретную страницу как настоящий пользователь
  async testPage(path, expectedElements = {}) {
    console.log(`\n🌐 Тестирую страницу: ${this.baseUrl}${path}`);
    
    const test = {
      path,
      url: `${this.baseUrl}${path}`,
      status: 'unknown',
      httpStatus: null,
      title: null,
      isNotFound: false,
      reactComponents: false,
      interactiveElements: {
        links: 0,
        buttons: 0,
        forms: 0,
        inputs: 0
      },
      contentChecks: {
        hasMainContent: false,
        hasNavigation: false,
        hasFooter: false,
        contentWords: 0
      },
      performance: {
        loadTime: 0,
        htmlSize: 0
      },
      issues: [],
      warnings: []
    };

    const startTime = Date.now();
    
    try {
      // Делаем HTTP запрос
      const response = await this.session.get(`${this.baseUrl}${path}`);
      test.httpStatus = response.status;
      test.performance.loadTime = Date.now() - startTime;
      test.performance.htmlSize = Buffer.byteLength(response.data, 'utf8');

      // Парсим HTML
      const dom = new JSDOM(response.data, { 
        url: `${this.baseUrl}${path}`,
        resources: 'usable',
        runScripts: 'outside-only'
      });
      const document = dom.window.document;

      // Базовые проверки
      test.title = document.title;
      console.log(`  📄 Заголовок: "${test.title}"`);
      
      // Проверка на 404 (NotFoundPage)
      const bodyText = document.body.textContent.toLowerCase();
      test.isNotFound = bodyText.includes('404') || 
                      bodyText.includes('not found') || 
                      bodyText.includes('страница не найдена') ||
                      bodyText.includes('страница не существует');

      if (test.isNotFound) {
        test.status = 'failed';
        test.issues.push('Показывается 404 NotFoundPage вместо реального контента');
        console.log(`  ❌ ПРОБЛЕМА: Страница показывает 404!`);
      } else {
        console.log(`  ✅ Статус: ${test.httpStatus} (реальная страница)`);
      }

      // React проверки
      test.reactComponents = !!document.getElementById('root');
      const scripts = Array.from(document.querySelectorAll('script'));
      const hasViteHMR = scripts.some(s => s.src && s.src.includes('@vite/client'));
      
      if (!test.reactComponents) {
        test.warnings.push('React root элемент не найден');
      }

      // Анализ интерактивных элементов
      test.interactiveElements.links = document.querySelectorAll('a[href]').length;
      test.interactiveElements.buttons = document.querySelectorAll('button').length;
      test.interactiveElements.forms = document.querySelectorAll('form').length;
      test.interactiveElements.inputs = document.querySelectorAll('input, textarea, select').length;

      console.log(`  🔗 Ссылок: ${test.interactiveElements.links}`);
      console.log(`  🔘 Кнопок: ${test.interactiveElements.buttons}`);
      console.log(`  📝 Форм: ${test.interactiveElements.forms}`);

      // Контентный анализ
      const textContent = document.body.textContent || '';
      test.contentChecks.contentWords = textContent.trim().split(/\s+/).length;
      test.contentChecks.hasMainContent = textContent.length > 200; // Минимум 200 символов
      test.contentChecks.hasNavigation = document.querySelector('nav') !== null;
      test.contentChecks.hasFooter = document.querySelector('footer') !== null;

      console.log(`  📝 Слов контента: ${test.contentChecks.contentWords}`);
      console.log(`  🧭 Навигация: ${test.contentChecks.hasNavigation ? '✅' : '❌'}`);
      console.log(`  🦶 Футер: ${test.contentChecks.hasFooter ? '✅' : '❌'}`);

      // Проверка специфического контента
      this.checkSpecificContent(test, path, textContent);

      // Финальная оценка
      if (!test.isNotFound && test.contentChecks.hasMainContent) {
        test.status = 'passed';
        console.log(`  🎉 УСПЕХ: Страница работает корректно`);
      } else if (!test.isNotFound) {
        test.status = 'warning';
        test.warnings.push('Мало контента на странице');
        console.log(`  ⚠️ ПРЕДУПРЕЖДЕНИЕ: Страница загружается, но мало контента`);
      }

      // Performance warnings
      if (test.performance.loadTime > 2000) {
        test.warnings.push(`Медленная загрузка: ${test.performance.loadTime}ms`);
      }
      
      if (test.performance.htmlSize > 50000) {
        test.warnings.push(`Большой размер HTML: ${Math.round(test.performance.htmlSize/1024)}KB`);
      }

    } catch (error) {
      test.status = 'failed';
      test.issues.push(`Ошибка загрузки: ${error.message}`);
      console.log(`  ❌ ОШИБКА: ${error.message}`);
    }

    // Обновляем статистику
    this.testResults.tests.push(test);
    this.testResults.summary.total++;
    
    if (test.status === 'passed') this.testResults.summary.passed++;
    else if (test.status === 'failed') this.testResults.summary.failed++;
    else if (test.status === 'warning') this.testResults.summary.warnings++;

    return test;
  }

  // Проверяет специфический контент страницы
  checkSpecificContent(test, path, textContent) {
    const contentLower = textContent.toLowerCase();
    
    const expectations = {
      '/about': ['платформа', 'gongbu', 'корейск', 'образован'],
      '/courses': ['курс', 'изучен', 'корейск'],
      '/contact': ['контакт', 'связь', 'поддержк'],
      '/instructors': ['преподавател', 'учител', 'эксперт'],
      '/certificates': ['сертификат', 'подтвержден'],
      '/help': ['помощь', 'поддержк', 'вопрос'],
      '/faq': ['вопрос', 'ответ', 'faq'],
      '/pricing': ['цен', 'стоимост', 'тариф'],
      '/privacy': ['конфиденциальност', 'данных', 'приватност'],
      '/terms': ['условия', 'правила', 'соглашение'],
      '/report': ['проблем', 'отчет', 'ошибк'],
      '/status': ['статус', 'сервис', 'работ']
    };

    const expectedWords = expectations[path];
    if (expectedWords) {
      const foundWords = expectedWords.filter(word => contentLower.includes(word));
      const expectedCount = expectedWords.length;
      const foundCount = foundWords.length;
      
      console.log(`  🎯 Ключевые слова: ${foundCount}/${expectedCount} найдено`);
      
      if (foundCount === 0) {
        test.issues.push(`Отсутствуют ключевые слова для ${path}`);
      } else if (foundCount < expectedCount / 2) {
        test.warnings.push(`Мало релевантного контента для ${path}`);
      }
    }
  }

  // Тестирует все ключевые страницы
  async testAllPages() {
    console.log('🚀 ========== УМНОЕ БРАУЗЕРНОЕ ТЕСТИРОВАНИЕ ==========\n');
    
    const pagesToTest = [
      // Главные страницы
      { path: '/', name: 'Главная страница' },
      
      // Группа "Платформа" 
      { path: '/about', name: 'О платформе' },
      { path: '/how-it-works', name: 'Как это работает' },
      { path: '/pricing', name: 'Цены' },
      { path: '/faq', name: 'FAQ' },
      
      // Группа "Обучение"
      { path: '/courses', name: 'Все курсы' },
      { path: '/categories', name: 'Категории' },
      { path: '/instructors', name: 'Преподаватели' },
      { path: '/certificates', name: 'Сертификаты' },
      
      // Группа "Поддержка"
      { path: '/help', name: 'Центр помощи' },
      { path: '/contact', name: 'Контакты' },
      { path: '/report', name: 'Сообщить о проблеме' },
      { path: '/status', name: 'Статус системы' },
      
      // Группа "Правовая информация"
      { path: '/privacy', name: 'Политика конфиденциальности' },
      { path: '/terms', name: 'Условия использования' },
      
      // Auth страницы
      { path: '/login', name: 'Вход' },
      { path: '/register', name: 'Регистрация' }
    ];

    for (const page of pagesToTest) {
      await this.testPage(page.path);
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.generateReport();
  }

  // Генерирует итоговый отчет
  generateReport() {
    const { summary, tests } = this.testResults;
    const successRate = summary.total > 0 ? (summary.passed / summary.total * 100).toFixed(1) : 0;
    
    console.log('\n📊 ========== ИТОГОВЫЙ ОТЧЕТ ==========');
    console.log(`\n📈 СТАТИСТИКА:`);
    console.log(`   ✅ Успешно: ${summary.passed}/${summary.total} (${successRate}%)`);
    console.log(`   ❌ Ошибки: ${summary.failed}/${summary.total}`);
    console.log(`   ⚠️ Предупреждения: ${summary.warnings}/${summary.total}`);

    // Проблемные страницы
    const failedTests = tests.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      console.log(`\n❌ ПРОБЛЕМНЫЕ СТРАНИЦЫ:`);
      failedTests.forEach(test => {
        console.log(`   ${test.path}: ${test.issues.join(', ')}`);
      });
    }

    // Страницы с предупреждениями
    const warningTests = tests.filter(t => t.status === 'warning');
    if (warningTests.length > 0) {
      console.log(`\n⚠️ СТРАНИЦЫ С ПРЕДУПРЕЖДЕНИЯМИ:`);
      warningTests.forEach(test => {
        console.log(`   ${test.path}: ${test.warnings.join(', ')}`);
      });
    }

    // Успешные страницы
    const passedTests = tests.filter(t => t.status === 'passed');
    if (passedTests.length > 0) {
      console.log(`\n✅ РАБОТАЮЩИЕ СТРАНИЦЫ:`);
      passedTests.forEach(test => {
        const interactiveCount = test.interactiveElements.links + test.interactiveElements.buttons;
        console.log(`   ${test.path}: ${test.contentChecks.contentWords} слов, ${interactiveCount} интерактивных элементов`);
      });
    }

    // Производительность
    const avgLoadTime = tests.reduce((sum, t) => sum + t.performance.loadTime, 0) / tests.length;
    console.log(`\n⚡ ПРОИЗВОДИТЕЛЬНОСТЬ:`);
    console.log(`   📊 Среднее время загрузки: ${Math.round(avgLoadTime)}ms`);
    
    const slowPages = tests.filter(t => t.performance.loadTime > 1000);
    if (slowPages.length > 0) {
      console.log(`   🐌 Медленные страницы: ${slowPages.map(t => `${t.path} (${t.performance.loadTime}ms)`).join(', ')}`);
    }

    // Сохранение отчета
    const reportPath = path.join(__dirname, 'test-reports', `browser-test-${new Date().toISOString().replace(/:/g, '-')}.json`);
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 Детальный отчет сохранен: ${reportPath}`);

    // Финальная оценка
    if (summary.failed === 0 && summary.passed > summary.total * 0.8) {
      console.log('\n🎉 ОТЛИЧНО! Большинство страниц работают корректно');
    } else if (summary.failed <= 2) {
      console.log('\n👍 ХОРОШО! Есть несколько проблем, но в целом сайт функционален');  
    } else {
      console.log('\n⚠️ ТРЕБУЕТ ВНИМАНИЯ! Много проблемных страниц');
    }

    return this.testResults;
  }
}

// Запуск если вызван напрямую
if (require.main === module) {
  const tester = new SmartBrowserTester();
  tester.testAllPages().catch(console.error);
}

module.exports = SmartBrowserTester;
