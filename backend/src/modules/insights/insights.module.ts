import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { InsightsAnalyticsService } from './insights-analytics.service';
import { InsightsLlmService } from './insights-llm.service';
import { InsightsService } from './insights.service';
import { InsightsCronService } from './insights-cron.service';
import { InsightsController } from './insights.controller';

@Module({
  imports: [PrismaModule],
  controllers: [InsightsController],
  providers: [
    InsightsAnalyticsService,
    InsightsLlmService,
    InsightsService,
    InsightsCronService,
  ],
})
export class InsightsModule {}
