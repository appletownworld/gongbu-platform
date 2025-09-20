/**
 * Code Assignment Type Handler
 * Обрабатывает создание, валидацию и автоматическую проверку заданий по программированию
 */

export interface CodeTestCase {
  id: string;
  name: string;
  input: any; // Входные данные для функции
  expectedOutput: any; // Ожидаемый результат
  hidden: boolean; // Скрыт ли тест от студента
  points: number;
  timeLimit?: number; // Лимит времени в миллисекундах
  memoryLimit?: number; // Лимит памяти в байтах
  explanation?: string;
}

export interface CodeAssignmentContent {
  language: 'javascript' | 'python' | 'java' | 'cpp' | 'c' | 'csharp' | 'go' | 'rust';
  description: string;
  functionName?: string; // Имя функции, которую должен реализовать студент
  signature?: string; // Сигнатура функции
  starterCode?: string; // Начальный код для студента
  testCases: CodeTestCase[];
  allowedLibraries?: string[]; // Разрешенные библиотеки
  forbiddenKeywords?: string[]; // Запрещенные ключевые слова
  maxExecutionTime?: number; // Общий лимит времени выполнения
  maxMemoryUsage?: number; // Лимит использования памяти
  enableSyntaxHighlighting: boolean;
  enableAutoCompletion: boolean;
  showTestResults: boolean; // Показывать ли результаты тестов студенту
  instructions?: string;
}

export interface CodeSubmissionContent {
  code: string;
  language: string;
  executionTime?: number;
  memoryUsed?: number;
  submittedAt: Date;
}

export interface CodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  exitCode?: number;
}

export interface TestCaseResult {
  testId: string;
  name: string;
  passed: boolean;
  input: any;
  expectedOutput: any;
  actualOutput?: any;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  points: number;
  pointsEarned: number;
  hidden: boolean;
  explanation?: string;
}

export class CodeAssignmentHandler {
  /**
   * Валидирует контент задания по программированию
   */
  static validateContent(content: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!content.language) {
      errors.push('Не указан язык программирования');
    }
    
    const supportedLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go', 'rust'];
    if (content.language && !supportedLanguages.includes(content.language)) {
      errors.push(`Неподдерживаемый язык программирования: ${content.language}`);
    }
    
    if (!content.description || content.description.trim() === '') {
      errors.push('Отсутствует описание задания');
    }
    
    if (!content.testCases || !Array.isArray(content.testCases)) {
      errors.push('Задание должно содержать массив тестовых случаев');
      return { isValid: false, errors };
    }
    
    if (content.testCases.length === 0) {
      errors.push('Задание должно содержать хотя бы один тестовый случай');
    }
    
    // Валидируем каждый тестовый случай
    content.testCases.forEach((testCase: any, index: number) => {
      if (!testCase.id) {
        errors.push(`Тест ${index + 1}: отсутствует ID`);
      }
      
      if (!testCase.name || testCase.name.trim() === '') {
        errors.push(`Тест ${index + 1}: отсутствует название`);
      }
      
      if (testCase.expectedOutput === undefined) {
        errors.push(`Тест ${index + 1}: не указан ожидаемый результат`);
      }
      
      if (typeof testCase.points !== 'number' || testCase.points < 0) {
        errors.push(`Тест ${index + 1}: некорректное количество баллов`);
      }
      
      if (typeof testCase.hidden !== 'boolean') {
        errors.push(`Тест ${index + 1}: не указано, скрыт ли тест`);
      }
    });
    
