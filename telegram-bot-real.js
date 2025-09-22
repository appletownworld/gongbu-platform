const { Telegraf, Markup } = require('telegraf')
const http = require('http')

// Токен бота
const BOT_TOKEN = '8464711606:AAG3oqGrg3P1_qvqfGFzGSmxlVDjuc9_a9w'
const WEBAPP_URL = 'http://localhost:3001/telegram-mini-app'

console.log('🤖 Запуск реального Telegram бота Gongbu...')
console.log('⚠️ ВНИМАНИЕ: WebApp кнопки отключены для localhost тестирования')

const bot = new Telegraf(BOT_TOKEN, {
  handlerTimeout: 90000, // Увеличиваем таймаут
})

// Данные курсов
const courses = [
  {
    id: 'course-123',
    title: 'Korean Language Basics',
    slug: 'korean-basics',
    description: '🇰🇷 Изучите корейский язык с нуля',
    price: 2999,
    currency: 'RUB',
    lessons: 5
  },
  {
    id: 'course-124', 
    title: 'Python Programming',
    slug: 'python-programming',
    description: '🐍 Программирование на Python',
    price: 4999,
    currency: 'RUB',
    lessons: 8
  }
]

// Команда /start
bot.start(async (ctx) => {
  try {
    const user = ctx.from
    console.log(`👤 Пользователь: ${user.first_name} ${user.last_name || ''} (@${user.username || 'без username'})`)
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📚 Список курсов', 'courses')],
      [Markup.button.callback('🚀 Как открыть Mini App', 'webapp_instructions')],
      [Markup.button.callback('ℹ️ О платформе', 'about')]
    ])

    await ctx.reply(
      `🎓 Добро пожаловать на платформу Gongbu!

👋 Привет, ${user.first_name}!

🌟 Gongbu - это современная образовательная платформа для изучения языков и программирования.

✨ Возможности:
• 🇰🇷 Корейский язык
• 🐍 Python программирование  
• 📱 Обучение прямо в Telegram
• 💳 Безопасные платежи
• 🌍 Мультиязычный интерфейс (EN/KO/RU)

👇 Выберите действие:`,
      keyboard
    )
  } catch (error) {
    console.error('❌ Ошибка в /start:', error)
    await ctx.reply('Произошла ошибка. Попробуйте еще раз.')
  }
})

// Команда /webapp
bot.command('webapp', async (ctx) => {
  try {
    await ctx.reply(`📱 Как открыть Mini App:

🎯 Метод 1 (Рекомендуется):
• Откройте Demo Interface: http://localhost:3005/
• Выберите тестового пользователя
• Нажмите "🚀 Открыть Mini App"

🎯 Метод 2 (Прямой доступ):
• Откройте браузер
• Перейдите: http://localhost:3001/telegram-mini-app/
• Добавьте параметры: ?user_id=215698548&first_name=Aleksey&last_name=Shin&username=shinalex1

⚠️ Примечание: WebApp кнопки работают только с HTTPS URL, поэтому используем альтернативные способы для localhost тестирования.`)
  } catch (error) {
    console.error('❌ Ошибка в /webapp:', error)
  }
})

// Новый обработчик для инструкций WebApp
bot.action('webapp_instructions', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    await ctx.editMessageText(`🚀 Как протестировать Mini App:

🎯 Метод 1 - Demo Interface (Лучший для тестирования):
1️⃣ Откройте в браузере: http://localhost:3005/
2️⃣ Выберите "Демо Пользователь" или "Test User"
3️⃣ Нажмите "🚀 Открыть Mini App"
4️⃣ Тестируйте все функции в iframe

🎯 Метод 2 - Прямой доступ:
1️⃣ Откройте: http://localhost:3001/telegram-mini-app/
2️⃣ Добавьте ваши параметры в URL:
   ?user_id=${ctx.from.id}&first_name=${ctx.from.first_name}&username=${ctx.from.username || 'no_username'}

✨ В Mini App вы можете:
• Переключать языки (EN/KO/RU)
• Просматривать курсы
• Открывать настройки
• Тестировать все функции

⚠️ Telegram WebApp кнопки требуют HTTPS, поэтому для localhost используем эти методы.`,
    
    Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ]))
  } catch (error) {
    console.error('❌ Ошибка webapp_instructions:', error)
  }
})

// Обработка callback кнопок
bot.action('courses', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    let courseList = '📚 Доступные курсы:\n\n'
    courses.forEach(course => {
      courseList += `📖 ${course.title}\n`
      courseList += `   ${course.description}\n`
      courseList += `   💰 ${course.price} ${course.currency}\n`
      courseList += `   📑 Уроков: ${course.lessons}\n\n`
    })
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Как открыть Mini App', 'webapp_instructions')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ])
    
    await ctx.editMessageText(courseList, keyboard)
  } catch (error) {
    console.error('❌ Ошибка courses:', error)
  }
})

bot.action('about', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    const aboutText = `ℹ️ О платформе Gongbu

🎯 Наша миссия: Сделать образование доступным для всех

🔧 Технологии:
• React + TypeScript
• Telegram Mini Apps
• Toss Payments
• Многоязычность

👨‍💻 Разработано специально для корейского и международного рынка

🌐 Поддерживаемые языки:
• 🇺🇸 English
• 🇰🇷 한국어 
• 🇷🇺 Русский`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Как открыть Mini App', 'webapp_instructions')],
      [Markup.button.callback('🔙 Назад', 'back_to_main')]
    ])
    
    await ctx.editMessageText(aboutText, keyboard)
  } catch (error) {
    console.error('❌ Ошибка about:', error)
  }
})

bot.action('back_to_main', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📚 Список курсов', 'courses')],
      [Markup.button.callback('🚀 Как открыть Mini App', 'webapp_instructions')],
      [Markup.button.callback('ℹ️ О платформе', 'about')]
    ])

    await ctx.editMessageText(
      `🎓 Gongbu - образовательная платформа

✨ Выберите действие:`,
      keyboard
    )
  } catch (error) {
    console.error('❌ Ошибка back_to_main:', error)
  }
})

// Health check endpoint
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'ok', 
      bot_running: true,
      timestamp: new Date().toISOString(),
      webapp_url: WEBAPP_URL
    }))
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('❌ Ошибка бота:', err)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error)
})

// Запуск бота
async function startBot() {
  try {
    console.log('🔄 Проверка токена бота...')
    const botInfo = await bot.telegram.getMe()
    console.log(`✅ Бот подключен: @${botInfo.username} (${botInfo.first_name})`)
    
    await bot.launch()
    console.log('🚀 Бот успешно запущен!')
    console.log(`📱 Найдите бота: @${botInfo.username}`)
    console.log(`🌐 Webapp URL: ${WEBAPP_URL}`)
    
    server.listen(3003, () => {
      console.log('🏥 Health check: http://localhost:3003/health')
    })
  } catch (error) {
    console.error('❌ Ошибка запуска бота:', error.message)
    
    if (error.message.includes('401')) {
      console.error('🔑 Проверьте токен бота в BotFather')
    }
    if (error.message.includes('ETIMEDOUT')) {
      console.error('🌐 Проблема с сетью. Проверьте интернет подключение')
    }
    
    process.exit(1)
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🔄 Остановка бота...')
  bot.stop('SIGINT')
  server.close()
})

process.once('SIGTERM', () => {
  console.log('🔄 Остановка бота...')
  bot.stop('SIGTERM')  
  server.close()
})

startBot()
