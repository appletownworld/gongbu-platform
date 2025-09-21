const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * 🔍 МАКСИМАЛЬНО ТЩАТЕЛЬНАЯ ПРОВЕРКА НА 404 ОШИБКИ
 * 
 * Этот скрипт проверяет ВСЕ возможные ссылки и маршруты в проекте
 * чтобы найти любые 404 ошибки, которые могли быть пропущены.
 */

const BASE_URL = 'http://localhost:3000';

// Все ссылки из Footer.tsx
const footerLinks = {
  platform: [
    { name: 'О платформе', href: '/about' },
    { name: 'Как это работает', href: '/how-it-works' },
    { name: 'Цены', href: '/pricing' },
    { name: 'FAQ', href: '/faq' },
  ],
  learning: [
    { name: 'Все курсы', href: '/courses' },
    { name: 'Категории', href: '/categories' },
    { name: 'Преподаватели', href: '/instructors' },
    { name: 'Сертификаты', href: '/certificates' },
  ],
  support: [
    { name: 'Центр помощи', href: '/help' },
    { name: 'Контакты', href: '/contact' },
    { name: 'Сообщить о проблеме', href: '/report' },
    { name: 'Статус системы', href: '/status' },
  ],
  legal: [
    { name: 'Политика конфиденциальности', href: '/privacy' },
    { name: 'Условия использования', href: '/terms' },
    { name: 'Пользовательское соглашение', href: '/agreement' },
    { name: 'Cookies', href: '/cookies' },
  ],
};

