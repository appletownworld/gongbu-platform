import { Injectable } from '@nestjs/common';
import { BotConfig } from './bot-instance-manager.service';

@Injectable()
export class MessageTemplatesService {
  welcome(course: any, user: any, config: BotConfig): string {
    return `
🎓 *Добро пожаловать на курс "${course.title}"!*

Привет, ${user.firstName || user.username || 'студент'}! 👋

${course.description || config.welcomeMessage}

📚 *О курсе:*
• Всего уроков: ${course.lessonCount || 0}
• Примерное время: ${this.formatDuration(course.estimatedDuration || 0)}
• Уровень сложности: ${'⭐'.repeat(Math.max(1, course.difficulty || 1))}

Нажмите "🚀 Начать обучение" чтобы перейти к первому уроку.
    `.trim();
  }

  stepContent(step: any, progress: any): string {
    const progressBar = this.createProgressBar(
      progress.completedLessons || 0,
      progress.totalLessons || 1,
    );

    return `
📖 *Урок ${step.order || 1}: ${step.title}*

${step.content?.text || step.description || 'Содержимое урока...'}

${progressBar}
*Прогресс:* ${progress.completedLessons || 0}/${progress.totalLessons || 1} (${
      Math.round(((progress.completedLessons || 0) / (progress.totalLessons || 1)) * 100)
    }%)

${step.estimatedDuration ? `⏱ *Время:* ~${this.formatDuration(step.estimatedDuration)}` : ''}
    `.trim();
  }

  quiz(step: any, questionIndex: number): string {
    const questions = step.content?.questions || [];
    const question = questions[questionIndex];
    const progress = `${questionIndex + 1}/${questions.length}`;

    if (!question) {
      return 'Вопрос не найден.';
    }

    return `
❓ *Вопрос ${progress}*

${question.question || question.text}

${question.explanation ? `💡 *Подсказка:* ${question.explanation}` : ''}
    `.trim();
  }

  quizOptions(question: any, stepId: string, questionIndex: number) {
    const options = question.options || question.answers || [];
    
    const keyboard = options.map((option: string, index: number) => [
      {
        text: `${String.fromCharCode(65 + index)}) ${option}`,
        callback_data: `quiz_${stepId}_${questionIndex}_${index}`,
      },
    ]);

    return { inline_keyboard: keyboard };
  }

  assignment(step: any): string {
    const assignment = step.content || {};

    return `
📝 *Задание: ${step.title}*

${assignment.instructions || assignment.description || 'Описание задания...'}

${
  assignment.requirements
    ? `*Требования:*\n${assignment.requirements.map((r: string) => `• ${r}`).join('\n')}`
    : ''
}

${
  assignment.examples
    ? `*Примеры:*\n${assignment.examples.map((e: any) => `• ${e.title || e}`).join('\n')}`
    : ''
}

Отправьте ваш ответ следующим сообщением (текст, фото или файл).
    `.trim();
  }

  courseCompleted(course: any, stats: any): string {
    return `
🎉 *Поздравляем! Курс "${course.title}" завершен!*

Отличная работа! Вы успешно завершили курс. 🎊

📊 *Ваши результаты:*
• Потрачено времени: ${this.formatDuration(stats.totalTime || 0)}
• Средняя оценка: ${stats.averageScore || 'N/A'}
• Выполнено заданий: ${stats.completedAssignments || 0}

${
  course.certificateEnabled
    ? '📜 Сертификат о прохождении курса будет отправлен в ближайшее время.'
    : ''
}

Спасибо за обучение! 🙏
    `.trim();
  }

  help(config: BotConfig): string {
    return `
❓ *Помощь и команды*

📋 *Доступные команды:*
• /start - Начать/перезапустить курс
• /progress - Посмотреть прогресс
• /courses - Открыть курс в WebApp  
• /help - Эта справка
• /settings - Настройки

🎓 *Как проходить курс:*
1. Используйте кнопки для навигации
2. Внимательно изучайте материалы
3. Отвечайте на вопросы в квизах
4. Выполняйте практические задания
5. Отслеживайте свой прогресс

💬 *Нужна помощь?*
Обратитесь к поддержке курса.
    `.trim();
  }

  progress(course: any, progress: any, user: any): string {
    const completedLessons = progress.completedLessons || 0;
    const totalLessons = progress.totalLessons || 1;
    const percentage = Math.round((completedLessons / totalLessons) * 100);
    const progressBar = this.createProgressBar(completedLessons, totalLessons);

    return `
📊 *Ваш прогресс по курсу "${course.title}"*

${progressBar}

📈 *Статистика:*
• Завершено уроков: ${completedLessons}/${totalLessons} (${percentage}%)
• Время в курсе: ${this.formatDuration(progress.timeSpent || 0)}
• Средняя оценка: ${progress.averageScore || 'N/A'}

🎯 *Текущий этап:*
${progress.currentLesson?.title || 'Готов к началу'}

${completedLessons === totalLessons ? '🎉 Курс завершен!' : '⚡ Продолжайте обучение!'}
    `.trim();
  }

  navigationKeyboard(currentStep: any, hasNext: boolean, hasPrev: boolean) {
    const keyboard = [];

    const row1 = [];
    if (hasPrev) {
      row1.push({ text: '⬅️ Назад', callback_data: 'prev_step' });
    }
    if (hasNext) {
      row1.push({ text: '➡️ Далее', callback_data: 'next_step' });
    }
    if (row1.length > 0) keyboard.push(row1);

    keyboard.push([
      { text: '📚 Меню курса', callback_data: 'course_menu' },
      { text: '📊 Прогресс', callback_data: 'show_progress' },
    ]);

    return { inline_keyboard: keyboard };
  }

  courseMenu(course: any, progress: any) {
    const keyboard = [
      [
        { text: '🚀 Продолжить обучение', callback_data: `step_${progress.currentLessonId || 'start'}` },
      ],
      [
        { text: '📊 Мой прогресс', callback_data: 'show_progress' },
        { text: '⚙️ Настройки', callback_data: 'settings' },
      ],
      [
        { text: '🌐 Открыть в WebApp', web_app: { url: `http://localhost:3000/student/${course.slug || course.id}` } },
      ],
    ];

    return { inline_keyboard: keyboard };
  }

  coursesMenu() {
    return `
📚 *Выберите курс для обучения*

Нажмите кнопку ниже, чтобы открыть полный каталог курсов в удобном веб-интерфейсе.
    `.trim();
  }

  coursesKeyboard() {
    return {
      inline_keyboard: [
        [
          {
            text: '🚀 Открыть каталог курсов',
            web_app: { url: 'http://localhost:3000/courses' },
          },
        ],
        [
          {
            text: '📱 Мой курс Python',
            web_app: { url: 'http://localhost:3000/student/python-for-beginners' },
          },
        ],
      ],
    };
  }

  errorMessage(error?: string): string {
    const messages = [
      'Произошла ошибка. Попробуйте позже.',
      'Что-то пошло не так. Наша команда уже работает над исправлением.',
      'Технические неполадки. Мы скоро все исправим!',
      'Ошибка сервера. Попробуйте повторить действие через минуту.',
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  private createProgressBar(completed: number, total: number, length: number = 10): string {
    const percentage = total > 0 ? completed / total : 0;
    const filled = Math.round(percentage * length);
    const empty = length - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} мин`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0 ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`;
  }
}
