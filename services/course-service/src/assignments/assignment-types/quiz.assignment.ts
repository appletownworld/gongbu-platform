import { BaseAssignmentHandler } from './index';

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'single-choice' | 'true-false';
  options: string[];
  correctAnswer: number | boolean;
  explanation?: string;
  points: number;
}

export interface QuizAssignmentContent {
  questions: QuizQuestion[];
  timeLimit?: number; // в секундах
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showCorrectAnswers?: boolean;
  passingScore?: number; // процент для прохождения
}

export interface QuizSubmissionContent {
  answers: (number | boolean | string)[];
  timeSpent?: number; // время в секундах
  startedAt?: Date;
  submittedAt?: Date;
}

export class QuizAssignmentHandler implements BaseAssignmentHandler<QuizAssignmentContent, QuizSubmissionContent> {
  validateContent(content: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || typeof content !== 'object') {
      errors.push('Контент должен быть объектом');
      return { isValid: false, errors };
    }

    if (!Array.isArray(content.questions)) {
      errors.push('Поле questions должно быть массивом');
      return { isValid: false, errors };
    }

    if (content.questions.length === 0) {
      errors.push('Должен быть хотя бы один вопрос');
    }

    // Валидация каждого вопроса
    content.questions.forEach((question: any, index: number) => {
      if (!question.id) {
        errors.push(`Вопрос ${index + 1}: отсутствует ID`);
      }
      if (!question.question || typeof question.question !== 'string') {
        errors.push(`Вопрос ${index + 1}: отсутствует текст вопроса`);
      }
      if (!['multiple-choice', 'single-choice', 'true-false'].includes(question.type)) {
        errors.push(`Вопрос ${index + 1}: неверный тип вопроса`);
      }
      if (!Array.isArray(question.options) || question.options.length < 2) {
        errors.push(`Вопрос ${index + 1}: должно быть минимум 2 варианта ответа`);
      }
      if (typeof question.correctAnswer === 'undefined') {
        errors.push(`Вопрос ${index + 1}: отсутствует правильный ответ`);
      }
      if (typeof question.points !== 'number' || question.points <= 0) {
        errors.push(`Вопрос ${index + 1}: неверное количество баллов`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  createTemplate(): QuizAssignmentContent {
    return {
      questions: [
        {
          id: 'question-1',
          question: 'Пример вопроса?',
          type: 'single-choice',
          options: ['Вариант 1', 'Вариант 2', 'Вариант 3', 'Вариант 4'],
          correctAnswer: 0,
          points: 10,
          explanation: 'Объяснение правильного ответа'
        }
      ],
      timeLimit: 1800, // 30 минут
      shuffleQuestions: false,
      shuffleAnswers: false,
      showCorrectAnswers: true,
      passingScore: 70
    };
  }

  prepareForStudent(content: QuizAssignmentContent): any {
    // Убираем правильные ответы для студента
    return {
      ...content,
      questions: content.questions.map(q => ({
        ...q,
        correctAnswer: undefined, // Скрываем правильный ответ
        explanation: undefined   // Скрываем объяснение
      }))
    };
  }

  gradeSubmission(assignmentContent: QuizAssignmentContent, submissionContent: QuizSubmissionContent): any {
    const answers = submissionContent.answers || [];
    const questions = assignmentContent.questions;
    
    let totalScore = 0;
    let maxScore = 0;
    const results: any[] = [];

    questions.forEach((question, index) => {
      maxScore += question.points;
      const userAnswer = answers[index];
      const isCorrect = this.isAnswerCorrect(question, userAnswer);
      
      if (isCorrect) {
        totalScore += question.points;
      }

      results.push({
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      });
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassing = percentage >= (assignmentContent.passingScore || 70);

    return {
      score: totalScore,
      maxScore,
      percentage,
      isPassing,
      results,
      timeSpent: submissionContent.timeSpent,
      feedback: isPassing 
        ? 'Поздравляем! Вы прошли тест.' 
        : 'К сожалению, вы не прошли тест. Попробуйте еще раз.'
    };
  }

  validateSubmission(assignmentContent: QuizAssignmentContent, submissionContent: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!submissionContent || typeof submissionContent !== 'object') {
      errors.push('Содержимое подачи должно быть объектом');
      return { isValid: false, errors };
    }

    if (!Array.isArray(submissionContent.answers)) {
      errors.push('Поле answers должно быть массивом');
      return { isValid: false, errors };
    }

    if (submissionContent.answers.length !== assignmentContent.questions.length) {
      errors.push(`Количество ответов (${submissionContent.answers.length}) не соответствует количеству вопросов (${assignmentContent.questions.length})`);
    }

    return { isValid: errors.length === 0, errors };
  }

  private isAnswerCorrect(question: QuizQuestion, userAnswer: any): boolean {
    if (question.type === 'true-false') {
      return userAnswer === question.correctAnswer;
    }
    
    if (question.type === 'single-choice') {
      return userAnswer === question.correctAnswer;
    }
    
    if (question.type === 'multiple-choice') {
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
        return false;
      }
      
      // Сортируем массивы для сравнения
      const sortedUser = [...userAnswer].sort();
      const sortedCorrect = [...question.correctAnswer].sort();
      
      return sortedUser.length === sortedCorrect.length && 
             sortedUser.every((val, index) => val === sortedCorrect[index]);
    }

    return false;
  }
}