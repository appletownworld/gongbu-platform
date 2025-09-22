const { Telegraf, Markup } = require('telegraf')
const http = require('http')

// Токен бота
const BOT_TOKEN = '8464711606:AAG3oqGrg3P1_qvqfGFzGSmxlVDjuc9_a9w'
const MINI_APP_URL = 'http://localhost:3001/telegram-mini-app'
const WEB_APP_URL = 'http://localhost:3000'
const DEMO_URL = 'http://localhost:3005'

console.log('🤖 Запуск простого инструктивного Telegram бота...')

const bot = new Telegraf(BOT_TOKEN, {
  handlerTimeout: 30000,
})

// Команда /start  
bot.start(async (ctx) => {
  try {
    const user = ctx.from
    console.log(`👤 Пользователь: ${user.first_name} ${user.last_name || ''} (@${user.username || 'без username'})`)
    
        const personalizedUrl = `${MINI_APP_URL}/?user_id=${user.id}&first_name=${encodeURIComponent(user.first_name)}&last_name=${encodeURIComponent(user.last_name || '')}&username=${encodeURIComponent(user.username || 'no_username')}&fresh=true`
        const coursesUrl = `${MINI_APP_URL}/?user_id=${user.id}&first_name=${encodeURIComponent(user.first_name)}&last_name=${encodeURIComponent(user.last_name || '')}&username=${encodeURIComponent(user.username || 'no_username')}&action=my_courses&fresh=true`
    
    await ctx.reply(
      `🎓 Добро пожаловать на платформу Gongbu!

👋 Привет, ${user.first_name}!

🌟 Gongbu - образовательная платформа для изучения языков и программирования.

📱 **КАК ОТКРЫТЬ MINI APP:**

🎯 **СПОСОБ 1 (Рекомендуется):**
1️⃣ Откройте Demo Interface: ${DEMO_URL}
2️⃣ Выберите "Демо Пользователь" или создайте своего
3️⃣ Нажмите "🚀 Открыть Mini App"
4️⃣ Тестируйте все функции

🎯 **СПОСОБ 2 (Прямой доступ):**
• Главная страница: ${personalizedUrl}
• 📚 Мои курсы: ${coursesUrl}

✨ **В MINI APP ВЫ МОЖЕТЕ:**
• 🇺🇸🇰🇷🇷🇺 Переключать языки  
• 📚 Просматривать курсы корейского и Python
• ⚙️ Настраивать интерфейс
• 💳 Тестировать платежную систему
• 🎮 Использовать все функции

⚠️ **ПРИМЕЧАНИЕ:** WebApp кнопки Telegram работают только с HTTPS, поэтому для localhost тестирования используйте указанные способы.

📧 **КОМАНДЫ:**
/webapp - Открыть полную Web-платформу (localhost:3000)
/mycourses - Открыть Mini App с курсами (localhost:3001)
/demo - Demo Interface для тестирования`
    )
  } catch (error) {
    console.error('❌ Ошибка в /start:', error)
    await ctx.reply('Произошла ошибка. Попробуйте команду /webapp для получения инструкций.')
  }
})

// Команда /webapp - открывает полную WEB-платформу  
bot.command('webapp', async (ctx) => {
  try {
    const user = ctx.from
    const personalizedWebUrl = `${WEB_APP_URL}/?user_id=${user.id}&first_name=${encodeURIComponent(user.first_name)}&username=${encodeURIComponent(user.username || 'no_username')}`
    
    await ctx.reply(`🌐 **WEB APP - ПОЛНАЯ ВЕБ-ПЛАТФОРМА:**

🎯 **Откройте в браузере:**
${personalizedWebUrl}

🎯 **Базовая ссылка:**
${WEB_APP_URL}

✨ **В WEB APP ВЫ ПОЛУЧИТЕ:**
• Полный функционал платформы
• Расширенные возможности обучения
• Детальная аналитика прогресса
• Административные функции
• Создание и редактирование курсов
• Система оплаты и подписок

📱 **Для Mini App используйте:** /mycourses`)
  } catch (error) {
    console.error('❌ Ошибка в /webapp:', error)
  }
})

