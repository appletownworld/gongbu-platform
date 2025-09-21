import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto, UpdateReviewDto, CreateCommentDto, VoteReviewDto } from './dto/social.dto';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  // ==================== REVIEWS ====================

  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    const { courseId, enrollmentId, rating, title, comment, contentRating, instructorRating, difficultyRating, valueRating } = createReviewDto;

    // Check if user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        studentId: userId,
        courseId: courseId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to leave a review');
    }

    // Check if user already reviewed this course
    const existingReview = await this.prisma.courseReview.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this course');
    }

    // Create review
    const review = await this.prisma.courseReview.create({
      data: {
        userId,
        courseId,
        enrollmentId,
        rating,
        title,
        comment,
        contentRating,
        instructorRating,
        difficultyRating,
        valueRating,
        isVerified: true // Auto-verify for enrolled students
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    // Update course average rating
    await this.updateCourseRating(courseId);

    return review;
  }

  async updateReview(userId: string, reviewId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.prisma.courseReview.findFirst({
      where: {
        id: reviewId,
        userId
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found or you do not have permission to edit it');
    }

    const updatedReview = await this.prisma.courseReview.update({
      where: { id: reviewId },
      data: updateReviewDto,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    // Update course average rating
    await this.updateCourseRating(review.courseId);

    return updatedReview;
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.courseReview.findFirst({
      where: {
        id: reviewId,
        userId
      }
    });

    if (!review) {
      throw new NotFoundException('Review not found or you do not have permission to delete it');
    }

    await this.prisma.courseReview.delete({
      where: { id: reviewId }
    });

    // Update course average rating
    await this.updateCourseRating(review.courseId);

    return { message: 'Review deleted successfully' };
  }

  async getCourseReviews(courseId: string, page: number = 1, limit: number = 10, sortBy: string = 'newest') {
    const skip = (page - 1) * limit;
    
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    if (sortBy === 'highest') orderBy = { rating: 'desc' };
    if (sortBy === 'lowest') orderBy = { rating: 'asc' };
    if (sortBy === 'most_helpful') orderBy = { helpfulVotes: 'desc' };

    const [reviews, total] = await Promise.all([
      this.prisma.courseReview.findMany({
        where: {
          courseId,
          isPublic: true,
          isModerated: false
        },
        include: {
          comments: {
            where: { isPublic: true },
            orderBy: { createdAt: 'asc' },
            take: 3
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.courseReview.count({
        where: {
          courseId,
          isPublic: true,
          isModerated: false
        }
      })
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async voteReview(userId: string, reviewId: string, voteDto: VoteReviewDto) {
    const { isHelpful } = voteDto;

    // Check if review exists
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user already voted
    const existingVote = await this.prisma.reviewVote.findUnique({
      where: {
        userId_reviewId: {
          userId,
          reviewId
        }
      }
    });

    if (existingVote) {
      // Update existing vote
      await this.prisma.reviewVote.update({
        where: {
          userId_reviewId: {
            userId,
            reviewId
          }
        },
        data: { isHelpful }
      });
    } else {
      // Create new vote
      await this.prisma.reviewVote.create({
        data: {
          userId,
          reviewId,
          isHelpful
        }
      });
    }

    // Update review vote counts
    const helpfulVotes = await this.prisma.reviewVote.count({
      where: { reviewId, isHelpful: true }
    });

    const totalVotes = await this.prisma.reviewVote.count({
      where: { reviewId }
    });

    await this.prisma.courseReview.update({
      where: { id: reviewId },
      data: {
        helpfulVotes,
        totalVotes
      }
    });

    return { message: 'Vote recorded successfully' };
  }

  // ==================== COMMENTS ====================

  async createCourseComment(userId: string, courseId: string, createCommentDto: CreateCommentDto) {
    const { content, parentId } = createCommentDto;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // If parent comment, check if it exists
    if (parentId) {
      const parentComment = await this.prisma.courseComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.courseComment.create({
      data: {
        userId,
        courseId,
        content,
        parentId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    return comment;
  }

  async createLessonComment(userId: string, lessonId: string, createCommentDto: CreateCommentDto) {
    const { content, parentId } = createCommentDto;

    // Check if lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // If parent comment, check if it exists
    if (parentId) {
      const parentComment = await this.prisma.lessonComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.lessonComment.create({
      data: {
        userId,
        lessonId,
        content,
        parentId
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    return comment;
  }

  async getCourseComments(courseId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.courseComment.findMany({
        where: {
          courseId,
          isPublic: true,
          isModerated: false,
          parentId: null // Only top-level comments
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.courseComment.count({
        where: {
          courseId,
          isPublic: true,
          isModerated: false,
          parentId: null
        }
      })
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getLessonComments(lessonId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.lessonComment.findMany({
        where: {
          lessonId,
          isPublic: true,
          isModerated: false,
          parentId: null // Only top-level comments
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.lessonComment.count({
        where: {
          lessonId,
          isPublic: true,
          isModerated: false,
          parentId: null
        }
      })
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== LIKES ====================

  async likeCourse(userId: string, courseId: string) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if user already liked
    const existingLike = await this.prisma.courseLike.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await this.prisma.courseLike.delete({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });
      return { liked: false, message: 'Course unliked' };
    } else {
      // Like
      await this.prisma.courseLike.create({
        data: {
          userId,
          courseId
        }
      });
      return { liked: true, message: 'Course liked' };
    }
  }

  async getCourseLikes(courseId: string) {
    const likes = await this.prisma.courseLike.count({
      where: { courseId }
    });

    return { likes };
  }

  // ==================== FOLLOWS ====================

  async followUser(userId: string, followingId: string) {
    if (userId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await this.prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await this.prisma.userFollow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId
          }
        }
      });
      return { following: false, message: 'User unfollowed' };
    } else {
      // Follow
      await this.prisma.userFollow.create({
        data: {
          followerId: userId,
          followingId
        }
      });
      return { following: true, message: 'User followed' };
    }
  }

  async getUserFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.userFollow.count({
        where: { followingId: userId }
      })
    ]);

    return {
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.userFollow.count({
        where: { followerId: userId }
      })
    ]);

    return {
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== HELPER METHODS ====================

  private async updateCourseRating(courseId: string) {
    const reviews = await this.prisma.courseReview.findMany({
      where: {
        courseId,
        isPublic: true,
        isModerated: false
      },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      await this.prisma.course.update({
        where: { id: courseId },
        data: { averageRating: null }
      });
      return;
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await this.prisma.course.update({
      where: { id: courseId },
      data: { averageRating }
    });
  }
}
