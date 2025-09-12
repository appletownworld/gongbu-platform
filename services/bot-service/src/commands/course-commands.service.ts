import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { BotContext } from '../bot/bot.service';
import { AuthClientService, AuthUser } from '../integrations/auth-client.service';
import { CourseClientService, Course, CourseList } from '../integrations/course-client.service';

@Injectable()
export class CourseCommandsService {
  private readonly logger = new Logger(CourseCommandsService.name);

  constructor(
    private readonly authClient: AuthClientService,
    private readonly courseClient: CourseClientService,
  ) {}

  /**
   * Команда /courses - список всех курсов
   */
  async handleCoursesCommand(ctx: BotContext): Promise<void> {
    try {
      await ctx.reply('📚 Загружаю курсы...');

      const coursesData = await this.courseClient.getCourses({
        page: 1,
        limit: 5,
      });

      if (!coursesData.courses || coursesData.courses.length === 0) {
        await ctx.editMessageText('📚 Курсы пока что не найдены. Попробуйте позже.');
        return;
      }

      const courseList = this.formatCourseList(coursesData);
      const keyboard = this.createCoursesKeyboard(coursesData.courses, coursesData.pagination);

      await ctx.editMessageText(courseList, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error in courses command:', error.message);
      await ctx.reply('⚠️ Произошла ошибка при загрузке курсов. Попробуйте позже.');
    }
  }

  /**
   * Команда /my_courses - мои курсы
   */
  async handleMyCoursesCommand(ctx: BotContext): Promise<void> {
    try {
      if (!ctx.from) {
        await ctx.reply('❌ Не удалось определить пользователя');
        return;
      }

      await ctx.reply('📖 Загружаю ваши курсы...');

      // Получаем пользователя из Auth Service
      const user = await this.authClient.createOrGetUser(ctx.from);
      const userCourses = await this.courseClient.getUserCourses(user.id);

      if (!userCourses.enrolled || userCourses.enrolled.length === 0) {
        await ctx.editMessageText(
          '📚 У вас пока нет активных курсов.\n\n' +
          'Используйте /courses чтобы посмотреть доступные курсы.',
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

      const message = this.formatUserCourses(userCourses);
      const keyboard = this.createMyCoursesKeyboard(userCourses);

      await ctx.editMessageText(message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error in my_courses command:', error.message);
      await ctx.reply('⚠️ Произошла ошибка при загрузке ваших курсов. Попробуйте позже.');
    }
  }

  /**
   * Команда /search - поиск курсов
   */
  async handleSearchCommand(ctx: BotContext, query: string): Promise<void> {
    try {
      if (!query || query.trim().length < 2) {
        await ctx.reply(
          '🔍 Введите поисковый запрос после команды:\n' +
          '<code>/search машинное обучение</code>',
          { parse_mode: 'HTML' }
        );
        return;
      }

      await ctx.reply(`🔍 Ищу курсы по запросу: "${query}"`);

      const courses = await this.courseClient.searchCourses(query, 5);

      if (!courses || courses.length === 0) {
        await ctx.editMessageText(
          `🔍 По запросу "${query}" курсы не найдены.\n\n` +
          'Попробуйте изменить поисковый запрос или посмотрите все доступные курсы.',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '📚 Все курсы', callback_data: 'show_all_courses' }],
              ],
            },
          }
        );
        return;
      }

      const courseList = this.formatSearchResults(courses, query);
      const keyboard = this.createSearchResultsKeyboard(courses);

      await ctx.editMessageText(courseList, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

    } catch (error) {
      this.logger.error('Error in search command:', error.message);
      await ctx.reply('⚠️ Произошла ошибка при поиске курсов. Попробуйте позже.');
    }
  }

  /**
   * Показ детальной информации о курсе
   */
  async showCourseDetails(ctx: BotContext, courseId: string): Promise<void> {
    try {
      const course = await this.courseClient.getCourseById(courseId);
      
      if (!course) {
        await ctx.answerCbQuery('❌ Курс не найден');
        return;
      }

      const courseDetails = this.formatCourseDetails(course);
      const keyboard = this.createCourseDetailsKeyboard(course);

      await ctx.editMessageText(courseDetails, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: keyboard,
        },
      });

