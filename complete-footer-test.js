const axios = require('axios');

/**
 * 🔍 ПОЛНАЯ ПРОВЕРКА ВСЕХ ССЫЛОК ФУТЕРА
 * 
 * Этот скрипт проверяет КАЖДУЮ ссылку из Footer.tsx
 * и находит все проблемы, которые я пропустил ранее.
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

async function checkLink(link) {
  try {
    const response = await axios.get(`${BASE_URL}${link.href}`, {
      timeout: 5000,
      validateStatus: () => true, // Принимаем любые статусы
    });
    
    return {
      name: link.name,
      href: link.href,
      status: response.status,
      success: response.status === 200,
      time: response.headers['x-response-time'] || 'N/A'
    };
  } catch (error) {
    return {
      name: link.name,
      href: link.href,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

async function runCompleteFooterTest() {
  console.log('🔍 ========== ПОЛНАЯ ПРОВЕРКА ВСЕХ ССЫЛОК ФУТЕРА ==========\n');
  
  const results = {
    platform: [],
    learning: [],
    support: [],
    legal: []
  };
  
  // Проверяем каждую категорию
  for (const [category, links] of Object.entries(footerLinks)) {
    console.log(`📂 ${category.toUpperCase()}:`);
    
    for (const link of links) {
      const result = await checkLink(link);
      results[category].push(result);
      
      const status = result.success ? '✅' : '❌';
      const statusText = result.success ? 'OK' : `ERROR (${result.status})`;
      
      console.log(`   ${status} ${link.name} - ${statusText} (${result.href})`);
      
      if (!result.success && result.error) {
        console.log(`      💥 Ошибка: ${result.error}`);
      }
    }
    
    const successCount = results[category].filter(r => r.success).length;
    const totalCount = results[category].length;
    console.log(`   📊 ${category.toUpperCase()}: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)\n`);
  }
  
  // Итоговая статистика
  const allResults = Object.values(results).flat();
  const totalSuccess = allResults.filter(r => r.success).length;
  const totalLinks = allResults.length;
  const successRate = Math.round(totalSuccess / totalLinks * 100);
  
  console.log('🎯 ========== ИТОГОВЫЙ ОТЧЕТ ==========');
  console.log(`📊 Общий результат: ${totalSuccess}/${totalLinks} ссылок работают (${successRate}%)`);
  
  // Находим проблемные ссылки
  const brokenLinks = allResults.filter(r => !r.success);
  if (brokenLinks.length > 0) {
    console.log('\n❌ ========== ПРОБЛЕМНЫЕ ССЫЛКИ ==========');
    brokenLinks.forEach(link => {
      console.log(`   ❌ ${link.name} (${link.href}) - ${link.status}`);
      if (link.error) {
        console.log(`      💥 ${link.error}`);
      }
    });
  } else {
    console.log('\n🎉 ВСЕ ССЫЛКИ ФУТЕРА РАБОТАЮТ ИДЕАЛЬНО!');
  }
  
  // Детальная статистика по категориям
  console.log('\n📊 ========== СТАТИСТИКА ПО КАТЕГОРИЯМ ==========');
  Object.entries(results).forEach(([category, links]) => {
    const successCount = links.filter(r => r.success).length;
    const totalCount = links.length;
    const rate = Math.round(successCount / totalCount * 100);
    const emoji = rate === 100 ? '🟢' : rate >= 75 ? '🟡' : '🔴';
    console.log(`   ${emoji} ${category.toUpperCase()}: ${successCount}/${totalCount} (${rate}%)`);
  });
  
  console.log('\n🏁 ========== ПРОВЕРКА ЗАВЕРШЕНА ==========');
  console.log(`📅 Время: ${new Date().toLocaleString('ru-RU')}`);
  console.log(`🌐 Базовый URL: ${BASE_URL}`);
  
  if (successRate === 100) {
    console.log('🏆 ОТЛИЧНО! Все ссылки футера работают безупречно!');
  } else {
    console.log(`⚠️  Найдено ${brokenLinks.length} проблемных ссылок. Требуется исправление.`);
  }
}

// Запуск теста
runCompleteFooterTest().catch(console.error);
