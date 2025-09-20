/**
 * Quiz Assignment Type Handler
 * Обрабатывает создание, валидацию и автоматическую проверку квизов
 */

export interface QuizQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'text' | 'number';
  question: string;
  options?: string[]; // Для вариантов ответа
  correctAnswer: any;
  explanation?: string;
  points: number;
  timeLimit?: number; // в секундах
  required: boolean;
}

export interface QuizAssignmentContent {
  questions: QuizQuestion[];
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showCorrectAnswers: boolean;
  allowRetries: boolean;
  maxRetries?: number;
  passingPercentage: number;
  timeLimit?: number; // общий лимит времени на весь квиз
  showProgressBar: boolean;
  instructions?: string;
}

export interface QuizSubmissionContent {
  answers: Record<string, any>; // questionId -> answer
  startTime: Date;
  endTime: Date;
  timeSpent: number; // в секундах
  questionOrder?: string[]; // порядок вопросов если был shuffle
}

export class QuizAssignmentHandler {
  /**
   * Валидирует контент квиза
   */
  static validateContent(content: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!content.questions || !Array.isArray(content.questions)) {
      errors.push('Квиз должен содержать массив вопросов');
      return { isValid: false, errors };
    }

    if (content.questions.length === 0) {
      errors.push('Квиз должен содержать хотя бы один вопрос');
    }