      await ctx.answerCbQuery();

    } catch (error) {
      this.logger.error('Error showing course details:', error.message);
      await ctx.answerCbQuery('❌ Ошибка загрузки курса');
    }
  }

  /**
   * Форматирование списка курсов
   */
  private formatCourseList(coursesData: CourseList): string {
    const { courses, pagination } = coursesData;
    
    let message = '📚 <b>Доступные курсы</b>\n\n';

    courses.forEach((course, index) => {
      const stars = '⭐'.repeat(Math.floor(course.rating));
      const price = course.price > 0 ? `${course.price} ${course.currency}` : 'Бесплатно';
      
      message += `<b>${index + 1}. ${course.title}</b>\n`;
      message += `${course.shortDescription || course.description.substring(0, 100)}...\n`;
      message += `${stars} ${course.rating} (${course.reviewCount} отзывов)\n`;
      message += `💰 ${price} • 👥 ${course.studentCount} студентов\n`;
      message += `⏱ ${course.lessonCount} уроков • 📊 ${course.difficulty}\n\n`;
    });

    message += `📄 Страница ${pagination.page} из ${pagination.totalPages}\n`;
    message += `📊 Всего курсов: ${pagination.totalItems}`;

    return message;
  }

  /**
   * Форматирование курсов пользователя
   */
  private formatUserCourses(userCourses: {
    enrolled: Course[];
    completed: Course[];
    inProgress: Course[];
  }): string {
    let message = '📖 <b>Мои курсы</b>\n\n';

    if (userCourses.inProgress.length > 0) {
      message += '🔥 <b>В процессе изучения:</b>\n';
      userCourses.inProgress.forEach((course, index) => {
        message += `${index + 1}. ${course.title}\n`;
      });
      message += '\n';
    }

    if (userCourses.completed.length > 0) {
      message += '✅ <b>Завершенные курсы:</b>\n';
      userCourses.completed.forEach((course, index) => {
        message += `${index + 1}. ${course.title}\n`;
      });
      message += '\n';
    }

    if (userCourses.enrolled.length > 0 && userCourses.inProgress.length === 0 && userCourses.completed.length === 0) {
      message += '📚 <b>Записанные курсы:</b>\n';
      userCourses.enrolled.forEach((course, index) => {
        message += `${index + 1}. ${course.title}\n`;
      });
    }

    return message;
  }

  /**
   * Форматирование результатов поиска
   */
  private formatSearchResults(courses: Course[], query: string): string {
    let message = `🔍 <b>Результаты поиска: "${query}"</b>\n\n`;

    courses.forEach((course, index) => {
      const stars = '⭐'.repeat(Math.floor(course.rating));
      const price = course.price > 0 ? `${course.price} ${course.currency}` : 'Бесплатно';
      
      message += `<b>${index + 1}. ${course.title}</b>\n`;
      message += `${course.shortDescription || course.description.substring(0, 100)}...\n`;
      message += `${stars} ${course.rating} • 💰 ${price}\n\n`;
    });

    return message;
  }

  /**
   * Форматирование детальной информации о курсе
   */
  private formatCourseDetails(course: Course): string {
    const stars = '⭐'.repeat(Math.floor(course.rating));
    const price = course.price > 0 ? `${course.price} ${course.currency}` : 'Бесплатно';
    const duration = course.duration ? `${Math.floor(course.duration / 60)} часов` : 'Не указано';

    let message = `📚 <b>${course.title}</b>\n\n`;
    message += `${course.description}\n\n`;
    message += `👨‍🏫 <b>Автор:</b> ${course.author.name}\n`;
    message += `💰 <b>Цена:</b> ${price}\n`;
    message += `📊 <b>Уровень:</b> ${course.difficulty}\n`;
    message += `🏷 <b>Категория:</b> ${course.category}\n`;
    message += `⏱ <b>Длительность:</b> ${duration}\n`;
    message += `📖 <b>Уроков:</b> ${course.lessonCount}\n`;
    message += `👥 <b>Студентов:</b> ${course.studentCount}\n`;
    message += `${stars} <b>Рейтинг:</b> ${course.rating} (${course.reviewCount} отзывов)\n\n`;

    if (course.tags && course.tags.length > 0) {
      message += `🏷 <b>Теги:</b> ${course.tags.map(tag => `#${tag}`).join(' ')}\n`;
    }

    return message;
  }

  /**
   * Клавиатура для списка курсов
   */
  private createCoursesKeyboard(courses: Course[], pagination: any): InlineKeyboardButton[][] {
    const keyboard: InlineKeyboardButton[][] = [];

    // Кнопки курсов (по 2 в ряд)
    for (let i = 0; i < courses.length; i += 2) {
      const row: InlineKeyboardButton[] = [];
      
      row.push({
        text: `${i + 1}. ${courses[i].title.substring(0, 20)}...`,
        callback_data: `course_${courses[i].id}`,
      });

      if (i + 1 < courses.length) {
        row.push({
          text: `${i + 2}. ${courses[i + 1].title.substring(0, 20)}...`,
          callback_data: `course_${courses[i + 1].id}`,
        });
      }

      keyboard.push(row);
    }

    // Навигация
    const navRow: InlineKeyboardButton[] = [];
    if (pagination.hasPrev) {
      navRow.push({ text: '⬅️ Назад', callback_data: `courses_page_${pagination.page - 1}` });
    }
    if (pagination.hasNext) {
      navRow.push({ text: 'Далее ➡️', callback_data: `courses_page_${pagination.page + 1}` });
    }
    
    if (navRow.length > 0) {
      keyboard.push(navRow);
    }

    // Дополнительные кнопки
    keyboard.push([
      { text: '🔍 Поиск', callback_data: 'search_courses' },
      { text: '📖 Мои курсы', callback_data: 'my_courses' },
    ]);

    return keyboard;
  }

  /**
   * Клавиатура для моих курсов
   */
  private createMyCoursesKeyboard(userCourses: {
    enrolled: Course[];
    completed: Course[];
    inProgress: Course[];
  }): InlineKeyboardButton[][] {
    const keyboard: InlineKeyboardButton[][] = [];

    // Курсы в процессе изучения
    userCourses.inProgress.forEach((course, index) => {
      keyboard.push([{
        text: `🔥 ${course.title}`,
        callback_data: `my_course_${course.id}`,
      }]);
    });

    // Завершенные курсы
    userCourses.completed.forEach((course, index) => {
      keyboard.push([{
        text: `✅ ${course.title}`,
        callback_data: `completed_course_${course.id}`,
      }]);
    });

    // Записанные курсы
    userCourses.enrolled.forEach((course, index) => {
      keyboard.push([{
        text: `📚 ${course.title}`,
        callback_data: `enrolled_course_${course.id}`,
      }]);
    });

    keyboard.push([
      { text: '📚 Все курсы', callback_data: 'show_all_courses' },
      { text: '🔍 Поиск', callback_data: 'search_courses' },
    ]);

    return keyboard;
  }

  /**
   * Клавиатура для результатов поиска
   */
  private createSearchResultsKeyboard(courses: Course[]): InlineKeyboardButton[][] {
    const keyboard: InlineKeyboardButton[][] = [];

    courses.forEach((course, index) => {
      keyboard.push([{
        text: `${index + 1}. ${course.title}`,
        callback_data: `course_${course.id}`,
      }]);
    });

    keyboard.push([
      { text: '📚 Все курсы', callback_data: 'show_all_courses' },
      { text: '🔍 Новый поиск', callback_data: 'search_courses' },
    ]);

    return keyboard;
  }

  /**
   * Клавиатура для детальной информации о курсе
   */
  private createCourseDetailsKeyboard(course: Course): InlineKeyboardButton[][] {
    const keyboard: InlineKeyboardButton[][] = [];

    // Основные действия
    if (course.price > 0) {
      keyboard.push([{
        text: `💳 Купить за ${course.price} ${course.currency}`,
        callback_data: `buy_course_${course.id}`,
      }]);
    } else {
      keyboard.push([{
        text: '🎯 Записаться бесплатно',
        callback_data: `enroll_course_${course.id}`,
      }]);
    }

    keyboard.push([
      { text: '📖 Посмотреть программу', callback_data: `lessons_${course.id}` },
      { text: '👨‍🏫 Об авторе', callback_data: `author_${course.author.id}` },
    ]);

    keyboard.push([
      { text: '⬅️ Назад к курсам', callback_data: 'show_all_courses' },
    ]);

    return keyboard;
  }
}
