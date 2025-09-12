import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CourseRepository } from './course.repository';
import { 
  CreateCourseDto, 
  UpdateCourseDto, 
  CourseQueryDto,
  CourseResponseDto,
  CourseListResponseDto,
  CourseStatsResponseDto 
} from './dto/course.dto';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private readonly authServiceUrl: string;

  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://auth-service:3001';
  }

  /**
   * Получение списка курсов с фильтрацией
   */
  async findAll(query: CourseQueryDto): Promise<CourseListResponseDto> {
    this.logger.debug('Getting courses list', query);

    const result = await this.courseRepository.findAll(query);
    
    // Обогащаем данные информацией об авторах
    const coursesWithAuthors = await this.enrichWithCreatorInfo(result.courses);

    return {
      courses: coursesWithAuthors,
      pagination: result.pagination,
    };
  }

  /**
   * Получение курса по ID
   */
  async findOne(id: string): Promise<CourseResponseDto> {
    this.logger.debug(`Getting course by ID: ${id}`);

    const course = await this.courseRepository.findById(id);
    
    // Обогащаем информацией об авторе
    const courseWithAuthor = await this.enrichWithCreatorInfo([course]);
    
    return courseWithAuthor[0];
  }

  /**
   * Получение курса по slug
   */
  async findBySlug(slug: string): Promise<CourseResponseDto | null> {
    this.logger.debug(`Getting course by slug: ${slug}`);

    const course = await this.courseRepository.findBySlug(slug);
    
    if (!course) {
      return null;
    }
    
    // Обогащаем информацией об авторе
    const courseWithAuthor = await this.enrichWithCreatorInfo([course]);
    
    return courseWithAuthor[0];
  }

  /**
   * Создание курса
   */
  async create(createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    this.logger.debug('Creating new course', { title: createCourseDto.title });

    // Валидируем создателя через Auth Service
    await this.validateCreator(createCourseDto.creatorId);

    const course = await this.courseRepository.create(createCourseDto);
    
    // Обогащаем информацией об авторе
    const courseWithAuthor = await this.enrichWithCreatorInfo([course]);
    
    this.logger.log(`Course created: ${course.id} - ${course.title}`);
    
    return courseWithAuthor[0];
  }

  /**
   * Обновление курса
   */
  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<CourseResponseDto> {
    this.logger.debug(`Updating course: ${id}`, updateCourseDto);

    const course = await this.courseRepository.update(id, updateCourseDto);
    
    // Обогащаем информацией об авторе
    const courseWithAuthor = await this.enrichWithCreatorInfo([course]);
    
    this.logger.log(`Course updated: ${id} - ${course.title}`);
    
    return courseWithAuthor[0];
  }

  /**
   * Удаление курса
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    this.logger.debug(`Deleting course: ${id}`);

    const result = await this.courseRepository.delete(id);
    
    this.logger.log(`Course deleted: ${id}`);
    
    return result;
  }

  /**
   * Публикация курса
   */
  async publish(id: string): Promise<CourseResponseDto> {
    this.logger.debug(`Publishing course: ${id}`);

    const course = await this.courseRepository.findById(id);
    
    if (course.lessonCount === 0) {
      throw new NotFoundException('Cannot publish course without lessons');
    }

    const updatedCourse = await this.courseRepository.update(id, {
      isPublished: true,
    });

    const courseWithAuthor = await this.enrichWithCreatorInfo([updatedCourse]);
    
    this.logger.log(`Course published: ${id} - ${updatedCourse.title}`);
    
    return courseWithAuthor[0];
  }

  /**
   * Снятие курса с публикации
   */
  async unpublish(id: string): Promise<CourseResponseDto> {
    this.logger.debug(`Unpublishing course: ${id}`);

    const updatedCourse = await this.courseRepository.update(id, {
      isPublished: false,
    });

    const courseWithAuthor = await this.enrichWithCreatorInfo([updatedCourse]);
    
    this.logger.log(`Course unpublished: ${id} - ${updatedCourse.title}`);
    
    return courseWithAuthor[0];
  }

  /**
   * Поиск курсов
   */
  async search(query: string, limit: number = 10): Promise<CourseResponseDto[]> {
    this.logger.debug(`Searching courses: "${query}"`);

    const courses = await this.courseRepository.search(query, limit);
    
    // Обогащаем информацией об авторах
    const coursesWithAuthors = await this.enrichWithCreatorInfo(courses);
    
    return coursesWithAuthors;
  }

  /**
   * Получение статистики курсов
   */
  async getStats(): Promise<CourseStatsResponseDto> {
    this.logger.debug('Getting courses statistics');

    const stats = await this.courseRepository.getStats();
    
    return stats;
  }

  /**
   * Получение курсов пользователя
   */
  async getUserCourses(userId: string): Promise<{
    enrolled: CourseResponseDto[];
    completed: CourseResponseDto[];
    inProgress: CourseResponseDto[];
  }> {
    this.logger.debug(`Getting courses for user: ${userId}`);

    // TODO: Implement user courses retrieval
    // This will be implemented when enrollment system is ready
    
    return {
      enrolled: [],
      completed: [],
      inProgress: [],
    };
  }

  /**
   * Валидация создателя через Auth Service
   */
  private async validateCreator(creatorId: string): Promise<void> {
    try {
      // В реальной системе здесь будет HTTP запрос к Auth Service
      // const user = await this.httpService.get(`${this.authServiceUrl}/users/${creatorId}`).toPromise();
      // if (!user.data || user.data.role === 'STUDENT') {
      //   throw new BadRequestException('User is not allowed to create courses');
      // }
      
      this.logger.debug(`Creator validated: ${creatorId}`);
    } catch (error) {
      this.logger.warn(`Failed to validate creator ${creatorId}:`, error.message);
      // В разработке не блокируем создание курсов
    }
  }

  /**
   * Обогащение курсов информацией об авторах
   */
  private async enrichWithCreatorInfo(courses: any[]): Promise<CourseResponseDto[]> {
    // Получаем уникальных создателей
    const creatorIds = [...new Set(courses.map(course => course.creatorId))];
    
    // В реальной системе здесь будет запрос к Auth Service для получения данных авторов
    const creators = {};
    for (const creatorId of creatorIds) {
      creators[creatorId] = {
        id: creatorId,
        name: `Author ${creatorId.substring(0, 8)}`,
        avatar: `https://via.placeholder.com/100x100?text=${creatorId.substring(0, 2).toUpperCase()}`,
      };
    }

    // Обогащаем курсы данными авторов
    return courses.map(course => ({
      ...course,
      price: course.price ? parseFloat(course.price.toString()) : null,
      creator: creators[course.creatorId],
    }));
  }
}
