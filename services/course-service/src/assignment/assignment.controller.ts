import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  Logger
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto, UpdateAssignmentDto, SubmitAssignmentDto, ReviewAssignmentDto } from './dto/assignment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('assignment')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  private readonly logger = new Logger(AssignmentController.name);

  constructor(private readonly assignmentService: AssignmentService) {}

  @Post('lesson/:lessonId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async createAssignment(
    @Param('lessonId') lessonId: string,
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Request() req: any
  ) {
    this.logger.log(`Создание задания для урока: ${lessonId} пользователем: ${req.user.id}`);
    
    try {
      const assignment = await this.assignmentService.createAssignment(lessonId, createAssignmentDto);
      return {
        success: true,
        data: assignment,
      };
    } catch (error) {
      this.logger.error(`Ошибка создания задания: ${error.message}`);
      throw error;
    }
  }

  @Get(':assignmentId')
  async getAssignment(
    @Param('assignmentId') assignmentId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение задания: ${assignmentId} пользователем: ${req.user.id}`);
    
    try {
      const assignment = await this.assignmentService.getAssignment(assignmentId);
      return {
        success: true,
        data: assignment,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения задания: ${error.message}`);
      throw error;
    }
  }

  @Get('lesson/:lessonId')
  async getAssignmentsByLesson(
    @Param('lessonId') lessonId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение заданий для урока: ${lessonId} пользователем: ${req.user.id}`);
    
    try {
      const assignments = await this.assignmentService.getAssignmentsByLesson(lessonId);
      return {
        success: true,
        data: assignments,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения заданий: ${error.message}`);
      throw error;
    }
  }

  @Put(':assignmentId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @Request() req: any
  ) {
    this.logger.log(`Обновление задания: ${assignmentId} пользователем: ${req.user.id}`);
    
    try {
      const assignment = await this.assignmentService.updateAssignment(assignmentId, updateAssignmentDto);
      return {
        success: true,
        data: assignment,
      };
    } catch (error) {
      this.logger.error(`Ошибка обновления задания: ${error.message}`);
      throw error;
    }
  }

  @Post(':assignmentId/submit')
  async submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() submitAssignmentDto: SubmitAssignmentDto,
    @Request() req: any
  ) {
    this.logger.log(`Отправка задания: ${assignmentId} пользователем: ${req.user.id}`);
    
    try {
      const submission = await this.assignmentService.submitAssignment(
        assignmentId,
        req.user.id,
        submitAssignmentDto
      );
      
      return {
        success: true,
        data: submission,
      };
    } catch (error) {
      this.logger.error(`Ошибка отправки задания: ${error.message}`);
      throw error;
    }
  }

  @Get(':assignmentId/submissions')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async getAssignmentSubmissions(
    @Param('assignmentId') assignmentId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req: any
  ) {
    this.logger.log(`Получение отправок задания: ${assignmentId} пользователем: ${req.user.id}`);
    
    try {
      const result = await this.assignmentService.getAssignmentSubmissions(
        assignmentId,
        status,
        limit || 50,
        offset || 0
      );
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения отправок: ${error.message}`);
      throw error;
    }
  }

  @Put('submission/:submissionId/review')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async reviewAssignment(
    @Param('submissionId') submissionId: string,
    @Body() reviewAssignmentDto: ReviewAssignmentDto,
    @Request() req: any
  ) {
    this.logger.log(`Проверка задания: ${submissionId} пользователем: ${req.user.id}`);
    
    try {
      const submission = await this.assignmentService.reviewAssignment(
        submissionId,
        req.user.id,
        reviewAssignmentDto
      );
      
      return {
        success: true,
        data: submission,
      };
    } catch (error) {
      this.logger.error(`Ошибка проверки задания: ${error.message}`);
      throw error;
    }
  }

  @Get('user/:userId/submissions')
  async getUserSubmissions(
    @Param('userId') userId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение отправок пользователя: ${userId} пользователем: ${req.user.id}`);
    
    try {
      // Проверяем, что пользователь запрашивает свои отправки или это преподаватель
      if (req.user.id !== userId && !req.user.roles?.includes('teacher') && !req.user.roles?.includes('admin')) {
        throw new Error('Нет прав для просмотра отправок этого пользователя');
      }

      const submissions = await this.assignmentService.getUserSubmissions(userId);
      return {
        success: true,
        data: submissions,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения отправок пользователя: ${error.message}`);
      throw error;
    }
  }

  @Get(':assignmentId/stats')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  async getAssignmentStats(
    @Param('assignmentId') assignmentId: string,
    @Request() req: any
  ) {
    this.logger.log(`Получение статистики задания: ${assignmentId} пользователем: ${req.user.id}`);
    
    try {
      const stats = await this.assignmentService.getAssignmentStats(assignmentId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      throw error;
    }
  }
}
