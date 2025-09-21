import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';

interface UserProfile {
  userId: string;
  interests: string[];
  completedCourses: string[];
  enrolledCourses: string[];
  ratings: { courseId: string; rating: number }[];
  timeSpent: { courseId: string; minutes: number }[];
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  categoryPreferences: string[];
}

interface CourseFeatures {
  courseId: string;
  category: string;
  difficulty: string;
  tags: string[];
  averageRating: number;
  enrollmentCount: number;
  completionRate: number;
  duration: number;
  price: number;
  isPremium: boolean;
}

interface RecommendationResult {
  courseId: string;
  score: number;
  reason: string;
  confidence: number;
}

@Injectable()
export class RecommendationService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  // ==================== COLLABORATIVE FILTERING ====================

  async getCollaborativeRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    // Get user's rating history
    const userRatings = await this.getUserRatings(userId);
    
    if (userRatings.length < 3) {
      // Not enough data for collaborative filtering
      return this.getPopularCourses(limit);
    }

    // Find similar users based on rating patterns
    const similarUsers = await this.findSimilarUsers(userId, userRatings);
    
    // Get courses liked by similar users that current user hasn't rated
    const recommendations = await this.getCoursesFromSimilarUsers(userId, similarUsers, limit);
    
    return recommendations;
  }

  private async getUserRatings(userId: string) {
    const reviews = await this.prisma.courseReview.findMany({
      where: { userId },
      select: { courseId: true, rating: true }
    });

    return reviews.map(review => ({
      courseId: review.courseId,
      rating: review.rating
    }));
  }

  private async findSimilarUsers(userId: string, userRatings: { courseId: string; rating: number }[]) {
    // Get all users who rated the same courses
    const courseIds = userRatings.map(r => r.courseId);
    
    const otherUsers = await this.prisma.courseReview.findMany({
      where: {
        courseId: { in: courseIds },
        userId: { not: userId }
      },
      select: { userId: true, courseId: true, rating: true }
    });

    // Group by user and calculate similarity
    const userGroups = otherUsers.reduce((acc, review) => {
      if (!acc[review.userId]) {
        acc[review.userId] = [];
      }
      acc[review.userId].push({ courseId: review.courseId, rating: review.rating });
      return acc;
    }, {} as Record<string, { courseId: string; rating: number }[]>);

    // Calculate cosine similarity
    const similarities = Object.entries(userGroups).map(([otherUserId, ratings]) => {
      const similarity = this.calculateCosineSimilarity(userRatings, ratings);
      return { userId: otherUserId, similarity, ratings };
    });

    // Return top similar users
    return similarities
      .filter(s => s.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 50);
  }

  private calculateCosineSimilarity(
    user1Ratings: { courseId: string; rating: number }[],
    user2Ratings: { courseId: string; rating: number }[]
  ): number {
    const user1Map = new Map(user1Ratings.map(r => [r.courseId, r.rating]));
    const user2Map = new Map(user2Ratings.map(r => [r.courseId, r.rating]));

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    // Find common courses
    const commonCourses = user1Ratings.filter(r => user2Map.has(r.courseId));

    for (const rating of commonCourses) {
      const rating1 = rating.rating;
      const rating2 = user2Map.get(rating.courseId)!;
      
      dotProduct += rating1 * rating2;
      norm1 += rating1 * rating1;
      norm2 += rating2 * rating2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private async getCoursesFromSimilarUsers(
    userId: string,
    similarUsers: { userId: string; similarity: number; ratings: { courseId: string; rating: number }[] }[],
    limit: number
  ): Promise<RecommendationResult[]> {
    // Get courses user hasn't rated
    const userRatedCourses = await this.prisma.courseReview.findMany({
      where: { userId },
      select: { courseId: true }
    });

    const userRatedCourseIds = new Set(userRatedCourses.map(r => r.courseId));

    // Calculate weighted scores for unrated courses
    const courseScores = new Map<string, { score: number; count: number; reasons: string[] }>();

    for (const similarUser of similarUsers) {
      for (const rating of similarUser.ratings) {
        if (!userRatedCourseIds.has(rating.courseId)) {
          const weightedScore = rating.rating * similarUser.similarity;
          
          if (!courseScores.has(rating.courseId)) {
            courseScores.set(rating.courseId, { score: 0, count: 0, reasons: [] });
          }
          
          const current = courseScores.get(rating.courseId)!;
          current.score += weightedScore;
          current.count += 1;
          current.reasons.push(`Similar user rated ${rating.rating}/5`);
        }
      }
    }

    // Convert to recommendations
    const recommendations: RecommendationResult[] = [];
    
    for (const [courseId, data] of courseScores.entries()) {
      if (data.count >= 2) { // At least 2 similar users rated this course
        const averageScore = data.score / data.count;
        const confidence = Math.min(data.count / 10, 1); // Confidence based on number of similar users
        
        recommendations.push({
          courseId,
          score: averageScore,
          reason: `Recommended by ${data.count} similar users`,
          confidence
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ==================== CONTENT-BASED FILTERING ====================

  async getContentBasedRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    const userProfile = await this.buildUserProfile(userId);
    const allCourses = await this.getAllCourses();
    
    // Calculate similarity scores
    const recommendations: RecommendationResult[] = [];
    
    for (const course of allCourses) {
      const score = this.calculateContentSimilarity(userProfile, course);
      
      if (score > 0.3) {
        recommendations.push({
          courseId: course.courseId,
          score,
          reason: this.generateContentReason(userProfile, course),
          confidence: score
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get user's course history
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          select: {
            id: true,
            category: true,
            difficulty: true,
            tags: true,
            averageRating: true
          }
        }
      }
    });

    const reviews = await this.prisma.courseReview.findMany({
      where: { userId },
      select: { courseId: true, rating: true }
    });

    const progress = await this.prisma.studentProgress.findMany({
      where: { studentId: userId },
      select: { courseId: true, timeSpent: true }
    });

    // Extract interests from completed courses
    const completedCourses = enrollments
      .filter(e => e.status === 'COMPLETED')
      .map(e => e.course);

    const interests = completedCourses.flatMap(course => course.tags);
    const categoryPreferences = completedCourses.map(course => course.category);

    // Calculate difficulty preference
    const difficultyCounts = completedCourses.reduce((acc, course) => {
      acc[course.difficulty] = (acc[course.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const difficultyPreference = Object.entries(difficultyCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as any || 'beginner';

    return {
      userId,
      interests: [...new Set(interests)],
      completedCourses: completedCourses.map(c => c.id),
      enrolledCourses: enrollments.map(e => e.courseId),
      ratings: reviews.map(r => ({ courseId: r.courseId, rating: r.rating })),
      timeSpent: progress.map(p => ({ courseId: p.courseId, minutes: p.timeSpent })),
      difficultyPreference,
      categoryPreferences: [...new Set(categoryPreferences)]
    };
  }

  private async getAllCourses(): Promise<CourseFeatures[]> {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        category: true,
        difficulty: true,
        tags: true,
        averageRating: true,
        enrollmentCount: true,
        completionCount: true,
        estimatedDuration: true,
        price: true,
        isPremium: true
      }
    });

    return courses.map(course => ({
      courseId: course.id,
      category: course.category,
      difficulty: course.difficulty,
      tags: course.tags,
      averageRating: course.averageRating || 0,
      enrollmentCount: course.enrollmentCount,
      completionRate: course.enrollmentCount > 0 ? course.completionCount / course.enrollmentCount : 0,
      duration: course.estimatedDuration || 0,
      price: course.price || 0,
      isPremium: course.isPremium
    }));
  }

  private calculateContentSimilarity(userProfile: UserProfile, course: CourseFeatures): number {
    let score = 0;
    let factors = 0;

    // Category preference (40% weight)
    if (userProfile.categoryPreferences.includes(course.category)) {
      score += 0.4;
    }
    factors += 0.4;

    // Interest tags (30% weight)
    const commonTags = course.tags.filter(tag => userProfile.interests.includes(tag));
    if (course.tags.length > 0) {
      score += 0.3 * (commonTags.length / course.tags.length);
    }
    factors += 0.3;

    // Difficulty preference (20% weight)
    if (userProfile.difficultyPreference === course.difficulty.toLowerCase()) {
      score += 0.2;
    }
    factors += 0.2;

    // Course quality (10% weight)
    if (course.averageRating >= 4.0) {
      score += 0.1;
    }
    factors += 0.1;

    return factors > 0 ? score / factors : 0;
  }

  private generateContentReason(userProfile: UserProfile, course: CourseFeatures): string {
    const reasons = [];

    if (userProfile.categoryPreferences.includes(course.category)) {
      reasons.push(`matches your interest in ${course.category}`);
    }

    const commonTags = course.tags.filter(tag => userProfile.interests.includes(tag));
    if (commonTags.length > 0) {
      reasons.push(`covers topics you're interested in: ${commonTags.slice(0, 2).join(', ')}`);
    }

    if (userProfile.difficultyPreference === course.difficulty.toLowerCase()) {
      reasons.push(`matches your preferred difficulty level`);
    }

    if (course.averageRating >= 4.0) {
      reasons.push('highly rated by other students');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'similar to courses you\'ve taken';
  }

  // ==================== POPULARITY-BASED ====================

  async getPopularCourses(limit: number = 10): Promise<RecommendationResult[]> {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      orderBy: [
        { enrollmentCount: 'desc' },
        { averageRating: 'desc' }
      ],
      take: limit,
      select: { id: true, title: true, enrollmentCount: true, averageRating: true }
    });

    return courses.map(course => ({
      courseId: course.id,
      score: course.enrollmentCount + (course.averageRating || 0) * 100,
      reason: `Popular course with ${course.enrollmentCount} enrollments`,
      confidence: 0.8
    }));
  }

  // ==================== HYBRID RECOMMENDATIONS ====================

  async getHybridRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    const [collaborative, contentBased, popular] = await Promise.all([
      this.getCollaborativeRecommendations(userId, limit * 2),
      this.getContentBasedRecommendations(userId, limit * 2),
      this.getPopularCourses(limit)
    ]);

    // Combine and deduplicate
    const allRecommendations = new Map<string, RecommendationResult>();

    // Add collaborative recommendations (weight: 0.4)
    collaborative.forEach(rec => {
      allRecommendations.set(rec.courseId, {
        ...rec,
        score: rec.score * 0.4,
        reason: `Collaborative: ${rec.reason}`
      });
    });

    // Add content-based recommendations (weight: 0.4)
    contentBased.forEach(rec => {
      const existing = allRecommendations.get(rec.courseId);
      if (existing) {
        existing.score += rec.score * 0.4;
        existing.reason += `; Content: ${rec.reason}`;
        existing.confidence = Math.max(existing.confidence, rec.confidence);
      } else {
        allRecommendations.set(rec.courseId, {
          ...rec,
          score: rec.score * 0.4,
          reason: `Content: ${rec.reason}`
        });
      }
    });

    // Add popular courses (weight: 0.2)
    popular.forEach(rec => {
      const existing = allRecommendations.get(rec.courseId);
      if (existing) {
        existing.score += rec.score * 0.2;
        existing.reason += `; Popular`;
      } else {
        allRecommendations.set(rec.courseId, {
          ...rec,
          score: rec.score * 0.2,
          reason: `Popular: ${rec.reason}`
        });
      }
    });

    return Array.from(allRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ==================== A/B TESTING ====================

  async getRecommendationsForABTest(userId: string, variant: 'A' | 'B', limit: number = 10): Promise<RecommendationResult[]> {
    // Log A/B test participation
    await this.logABTestParticipation(userId, variant);

    if (variant === 'A') {
      // Variant A: Pure collaborative filtering
      return this.getCollaborativeRecommendations(userId, limit);
    } else {
      // Variant B: Hybrid approach
      return this.getHybridRecommendations(userId, limit);
    }
  }

  private async logABTestParticipation(userId: string, variant: 'A' | 'B') {
    // In a real implementation, this would log to an analytics service
    console.log(`User ${userId} assigned to recommendation variant ${variant}`);
  }
}
