#!/usr/bin/env node

const axios = require('axios');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

class GongbuSiteChecker {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.authApiUrl = 'http://localhost:3001/api/v1';
    this.courseApiUrl = 'http://localhost:3002/api/v1';
    this.reportDir = path.join(__dirname, 'site-check-reports');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir);
    }
  }

  async checkPage(url, expectedTitle = null) {
    try {
      console.log(`\n📍 Проверяю страницу: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.status === 200) {
        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const title = document.title;
        
        console.log(`  ✅ Статус: ${response.status}`);
        console.log(`  📝 Заголовок: "${title}"`);
        
        if (expectedTitle && title.includes(expectedTitle)) {
          console.log(`  🎯 Ожидаемый заголовок найден!`);
        }
        
        // Проверим основные элементы React приложения
        const reactRoot = document.getElementById('root');
        const viteClient = response.data.includes('/@vite/client');
        
        console.log(`  ⚛️ React Root: ${reactRoot ? '✅' : '❌'}`);
        console.log(`  🔥 Vite HMR: ${viteClient ? '✅' : '❌'}`);
        
        return { success: true, status: response.status, title, data: response.data };
      } else {
        console.log(`  ❌ Неожиданный статус: ${response.status}`);
        return { success: false, status: response.status, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async checkApi(url, expectedStatus = 200, description = '') {
    try {
      console.log(`\n🌐 Проверяю API: ${url} ${description}`);
      const response = await axios.get(url, { 
        timeout: 5000,
        validateStatus: () => true // Не выбрасывать ошибку на non-2xx статусы
      });
      
      const isSuccess = response.status === expectedStatus;
      console.log(`  ${isSuccess ? '✅' : '❌'} Статус: ${response.status} (ожидался ${expectedStatus})`);
      
      if (response.data && typeof response.data === 'object') {
        console.log(`  📊 Данные: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
      
      return { success: isSuccess, status: response.status, data: response.data };
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async runFullCheck() {
    console.log('🚀 ========== ПОЛНАЯ ПРОВЕРКА САЙТА GONGBU ==========');
    
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      pages: {},
      apis: {},
      summary: { total: 0, success: 0, failed: 0 }
    };

    // Проверка основных страниц
    const pagesToCheck = [
      { url: `${this.baseUrl}/`, title: 'Gongbu', name: 'home' },
      { url: `${this.baseUrl}/about`, title: 'О платформе', name: 'about' },
      { url: `${this.baseUrl}/contact`, title: 'Свяжитесь с нами', name: 'contact' },
      { url: `${this.baseUrl}/courses`, title: 'Курсы', name: 'courses' },
      { url: `${this.baseUrl}/dashboard`, title: 'Dashboard', name: 'dashboard' },
      { url: `${this.baseUrl}/profile`, title: 'Profile', name: 'profile' },
      { url: `${this.baseUrl}/nonexistent`, title: null, name: '404_test' } // Проверка 404
    ];

    console.log('\n🔸 ========== ПРОВЕРКА СТРАНИЦ ==========');
    for (const page of pagesToCheck) {
      const result = await this.checkPage(page.url, page.title);
      report.pages[page.name] = result;
      report.summary.total++;
      if (result.success) {
        report.summary.success++;
      } else {
        report.summary.failed++;
      }
    }

    // Проверка API endpoints
    const apisToCheck = [
      { url: `${this.authApiUrl}/health`, status: 200, desc: '(Auth Service Health)' },
      { url: `${this.courseApiUrl}/health`, status: 200, desc: '(Course Service Health)' },
      { url: `${this.courseApiUrl}/courses`, status: 200, desc: '(Courses List)' },
      { url: `${this.authApiUrl}/auth/me`, status: 401, desc: '(Auth Check - 401 expected)' },
      { url: `${this.courseApiUrl}/courses/nonexistent`, status: 404, desc: '(Non-existent course - 404 expected)' }
    ];

    console.log('\n🔸 ========== ПРОВЕРКА API ==========');
    for (const api of apisToCheck) {
      const result = await this.checkApi(api.url, api.status, api.desc);
      report.apis[api.url] = result;
      report.summary.total++;
      if (result.success) {
        report.summary.success++;
      } else {
        report.summary.failed++;
      }
    }

    // Специальные проверки
    console.log('\n🔸 ========== СПЕЦИАЛЬНЫЕ ПРОВЕРКИ ==========');
    
    // Проверка, что главная страница содержит React
    if (report.pages.home && report.pages.home.data) {
      const hasReact = report.pages.home.data.includes('react');
      const hasVite = report.pages.home.data.includes('@vite/client');
      console.log(`📦 React упоминается: ${hasReact ? '✅' : '❌'}`);
      console.log(`⚡ Vite клиент найден: ${hasVite ? '✅' : '❌'}`);
    }

    // Проверка времени отклика
    console.log('\n⏱️ Проверка времени отклика:');
    const start = Date.now();
    await this.checkPage(this.baseUrl);
    const responseTime = Date.now() - start;
    console.log(`  🚀 Время отклика главной страницы: ${responseTime}ms`);
    report.responseTime = responseTime;

    // Сохранение отчета
    const filename = `site-check-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const filepath = path.join(this.reportDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    // Итоговый отчет
    console.log('\n📊 ========== ИТОГОВЫЙ ОТЧЕТ ==========');
    console.log(`✅ Успешных проверок: ${report.summary.success}/${report.summary.total}`);
    console.log(`❌ Неудачных проверок: ${report.summary.failed}/${report.summary.total}`);
    console.log(`⚡ Время отклика: ${responseTime}ms`);
    console.log(`📄 Отчет сохранен: ${filepath}`);

    const successRate = (report.summary.success / report.summary.total * 100).toFixed(1);
    console.log(`🎯 Процент успеха: ${successRate}%`);

    if (report.summary.failed === 0) {
      console.log('\n🎉 ВСЕ ПРОВЕРКИ ПРОШЛИ УСПЕШНО!');
    } else {
      console.log(`\n⚠️ Найдены проблемы в ${report.summary.failed} проверках`);
    }

    return report;
  }
}

// Запуск, если скрипт вызван напрямую
if (require.main === module) {
  const checker = new GongbuSiteChecker();
  checker.runFullCheck()
    .then(report => {
      console.log('\n✅ Проверка завершена');
      process.exit(report.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = GongbuSiteChecker;
