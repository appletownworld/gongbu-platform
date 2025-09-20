import { BaseAssignmentHandler } from './index';

export interface CodeTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
  isHidden?: boolean;
  points: number;
}

export interface CodeAssignmentContent {
  description: string;
  language: string;
  starterCode?: string;
  testCases: CodeTestCase[];
  timeLimit?: number; // в секундах
  memoryLimit?: number; // в MB
  allowMultipleSubmissions?: boolean;
  maxSubmissions?: number;
}

export interface CodeSubmissionContent {
  code: string;
  language: string;
  testResults?: any[];
  executionTime?: number;
  memoryUsed?: number;
  submittedAt?: Date;
}

export class CodeAssignmentHandler implements BaseAssignmentHandler<CodeAssignmentContent, CodeSubmissionContent> {
  validateContent(content: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || typeof content !== 'object') {
      errors.push('Контент должен быть объектом');
      return { isValid: false, errors };
    }

    if (!content.description || typeof content.description !== 'string') {
      errors.push('Отсутствует описание задания');
    }

    if (!content.language || typeof content.language !== 'string') {
      errors.push('Не указан язык программирования');
    }

    if (!Array.isArray(content.testCases)) {
      errors.push('Поле testCases должно быть массивом');
      return { isValid: false, errors };
    }

    if (content.testCases.length === 0) {
      errors.push('Должен быть хотя бы один тест-кейс');
    }

    // Валидация каждого тест-кейса
    content.testCases.forEach((testCase: any, index: number) => {
      if (!testCase.id) {
        errors.push(`Тест-кейс ${index + 1}: отсутствует ID`);
      }
      if (typeof testCase.input === 'undefined') {
        errors.push(`Тест-кейс ${index + 1}: отсутствует входной параметр`);
      }
      if (typeof testCase.expectedOutput === 'undefined') {
        errors.push(`Тест-кейс ${index + 1}: отсутствует ожидаемый результат`);
      }
      if (typeof testCase.points !== 'number' || testCase.points <= 0) {
        errors.push(`Тест-кейс ${index + 1}: неверное количество баллов`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  createTemplate(): CodeAssignmentContent {
    return {
      description: 'Напишите функцию, которая...',
      language: 'javascript',
      starterCode: 'function solution() {\n  // Ваш код здесь\n  return null;\n}',
      testCases: [
        {
          id: 'test-1',
          input: 'example input',
          expectedOutput: 'expected output',
          description: 'Базовый тест-кейс',
          isHidden: false,
          points: 10
        }
      ],
      timeLimit: 3600, // 1 час
      memoryLimit: 256, // 256 MB
      allowMultipleSubmissions: true,
      maxSubmissions: 10
    };
  }

  prepareForStudent(content: CodeAssignmentContent): any {
    // Скрываем скрытые тест-кейсы
    return {
      ...content,
      testCases: content.testCases.map(tc => ({
        ...tc,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput
      }))
    };
  }

  gradeSubmission(assignmentContent: CodeAssignmentContent, submissionContent: CodeSubmissionContent): any {
    const testResults = submissionContent.testResults || [];
    const testCases = assignmentContent.testCases;
    
    let totalScore = 0;
    let maxScore = 0;
    const results: any[] = [];

    testCases.forEach((testCase, index) => {
      maxScore += testCase.points;
      const testResult = testResults[index];
      
      if (testResult && testResult.passed) {
        totalScore += testCase.points;
      }

      results.push({
        testCaseId: testCase.id,
        passed: testResult?.passed || false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: testResult?.output,
        points: testResult?.passed ? testCase.points : 0,
        maxPoints: testCase.points,
        executionTime: testResult?.executionTime,
        memoryUsed: testResult?.memoryUsed
      });
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    return {
      score: totalScore,
      maxScore,
      percentage,
      passedTests,
      totalTests,
      results,
      executionTime: submissionContent.executionTime,
      memoryUsed: submissionContent.memoryUsed,
      feedback: `Пройдено тестов: ${passedTests}/${totalTests}. Общий балл: ${percentage}%`
    };
  }

  validateSubmission(assignmentContent: CodeAssignmentContent, submissionContent: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!submissionContent || typeof submissionContent !== 'object') {
      errors.push('Содержимое подачи должно быть объектом');
      return { isValid: false, errors };
    }

    if (!submissionContent.code || typeof submissionContent.code !== 'string') {
      errors.push('Отсутствует код');
    }

    if (!submissionContent.language || typeof submissionContent.language !== 'string') {
      errors.push('Не указан язык программирования');
    }

    if (submissionContent.language !== assignmentContent.language) {
      errors.push(`Язык программирования должен быть ${assignmentContent.language}`);
    }

    if (submissionContent.code.trim().length === 0) {
      errors.push('Код не может быть пустым');
    }

    return { isValid: errors.length === 0, errors };
  }
}