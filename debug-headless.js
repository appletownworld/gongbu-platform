#!/usr/bin/env node

/**
 * 🔍 Headless отладка Gongbu Mini App
 * Анализ без браузера для WSL/серверных сред
 */

const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class HeadlessGongbuDebugger {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      timestamp: new Date().toISOString(),
      success: false,
      accessibility: {},
      performance: {},
      seo: {},
      errors: [],
      html: null,
      scripts: []
    };
  }

  async fetchPage(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      client.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            html: data
          });
        });
      }).on('error', reject);
    });
  }

  analyzeHTML(html) {
    console.log('🔍 Анализ HTML структуры...');
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const analysis = {
      title: document.title || 'No title',
      metaTags: Array.from(document.querySelectorAll('meta')).length,
      headings: {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length
      },
      elements: {
        total: document.querySelectorAll('*').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        forms: document.querySelectorAll('form').length,
        images: document.querySelectorAll('img').length,
        inputs: document.querySelectorAll('input').length
      },
      scripts: Array.from(document.querySelectorAll('script')).map(script => ({
        src: script.src || 'inline',
        type: script.type || 'text/javascript'
      })),
      stylesheets: Array.from(document.querySelectorAll('link[rel=\"stylesheet\"]')).length,
      react: {
        root: !!document.querySelector('#root'),
        viteHMR: html.includes('/@vite/client'),
        reactRefresh: html.includes('@react-refresh')
      }
    };
    
    console.log('📄 HTML Анализ:');
    console.log(`  📝 Заголовок: "${analysis.title}"`);
    console.log(`  📊 Всего элементов: ${analysis.elements.total}`);
    console.log(`  🔗 Ссылок: ${analysis.elements.links}`);
    console.log(`  🔘 Кнопок: ${analysis.elements.buttons}`);
    console.log(`  📋 Форм: ${analysis.elements.forms}`);
    console.log(`  🖼️ Изображений: ${analysis.elements.images}`);
    console.log(`  📄 Скриптов: ${analysis.scripts.length}`);
    console.log(`  🎨 CSS файлов: ${analysis.stylesheets}`);
    console.log(`  ⚛️ React Root: ${analysis.react.root ? '✅' : '❌'}`);
    console.log(`  🔥 Vite HMR: ${analysis.react.viteHMR ? '✅' : '❌'}`);
    
    return analysis;
  }

  checkAccessibility(document) {
    console.log('♿ Проверка доступности...');
    
    const accessibility = {
      missingAlt: document.querySelectorAll('img:not([alt])').length,
      missingLabels: document.querySelectorAll('input:not([aria-label]):not([id])').length,
      headingStructure: this.checkHeadingStructure(document),
      colorContrast: this.estimateContrast(document),
      focusable: document.querySelectorAll('[tabindex]').length
    };
    
    console.log('♿ Доступность:');
    console.log(`  🖼️ Изображения без alt: ${accessibility.missingAlt}`);
    console.log(`  🏷️ Поля без меток: ${accessibility.missingLabels}`);
    console.log(`  📋 Структура заголовков: ${accessibility.headingStructure ? '✅' : '⚠️'}`);
    console.log(`  🎯 Focusable элементы: ${accessibility.focusable}`);
    
    return accessibility;
  }

  checkHeadingStructure(document) {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    const levels = headings.map(h => parseInt(h.tagName[1]));
    
    // Проверяем логическую структуру заголовков
    let prevLevel = 0;
    for (const level of levels) {
      if (level - prevLevel > 1 && prevLevel !== 0) {
        return false; // Пропущен уровень
      }
      prevLevel = level;
    }
    return true;
  }

  estimateContrast(document) {
    // Упрощенная проверка контрастности на основе CSS
    const styles = document.querySelectorAll('style, link[rel=\"stylesheet\"]');
    let hasGoodContrast = false;
    
    // Это упрощенная эвристика
    if (styles.length > 0) {
      hasGoodContrast = true; // Предполагаем, что CSS настроен правильно
    }
    
    return hasGoodContrast;
  }

  checkSEO(document) {
    console.log('🔍 SEO анализ...');
    
    const seo = {
      title: !!document.querySelector('title'),
      metaDescription: !!document.querySelector('meta[name=\"description\"]'),
      metaKeywords: !!document.querySelector('meta[name=\"keywords\"]'),
      ogTags: document.querySelectorAll('meta[property^=\"og:\"]').length,
      canonicalUrl: !!document.querySelector('link[rel=\"canonical\"]'),
      robotsMeta: !!document.querySelector('meta[name=\"robots\"]'),
      structuredData: document.querySelectorAll('script[type=\"application/ld+json\"]').length
    };
    
    console.log('🔍 SEO:');
    console.log(`  📝 Title тег: ${seo.title ? '✅' : '❌'}`);
    console.log(`  📄 Meta description: ${seo.metaDescription ? '✅' : '❌'}`);
    console.log(`  🏷️ Meta keywords: ${seo.metaKeywords ? '✅' : '❌'}`);
    console.log(`  📱 Open Graph теги: ${seo.ogTags}`);
    console.log(`  🔗 Canonical URL: ${seo.canonicalUrl ? '✅' : '❌'}`);
    console.log(`  🤖 Robots meta: ${seo.robotsMeta ? '✅' : '❌'}`);
    
    return seo;
  }

  async checkAPIsHealth() {
    console.log('🌐 Проверка API здоровья...');
    
    const apis = [
      '/api/health',
      '/api/courses',
      '/api/auth/me'
    ];
    
    const results = {};
    
    for (const api of apis) {
      try {
        const response = await this.fetchPage(`${this.baseUrl}${api}`);
        results[api] = {
          status: response.statusCode,
          healthy: response.statusCode < 400
        };
        console.log(`  ${api}: ${response.statusCode} ${results[api].healthy ? '✅' : '❌'}`);
      } catch (error) {
        results[api] = {
          status: 'error',
          healthy: false,
          error: error.message
        };
        console.log(`  ${api}: ❌ ${error.message}`);
      }
    }
    
    return results;
  }

  estimatePerformance(html, headers) {
    console.log('⚡ Оценка производительности...');
    
    const performance = {
      htmlSize: Buffer.byteLength(html, 'utf8'),
      gzipEnabled: headers['content-encoding']?.includes('gzip'),
      cacheHeaders: !!(headers['cache-control'] || headers['etag'] || headers['last-modified']),
      scriptCount: (html.match(/<script/g) || []).length,
      styleCount: (html.match(/<link[^>]*rel="stylesheet"/g) || []).length,
      imageCount: (html.match(/<img/g) || []).length
    };
    
    console.log('⚡ Производительность:');
    console.log(`  📏 Размер HTML: ${(performance.htmlSize / 1024).toFixed(2)} KB`);
    console.log(`  🗜️ GZIP сжатие: ${performance.gzipEnabled ? '✅' : '❌'}`);
    console.log(`  💾 Заголовки кэша: ${performance.cacheHeaders ? '✅' : '❌'}`);
    console.log(`  📄 Скриптов: ${performance.scriptCount}`);
    console.log(`  🎨 CSS файлов: ${performance.styleCount}`);
    console.log(`  🖼️ Изображений: ${performance.imageCount}`);
    
    return performance;
  }

  async generateReport() {
    const reportPath = path.join(__dirname, 'debug-reports', 
      `headless-debug-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📄 Полный отчет сохранен: ${reportPath}`);
    return reportPath;
  }

  async runFullAnalysis() {
    console.log('\n🚀 ========== HEADLESS ОТЛАДКА GONGBU MINI APP ==========\n');
    
    try {
      // 1. Загрузка страницы
      console.log(`📍 Загрузка страницы ${this.baseUrl}...`);
      const response = await this.fetchPage(this.baseUrl);
      
      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}: страница недоступна`);
      }
      
      console.log(`✅ Страница загружена (${response.statusCode})`);
      
      // 2. Создание DOM
      const dom = new JSDOM(response.html);
      const document = dom.window.document;
      
      // 3. Анализы
      const htmlAnalysis = this.analyzeHTML(response.html);
      const accessibility = this.checkAccessibility(document);
      const seo = this.checkSEO(document);
      const performance = this.estimatePerformance(response.html, response.headers);
      const apiHealth = await this.checkAPIsHealth();
      
      // 4. Сборка результатов
      this.results = {
        ...this.results,
        success: true,
        html: htmlAnalysis,
        accessibility,
        seo,
        performance,
        apiHealth,
        responseHeaders: response.headers
      };
      
      console.log('\n✅ =============== АНАЛИЗ ЗАВЕРШЕН УСПЕШНО ===============');
      
    } catch (error) {
      console.error('\n❌ =============== ОШИБКА АНАЛИЗА ===============');
      console.error('Ошибка:', error.message);
      this.results.errors.push(error.message);
    }
    
    // 5. Генерация отчета
    await this.generateReport();
    
    return this.results;
  }
}

// Проверка зависимостей и запуск
async function checkAndInstallDeps() {
  try {
    require('jsdom');
  } catch (error) {
    console.log('📦 Устанавливаем jsdom...');
    const { execSync } = require('child_process');
    execSync('npm install jsdom', { stdio: 'inherit' });
    console.log('✅ jsdom установлен');
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  (async () => {
    try {
      await checkAndInstallDeps();
      
      const analyzer = new HeadlessGongbuDebugger();
      const results = await analyzer.runFullAnalysis();
      
      console.log('\n📊 ИТОГОВЫЙ РЕЗУЛЬТАТ:');
      console.log(`✅ Успех: ${results.success}`);
      console.log(`📄 HTML элементов: ${results.html?.elements?.total || 'N/A'}`);
      console.log(`⚛️ React приложение: ${results.html?.react?.root ? '✅' : '❌'}`);
      console.log(`🔥 Vite HMR: ${results.html?.react?.viteHMR ? '✅' : '❌'}`);
      console.log(`♿ Доступность: ${results.accessibility?.missingAlt === 0 ? '✅' : '⚠️'}`);
      console.log(`🔍 SEO готовность: ${results.seo?.title ? '✅' : '❌'}`);
      console.log(`❌ Ошибок: ${results.errors.length}`);
      
    } catch (error) {
      console.error('💥 Критическая ошибка:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = HeadlessGongbuDebugger;
