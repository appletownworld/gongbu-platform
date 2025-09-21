const { Telegraf, Markup } = require('telegraf')
const http = require('http')
const url = require('url')

// Токен бота из .env
const BOT_TOKEN = '8464711606:AAG3oqGrg3P1_qvqfGFzGSmxlVDjuc9_a9w'
const WEBAPP_URL = 'http://localhost:3001/telegram-mini-app'

const bot = new Telegraf(BOT_TOKEN)

// Данные курсов для бота
const courses = [
  {
    id: 'course-123',
    title: 'Python для начинающих',
    slug: 'python-for-beginners',
    description: 'Изучите Python с нуля за 30 дней',
    price: 4999,
    currency: 'RUB',
    lessons: 3
  }
]

// Команда /start
bot.start(async (ctx) => {
  const user = ctx.from
  console.log(`👤 Новый пользователь: ${user.first_name} ${user.last_name} (@${user.username})`)
  
  await ctx.reply(
    `🎓 Добро пожаловать на платформу Gongbu!
    
Привет, ${user.first_name}! 👋

Это образовательная платформа для изучения программирования и других навыков.

🚀 Что вы можете делать:
• Просматривать доступные курсы
• Изучать материалы в удобном интерфейсе
• Отслеживать свой прогресс

Используйте команды ниже для начала работы:`,
    Markup.keyboard([
      ['📚 Курсы', '👤 Профиль'],
      ['❓ Помощь']
    ]).resize()
  )
})

// Команда /courses - показать доступные курсы
bot.command('courses', async (ctx) => {
  console.log('🎓 Запрос курсов от:', ctx.from.first_name)
  
  let message = '📚 **Доступные курсы:**\\n\\n'
  
  for (const course of courses) {
    message += `📖 **${course.title}**\\n`
    message += `${course.description}\\n`
    message += `💰 Цена: ${course.price} ${course.currency}\\n`
    message += `📝 Уроков: ${course.lessons}\\n\\n`
  }
  
  const keyboard = Markup.inlineKeyboard([
    Markup.button.webApp(
      '🚀 Открыть курс Python',
      `${WEBAPP_URL}/python-for-beginners`
    ),
    Markup.button.callback('📋 Список курсов', 'list_courses')
  ])
  
  await ctx.reply(message, { 
    ...keyboard,
    parse_mode: 'MarkdownV2'
  })
})

// Кнопка "Курсы"
bot.hears('📚 Курсы', async (ctx) => {
  console.log('🎓 Кнопка Курсы от:', ctx.from.first_name)
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp(
      '🐍 Python для начинающих',
      `${WEBAPP_URL}/python-for-beginners`
    )],
    [Markup.button.callback('📋 Все курсы', 'all_courses')]
  ])
  
  await ctx.reply(
    `📚 **Выберите курс для изучения:**
    
🐍 **Python для начинающих**
• Изучите основы программирования
• 3 практических урока
• Подходит для новичков

Нажмите кнопку ниже, чтобы открыть курс в удобном интерфейсе! 👇`,
    { 
      ...keyboard, 
      parse_mode: 'MarkdownV2' 
    }
  )
})

// Кнопка "Профиль"
bot.hears('👤 Профиль', async (ctx) => {
  const user = ctx.from
  await ctx.reply(
    `👤 **Ваш профиль:**
    
📛 Имя: ${user.first_name} ${user.last_name || ''}
🆔 Username: @${user.username || 'не указан'}
🆔 ID: ${user.id}

📊 **Статистика:**
• Курсов изучается: 1
• Уроков завершено: 0
• Общий прогресс: 0%`,
    { parse_mode: 'MarkdownV2' }
  )
})

// Кнопка "Помощь"
bot.hears('❓ Помощь', async (ctx) => {
  await ctx.reply(
    `❓ **Помощь и поддержка**
    
📋 **Доступные команды:**
• /start - Начать работу
• /courses - Посмотреть курсы
• /help - Эта справка

🎓 **Как использовать платформу:**
1. Выберите курс из списка
2. Нажмите кнопку "Открыть курс"
3. Изучайте материалы в веб-интерфейсе
4. Отслеживайте прогресс

🆘 **Нужна помощь?**
Обратитесь к администратору: @admin`,
    { parse_mode: 'MarkdownV2' }
  )
})

// Callback для списка курсов
bot.action('list_courses', async (ctx) => {
  console.log('📋 Запрос списка курсов')
  await ctx.answerCbQuery()
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp(
      '🐍 Python для начинающих - 4999₽',
      `${WEBAPP_URL}/python-for-beginners`
    )],
    [Markup.button.callback('🔙 Назад', 'back_to_main')]
  ])
  
  await ctx.editMessageText(
    `📚 **Каталог курсов Gongbu:**
    
🐍 **Python для начинающих**
📝 Изучите основы программирования на Python
💰 Цена: 4999 ₽
📊 Уровень: Начинающий
🎯 Уроков: 3

🚀 Нажмите на курс, чтобы открыть его в удобном интерфейсе!`,
    { 
      ...keyboard, 
      parse_mode: 'MarkdownV2' 
    }
  )
})

bot.action('all_courses', async (ctx) => {
  await ctx.answerCbQuery()
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.webApp(
      '🚀 Открыть каталог курсов',
      'http://localhost:3000/courses'
    )],
    [Markup.button.webApp(
      '🐍 Python для начинающих',
      `${WEBAPP_URL}/python-for-beginners`
    )]
  ])
  
  await ctx.editMessageText(
    `📚 **Полный каталог курсов:**
    
🎓 Более 10+ курсов по программированию
💻 Веб-разработка, Python, JavaScript
🚀 Новые курсы каждую неделю

Выберите действие:`,
    { 
      ...keyboard, 
      parse_mode: 'MarkdownV2' 
    }
  )
})

// Команда /help
bot.help((ctx) => ctx.reply('❓ Используйте /courses для просмотра доступных курсов или кнопки меню'))

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('❌ Ошибка бота:', err)
  console.error('Контекст:', ctx)
})

// Запуск бота
console.log('🤖 Запуск Telegram бота Gongbu...')

bot.launch().then(() => {
  console.log('✅ Telegram бот успешно запущен!')
  console.log('🎯 Доступные команды:')
  console.log('   • /start - Начать работу')
  console.log('   • /courses - Курсы с WebApp')
  console.log('   • /help - Справка')
  console.log('\n🌐 WebApp URL:', WEBAPP_URL)
  console.log('📱 Тестируйте бота в Telegram!')
}).catch((err) => {
  console.error('❌ Ошибка запуска бота:', err)
})

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Остановка бота...')
  bot.stop('SIGINT')
})
process.once('SIGTERM', () => {
  console.log('\n🛑 Остановка бота...')
  bot.stop('SIGTERM')
})

// Health check сервер для бота
const healthServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  
  if (parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'OK',
      service: 'Telegram Bot',
      timestamp: new Date().toISOString(),
      bot_username: 'GongbuEducationBot'
    }))
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Not found' }))
  }
})

healthServer.listen(3003, () => {
  console.log('🏥 Bot Health Check: http://localhost:3003/health')
})
