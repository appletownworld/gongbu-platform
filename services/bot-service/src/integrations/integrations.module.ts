import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthClientService } from './auth-client.service';
import { CourseClientService } from './course-client.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  providers: [
    AuthClientService,
    CourseClientService,
  ],
  exports: [
    AuthClientService,
    CourseClientService,
  ],
})
export class IntegrationsModule {}