// Команда /demo
bot.command('demo', async (ctx) => {
  try {
    await ctx.reply(`🎭 **DEMO INTERFACE:**

${DEMO_URL}

Это лучший способ протестировать Mini App!

🎮 **Возможности Demo Interface:**
• Выбор тестовых пользователей
• iframe предпросмотр Mini App  
• Имитация Telegram параметров
• Полное тестирование функций

👆 Просто откройте ссылку в браузере!`)
  } catch (error) {
    console.error('❌ Ошибка в /demo:', error)
  }
})

// Команда /mycourses - прямой переход к курсам
bot.command('mycourses', async (ctx) => {
  console.log('🔍 DEBUG: Получена команда /mycourses')
  try {
    const user = ctx.from
    console.log('👤 DEBUG: Пользователь:', user.first_name, user.id)
    const coursesUrl = `${MINI_APP_URL}/?user_id=${user.id}&first_name=${encodeURIComponent(user.first_name)}&last_name=${encodeURIComponent(user.last_name || '')}&username=${encodeURIComponent(user.username || 'no_username')}&action=my_courses&fresh=true`
    console.log('🔗 DEBUG: URL для курсов:', coursesUrl)
    
    console.log('📤 DEBUG: Отправляем ответ пользователю...')
    await ctx.reply(`📚 **МОИ КУРСЫ:**

Откройте ваши курсы в Mini App:

🔗 **Прямая ссылка на курсы:**
${coursesUrl}

🎯 **Что произойдет:**
• Автоматический вход в систему
• Переход сразу к курсам (без Welcome Screen)
• Ваши персональные данные
• Доступные курсы корейского и Python

✨ Система автоматически вас зарегистрирует или войдет!

⚠️ **Примечание:** WebApp кнопки работают только с HTTPS. Для localhost тестирования используйте ссылку выше.`)
    console.log('✅ DEBUG: Ответ успешно отправлен!')
  } catch (error) {
    console.error('❌ ОШИБКА в /mycourses:', error)
    console.error('❌ Stack trace:', error.stack)
  }
})

// Fallback для всех сообщений
bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return // Пропускаем команды
  
  try {
    await ctx.reply(`👋 Привет! 

Используйте команды:
/start - Начать работу  
/webapp - Открыть Web App (полная платформа)
/mycourses - Открыть Mini App (упрощенная версия)
/demo - Demo Interface

🎯 Или сразу откройте: ${DEMO_URL}`)
  } catch (error) {
    console.error('❌ Ошибка в fallback:', error)
  }
})

// Health check
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'ok', 
      bot_running: true,
      timestamp: new Date().toISOString(),
      web_app_url: WEB_APP_URL,
      mini_app_url: MINI_APP_URL,
      demo_url: DEMO_URL
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

// Запуск
async function startBot() {
  try {
    console.log('🔄 Проверка токена бота...')
    const botInfo = await bot.telegram.getMe()
    console.log(`✅ Бот подключен: @${botInfo.username} (${botInfo.first_name})`)
    
    await bot.launch()
    console.log('🚀 Бот успешно запущен!')
    console.log(`📱 Найдите бота: @${botInfo.username}`)
    console.log(`🌐 Web App: ${WEB_APP_URL}`)
    console.log(`📱 Mini App: ${MINI_APP_URL}`)
    console.log(`🎭 Demo Interface: ${DEMO_URL}`)
    
    server.listen(3003, () => {
      console.log('🏥 Health check: http://localhost:3003/health')
    })
  } catch (error) {
    console.error('❌ Ошибка запуска:', error.message)
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.log('🌐 Проблема с интернет подключением.')
      console.log('📱 Mini App все равно доступен: ' + MINI_APP_URL)
      console.log('🎭 Demo Interface: ' + DEMO_URL)
      console.log('🔄 Бот попробует переподключиться...')
      
      // Попытка переподключения через 10 секунд
      setTimeout(startBot, 10000)
    } else {
      process.exit(1)
    }
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
