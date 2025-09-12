import { Injectable } from '@nestjs/common';
import { LessonRepository } from './lesson.repository';

@Injectable()
export class LessonsService {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async findByCourse(courseId: string) {
    // TODO: Implement lesson listing by course
    return [];
  }

  async findOne(id: string) {
    // TODO: Implement lesson retrieval
    return { id, title: 'Sample Lesson' };
  }

  async create(createLessonDto: any) {
    // TODO: Implement lesson creation
    return { message: 'Lesson created (stub)' };
  }
}
