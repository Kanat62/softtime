import { Module } from '@nestjs/common';
import { InsightsModule } from '../insights/insights.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

// RedisModule и ConfigModule зарегистрированы глобально (@Global / isGlobal)
@Module({
  imports: [InsightsModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
