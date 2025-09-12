import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AssignmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // TODO: Implement assignment repository methods
}
