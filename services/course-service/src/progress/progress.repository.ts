import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // TODO: Implement progress repository methods
}
