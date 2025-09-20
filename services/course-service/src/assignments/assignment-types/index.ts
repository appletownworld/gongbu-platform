/**
 * Assignment Types Index
 * Экспортирует все типы заданий и их обработчики
 */

export { QuizAssignmentHandler, type QuizAssignmentContent, type QuizSubmissionContent, type QuizQuestion } from './quiz.assignment';
export { CodeAssignmentHandler, type CodeAssignmentContent, type CodeSubmissionContent, type CodeTestCase } from './code.assignment';

// Импортируем классы для использования в фабрике
import { QuizAssignmentHandler } from './quiz.assignment';
import { CodeAssignmentHandler } from './code.assignment';

// Базовый интерфейс для всех типов заданий
export interface BaseAssignmentHandler<TContent = any, TSubmission = any> {
  validateContent(content: any): { isValid: boolean; errors: string[] };
  createTemplate(): TContent;
  prepareForStudent(content: TContent): any;
  gradeSubmission(assignmentContent: TContent, submissionContent: TSubmission): Promise<any> | any;
  validateSubmission(assignmentContent: TContent, submissionContent: any): { isValid: boolean; errors: string[] };
}

// Фабрика для получения обработчика типа задания
export class AssignmentTypeFactory {
  private static handlers = new Map<string, any>([
    ['QUIZ', QuizAssignmentHandler],
    ['CODE', CodeAssignmentHandler],
  ]);

  static getHandler(type: string): BaseAssignmentHandler | null {
    const HandlerClass = this.handlers.get(type.toUpperCase());
    return HandlerClass ? new HandlerClass() : null;
  }

  static getSupportedTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  static registerHandler(type: string, HandlerClass: any): void {
    this.handlers.set(type.toUpperCase(), HandlerClass);
  }
}

// Утилиты для работы с заданиями
export class AssignmentUtils {
  /**
   * Валидирует контент задания в зависимости от типа
   */
  static validateAssignmentContent(type: string, content: any): { isValid: boolean; errors: string[] } {
    const handler = AssignmentTypeFactory.getHandler(type);
    if (!handler) {
      return { isValid: false, errors: [`Неподдерживаемый тип задания: ${type}`] };
    }

    return handler.validateContent(content);
  }

  /**
   * Создает шаблон задания
   */
  static createAssignmentTemplate(type: string): any {
    const handler = AssignmentTypeFactory.getHandler(type);
    if (!handler) {
      throw new Error(`Неподдерживаемый тип задания: ${type}`);
    }

    return handler.createTemplate();
  }

  /**
   * Подготавливает задание для студента
   */
  static prepareAssignmentForStudent(type: string, content: any): any {
    const handler = AssignmentTypeFactory.getHandler(type);
    if (!handler) {
      return content; // Возвращаем как есть для неизвестных типов
    }

    return handler.prepareForStudent(content);
  }

  /**
   * Автоматически проверяет подачу задания
   */
  static async gradeAssignmentSubmission(
    type: string, 
    assignmentContent: any, 
    submissionContent: any
  ): Promise<any> {
    const handler = AssignmentTypeFactory.getHandler(type);
    if (!handler) {
      throw new Error(`Автоматическая проверка не поддерживается для типа: ${type}`);
    }

    const result = handler.gradeSubmission(assignmentContent, submissionContent);
    
    // Если результат - промис, дожидаемся его выполнения
    if (result instanceof Promise) {
      return await result;
    }
    
    return result;
  }

  /**
   * Валидирует подачу задания
   */
  static validateAssignmentSubmission(
    type: string, 
    assignmentContent: any, 
    submissionContent: any
  ): { isValid: boolean; errors: string[] } {
    const handler = AssignmentTypeFactory.getHandler(type);
    if (!handler) {
      return { isValid: true, errors: [] }; // Пропускаем валидацию для неизвестных типов
    }

    return handler.validateSubmission(assignmentContent, submissionContent);
  }

  /**
   * Проверяет, поддерживает ли тип автоматическую проверку
   */
  static supportsAutoGrading(type: string): boolean {
    const autoGradableTypes = ['QUIZ', 'CODE'];
    return autoGradableTypes.includes(type.toUpperCase());
  }

  /**
   * Генерирует шаблон для подачи задания
   */
  static generateSubmissionTemplate(assignment: any): any {
    switch (assignment.type) {
      case 'QUIZ':
        return {
          answers: assignment.content?.questions?.map(() => null) || []
        };
      case 'CODE':
        return {
          code: '',
          language: assignment.content?.language || 'javascript'
        };
      case 'ESSAY':
        return {
          text: '',
          wordCount: 0
        };
      case 'PROJECT':
        return {
          description: '',
          files: []
        };
      case 'UPLOAD':
        return {
          files: []
        };
      case 'PEER_REVIEW':
        return {
          review: '',
          rating: 0,
          criteria: {}
        };
      default:
        return {};
    }
  }

  /**
   * Получает рекомендуемые настройки для типа задания
   */
  static getDefaultSettings(type: string): Record<string, any> {
    const defaults = {
      QUIZ: {
        allowRetries: false,
        showCorrectAnswers: true,
        timeLimit: 1800, // 30 минут
        shuffleQuestions: false,
        shuffleAnswers: false,
      },
      CODE: {
        allowRetries: true,
        maxRetries: 10,
        showTestResults: true,
        timeLimit: 3600, // 1 час
        enableSyntaxHighlighting: true,
        enableAutoCompletion: true,
      },
      ESSAY: {
        allowRetries: false,
        wordLimit: 1000,
        enableSpellCheck: true,
        allowFileAttachments: true,
      },
      PROJECT: {
        allowRetries: true,
        allowFileAttachments: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFileTypes: ['.zip', '.tar.gz', '.pdf', '.docx'],
      },
      UPLOAD: {
        allowRetries: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['.pdf', '.docx', '.txt', '.jpg', '.png'],
        requireDescription: false,
      },
      PEER_REVIEW: {
        reviewersPerSubmission: 3,
        reviewCriteria: ['quality', 'originality', 'clarity'],
        allowSelfReview: false,
        anonymousReview: true,
      }
    };

    return defaults[type.toUpperCase() as keyof typeof defaults] || {};
  }

  /**
   * Получает поддерживаемые типы заданий
   */
  static getSupportedTypes(): string[] {
    return ['QUIZ', 'CODE', 'ESSAY', 'PROJECT', 'UPLOAD', 'PEER_REVIEW'];
  }
}

// Константы типов заданий
export const ASSIGNMENT_TYPES = {
  QUIZ: 'QUIZ',
  ESSAY: 'ESSAY', 
  CODE: 'CODE',
  PROJECT: 'PROJECT',
  UPLOAD: 'UPLOAD',
  PEER_REVIEW: 'PEER_REVIEW',
} as const;

export type AssignmentType = typeof ASSIGNMENT_TYPES[keyof typeof ASSIGNMENT_TYPES];