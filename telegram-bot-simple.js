const https = require('https')
const http = require('http')
const querystring = require('querystring')

// Telegram Bot API Configuration
const BOT_TOKEN = '8464711606:AAG3oqGrg3P1_qvqfGFzGSmxlVDjuc9_a9w'
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`
const WEBAPP_URL = 'http://localhost:3000/student'

// Utility function to make Telegram API calls
function telegramRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify(params)
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          if (response.ok) {
            resolve(response.result)
          } else {
            reject(new Error(response.description))
          }
        } catch (err) {
          reject(err)
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

// Send message with inline keyboard
async function sendMessage(chatId, text, options = {}) {
  const params = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    ...options
  }
  
  return await telegramRequest('sendMessage', params)
}

// Handle incoming messages
function handleMessage(message) {
  const chatId = message.chat.id
  const text = message.text
  const user = message.from
  
  console.log(`📨 Сообщение от ${user.first_name}: ${text}`)

  if (text === '/start') {
    const welcomeText = `🎓 *Добро пожаловать на платформу Gongbu!*

Привет, ${user.first_name}! 👋

Это образовательная платформа для изучения программирования.

🚀 *Что вы можете делать:*
• Просматривать доступные курсы
• Изучать материалы в удобном интерфейсе  
• Отслеживать свой прогресс

Нажмите кнопки ниже для начала работы:`

    const keyboard = {
      reply_markup: {
        keyboard: [
          [{ text: '📚 Курсы' }, { text: '👤 Профиль' }],
          [{ text: '❓ Помощь' }]
        ],
        resize_keyboard: true
      }
    }

    sendMessage(chatId, welcomeText, keyboard)
  }
  else if (text === '/courses' || text === '📚 Курсы') {
    const coursesText = `📚 *Выберите курс для изучения:*

🐍 *Python для начинающих*
• Изучите основы программирования
• 3 практических урока  
• Подходит для новичков
• Цена: 4999 ₽

Нажмите кнопку ниже, чтобы открыть курс! 👇`

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{
            text: '🚀 Открыть курс Python',
            web_app: { url: `${WEBAPP_URL}/?action=my_courses` }
          }],
          [{
            text: '📋 Каталог всех курсов', 
            web_app: { url: 'http://localhost:3001/telegram-mini-app' }
          }]
        ]
      }
    }

    sendMessage(chatId, coursesText, keyboard)
  }
  else if (text === '👤 Профиль') {
    const profileText = `👤 *Ваш профиль:*

📛 Имя: ${user.first_name} ${user.last_name || ''}
🆔 Username: @${user.username || 'не указан'}  
🆔 ID: ${user.id}

📊 *Статистика:*
• Курсов изучается: 1
• Уроков завершено: 0
• Общий прогресс: 0%`

    sendMessage(chatId, profileText)
  }
  else if (text === '❓ Помощь' || text === '/help') {
    const helpText = `❓ *Помощь и поддержка*

📋 *Доступные команды:*
• /start - Начать работу
• /courses - Посмотреть курсы  
• /help - Эта справка

🎓 *Как использовать платформу:*
1. Выберите курс из списка
2. Нажмите кнопку "Открыть курс"
3. Изучайте материалы в веб-интерфейсе
4. Отслеживайте прогресс

🆘 *Нужна помощь?*
Обратитесь к администратору`

    sendMessage(chatId, helpText)
  }
  else {
    const defaultText = `🤖 Используйте кнопки меню или команды:
    
• /start - Главное меню
• /courses - Посмотреть курсы
• /help - Справка

Или нажмите кнопку "📚 Курсы" ниже! 👇`

    sendMessage(chatId, defaultText)
  }
}

// Webhook handler
function handleWebhook(req, res) {
  let body = ''
  
  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', () => {
    try {
      const update = JSON.parse(body)
      console.log('📦 Получено обновление:', JSON.stringify(update, null, 2))
      
      if (update.message) {
        handleMessage(update.message)
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('OK')
    } catch (err) {
      console.error('❌ Ошибка обработки webhook:', err)
      res.writeHead(400)
      res.end('Bad Request')
    }
  })
}

// Setup webhook
async function setupWebhook() {
  try {
    // Remove existing webhook first
    await telegramRequest('deleteWebhook')
    console.log('🗑️ Старый webhook удален')
    
    // For local development, we'll use polling instead of webhook
    console.log('🔄 Используем polling для локальной разработки')
    startPolling()
  } catch (err) {
    console.error('❌ Ошибка настройки webhook:', err)
    console.log('🔄 Переходим на polling...')
    startPolling()
  }
}

// Polling method for local development
let offset = 0
async function startPolling() {
  console.log('🔄 Запуск polling...')
  
  const poll = async () => {
    try {
      const updates = await telegramRequest('getUpdates', {
        offset: offset,
        timeout: 30
      })
      
      if (updates && updates.length > 0) {
        for (const update of updates) {
          console.log('📦 Получено обновление:', update.update_id)
          
          if (update.message) {
            handleMessage(update.message)
          }
          
          offset = update.update_id + 1
        }
      }
    } catch (err) {
      console.error('❌ Ошибка polling:', err.message)
    }
    
    // Continue polling
    setTimeout(poll, 1000)
  }
  
  poll()
}

// HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'OK',
      service: 'Telegram Bot',
      timestamp: new Date().toISOString(),
      method: 'polling'
    }))
  } else if (req.url === '/webhook' && req.method === 'POST') {
    handleWebhook(req, res)
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

// Start the bot
console.log('🤖 Запуск Telegram бота Gongbu...')

server.listen(3003, () => {
  console.log('🔥 HTTP сервер запущен на http://localhost:3003')
  console.log('🏥 Health check: http://localhost:3003/health')
  
  // Test bot connection and setup
  telegramRequest('getMe').then((botInfo) => {
    console.log('✅ Бот успешно подключен!')
    console.log('🤖 Имя бота:', botInfo.first_name)
    console.log('📛 Username:', `@${botInfo.username}`)
    console.log('🆔 Bot ID:', botInfo.id)
    console.log('')
    console.log('🎯 Доступные команды в боте:')
    console.log('   • /start - Главное меню')
    console.log('   • /courses - Курсы с WebApp')
    console.log('   • /help - Справка')
    console.log('')
    console.log('🌐 WebApp URL:', WEBAPP_URL)
    console.log('📱 Найдите бота в Telegram: @' + botInfo.username)
    console.log('')
    console.log('🚀 БОТ ГОТОВ К ТЕСТИРОВАНИЮ!')
    
    setupWebhook()
  }).catch((err) => {
    console.error('❌ Ошибка подключения к боту:', err)
    if (err.code === 'ENOTFOUND') {
      console.log('🌐 Проблема с интернет подключением')
    } else if (err.message && err.message.includes('401')) {
      console.log('🔑 Неверный токен бота!')
    } else {
      console.log('⚠️ Проверьте токен бота и интернет соединение!')
    }
  })
})

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Остановка бота...')
  process.exit(0)
})
process.once('SIGTERM', () => {
  console.log('\n🛑 Остановка бота...')
  process.exit(0)
})
