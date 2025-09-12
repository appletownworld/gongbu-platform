import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { BotContext } from '../bot/bot.service';
import { AuthClientService } from '../integrations/auth-client.service';
import { CourseClientService } from '../integrations/course-client.service';

@Injectable()
export class ProgressCommandsService {
  private readonly logger = new Logger(ProgressCommandsService.name);

  constructor(
    private readonly authClient: AuthClientService,
    private readonly courseClient: CourseClientService,
  ) {}

  /**
   * Команда /progress - общий прогресс пользователя
   */
  async handleProgressCommand(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.from) {
        await ctx.reply('❌ Не удалось определить пользователя');
        return;
      }

      await ctx.reply('📊 Загружаю ваш прогресс...');

      // Получаем пользователя из Auth Service
      const user = await this.authClient.createOrGetUser(ctx.from);
      const userCourses = await this.courseClient.getUserCourses(user.id);

      if (!userCourses.inProgress || userCourses.inProgress.length === 0) {
        await ctx.editMessageText(
          '📊 У вас пока нет активных курсов.\n\n' +
          'Начните изучение, записавшись на курс!',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📚 Посмотреть курсы', callback_data: 'show_all_courses' }],
              ],
            },
          }
        );
        return;
      }

      const message = this.formatProgressOverview(userCourses);
      const keyboard = this.createProgressOverviewKeyboard(userCourses.inProgress);

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error in progress command:', error.message);
      await ctx.reply('⚠️ Произошла ошибка при загрузке прогресса. Попробуйте позже.');
    }
  }

  /**
   * Показ детального прогресса по курсу
   */
  async showCourseProgress(ctx: BotContext, courseId: string): Promise<void> {
    try {
      if (!ctx.from) {
        await ctx.answerCbQuery('❌ Не удалось определить пользователя');
        return;
      }

      const user = await this.authClient.createOrGetUser(ctx.from);
      
      // Получаем прогресс по курсу (здесь будет интеграция с Progress Service)
      const courseProgress = await this.getCourseProgress(user.id, courseId);
      
      if (!courseProgress) {
        await ctx.answerCbQuery('❌ Курс не найден');
        return;
      }

      const message = this.formatCourseProgress(courseProgress);
      const keyboard = this.createCourseProgressKeyboard(courseProgress);

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

      await ctx.answerCbQuery();

    } catch (error) {
      this.logger.error('Error showing course progress:', error.message);
      await ctx.answerCbQuery('❌ Ошибка загрузки прогресса');
    }
  }

  /**
   * Команда /achievements - достижения пользователя
   */
  async handleAchievementsCommand(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.from) {
        await ctx.reply('❌ Не удалось определить пользователя');
        return;
      }

      const user = await this.authClient.createOrGetUser(ctx.from);
      const userCourses = await this.courseClient.getUserCourses(user.id);

      const achievements = this.calculateAchievements(userCourses);
      const message = this.formatAchievements(achievements);
      const keyboard = this.createAchievementsKeyboard(achievements);

      await ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error in achievements command:', error.message);
      await ctx.reply('⚠️ Произошла ошибка при загрузке достижений. Попробуйте позже.');
    }
  }

  /**
   * Еженедельный отчет прогресса
   */
  async handleWeeklyReportCommand(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.from) {
        await ctx.reply('❌ Не удалось определить пользователя');
        return;
      }

      await ctx.reply('📈 Генерирую ваш еженедельный отчет...');

      const user = await this.authClient.createOrGetUser(ctx.from);
      const weeklyReport = await this.generateWeeklyReport(user.id);

      const message = this.formatWeeklyReport(weeklyReport);
      const keyboard = this.createWeeklyReportKeyboard();

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error in weekly report command:', error.message);
      await ctx.reply('⚠️ Произошла ошибка при генерации отчета. Попробуйте позже.');
    }
  }

  /**
   * Форматирование общего обзора прогресса
   */
  private formatProgressOverview(userCourses: any): string {
    const { enrolled, completed, inProgress } = userCourses;
    
    let message = '📊 <b>Ваш прогресс обучения</b>\n\n';
    
    // Общая статистика
    message += '📈 <b>Общая статистика:</b>\n';
    message += `📚 Всего курсов: ${enrolled.length}\n`;
    message += `🔥 В процессе: ${inProgress.length}\n`;
    message += `✅ Завершено: ${completed.length}\n\n`;

    // Активные курсы
    if (inProgress.length > 0) {
      message += '🔥 <b>Активные курсы:</b>\n';
      inProgress.slice(0, 3).forEach((course, index) => {
        const progress = course.progress?.progressPercentage || 0;
        const progressBar = this.createProgressBar(progress);
        
        message += `${index + 1}. <b>${course.title}</b>\n`;
        message += `${progressBar} ${progress}%\n`;
        message += `⏱ ${this.formatTimeSpent(course.progress?.timeSpent || 0)}\n\n`;
      });

      if (inProgress.length > 3) {
        message += `... и еще ${inProgress.length - 3} курсов\n\n`;
      }
    }

    // Последние достижения
    const recentAchievements = this.getRecentAchievements(completed);
    if (recentAchievements.length > 0) {
      message += '🏆 <b>Последние достижения:</b>\n';
      recentAchievements.forEach(achievement => {
        message += `${achievement.icon} ${achievement.title}\n`;
      });
    }

    return message;
  }

  /**
   * Форматирование прогресса по курсу
   */
  private formatCourseProgress(courseProgress: any): string {
    let message = `📚 <b>${courseProgress.courseTitle}</b>\n\n`;
    
    const progress = courseProgress.progressPercentage || 0;
    const progressBar = this.createProgressBar(progress);
    
    message += `${progressBar} <b>${progress}%</b> завершено\n\n`;
    message += `📖 Уроков пройдено: ${courseProgress.completedLessons}/${courseProgress.totalLessons}\n`;
    message += `⏱ Время изучения: ${this.formatTimeSpent(courseProgress.timeSpent)}\n`;
    message += `📅 Начато: ${courseProgress.enrolledAt?.toLocaleDateString('ru-RU')}\n`;
    
    if (courseProgress.lastAccessedAt) {
      message += `🕐 Последний раз: ${courseProgress.lastAccessedAt.toLocaleDateString('ru-RU')}\n`;
    }
    
    message += '\n';

    // Следующие уроки
    if (courseProgress.nextLessons && courseProgress.nextLessons.length > 0) {
      message += '📖 <b>Следующие уроки:</b>\n';
      courseProgress.nextLessons.slice(0, 3).forEach((lesson, index) => {
        message += `${index + 1}. ${lesson.title}\n`;
      });
      message += '\n';
    }

    // Статистика курса
    if (progress >= 100) {
      message += '🎉 <b>Поздравляем с завершением курса!</b>\n';
      if (!courseProgress.certificateIssued) {
        message += '📜 Сертификат готов к выдаче\n';
      }
    } else if (progress > 0) {
      const estimatedCompletion = this.estimateCompletionTime(courseProgress);
      message += `⏳ Примерное завершение: ${estimatedCompletion}\n`;
    }

    return message;
  }

  /**
   * Форматирование достижений
   */
  private formatAchievements(achievements: any): string {
    let message = '🏆 <b>Ваши достижения</b>\n\n';
    
    // Основные достижения
    message += '⭐ <b>Основные:</b>\n';
    achievements.main.forEach(achievement => {
      const status = achievement.unlocked ? '✅' : '🔒';
      message += `${status} ${achievement.title}\n`;
      message += `   ${achievement.description}\n\n`;
    });

    // Прогресс до следующего достижения
    if (achievements.nextAchievement) {
      message += '🎯 <b>Следующее достижение:</b>\n';
      message += `${achievements.nextAchievement.title}\n`;
      message += `${achievements.nextAchievement.description}\n`;
      message += `Прогресс: ${achievements.nextAchievement.progress}%\n\n`;
    }

    // Статистика
    message += '📊 <b>Статистика:</b>\n';
    message += `🏅 Получено достижений: ${achievements.unlockedCount}/${achievements.totalCount}\n`;
    message += `📚 Курсов завершено: ${achievements.stats.completedCourses}\n`;
    message += `⏱ Общее время изучения: ${this.formatTimeSpent(achievements.stats.totalTime)}\n`;

    return message;
  }

  /**
   * Форматирование еженедельного отчета
   */
  private formatWeeklyReport(report: any): string {
    let message = '📈 <b>Еженедельный отчет</b>\n';
    message += `📅 ${report.startDate} - ${report.endDate}\n\n`;
    
    message += '🎯 <b>За эту неделю:</b>\n';
    message += `📖 Уроков завершено: ${report.lessonsCompleted}\n`;
    message += `⏱ Время изучения: ${this.formatTimeSpent(report.timeSpent)}\n`;
    message += `🔥 Дней активности: ${report.activeDays}/7\n\n`;

    if (report.achievements.length > 0) {
      message += '🏆 <b>Новые достижения:</b>\n';
      report.achievements.forEach(achievement => {
        message += `• ${achievement.title}\n`;
      });
      message += '\n';
    }

    // Сравнение с прошлой неделей
    if (report.comparison) {
      message += '📊 <b>Сравнение с прошлой неделей:</b>\n';
      const timeChange = report.comparison.timeSpent;
      const timeIcon = timeChange > 0 ? '📈' : timeChange < 0 ? '📉' : '➡️';
      message += `${timeIcon} Время: ${Math.abs(timeChange)} мин\n`;
      
      const lessonsChange = report.comparison.lessons;
      const lessonsIcon = lessonsChange > 0 ? '📈' : lessonsChange < 0 ? '📉' : '➡️';
      message += `${lessonsIcon} Уроки: ${Math.abs(lessonsChange)}\n\n`;
    }

    // Рекомендации
    if (report.recommendations.length > 0) {
      message += '💡 <b>Рекомендации:</b>\n';
      report.recommendations.forEach(rec => {
        message += `• ${rec}\n`;
      });
    }

    return message;
  }

  /**
   * Создание прогресс-бара
   */
  private createProgressBar(percentage: number): string {
    const totalBars = 10;
    const filledBars = Math.round((percentage / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    
    return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  }

  /**
   * Форматирование времени
   */
  private formatTimeSpent(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} мин`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}ч ${remainingMinutes}м` : `${hours}ч`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}д ${remainingHours}ч` : `${days}д`;
  }

  /**
   * Клавиатуры для различных экранов
   */
  private createProgressOverviewKeyboard(inProgressCourses: any[]): InlineKeyboardButton[][] {
    const keyboard: InlineKeyboardButton[][] = [];

    // Курсы в процессе
    inProgressCourses.slice(0, 3).forEach(course => {
      keyboard.push([{
        text: `📊 ${course.title}`,
        callback_data: `progress_${course.id}`,
      }]);
    });

    // Дополнительные кнопки
    keyboard.push([
      { text: '🏆 Достижения', callback_data: 'show_achievements' },
      { text: '📈 Еженедельный отчет', callback_data: 'weekly_report' },
    ]);

    keyboard.push([
      { text: '📚 Все курсы', callback_data: 'show_all_courses' },
    ]);

    return keyboard;
  }

  private createCourseProgressKeyboard(courseProgress: any): InlineKeyboardButton[][] {
    const keyboard: InlineKeyboardButton[][] = [];

    // Действия с курсом
    if (courseProgress.nextLessons && courseProgress.nextLessons.length > 0) {
      keyboard.push([{
        text: '▶️ Продолжить обучение',
        callback_data: `lesson_${courseProgress.nextLessons[0].id}`,
      }]);
    }

    keyboard.push([
      { text: '📖 Программа курса', callback_data: `lessons_${courseProgress.courseId}` },
      { text: '📊 Статистика', callback_data: `stats_${courseProgress.courseId}` },
    ]);

    if (courseProgress.progressPercentage >= 100 && !courseProgress.certificateIssued) {
      keyboard.push([{
        text: '📜 Получить сертификат',
        callback_data: `certificate_${courseProgress.courseId}`,
      }]);
    }

    keyboard.push([
      { text: '⬅️ К общему прогрессу', callback_data: 'show_progress' },
    ]);

    return keyboard;
  }

  private createAchievementsKeyboard(achievements: any): InlineKeyboardButton[][] {
    const keyboard: InlineKeyboardButton[][] = [];

    // Категории достижений
    keyboard.push([
      { text: '📚 По курсам', callback_data: 'achievements_courses' },
      { text: '⏱ По времени', callback_data: 'achievements_time' },
    ]);

    keyboard.push([
      { text: '🔥 По активности', callback_data: 'achievements_streak' },
      { text: '🎯 Специальные', callback_data: 'achievements_special' },
    ]);

    keyboard.push([
      { text: '📊 Общий прогресс', callback_data: 'show_progress' },
    ]);

    return keyboard;
  }

  private createWeeklyReportKeyboard(): InlineKeyboardButton[][] {
    return [
      [
        { text: '📈 Предыдущие отчеты', callback_data: 'previous_reports' },
        { text: '🎯 Цели на неделю', callback_data: 'weekly_goals' },
      ],
      [
        { text: '📊 Общий прогресс', callback_data: 'show_progress' },
      ],
    ];
  }

  // Вспомогательные методы для генерации данных (mock данные)
  private async getCourseProgress(userId: string, courseId: string): Promise<any> {
    // В реальности здесь будет запрос к Progress Service
    return {
      courseId,
      courseTitle: 'Python для начинающих',
      progressPercentage: 65,
      completedLessons: 13,
      totalLessons: 20,
      timeSpent: 480, // минуты
      enrolledAt: new Date('2023-11-01'),
      lastAccessedAt: new Date('2023-12-01'),
      certificateIssued: false,
      nextLessons: [
        { id: 'lesson-14', title: 'Работа с файлами' },
        { id: 'lesson-15', title: 'Обработка исключений' },
      ],
    };
  }

  private calculateAchievements(userCourses: any): any {
    const completedCount = userCourses.completed.length;
    const totalTime = userCourses.enrolled.reduce((sum, course) => sum + (course.progress?.timeSpent || 0), 0);

    return {
      main: [
        {
          title: 'Первые шаги',
          description: 'Завершите первый урок',
          unlocked: true,
        },
        {
          title: 'Студент',
          description: 'Завершите первый курс',
          unlocked: completedCount >= 1,
        },
        {
          title: 'Знаток',
          description: 'Завершите 5 курсов',
          unlocked: completedCount >= 5,
        },
      ],
      nextAchievement: {
        title: 'Марафонец',
        description: 'Изучайте 30 дней подряд',
        progress: 45,
      },
      unlockedCount: 2,
      totalCount: 15,
      stats: {
        completedCourses: completedCount,
        totalTime,
      },
    };
  }

  private getRecentAchievements(completedCourses: any[]): any[] {
    if (completedCourses.length === 0) return [];
    
    return [
      { icon: '🎓', title: 'Завершен курс "Python для начинающих"' },
    ].slice(0, 2);
  }

  private async generateWeeklyReport(userId: string): Promise<any> {
    // Mock данные для еженедельного отчета
    return {
      startDate: '25 ноя',
      endDate: '1 дек',
      lessonsCompleted: 8,
      timeSpent: 240, // минуты
      activeDays: 5,
      achievements: [
        { title: 'Активный студент - 5 дней подряд' },
      ],
      comparison: {
        timeSpent: 60, // +60 минут к прошлой неделе
        lessons: 3, // +3 урока к прошлой неделе
      },
      recommendations: [
        'Попробуйте заниматься каждый день по 15 минут',
        'Перейдите к изучению React после завершения JavaScript',
      ],
    };
  }

  private estimateCompletionTime(courseProgress: any): string {
    const remaining = courseProgress.totalLessons - courseProgress.completedLessons;
    const avgLessonTime = courseProgress.timeSpent / courseProgress.completedLessons || 30;
    const daysRemaining = Math.ceil((remaining * avgLessonTime) / 60 / 2); // 2 часа в день
    
    return `через ${daysRemaining} дней`;
  }
}
