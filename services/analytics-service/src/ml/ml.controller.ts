import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ml')
@UseGuards(JwtAuthGuard)
export class MLController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('recommendations')
  async getRecommendations(
    @Request() req,
    @Query('type') type: 'collaborative' | 'content' | 'hybrid' | 'popular' = 'hybrid',
    @Query('limit') limit: string = '10'
  ) {
    const userId = req.user.id;
    const limitNum = parseInt(limit, 10) || 10;

    switch (type) {
      case 'collaborative':
        return this.recommendationService.getCollaborativeRecommendations(userId, limitNum);
      case 'content':
        return this.recommendationService.getContentBasedRecommendations(userId, limitNum);
      case 'popular':
        return this.recommendationService.getPopularCourses(limitNum);
      case 'hybrid':
      default:
        return this.recommendationService.getHybridRecommendations(userId, limitNum);
    }
  }

  @Get('recommendations/ab-test')
  async getRecommendationsForABTest(
    @Request() req,
    @Query('variant') variant: 'A' | 'B' = 'A',
    @Query('limit') limit: string = '10'
  ) {
    const userId = req.user.id;
    const limitNum = parseInt(limit, 10) || 10;

    return this.recommendationService.getRecommendationsForABTest(userId, variant, limitNum);
  }
}