    // Проверяем, что есть хотя бы один открытый тест
    const openTests = content.testCases.filter((test: any) => !test.hidden);
    if (openTests.length === 0) {
      errors.push('Должен быть хотя бы один открытый тест для студентов');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Создает шаблон задания по программированию
   */
  static createTemplate(language: string = 'javascript'): CodeAssignmentContent {
    const templates = {
      javascript: {
        signature: 'function solution(n) {\n  // Ваш код здесь\n  return n;\n}',
        starterCode: 'function solution(n) {\n  // Напишите функцию, которая возвращает число n умноженное на 2\n  \n}',
      },
      python: {
        signature: 'def solution(n):\n    # Ваш код здесь\n    return n',
        starterCode: 'def solution(n):\n    # Напишите функцию, которая возвращает число n умноженное на 2\n    pass',
      },
      java: {
        signature: 'public static int solution(int n) {\n    // Ваш код здесь\n    return n;\n}',
        starterCode: 'public class Solution {\n    public static int solution(int n) {\n        // Напишите функцию, которая возвращает число n умноженное на 2\n        \n    }\n}',
      }
    };
    
    const template = templates[language as keyof typeof templates] || templates.javascript;
    
    return {
      language: language as any,
      description: 'Напишите функцию, которая принимает число n и возвращает его умноженное на 2.',
      functionName: 'solution',
      signature: template.signature,
      starterCode: template.starterCode,
      testCases: [
        {
          id: 'test1',
          name: 'Простой случай',
          input: 5,
          expectedOutput: 10,
          hidden: false,
          points: 25,
          explanation: 'Функция должна умножить 5 на 2 и вернуть 10'
        },
        {
          id: 'test2',
          name: 'Отрицательное число',
          input: -3,
          expectedOutput: -6,
          hidden: false,
          points: 25,
          explanation: 'Функция должна корректно работать с отрицательными числами'
        },
        {
          id: 'test3',
          name: 'Ноль',
          input: 0,
          expectedOutput: 0,
          hidden: false,
          points: 25,
          explanation: 'Функция должна корректно обрабатывать ноль'
        },
        {
          id: 'test4',
          name: 'Большое число (скрытый тест)',
          input: 1000,
          expectedOutput: 2000,
          hidden: true,
          points: 25,
          explanation: 'Функция должна корректно работать с большими числами'
        }
      ],
      allowedLibraries: [],
      forbiddenKeywords: [],
      maxExecutionTime: 5000, // 5 секунд
      maxMemoryUsage: 128 * 1024 * 1024, // 128 MB
      enableSyntaxHighlighting: true,
      enableAutoCompletion: true,
      showTestResults: true,
      instructions: 'Реализуйте функцию согласно описанию. Код будет протестирован на нескольких тестовых случаях.'
    };
  }

  /**
   * Подготавливает задание для студента (убирает скрытые тесты)
   */
  static prepareForStudent(content: CodeAssignmentContent): any {
    const prepared = JSON.parse(JSON.stringify(content));
    
    // Оставляем только открытые тесты
    prepared.testCases = prepared.testCases.filter((test: CodeTestCase) => !test.hidden);
    
    // Убираем внутренние данные
    prepared.testCases = prepared.testCases.map((test: CodeTestCase) => ({
      id: test.id,
      name: test.name,
      input: test.input,
      expectedOutput: test.expectedOutput,
      points: test.points,
      explanation: test.explanation,
    }));
    
    return prepared;
  }

  /**
   * Выполняет код студента и тестирует его
   */
  static async gradeSubmission(
    assignmentContent: CodeAssignmentContent,
    submissionContent: CodeSubmissionContent
  ): Promise<{
    score: number;
    maxScore: number;
    results: TestCaseResult[];
    feedback: string;
    compilationError?: string;
  }> {
    const results: TestCaseResult[] = [];
    let totalScore = 0;
    let maxScore = 0;
    
    // Валидация кода
    const codeValidation = this.validateCode(assignmentContent, submissionContent.code);
    if (!codeValidation.isValid) {
      return {
        score: 0,
        maxScore: assignmentContent.testCases.reduce((sum, test) => sum + test.points, 0),
        results: [],
        feedback: `Ошибка валидации кода: ${codeValidation.errors.join(', ')}`,
        compilationError: codeValidation.errors.join('\n'),
      };
    }
    
    // Выполняем каждый тест
    for (const testCase of assignmentContent.testCases) {
      maxScore += testCase.points;
      
      try {
        const executionResult = await this.executeCode(
          submissionContent.code,
          submissionContent.language,
          testCase.input,
          testCase.timeLimit || assignmentContent.maxExecutionTime || 5000,
          testCase.memoryLimit || assignmentContent.maxMemoryUsage || 128 * 1024 * 1024
        );
        
        const passed = this.compareOutputs(testCase.expectedOutput, executionResult.output);
        const pointsEarned = passed ? testCase.points : 0;
        
        totalScore += pointsEarned;
        
        results.push({
          testId: testCase.id,
          name: testCase.name,
          passed,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: executionResult.output,
          error: executionResult.error,
          executionTime: executionResult.executionTime,
          memoryUsed: executionResult.memoryUsed,
          points: testCase.points,
          pointsEarned,
          hidden: testCase.hidden,
          explanation: testCase.explanation,
        });
        
      } catch (error) {
        results.push({
          testId: testCase.id,
          name: testCase.name,
          passed: false,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          error: error instanceof Error ? error.message : String(error),
          executionTime: 0,
          memoryUsed: 0,
          points: testCase.points,
          pointsEarned: 0,
          hidden: testCase.hidden,
          explanation: testCase.explanation,
        });
      }
    }
    
    const feedback = this.generateFeedback(totalScore, maxScore, results);
    
    return {
      score: totalScore,
      maxScore,
      results,
      feedback,
    };
  }

  /**
   * Валидирует код студента
   */
  private static validateCode(assignmentContent: CodeAssignmentContent, code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!code || code.trim() === '') {
      errors.push('Код не может быть пустым');
      return { isValid: false, errors };
    }
    
    // Проверяем запрещенные ключевые слова
    if (assignmentContent.forbiddenKeywords) {
      for (const keyword of assignmentContent.forbiddenKeywords) {
        if (code.includes(keyword)) {
          errors.push(`Использование запрещенного ключевого слова: ${keyword}`);
        }
      }
    }
    
    // Базовая проверка синтаксиса (можно расширить)
    try {
      // Для JavaScript можно использовать eval или другие инструменты валидации
      if (assignmentContent.language === 'javascript') {
        // Простая проверка на базовые синтаксические ошибки
        const forbiddenPatterns = [
          /\beval\b/,
          /\bFunction\b\(/,
          /\bsetTimeout\b/,
          /\bsetInterval\b/,
          /\brequire\b/,
          /\bimport\b.*\bfrom\b/,
        ];
        
        for (const pattern of forbiddenPatterns) {
          if (pattern.test(code)) {
            errors.push(`Использование запрещенной конструкции: ${pattern.source}`);
          }
        }
      }
    } catch (syntaxError) {
      errors.push(`Синтаксическая ошибка: ${syntaxError}`);
    }
    
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Выполняет код студента (заглушка - в реальном проекте нужен безопасный sandbox)
   */
  private static async executeCode(
    code: string,
    language: string,
    input: any,
    timeLimit: number,
    memoryLimit: number
  ): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // ВНИМАНИЕ: Это упрощенная заглушка!
      // В реальном проекте необходимо использовать безопасный sandbox
      // например Docker containers, VM, или специализированные сервисы
      
      if (language === 'javascript') {
        // Создаем безопасную функцию для выполнения
        const safeCode = `
          (function() {
            ${code}
            if (typeof solution === 'function') {
              return solution(${JSON.stringify(input)});
            } else {
              throw new Error('Функция solution не найдена');
            }
          })()
        `;
        
        // В реальном проекте использовать vm2 или аналогичную безопасную среду
        const result = eval(safeCode);
        
        return {
          success: true,
          output: result,
          executionTime: Date.now() - startTime,
          memoryUsed: 0, // В реальном проекте измерять фактическое использование памяти
          exitCode: 0,
        };
      }
      
      // Для других языков программирования нужны отдельные обработчики
      throw new Error(`Язык ${language} не поддерживается в данной демо-версии`);
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        exitCode: 1,
      };
    }
  }

  /**
   * Сравнивает ожидаемый и фактический результат
   */
  private static compareOutputs(expected: any, actual: any): boolean {
    // Простое сравнение - можно расширить для сложных случаев
    if (typeof expected === 'number' && typeof actual === 'number') {
      // Для чисел с плавающей точкой используем небольшую погрешность
      return Math.abs(expected - actual) < 1e-9;
    }
    
    // Глубокое сравнение объектов и массивов
    return JSON.stringify(expected) === JSON.stringify(actual);
  }

  /**
   * Генерирует обратную связь по результатам тестирования
   */
  private static generateFeedback(
    score: number,
    maxScore: number,
    results: TestCaseResult[]
  ): string {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    let feedback = `Результат: ${score}/${maxScore} баллов (${Math.round(percentage)}%)\n`;
    feedback += `Пройдено тестов: ${passedTests}/${totalTests}\n\n`;
    
    if (percentage >= 100) {
      feedback += '🎉 Отлично! Все тесты пройдены!\n\n';
    } else if (percentage >= 80) {
      feedback += '✅ Хорошо! Большинство тестов пройдено.\n\n';
    } else if (percentage >= 50) {
      feedback += '⚠️ Удовлетворительно. Есть над чем поработать.\n\n';
    } else {
      feedback += '❌ Требуется доработка. Много тестов не пройдено.\n\n';
    }
    
    // Детализация по тестам (только открытые)
    const visibleResults = results.filter(r => !r.hidden);
    visibleResults.forEach((result) => {
      const status = result.passed ? '✅' : '❌';
      feedback += `${status} ${result.name}: ${result.pointsEarned}/${result.points} баллов\n`;
      
      if (!result.passed) {
        feedback += `   Ожидалось: ${JSON.stringify(result.expectedOutput)}\n`;
        feedback += `   Получено: ${JSON.stringify(result.actualOutput)}\n`;
        
        if (result.error) {
          feedback += `   Ошибка: ${result.error}\n`;
        }
        
        if (result.explanation) {
          feedback += `   Подсказка: ${result.explanation}\n`;
        }
      }
      
      feedback += `   Время выполнения: ${result.executionTime}мс\n\n`;
    });
    
    // Информация о скрытых тестах
    const hiddenResults = results.filter(r => r.hidden);
    if (hiddenResults.length > 0) {
      const hiddenPassed = hiddenResults.filter(r => r.passed).length;
      feedback += `Скрытые тесты: ${hiddenPassed}/${hiddenResults.length} пройдено\n`;
    }
    
    return feedback;
  }

  /**
   * Валидирует подачу кода
   */
  static validateSubmission(
    assignmentContent: CodeAssignmentContent,
    submissionContent: any
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!submissionContent.code || submissionContent.code.trim() === '') {
      errors.push('Код не может быть пустым');
    }
    
    if (!submissionContent.language) {
      errors.push('Не указан язык программирования');
    }
    
    if (submissionContent.language !== assignmentContent.language) {
      errors.push(`Язык программирования должен быть ${assignmentContent.language}`);
    }
    
    // Проверяем длину кода (разумные ограничения)
    if (submissionContent.code && submissionContent.code.length > 10000) {
      errors.push('Код слишком длинный (максимум 10000 символов)');
    }
    
    return { isValid: errors.length === 0, errors };
  }
}
