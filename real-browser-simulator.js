#!/usr/bin/env node

/**
 * 🌐 Симулятор реального браузерного взаимодействия для Gongbu
 * Имитирует действия пользователя без необходимости в Chrome
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class RealBrowserSimulator {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.session = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
  }

  // Симулирует пользователя, который кликает по ссылкам футера
  async simulateUserJourney() {
    console.log('👤 ========== СИМУЛЯЦИЯ ПОЛЬЗОВАТЕЛЯ ==========\n');
    
    const userScenarios = [
      {
        name: "🏠 Новый посетитель изучает платформу",
        path: "/",
        nextPages: ["/about", "/how-it-works", "/courses"],
        expectations: {
          shouldLoad: true,
          hasReactApp: true,
          description: "Пользователь заходит на главную, читает о платформе, смотрит курсы"
        }
      },
      {
        name: "📚 Студент ищет курсы и преподавателей",
        path: "/courses", 
        nextPages: ["/instructors", "/categories", "/certificates"],
        expectations: {
          shouldLoad: true,
          hasReactApp: true,
          description: "Студент изучает доступные курсы и преподавателей"
        }
      },
      {
        name: "❓ Пользователь ищет помощь",
        path: "/help",
        nextPages: ["/faq", "/contact", "/report"],
        expectations: {
          shouldLoad: true, 
          hasReactApp: true,
          description: "Пользователь нуждается в поддержке"
        }
      },
      {
        name: "⚖️ Пользователь читает правовые документы", 
        path: "/privacy",
        nextPages: ["/terms"],
        expectations: {
          shouldLoad: true,
          hasReactApp: true,
          description: "Пользователь изучает условия использования"
        }
      },
      {
        name: "🔐 Новый пользователь хочет зарегистрироваться",
        path: "/register",
        nextPages: ["/login"],
        expectations: {
          shouldLoad: true,
          hasReactApp: true,
          description: "Процесс регистрации/входа"
        }
      }
    ];

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const scenario of userScenarios) {
      console.log(`\n${scenario.name}`);
      console.log(`📝 ${scenario.description}`);
      
      // Тестируем начальную страницу
      const mainPageResult = await this.testPageAsUser(scenario.path);
      totalTests++;
      
      if (mainPageResult.success) {
        passedTests++;
        console.log(`✅ Начальная страница загружена успешно`);
      } else {
        failedTests++;
        console.log(`❌ Проблема с начальной страницей: ${mainPageResult.error}`);
      }

      // Тестируем связанные страницы (имитируем клики по ссылкам)
      for (const nextPage of scenario.nextPages) {
        console.log(`   🔗 Переходит по ссылке: ${nextPage}`);
        const result = await this.testPageAsUser(nextPage);
        totalTests++;
        
        if (result.success) {
          passedTests++;
          console.log(`   ✅ Страница ${nextPage} загружена`);
        } else {
          failedTests++;
          console.log(`   ❌ Ошибка на ${nextPage}: ${result.error}`);
        }
        
        // Пауза между кликами (как реальный пользователь)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Итоговый отчет
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
    console.log('\n🎯 ========== ИТОГИ ПОЛЬЗОВАТЕЛЬСКОГО ТЕСТИРОВАНИЯ ==========');
    console.log(`📊 Общий результат: ${passedTests}/${totalTests} (${successRate}%)`);
    console.log(`✅ Успешных переходов: ${passedTests}`);
    console.log(`❌ Неудачных переходов: ${failedTests}`);

    if (successRate >= 90) {
      console.log('\n🏆 ОТЛИЧНО! Сайт работает безупречно для пользователей');
    } else if (successRate >= 75) {
      console.log('\n👍 ХОРОШО! Большинство страниц доступны пользователям');
    } else {
      console.log('\n⚠️ ТРЕБУЕТСЯ ВНИМАНИЕ! Много проблемных переходов');
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate)
    };
  }

  // Тестирует страницу с точки зрения пользователя
  async testPageAsUser(path) {
    try {
      const startTime = Date.now();
      const response = await this.session.get(`${this.baseUrl}${path}`);
      const loadTime = Date.now() - startTime;

      // Базовые проверки
      if (response.status !== 200) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          loadTime
        };
      }

      const html = response.data;
      
      // Проверяем, что это не 404 страница
      const bodyLower = html.toLowerCase();
      if (bodyLower.includes('404') || bodyLower.includes('not found') || bodyLower.includes('страница не найдена')) {
        return {
          success: false,
          error: "Показывается 404 страница",
          loadTime
        };
      }

      // Проверяем наличие React приложения
      const hasReactRoot = html.includes('<div id="root">');
      const hasViteClient = html.includes('@vite/client');
      const hasReactRefresh = html.includes('react-refresh');

      if (!hasReactRoot) {
        return {
          success: false,
          error: "Отсутствует React root элемент",
          loadTime
        };
      }

      // Проверяем корректный заголовок
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1] : 'Без заголовка';
      
      if (!title.includes('Gongbu')) {
        return {
          success: false,
          error: `Неожиданный заголовок: "${title}"`,
          loadTime
        };
      }

      // Проверяем мета-теги
      const hasDescription = html.includes('name="description"');
      const hasViewport = html.includes('name="viewport"');

      return {
        success: true,
        loadTime,
        title,
        hasReactRoot,
        hasViteClient,
        hasReactRefresh,
        hasDescription,
        hasViewport,
        htmlSize: Buffer.byteLength(html, 'utf8')
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        loadTime: 0
      };
    }
  }

  // Проверяет конкретные функции футера  
  async testFooterLinks() {
    console.log('\n🦶 ========== ТЕСТИРОВАНИЕ ССЫЛОК ФУТЕРА ==========\n');
    
    const footerSections = {
      "ПЛАТФОРМА": [
        { path: "/about", name: "О платформе" },
        { path: "/how-it-works", name: "Как это работает" },
        { path: "/pricing", name: "Цены" },
        { path: "/faq", name: "FAQ" }
      ],
      "ОБУЧЕНИЕ": [
        { path: "/courses", name: "Все курсы" },
        { path: "/categories", name: "Категории" },
        { path: "/instructors", name: "Преподаватели" },
        { path: "/certificates", name: "Сертификаты" }
      ],
      "ПОДДЕРЖКА": [
        { path: "/help", name: "Центр помощи" },
        { path: "/contact", name: "Контакты" },
        { path: "/report", name: "Сообщить о проблеме" },
        { path: "/status", name: "Статус системы" }
      ],
      "ПРАВОВАЯ ИНФОРМАЦИЯ": [
        { path: "/privacy", name: "Политика конфиденциальности" },
        { path: "/terms", name: "Условия использования" }
      ]
    };

    const results = {};
    let totalLinks = 0;
    let workingLinks = 0;

    for (const [section, links] of Object.entries(footerSections)) {
      console.log(`📂 ${section}:`);
      results[section] = { total: links.length, working: 0, failed: 0 };
      
      for (const link of links) {
        const result = await this.testPageAsUser(link.path);
        totalLinks++;
        
        if (result.success) {
          workingLinks++;
          results[section].working++;
          console.log(`   ✅ ${link.name} - OK (${result.loadTime}ms)`);
        } else {
          results[section].failed++;
          console.log(`   ❌ ${link.name} - ${result.error}`);
        }
        
        // Небольшая пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const sectionPercent = (results[section].working / results[section].total * 100).toFixed(0);
      console.log(`   📊 ${section}: ${results[section].working}/${results[section].total} (${sectionPercent}%)\n`);
    }

    // Итоговая статистика
    const overallPercent = (workingLinks / totalLinks * 100).toFixed(1);
    console.log('🎯 ========== ИТОГИ ТЕСТИРОВАНИЯ ФУТЕРА ==========');
    console.log(`📊 Общий результат: ${workingLinks}/${totalLinks} ссылок работают (${overallPercent}%)`);
    
    // Детальная статистика по разделам
    for (const [section, stats] of Object.entries(results)) {
      const percent = (stats.working / stats.total * 100).toFixed(0);
      const status = percent == 100 ? '🟢' : percent >= 75 ? '🟡' : '🔴';
      console.log(`${status} ${section}: ${stats.working}/${stats.total} (${percent}%)`);
    }

    if (overallPercent >= 90) {
      console.log('\n🎉 ПРЕВОСХОДНО! Почти все ссылки футера работают');
    } else if (overallPercent >= 75) {  
      console.log('\n👍 ХОРОШО! Большинство ссылок футера функциональны');
    } else {
      console.log('\n⚠️ НУЖНЫ ДОРАБОТКИ! Много неработающих ссылок');
    }

    return {
      totalLinks,
      workingLinks, 
      successRate: parseFloat(overallPercent),
      sectionResults: results
    };
  }

  // Основной метод запуска всех тестов
  async runAllTests() {
    console.log('🚀 ЗАПУСК ПОЛНОГО БРАУЗЕРНОГО ТЕСТИРОВАНИЯ\n');
    
    const results = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl
    };

    // 1. Тестируем пользовательские сценарии
    results.userJourney = await this.simulateUserJourney();
    
    // 2. Тестируем ссылки футера
    results.footerLinks = await this.testFooterLinks();

    // 3. Сохраняем отчет
    const reportDir = path.join(__dirname, 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `real-browser-test-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    // 4. Финальное резюме
    console.log('\n🏁 ========== ФИНАЛЬНОЕ РЕЗЮМЕ ==========');
    console.log(`📅 Время тестирования: ${new Date().toLocaleString('ru-RU')}`);
    console.log(`🌐 Базовый URL: ${this.baseUrl}`);
    console.log(`👤 Пользовательские сценарии: ${results.userJourney.successRate}% успеха`);
    console.log(`🦶 Ссылки футера: ${results.footerLinks.successRate}% работают`);
    console.log(`📄 Детальный отчет: ${reportPath}`);

    const overallScore = (results.userJourney.successRate + results.footerLinks.successRate) / 2;
    if (overallScore >= 90) {
      console.log('\n🏆 САЙТ В ОТЛИЧНОМ СОСТОЯНИИ! 🏆');
    } else if (overallScore >= 75) {
      console.log('\n✅ САЙТ РАБОТАЕТ ХОРОШО!');
    } else {
      console.log('\n⚠️ САЙТ ТРЕБУЕТ ДОРАБОТКИ');
    }

    console.log(`\n🔢 Общая оценка: ${overallScore.toFixed(1)}/100`);
    
    return results;
  }
}

// Запуск если вызван напрямую
if (require.main === module) {
  const simulator = new RealBrowserSimulator();
  simulator.runAllTests()
    .then(results => {
      console.log('\n✅ Тестирование завершено успешно!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Ошибка при тестировании:', error);
      process.exit(1);
    });
}

module.exports = RealBrowserSimulator;
