import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  ValidationPipe,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { 
  CreateCourseDto, 
  UpdateCourseDto, 
  CourseQueryDto,
  CourseResponseDto,
  CourseListResponseDto,
  CourseStatsResponseDto 
} from './dto/course.dto';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  private readonly logger = new Logger(CoursesController.name);

  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all courses',
    description: 'Retrieve a paginated list of courses with optional filters'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Courses retrieved successfully',
    type: CourseListResponseDto
  })
  async getAllCourses(@Query() query: CourseQueryDto): Promise<CourseListResponseDto> {
    this.logger.debug('GET /courses', query);
    return this.coursesService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search courses',
    description: 'Search for courses by title, description, or tags'
  })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Search results retrieved successfully',
    type: [CourseResponseDto]
  })
  async searchCourses(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
  ): Promise<CourseResponseDto[]> {
    this.logger.debug(`GET /courses/search?q=${query}&limit=${limit}`);
    return this.coursesService.search(query, limit);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get course statistics',
    description: 'Retrieve overall statistics about courses'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    type: CourseStatsResponseDto
  })
  async getStats(): Promise<CourseStatsResponseDto> {
    this.logger.debug('GET /courses/stats');
    return this.coursesService.getStats();
  }

  @Get('users/:userId')
  @ApiOperation({ 
    summary: 'Get user courses',
    description: 'Get all courses for a specific user (enrolled, completed, in progress)'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'User courses retrieved successfully'
  })
  async getUserCourses(@Param('userId') userId: string): Promise<{
    enrolled: CourseResponseDto[];
    completed: CourseResponseDto[];
    inProgress: CourseResponseDto[];
  }> {
    this.logger.debug(`GET /courses/users/${userId}`);
    return this.coursesService.getUserCourses(userId);
  }

  @Get('slug/:slug')
  @ApiOperation({ 
    summary: 'Get course by slug',
    description: 'Retrieve a course by its unique slug'
  })
  @ApiParam({ name: 'slug', description: 'Course slug' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course retrieved successfully',
    type: CourseResponseDto
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseBySlug(@Param('slug') slug: string): Promise<CourseResponseDto> {
    this.logger.debug(`GET /courses/slug/${slug}`);
    
    const course = await this.coursesService.findBySlug(slug);
    if (!course) {
      throw new NotFoundException(`Course with slug "${slug}" not found`);
    }
    
    return course;
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get course by ID',
    description: 'Retrieve a specific course by its ID'
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course retrieved successfully',
    type: CourseResponseDto
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourse(@Param('id') id: string): Promise<CourseResponseDto> {
    this.logger.debug(`GET /courses/${id}`);
    return this.coursesService.findOne(id);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create new course',
    description: 'Create a new course with the provided details'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Course created successfully',
    type: CourseResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid course data' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @Body(ValidationPipe) createCourseDto: CreateCourseDto
  ): Promise<CourseResponseDto> {
    this.logger.debug('POST /courses', { title: createCourseDto.title });
    return this.coursesService.create(createCourseDto);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update course',
    description: 'Update an existing course with new details'
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course updated successfully',
    type: CourseResponseDto
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiBearerAuth()
  async updateCourse(
    @Param('id') id: string, 
    @Body(ValidationPipe) updateCourseDto: UpdateCourseDto
  ): Promise<CourseResponseDto> {
    this.logger.debug(`PUT /courses/${id}`, updateCourseDto);
    return this.coursesService.update(id, updateCourseDto);
  }

  @Post(':id/publish')
  @ApiOperation({ 
    summary: 'Publish course',
    description: 'Publish a course to make it available to students'
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course published successfully',
    type: CourseResponseDto
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 400, description: 'Course cannot be published' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async publishCourse(@Param('id') id: string): Promise<CourseResponseDto> {
    this.logger.debug(`POST /courses/${id}/publish`);
    return this.coursesService.publish(id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ 
    summary: 'Unpublish course',
    description: 'Unpublish a course to make it unavailable to students'
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course unpublished successfully',
    type: CourseResponseDto
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async unpublishCourse(@Param('id') id: string): Promise<CourseResponseDto> {
    this.logger.debug(`POST /courses/${id}/unpublish`);
    return this.coursesService.unpublish(id);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete course',
    description: 'Delete a course and all its associated data'
  })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Course deleted successfully'
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 400, description: 'Course cannot be deleted' })
  @ApiBearerAuth()
  async deleteCourse(@Param('id') id: string): Promise<{ message: string; id: string }> {
    this.logger.debug(`DELETE /courses/${id}`);
    return this.coursesService.remove(id);
  }
}