// Все маршруты из App.tsx (извлекаем из кода)
const appRoutes = [
  // Public routes
  { name: 'Главная', href: '/' },
  { name: 'О платформе', href: '/about' },
  { name: 'Контакты', href: '/contact' },
  { name: 'Курсы', href: '/courses' },
  { name: 'Детали курса', href: '/courses/test-course' }, // Тестовый курс
  { name: 'Как это работает', href: '/how-it-works' },
  { name: 'Цены', href: '/pricing' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Категории', href: '/categories' },
  { name: 'Преподаватели', href: '/instructors' },
  { name: 'Сертификаты', href: '/certificates' },
  { name: 'Помощь', href: '/help' },
  { name: 'Сообщить о проблеме', href: '/report' },
  { name: 'Статус системы', href: '/status' },
  { name: 'Политика конфиденциальности', href: '/privacy' },
  { name: 'Условия использования', href: '/terms' },
  { name: 'Cookies', href: '/cookies' },
  
  // Auth routes
  { name: 'Вход', href: '/auth/login' },
  { name: 'Вход (старая)', href: '/login' },
  { name: 'Регистрация', href: '/auth/register' },
  { name: 'Регистрация (старая)', href: '/register' },
  { name: 'Доступ запрещен', href: '/access-denied' },
  
  // Protected routes (могут требовать аутентификации)
  { name: 'Панель управления', href: '/dashboard' },
  { name: 'Профиль', href: '/profile' },
  { name: 'Создать курс', href: '/create-course' },
  { name: 'Мои курсы', href: '/my-courses' },
  { name: 'Редактор курса', href: '/courses/test-course/edit' },
  { name: 'Студенческое приложение', href: '/student/test-course' },
  
  // 404 test
  { name: 'Несуществующая страница', href: '/nonexistent-page' },
];

// API endpoints
const apiEndpoints = [
  { name: 'Auth Health', href: '/api/v1/health', base: 'http://localhost:3001' },
  { name: 'Course Health', href: '/api/v1/health', base: 'http://localhost:3002' },
  { name: 'Courses List', href: '/api/v1/courses', base: 'http://localhost:3002' },
  { name: 'Auth Me', href: '/api/v1/auth/me', base: 'http://localhost:3001' },
  { name: 'Non-existent Course', href: '/api/v1/courses/nonexistent', base: 'http://localhost:3002' },
];

async function checkLink(link, baseUrl = BASE_URL) {
  try {
    const response = await axios.get(`${baseUrl}${link.href}`, {
      timeout: 5000,
      validateStatus: () => true, // Принимаем любые статусы
    });
    
    return {
      name: link.name,
      href: link.href,
      status: response.status,
      success: response.status === 200,
      time: response.headers['x-response-time'] || 'N/A',
      isApi: baseUrl !== BASE_URL
    };
  } catch (error) {
    return {
      name: link.name,
      href: link.href,
      status: 'ERROR',
      success: false,
      error: error.message,
      isApi: baseUrl !== BASE_URL
    };
  }
}

async function runComprehensive404Check() {
  console.log('🔍 ========== МАКСИМАЛЬНО ТЩАТЕЛЬНАЯ ПРОВЕРКА НА 404 ОШИБКИ ==========\n');
  
  const results = {
    footer: [],
    appRoutes: [],
    api: []
  };
  
  // 1. Проверяем все ссылки футера
  console.log('🦶 ========== ПРОВЕРКА ССЫЛОК ФУТЕРА ==========');
  for (const [category, links] of Object.entries(footerLinks)) {
    console.log(`\n📂 ${category.toUpperCase()}:`);
    
    for (const link of links) {
      const result = await checkLink(link);
      results.footer.push(result);
      
      const status = result.success ? '✅' : '❌';
      const statusText = result.success ? 'OK' : `ERROR (${result.status})`;
      
      console.log(`   ${status} ${link.name} - ${statusText} (${result.href})`);
      
      if (!result.success && result.error) {
        console.log(`      💥 Ошибка: ${result.error}`);
      }
    }
  }
  
  // 2. Проверяем все маршруты приложения
  console.log('\n\n⚛️ ========== ПРОВЕРКА МАРШРУТОВ ПРИЛОЖЕНИЯ ==========');
  for (const link of appRoutes) {
    const result = await checkLink(link);
    results.appRoutes.push(result);
    
    const status = result.success ? '✅' : '❌';
    const statusText = result.success ? 'OK' : `ERROR (${result.status})`;
    
    console.log(`   ${status} ${link.name} - ${statusText} (${result.href})`);
    
    if (!result.success && result.error) {
      console.log(`      💥 Ошибка: ${result.error}`);
    }
  }
  
  // 3. Проверяем API endpoints
  console.log('\n\n🌐 ========== ПРОВЕРКА API ENDPOINTS ==========');
  for (const endpoint of apiEndpoints) {
    const result = await checkLink(endpoint, endpoint.base);
    results.api.push(result);
    
    const status = result.success ? '✅' : '❌';
    const statusText = result.success ? 'OK' : `ERROR (${result.status})`;
    
    console.log(`   ${status} ${endpoint.name} - ${statusText} (${endpoint.base}${endpoint.href})`);
    
    if (!result.success && result.error) {
      console.log(`      💥 Ошибка: ${result.error}`);
    }
  }
  
  // Итоговая статистика
  const allResults = [...results.footer, ...results.appRoutes, ...results.api];
  const totalSuccess = allResults.filter(r => r.success).length;
  const totalLinks = allResults.length;
  const successRate = Math.round(totalSuccess / totalLinks * 100);
  
  console.log('\n\n🎯 ========== ИТОГОВЫЙ ОТЧЕТ ==========');
  console.log(`📊 Общий результат: ${totalSuccess}/${totalLinks} ссылок работают (${successRate}%)`);
  
  // Статистика по категориям
  const footerSuccess = results.footer.filter(r => r.success).length;
  const appRoutesSuccess = results.appRoutes.filter(r => r.success).length;
  const apiSuccess = results.api.filter(r => r.success).length;
  
  console.log(`\n📊 ========== СТАТИСТИКА ПО КАТЕГОРИЯМ ==========`);
  console.log(`   🦶 ФУТЕР: ${footerSuccess}/${results.footer.length} (${Math.round(footerSuccess/results.footer.length*100)}%)`);
  console.log(`   ⚛️ МАРШРУТЫ: ${appRoutesSuccess}/${results.appRoutes.length} (${Math.round(appRoutesSuccess/results.appRoutes.length*100)}%)`);
  console.log(`   🌐 API: ${apiSuccess}/${results.api.length} (${Math.round(apiSuccess/results.api.length*100)}%)`);
  
  // Находим проблемные ссылки
  const brokenLinks = allResults.filter(r => !r.success);
  if (brokenLinks.length > 0) {
    console.log('\n❌ ========== НАЙДЕННЫЕ ПРОБЛЕМЫ ==========');
    brokenLinks.forEach(link => {
      const category = link.isApi ? 'API' : 'WEB';
      console.log(`   ❌ [${category}] ${link.name} (${link.href}) - ${link.status}`);
      if (link.error) {
        console.log(`      💥 ${link.error}`);
      }
    });
    
    console.log(`\n⚠️  НАЙДЕНО ${brokenLinks.length} ПРОБЛЕМНЫХ ССЫЛОК!`);
    console.log('🔧 ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ!');
  } else {
    console.log('\n🎉 ВСЕ ССЫЛКИ РАБОТАЮТ ИДЕАЛЬНО!');
    console.log('🏆 НИКАКИХ 404 ОШИБОК НЕ НАЙДЕНО!');
  }
  
  console.log('\n🏁 ========== ПРОВЕРКА ЗАВЕРШЕНА ==========');
  console.log(`📅 Время: ${new Date().toLocaleString('ru-RU')}`);
  console.log(`🌐 Базовый URL: ${BASE_URL}`);
  
  // Сохраняем детальный отчет
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: totalLinks,
      success: totalSuccess,
      failed: brokenLinks.length,
      successRate: successRate
    },
    categories: {
      footer: { total: results.footer.length, success: footerSuccess },
      appRoutes: { total: results.appRoutes.length, success: appRoutesSuccess },
      api: { total: results.api.length, success: apiSuccess }
    },
    results: allResults,
    brokenLinks: brokenLinks
  };
  
  const reportPath = `comprehensive-404-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Детальный отчет сохранен: ${reportPath}`);
  
  return report;
}

// Запуск проверки
runComprehensive404Check().catch(console.error);
