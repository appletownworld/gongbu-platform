import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, Course, Prisma } from '@prisma/client';
import { CourseQueryDto, CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Получение курсов с фильтрацией и пагинацией
   */
  async findAll(query: CourseQueryDto) {
    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      search,
      language,
      minPrice,
      maxPrice,
      tags,
      creatorId,
      isPublished,
      isPremium,
    } = query;

    const skip = (page - 1) * limit;
    
    // Строим условие для поиска
    const where: Prisma.CourseWhereInput = {};

    if (category) {
      where.category = category as any;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (language) {
      where.language = language;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    if (typeof isPublished === 'boolean') {
      where.isPublished = isPublished;
    }

    if (typeof isPremium === 'boolean') {
      where.isPremium = isPremium;
    }

    // Фильтр по цене
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Поиск по тексту
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Фильтр по тегам
    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagsArray };
    }

    // Получаем курсы с подсчетом статистики
    const [courses, totalItems] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              reviews: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: [
          { isPublished: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.course.count({ where }),
    ]);

    // Обогащаем курсы статистикой
    const enrichedCourses = courses.map(course => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;

      return {
        ...course,
        lessonCount: course._count.lessons,
        enrollmentCount: course._count.enrollments,
        reviewCount: course._count.reviews,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      courses: enrichedCourses,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Получение курса по ID
   */
  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            isPublished: true,
            isFree: true,
          },
        },
        assignments: {
          select: {
            id: true,
            title: true,
            type: true,
            isPublished: true,
          },
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                duration: true,
                isPublished: true,
                isFree: true,
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            userId: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Добавляем статистику
    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
      : 0;

    return {
      ...course,
      lessonCount: course._count.lessons,
      enrollmentCount: course._count.enrollments,
      reviewCount: course._count.reviews,
      averageRating: Math.round(avgRating * 10) / 10,
    };
  }

  /**
   * Получение курса по slug
   */
  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    const avgRating = course.reviews.length > 0
      ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
      : 0;

    return {
      ...course,
      lessonCount: course._count.lessons,
      enrollmentCount: course._count.enrollments,
      reviewCount: course._count.reviews,
      averageRating: Math.round(avgRating * 10) / 10,
    };
  }

  /**
   * Создание курса
   */
  async create(data: CreateCourseDto) {
    // Генерируем slug если не указан
    let slug = data.slug;
    if (!slug) {
      slug = this.generateSlug(data.title);
    }

    // Проверяем уникальность slug
    const existingCourse = await this.prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      slug = `${slug}-${Date.now()}`;
    }

    try {
      const course = await this.prisma.course.create({
        data: {
          ...data,
          slug,
          price: data.price ? new Prisma.Decimal(data.price) : null,
          category: data.category as any,
        },
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              reviews: true,
            },
          },
        },
      });

      return {
        ...course,
        lessonCount: course._count.lessons,
        enrollmentCount: course._count.enrollments,
        reviewCount: course._count.reviews,
        averageRating: 0,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Course with this slug already exists');
      }
      throw error;
    }
  }

  /**
   * Обновление курса
   */
  async update(id: string, data: UpdateCourseDto) {
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!existingCourse) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    try {
      const course = await this.prisma.course.update({
        where: { id },
        data: {
          ...data,
          price: data.price ? new Prisma.Decimal(data.price) : undefined,
          publishedAt: data.isPublished && !existingCourse.isPublished ? new Date() : undefined,
          category: data.category ? data.category as any : undefined,
        },
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              reviews: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;

      return {
        ...course,
        lessonCount: course._count.lessons,
        enrollmentCount: course._count.enrollments,
        reviewCount: course._count.reviews,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Course with this slug already exists');
      }
      throw error;
    }
  }

  /**
   * Удаление курса
   */
  async delete(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    if (course._count.enrollments > 0) {
      throw new BadRequestException('Cannot delete course with active enrollments');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return { message: 'Course deleted successfully', id };
  }

  /**
   * Получение статистики курсов
   */
  async getStats() {
    const [
      totalCourses,
      publishedCourses,
      totalEnrollments,
      avgRating,
    ] = await this.prisma.$transaction([
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.enrollment.count(),
      this.prisma.courseReview.aggregate({
        _avg: { rating: true },
      }),
    ]);

    const draftCourses = totalCourses - publishedCourses;
    const activeStudents = await this.prisma.enrollment.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Простая статистика без группировки (избегаем циркулярных ссылок)
    const categoriesStatsObj = {
      PROGRAMMING: 0,
      DATA_SCIENCE: 0,
      WEB_DEVELOPMENT: 0,
      MOBILE_DEVELOPMENT: 0,
      DEVOPS: 0,
      DESIGN: 0,
      BUSINESS: 0,
      MARKETING: 0,
      LANGUAGES: 0,
      OTHER: 0,
    };

    const difficultyStatsObj = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
      EXPERT: 0,
    };

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalEnrollments,
      activeStudents,
      averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
      categoriesStats: categoriesStatsObj,
      difficultyStats: difficultyStatsObj,
    };
  }

  /**
   * Поиск курсов
   */
  async search(query: string, limit: number = 10) {
    const courses = await this.prisma.course.findMany({
      where: {
        AND: [
          { isPublished: true },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } },
            ],
          },
        ],
      },
      take: limit,
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
    });

    return courses.map(course => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;

      return {
        ...course,
        lessonCount: course._count.lessons,
        enrollmentCount: course._count.enrollments,
        reviewCount: course._count.reviews,
        averageRating: Math.round(avgRating * 10) / 10,
      };
    });
  }

  /**
   * Генерация slug из заголовка
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Удаляем специальные символы
      .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
      .replace(/--+/g, '-') // Удаляем множественные дефисы
      .trim();
  }
}