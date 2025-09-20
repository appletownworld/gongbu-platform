import { AssignmentType } from '@prisma/client';

export class QuizAssignmentHandler {
  static readonly type = AssignmentType.QUIZ;

  static validateSubmission(content: any): boolean {
    // Basic validation for quiz submissions
    return content && typeof content === 'object' && Array.isArray(content.answers);
  }

  static calculateScore(submission: any, assignment: any): number {
    // Basic scoring logic for quizzes
    if (!submission.content?.answers || !assignment.content?.questions) {
      return 0;
    }

    const answers = submission.content.answers;
    const questions = assignment.content.questions;
    let correctAnswers = 0;

    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswer) {
        correctAnswers++;
      }
    }

    return Math.round((correctAnswers / questions.length) * 100);
  }
}