    // Валидируем каждый вопрос
    content.questions.forEach((question: any, index: number) => {
      if (!question.id) {
        errors.push(`Вопрос ${index + 1}: отсутствует ID`);
      }

      if (!question.question || question.question.trim() === '') {
        errors.push(`Вопрос ${index + 1}: отсутствует текст вопроса`);
      }

      if (!question.type) {
        errors.push(`Вопрос ${index + 1}: не указан тип вопроса`);
      }

      if (!['single_choice', 'multiple_choice', 'true_false', 'text', 'number'].includes(question.type)) {
        errors.push(`Вопрос ${index + 1}: недопустимый тип вопроса`);
      }

      // Валидируем варианты ответов для choice-вопросов
      if (['single_choice', 'multiple_choice'].includes(question.type)) {
        if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
          errors.push(`Вопрос ${index + 1}: должен содержать минимум 2 варианта ответа`);
        }
      }

      // Валидируем правильный ответ
      if (question.correctAnswer === undefined || question.correctAnswer === null) {
        errors.push(`Вопрос ${index + 1}: не указан правильный ответ`);
      }

      // Валидируем баллы
      if (typeof question.points !== 'number' || question.points < 0) {
        errors.push(`Вопрос ${index + 1}: некорректное количество баллов`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Создает шаблон квиза
   */
  static createTemplate(): QuizAssignmentContent {
    return {
      questions: [
        {
          id: 'q1',
          type: 'single_choice',
          question: 'Пример вопроса с одним правильным ответом',
          options: ['Вариант А', 'Вариант Б', 'Вариант В', 'Вариант Г'],
          correctAnswer: 0, // индекс правильного ответа
          explanation: 'Объяснение правильного ответа',
          points: 1,
          required: true,
        },
        {
          id: 'q2',
          type: 'multiple_choice',
          question: 'Пример вопроса с несколькими правильными ответами',
          options: ['Вариант А', 'Вариант Б', 'Вариант В', 'Вариант Г'],
          correctAnswer: [0, 2], // индексы правильных ответов
          explanation: 'Варианты А и В правильные',
          points: 2,
          required: true,
        },
        {
          id: 'q3',
          type: 'true_false',
          question: 'Это утверждение истинно?',
          correctAnswer: true,
          explanation: 'Объяснение ответа',
          points: 1,
          required: true,
        },
        {
          id: 'q4',
          type: 'text',
          question: 'Дайте краткий ответ на вопрос',
          correctAnswer: 'ожидаемый ответ',
          points: 3,
          required: false,
        }
      ],
      shuffleQuestions: false,
      shuffleAnswers: false,
      showCorrectAnswers: true,
      allowRetries: false,
      passingPercentage: 60,
      showProgressBar: true,
      instructions: 'Внимательно прочитайте вопросы и выберите правильные ответы.'
    };
  }

  /**
   * Подготавливает квиз для студента (убирает правильные ответы, перемешивает если нужно)
   */
  static prepareForStudent(content: QuizAssignmentContent): any {
    const prepared = JSON.parse(JSON.stringify(content));
    
    // Убираем правильные ответы и объяснения
    prepared.questions = prepared.questions.map((question: QuizQuestion) => {
      const studentQuestion = { ...question };
      delete studentQuestion.correctAnswer;
      delete studentQuestion.explanation;
      
      // Перемешиваем варианты ответов если нужно
      if (content.shuffleAnswers && studentQuestion.options) {
        studentQuestion.options = this.shuffleArray([...studentQuestion.options]);
      }
      
      return studentQuestion;
    });
    
    // Перемешиваем вопросы если нужно
    if (content.shuffleQuestions) {
      prepared.questions = this.shuffleArray(prepared.questions);
    }
    
    return prepared;
  }

  /**
   * Проверяет ответы студента автоматически
   */
  static gradeSubmission(
    assignmentContent: QuizAssignmentContent,
    submissionContent: QuizSubmissionContent
  ): {
    score: number;
    maxScore: number;
    results: Array<{
      questionId: string;
      correct: boolean;
      points: number;
      studentAnswer: any;
      correctAnswer: any;
      explanation?: string;
    }>;
    feedback: string;
  } {
    const results: Array<{
      questionId: string;
      correct: boolean;
      points: number;
      studentAnswer: any;
      correctAnswer: any;
      explanation?: string;
    }> = [];
    
    let totalScore = 0;
    let maxScore = 0;
    
    assignmentContent.questions.forEach((question) => {
      maxScore += question.points;
      
      const studentAnswer = submissionContent.answers[question.id];
      const isCorrect = this.isAnswerCorrect(question, studentAnswer);
      const points = isCorrect ? question.points : 0;
      
      totalScore += points;
      
      results.push({
        questionId: question.id,
        correct: isCorrect,
        points,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    });
    
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= assignmentContent.passingPercentage;
    
    const feedback = this.generateFeedback(totalScore, maxScore, percentage, passed, results);
    
    return {
      score: totalScore,
      maxScore,
      results,
      feedback,
    };
  }

  /**
   * Проверяет правильность ответа на вопрос
   */
  private static isAnswerCorrect(question: QuizQuestion, studentAnswer: any): boolean {
    if (studentAnswer === undefined || studentAnswer === null) {
      return false;
    }
    
    switch (question.type) {
      case 'single_choice':
        return studentAnswer === question.correctAnswer;
        
      case 'multiple_choice':
        if (!Array.isArray(studentAnswer) || !Array.isArray(question.correctAnswer)) {
          return false;
        }
        // Сравниваем отсортированные массивы
        const sortedStudent = [...studentAnswer].sort();
        const sortedCorrect = [...question.correctAnswer].sort();
        return JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect);
        
      case 'true_false':
        return studentAnswer === question.correctAnswer;
        
      case 'text':
        // Для текстовых ответов делаем простое сравнение без учета регистра
        const studentText = String(studentAnswer).toLowerCase().trim();
        const correctText = String(question.correctAnswer).toLowerCase().trim();
        return studentText === correctText;
        
      case 'number':
        return Number(studentAnswer) === Number(question.correctAnswer);
        
      default:
        return false;
    }
  }

  /**
   * Генерирует обратную связь по результатам квиза
   */
  private static generateFeedback(
    score: number,
    maxScore: number,
    percentage: number,
    passed: boolean,
    results: any[]
  ): string {
    const correctCount = results.filter(r => r.correct).length;
    const totalQuestions = results.length;
    
    let feedback = `Результат: ${score}/${maxScore} баллов (${Math.round(percentage)}%)\n`;
    feedback += `Правильных ответов: ${correctCount} из ${totalQuestions}\n\n`;
    
    if (passed) {
      feedback += '✅ Поздравляем! Вы успешно прошли квиз.\n\n';
    } else {
      feedback += '❌ Квиз не пройден. Необходимо набрать больше баллов.\n\n';
    }
    
    // Детализация по вопросам
    results.forEach((result, index) => {
      const status = result.correct ? '✅' : '❌';
      feedback += `${status} Вопрос ${index + 1}: ${result.points} из ${result.points} ${result.correct ? '' : '(0)'} баллов\n`;
      
      if (!result.correct && result.explanation) {
        feedback += `   Объяснение: ${result.explanation}\n`;
      }
    });
    
    return feedback;
  }

  /**
   * Перемешивает массив (алгоритм Фишера-Йетса)
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Валидирует подачу квиза
   */
  static validateSubmission(
    assignmentContent: QuizAssignmentContent,
    submissionContent: any
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!submissionContent.answers || typeof submissionContent.answers !== 'object') {
      errors.push('Подача должна содержать ответы на вопросы');
      return { isValid: false, errors };
    }
    
    // Проверяем обязательные вопросы
    const requiredQuestions = assignmentContent.questions.filter(q => q.required);
    requiredQuestions.forEach((question) => {
      const answer = submissionContent.answers[question.id];
      if (answer === undefined || answer === null || answer === '') {
        errors.push(`Вопрос "${question.question}" является обязательным`);
      }
    });
    
    // Проверяем временные ограничения
    if (assignmentContent.timeLimit && submissionContent.timeSpent) {
      if (submissionContent.timeSpent > assignmentContent.timeLimit + 60) { // +60 секунд допуск
        errors.push('Превышен лимит времени на выполнение квиза');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
}
