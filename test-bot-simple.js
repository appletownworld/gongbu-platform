const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = '8464711606:AAG3oqGrg3P1_qvqfGFzGSmxlVDjuc9_a9w';
const WEBAPP_URL = 'http://localhost:3001/telegram-mini-app';

console.log('🤖 Создаем простого бота...');

const bot = new Telegraf(BOT_TOKEN);

// Обработчик команды /start
bot.command('start', async (ctx) => {
  console.log('👤 Пользователь запустил бота:', ctx.from.first_name);
  
  const keyboard = Markup.inlineKeyboard([
    Markup.button.webApp('📚 Открыть Gongbu', WEBAPP_URL)
  ]);

  try {
    await ctx.reply(
      `Добро пожаловать в Gongbu! 🎓\n\nНажмите кнопку ниже, чтобы открыть мини приложение:`,
      keyboard
    );
    console.log('✅ Сообщение отправлено');
  } catch (error) {
    console.log('❌ Ошибка отправки:', error.message);
  }
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.log('💥 Ошибка бота:', err.message);
});

// Запуск в режиме polling
console.log('🚀 Запуск бота в polling режиме...');
bot.launch({ 
  polling: {
    timeout: 30,
    limit: 100
  }
}).then(() => {
  console.log('✅ Бот запущен успешно!');
  console.log('📱 WebApp URL:', WEBAPP_URL);
}).catch((error) => {
  console.log('❌ Ошибка запуска:', error.message);
});

// Graceful stop
process.once('SIGINT', () => {
  console.log('🛑 Остановка бота...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Остановка бота...');
  bot.stop('SIGTERM');
});
