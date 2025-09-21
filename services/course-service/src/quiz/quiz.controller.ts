import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto, UpdateQuizDto, SubmitQuizAnswerDto } from './dto/quiz.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  private readonly logger = new Logger(QuizController.name);

  constructor(private readonly quizService: QuizService) {}

  @Post('lesson/:lessonId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() createQuizDto: CreateQuizDto,
    @Request() req: any
  ) {
    this.logger.log(`Создание квиза для урока: ${lessonId} пользователем: ${req.user.id}`);
    
    try {
      const quiz = await this.quizService.createQuiz(lessonId, createQuizDto);
      return {
        success: true,
        data: quiz,
      };
    } catch (error) {
      this.logger.error(`Ошибка создания квиза: ${error.message}`);
      throw error;
    }
  }

  @Get(':quizId')
  async getQuiz(
    @Param('quizId') quizId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение квиза: ${quizId} пользователем: ${req.user.id}`);
    
    try {
      const quiz = await this.quizService.getQuiz(quizId);
      return {
        success: true,
        data: quiz,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения квиза: ${error.message}`);
      throw error;
    }
  }

  @Get('lesson/:lessonId')
  async getQuizByLesson(
    @Param('lessonId') lessonId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение квиза для урока: ${lessonId} пользователем: ${req.user.id}`);
    
    try {
      const quiz = await this.quizService.getQuizByLesson(lessonId);
      return {
        success: true,
        data: quiz,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения квиза для урока: ${error.message}`);
      throw error;
    }
  }

  @Put(':quizId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async updateQuiz(
    @Param('quizId') quizId: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @Request() req: any
  ) {
    this.logger.log(`Обновление квиза: ${quizId} пользователем: ${req.user.id}`);
    
    try {
      const quiz = await this.quizService.updateQuiz(quizId, updateQuizDto);
      return {
        success: true,
        data: quiz,
      };
    } catch (error) {
      this.logger.error(`Ошибка обновления квиза: ${error.message}`);
      throw error;
    }
  }

  @Delete(':quizId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async deleteQuiz(
    @Param('quizId') quizId: string,
    @Request() req: any
  ) {
    this.logger.log(`Удаление квиза: ${quizId} пользователем: ${req.user.id}`);
    
    try {
      await this.quizService.deleteQuiz(quizId);
      return {
        success: true,
        message: 'Квиз успешно удален',
      };
    } catch (error) {
      this.logger.error(`Ошибка удаления квиза: ${error.message}`);
      throw error;
    }
  }

  @Post(':quizId/submit')
  async submitQuizAnswers(
    @Param('quizId') quizId: string,
    @Body() submitQuizAnswerDto: SubmitQuizAnswerDto,
    @Request() req: any
  ) {
    this.logger.log(`Отправка ответов на квиз: ${quizId} пользователем: ${req.user.id}`);
    
    try {
      const result = await this.quizService.submitQuizAnswers(
        quizId,
        req.user.id,
        submitQuizAnswerDto
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Ошибка отправки ответов: ${error.message}`);
      throw error;
    }
  }

  @Get(':quizId/results')
  async getQuizResults(
    @Param('quizId') quizId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение результатов квиза: ${quizId} пользователем: ${req.user.id}`);
    
    try {
      const results = await this.quizService.getQuizResults(quizId, req.user.id);
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения результатов: ${error.message}`);
      throw error;
    }
  }

  @Get(':quizId/stats')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async getQuizStats(
    @Param('quizId') quizId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение статистики квиза: ${quizId} пользователем: ${req.user.id}`);
    
    try {
      const stats = await this.quizService.getQuizStats(quizId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      throw error;
    }
  }

  @Get('user/:userId/attempts')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async getUserQuizAttempts(
    @Param('userId') userId: string,
    @Query('quizId') quizId?: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение попыток пользователя: ${userId} пользователем: ${req.user.id}`);
    
    try {
      // Здесь можно добавить логику для получения всех попыток пользователя
      // Пока возвращаем заглушку
      return {
        success: true,
        data: {
          userId,
          quizId,
          attempts: [],
        },
      };
    } catch (error) {
      this.logger.error(`Ошибка получения попыток пользователя: ${error.message}`);
      throw error;
    }
  }
}
