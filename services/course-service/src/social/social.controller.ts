import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SocialService } from './social.service';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  CreateCommentDto, 
  VoteReviewDto,
  GetReviewsQueryDto,
  GetCommentsQueryDto,
  GetFollowersQueryDto
} from './dto/social.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ==================== REVIEWS ====================

  @Post('reviews')
  async createReview(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.socialService.createReview(req.user.id, createReviewDto);
  }

  @Put('reviews/:id')
  async updateReview(@Request() req, @Param('id') reviewId: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.socialService.updateReview(req.user.id, reviewId, updateReviewDto);
  }

  @Delete('reviews/:id')
  async deleteReview(@Request() req, @Param('id') reviewId: string) {
    return this.socialService.deleteReview(req.user.id, reviewId);
  }

  @Get('courses/:courseId/reviews')
  async getCourseReviews(
    @Param('courseId') courseId: string,
    @Query() query: GetReviewsQueryDto
  ) {
    return this.socialService.getCourseReviews(
      courseId,
      query.page,
      query.limit,
      query.sortBy
    );
  }

  @Post('reviews/:id/vote')
  async voteReview(@Request() req, @Param('id') reviewId: string, @Body() voteDto: VoteReviewDto) {
    return this.socialService.voteReview(req.user.id, reviewId, voteDto);
  }

  // ==================== COMMENTS ====================

  @Post('courses/:courseId/comments')
  async createCourseComment(
    @Request() req,
    @Param('courseId') courseId: string,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.socialService.createCourseComment(req.user.id, courseId, createCommentDto);
  }

  @Post('lessons/:lessonId/comments')
  async createLessonComment(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.socialService.createLessonComment(req.user.id, lessonId, createCommentDto);
  }

  @Get('courses/:courseId/comments')
  async getCourseComments(
    @Param('courseId') courseId: string,
    @Query() query: GetCommentsQueryDto
  ) {
    return this.socialService.getCourseComments(courseId, query.page, query.limit);
  }

  @Get('lessons/:lessonId/comments')
  async getLessonComments(
    @Param('lessonId') lessonId: string,
    @Query() query: GetCommentsQueryDto
  ) {
    return this.socialService.getLessonComments(lessonId, query.page, query.limit);
  }

  // ==================== LIKES ====================

  @Post('courses/:courseId/like')
  async likeCourse(@Request() req, @Param('courseId') courseId: string) {
    return this.socialService.likeCourse(req.user.id, courseId);
  }

  @Get('courses/:courseId/likes')
  async getCourseLikes(@Param('courseId') courseId: string) {
    return this.socialService.getCourseLikes(courseId);
  }

  // ==================== FOLLOWS ====================

  @Post('users/:userId/follow')
  async followUser(@Request() req, @Param('userId') userId: string) {
    return this.socialService.followUser(req.user.id, userId);
  }

  @Get('users/:userId/followers')
  async getUserFollowers(
    @Param('userId') userId: string,
    @Query() query: GetFollowersQueryDto
  ) {
    return this.socialService.getUserFollowers(userId, query.page, query.limit);
  }

  @Get('users/:userId/following')
  async getUserFollowing(
    @Param('userId') userId: string,
    @Query() query: GetFollowersQueryDto
  ) {
    return this.socialService.getUserFollowing(userId, query.page, query.limit);
  }
}
