import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto, UpdateQuizDto, SubmitQuizAnswerDto } from './dto/quiz.dto';

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'single_choice' | 'text' | 'file_upload' | 'voice';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  points: number;
  order: number;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit?: number; // в минутах
  passingScore: number; // процент для прохождения
  maxAttempts?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Создать квиз для урока
   */
  async createQuiz(lessonId: string, createQuizDto: CreateQuizDto): Promise<Quiz> {
    this.logger.log(`Создание квиза для урока: ${lessonId}`);

    // Проверяем существование урока
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }

    // Создаем квиз
    const quiz = await this.prisma.quiz.create({
      data: {
        lessonId,
        title: createQuizDto.title,
        description: createQuizDto.description,
        timeLimit: createQuizDto.timeLimit,
        passingScore: createQuizDto.passingScore,
        maxAttempts: createQuizDto.maxAttempts,
        questions: createQuizDto.questions,
        isActive: true,
      },
    });

    this.logger.log(`Квиз создан: ${quiz.id}`);
    return this.mapQuizToResponse(quiz);
  }

  /**
   * Получить квиз по ID
   */
  async getQuiz(quizId: string): Promise<Quiz> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Квиз не найден');
    }

    return this.mapQuizToResponse(quiz);
  }

  /**
   * Получить квиз для урока
   */
  async getQuizByLesson(lessonId: string): Promise<Quiz | null> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { 
        lessonId,
        isActive: true,
      },
    });

    return quiz ? this.mapQuizToResponse(quiz) : null;
  }

  /**
   * Обновить квиз
   */
  async updateQuiz(quizId: string, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
    this.logger.log(`Обновление квиза: ${quizId}`);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Квиз не найден');
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(updateQuizDto.title && { title: updateQuizDto.title }),
        ...(updateQuizDto.description && { description: updateQuizDto.description }),
        ...(updateQuizDto.timeLimit !== undefined && { timeLimit: updateQuizDto.timeLimit }),
        ...(updateQuizDto.passingScore !== undefined && { passingScore: updateQuizDto.passingScore }),
        ...(updateQuizDto.maxAttempts !== undefined && { maxAttempts: updateQuizDto.maxAttempts }),
        ...(updateQuizDto.questions && { questions: updateQuizDto.questions }),
        ...(updateQuizDto.isActive !== undefined && { isActive: updateQuizDto.isActive }),
      },
    });

    this.logger.log(`Квиз обновлен: ${quizId}`);
    return this.mapQuizToResponse(updatedQuiz);
  }

  /**
   * Удалить квиз
   */
  async deleteQuiz(quizId: string): Promise<void> {
    this.logger.log(`Удаление квиза: ${quizId}`);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Квиз не найден');
    }

    await this.prisma.quiz.update({
      where: { id: quizId },
      data: { isActive: false },
    });

    this.logger.log(`Квиз удален: ${quizId}`);
  }

  /**
   * Отправить ответы на квиз
   */
  async submitQuizAnswers(
    quizId: string,
    userId: string,
    answers: SubmitQuizAnswerDto
  ): Promise<any> {
    this.logger.log(`Отправка ответов на квиз: ${quizId} пользователем: ${userId}`);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Квиз не найден');
    }

    // Проверяем количество попыток
    const attempts = await this.prisma.quizAttempt.count({
      where: {
        quizId,
        userId,
      },
    });

    if (quiz.maxAttempts && attempts >= quiz.maxAttempts) {
      throw new BadRequestException('Превышено максимальное количество попыток');
    }

    // Проверяем время выполнения
    if (quiz.timeLimit) {
      const startTime = new Date(answers.startedAt);
      const endTime = new Date();
      const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000 / 60; // в минутах

      if (timeSpent > quiz.timeLimit) {
        throw new BadRequestException('Время выполнения квиза истекло');
      }
    }

    // Проверяем ответы
    const results = this.checkAnswers(quiz.questions as QuizQuestion[], answers.answers);
    const score = this.calculateScore(results, quiz.questions as QuizQuestion[]);
    const passed = score >= quiz.passingScore;

    // Сохраняем попытку
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers: answers.answers,
        score,
        passed,
        timeSpent: answers.timeSpent,
        completedAt: new Date(),
      },
    });

    // Если квиз пройден, обновляем прогресс урока
    if (passed) {
      await this.updateLessonProgress(userId, quiz.lessonId);
    }

    this.logger.log(`Квиз завершен: ${quizId}, результат: ${score}%, пройден: ${passed}`);

    return {
      attemptId: attempt.id,
      score,
      passed,
      results,
      correctAnswers: results.filter(r => r.isCorrect).length,
      totalQuestions: results.length,
      timeSpent: answers.timeSpent,
    };
  }

  /**
   * Получить результаты квиза для пользователя
   */
  async getQuizResults(quizId: string, userId: string): Promise<any> {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        userId,
      },
      orderBy: { completedAt: 'desc' },
    });

    if (attempts.length === 0) {
      return null;
    }

    const bestAttempt = attempts.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      attempts: attempts.map(attempt => ({
        id: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt,
      })),
      bestScore: bestAttempt.score,
      passed: bestAttempt.passed,
      totalAttempts: attempts.length,
    };
  }

  /**
   * Получить статистику квиза для преподавателя
   */
  async getQuizStats(quizId: string): Promise<any> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Квиз не найден');
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const totalAttempts = attempts.length;
    const passedAttempts = attempts.filter(a => a.passed).length;
    const averageScore = totalAttempts > 0 
      ? attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts 
      : 0;

    // Статистика по вопросам
    const questionStats = (quiz.questions as QuizQuestion[]).map(question => {
      const questionAttempts = attempts.filter(attempt => 
        attempt.answers && 
        typeof attempt.answers === 'object' && 
        question.id in (attempt.answers as any)
      );

      const correctAnswers = questionAttempts.filter(attempt => {
        const userAnswer = (attempt.answers as any)[question.id];
        return this.isAnswerCorrect(question, userAnswer);
      }).length;

      return {
        questionId: question.id,
        question: question.question,
        totalAnswers: questionAttempts.length,
        correctAnswers,
        accuracy: questionAttempts.length > 0 
          ? (correctAnswers / questionAttempts.length) * 100 
          : 0,
      };
    });

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
      },
      stats: {
        totalAttempts,
        passedAttempts,
        failedAttempts: totalAttempts - passedAttempts,
        passRate: totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0,
        averageScore,
        averageTimeSpent: totalAttempts > 0 
          ? attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / totalAttempts 
          : 0,
      },
      questionStats,
      recentAttempts: attempts
        .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
        .slice(0, 10)
        .map(attempt => ({
          id: attempt.id,
          user: attempt.user,
          score: attempt.score,
          passed: attempt.passed,
          timeSpent: attempt.timeSpent,
          completedAt: attempt.completedAt,
        })),
    };
  }

  // Приватные методы

  private checkAnswers(questions: QuizQuestion[], userAnswers: Record<string, any>): any[] {
    return questions.map(question => {
      const userAnswer = userAnswers[question.id];
      const isCorrect = this.isAnswerCorrect(question, userAnswer);

      return {
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        explanation: question.explanation,
      };
    });
  }

  private isAnswerCorrect(question: QuizQuestion, userAnswer: any): boolean {
    switch (question.type) {
      case 'multiple_choice':
        // Для множественного выбора проверяем, что все правильные ответы выбраны
        const correctAnswers = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer 
          : [question.correctAnswer];
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        return correctAnswers.every(correct => userAnswers.includes(correct));

      case 'single_choice':
        return userAnswer === question.correctAnswer;

      case 'text':
        // Для текстовых ответов делаем нечувствительное к регистру сравнение
        const correctText = String(question.correctAnswer).toLowerCase().trim();
        const userText = String(userAnswer).toLowerCase().trim();
        return correctText === userText;

      case 'file_upload':
      case 'voice':
        // Для файлов и голосовых сообщений считаем, что ответ правильный, если файл загружен
        return userAnswer && userAnswer !== '';

      default:
        return false;
    }
  }

  private calculateScore(results: any[], questions: QuizQuestion[]): number {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = results.reduce((sum, r) => sum + r.points, 0);
    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  }

  private async updateLessonProgress(userId: string, lessonId: string): Promise<void> {
    // Обновляем прогресс урока
    await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Прогресс урока обновлен: ${userId} -> ${lessonId}`);
  }

  private mapQuizToResponse(quiz: any): Quiz {
    return {
      id: quiz.id,
      lessonId: quiz.lessonId,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions as QuizQuestion[],
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
    };
  }
}
