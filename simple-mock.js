const http = require('http')
const url = require('url')

// Mock данные
const courses = [{
  id: 'course-123',
  title: 'Python для начинающих',
  slug: 'python-for-beginners',
  description: 'Полный курс по программированию на Python с нуля',
  shortDescription: 'Изучите Python за 30 дней',
  category: 'PROGRAMMING',
  difficulty: 'BEGINNER',
  language: 'ru',
  estimatedDuration: 2400,
  price: 4999,
  currency: 'RUB',
  isPremium: false,
  isPublished: true,
  tags: ['python', 'programming', 'beginner'],
  creatorId: 'user-123',
  lessonCount: 3,
  enrollmentCount: 142,
  averageRating: 4.7,
  reviewCount: 45,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  creator: {
    id: 'user-123',
    name: 'Иван Петров'
  }
}]

const lessons = [
  {
    id: 'lesson-1',
    title: 'Урок 1: Введение в Python',
    slug: 'lesson-1-intro',
    content: `# Добро пожаловать на курс Python! 

В этом уроке мы изучим основы языка программирования Python. 

## Что такое Python?

Python - это высокоуровневый язык программирования, который отличается:
- Простотой синтаксиса
- Мощными возможностями  
- Большим сообществом разработчиков

## Применение Python

Python используется в:
- Веб-разработке
- Анализе данных
- Машинном обучении  
- Автоматизации
- Научных вычислениях

Давайте начнем наше изучение!`,
    contentType: 'TEXT',
    videoUrl: null,
    audioUrl: null,
    order: 1,
    duration: 15,
    isPreview: true,
    isRequired: true,
    courseId: 'course-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lesson-2',
    title: 'Урок 2: Установка Python',
    slug: 'lesson-2-installation',
    content: `# Установка Python

В этом уроке мы научимся устанавливать Python на различные операционные системы.

## Windows
1. Перейдите на python.org
2. Скачайте последнюю версию
3. Запустите установщик
4. Не забудьте поставить галочку "Add Python to PATH"

## macOS
\`\`\`bash
brew install python
\`\`\`

## Linux (Ubuntu/Debian)
\`\`\`bash
sudo apt update
sudo apt install python3 python3-pip
\`\`\`

После установки проверьте:
\`\`\`bash
python --version
\`\`\``,
    contentType: 'VIDEO',
    videoUrl: 'https://www.youtube.com/embed/YKSpANU8jKo',
    audioUrl: null,
    order: 2,
    duration: 20,
    isPreview: false,
    isRequired: true,
    courseId: 'course-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lesson-3',
    title: 'Урок 3: Первая программа',
    slug: 'lesson-3-first-program',
    content: `# Первая программа на Python

Пришло время написать нашу первую программу на Python!

## Hello, World!

Традиционно, первая программа выводит приветствие:

\`\`\`python
print("Hello, World!")
print("Привет, мир!")
\`\`\`

## Переменные

Python позволяет легко работать с переменными:

\`\`\`python
name = "Иван"
age = 25
height = 1.75

print(f"Меня зовут {name}")
print(f"Мне {age} лет")
print(f"Мой рост {height} метра")
\`\`\`

## Задание

Попробуйте создать свою программу, которая:
1. Запрашивает ваше имя
2. Приветствует вас
3. Спрашивает ваш возраст
4. Выводит информацию о вас

## Решение

\`\`\`python
name = input("Как вас зовут? ")
age = input("Сколько вам лет? ")

print(f"Привет, {name}!")
print(f"Здорово, что вам {age} лет!")
\`\`\`

Отлично! Вы написали свою первую интерактивную программу!`,
    contentType: 'TEXT',
    videoUrl: null,
    audioUrl: null,
    order: 3,
    duration: 25,
    isPreview: false,
    isRequired: true,
    courseId: 'course-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

function sendJSON(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })
  res.end(JSON.stringify(data))
}

function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const method = req.method

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    res.end()
    return
  }

  console.log(`${method} ${path}`)

  // Routes
  if (path === '/courses' && method === 'GET') {
    const { isPublished = 'true' } = parsedUrl.query
    const filteredCourses = isPublished === 'true' 
      ? courses.filter(c => c.isPublished)
      : courses
    
    sendJSON(res, {
      courses: filteredCourses,
      pagination: {
        page: 1,
        limit: 10,
        totalItems: filteredCourses.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    })
  }
  else if (path.startsWith('/courses/slug/') && method === 'GET') {
    const slug = path.split('/courses/slug/')[1]
    const course = courses.find(c => c.slug === slug)
    if (course) {
      sendJSON(res, course)
    } else {
      sendJSON(res, { message: 'Course not found' }, 404)
    }
  }
  else if (path.startsWith('/lessons/course/') && method === 'GET') {
    const courseId = path.split('/lessons/course/')[1]
    const courseLessons = lessons.filter(l => l.courseId === courseId)
    sendJSON(res, courseLessons.sort((a, b) => a.order - b.order))
  }
  else if (path === '/health' && method === 'GET') {
    sendJSON(res, { status: 'OK', service: 'Mock Backend', timestamp: new Date().toISOString() })
  }
  else {
    sendJSON(res, { message: 'Not found', path, method }, 404)
  }
}

// Запускаем серверы
const courseServer = http.createServer(handleRequest)
courseServer.listen(3002, () => {
  console.log('🚀 Mock Course Service запущен на http://localhost:3002')
})

// Auth server
const authServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const method = req.method

  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    res.end()
    return
  }

  console.log(`AUTH: ${method} ${path}`)

  if (path === '/login' && method === 'POST') {
    sendJSON(res, {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'user-123',
        firstName: 'Иван',
        lastName: 'Петров',
        username: 'ivan_petrov',
        role: 'INSTRUCTOR'
      }
    })
  } else {
    sendJSON(res, { message: 'Not found' }, 404)
  }
})

authServer.listen(3001, () => {
  console.log('🔐 Mock Auth Service запущен на http://localhost:3001')
})

console.log('\n🎉 Mock Backend готов к тестированию!')
console.log('\n📝 Доступные endpoints:')
console.log('   - http://localhost:3002/courses - Список курсов') 
console.log('   - http://localhost:3002/courses/slug/python-for-beginners - Курс по Python')
console.log('   - http://localhost:3002/lessons/course/course-123 - Уроки курса')
console.log('   - http://localhost:3001/login - Авторизация')
console.log('\n🌐 Веб-приложение: http://localhost:3000')
console.log('📚 Тест студента: http://localhost:3000/student/python-for-beginners')
console.log('\n🚀 Теперь можно тестировать Telegram WebApp!')
