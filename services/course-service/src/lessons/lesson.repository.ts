import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class LessonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // TODO: Implement lesson repository methods
}
