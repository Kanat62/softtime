import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompanyStatus } from '@softtime/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightsService } from './insights.service';

// Runs at 02:30 UTC daily — after calculateAbsent (01:00) so data is fresh.
@Injectable()
export class InsightsCronService {
  private readonly logger = new Logger(InsightsCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly insightsService: InsightsService,
  ) {}

  @Cron('30 2 * * *')
  async generateDailyInsights(): Promise<void> {
    const companies = await this.prisma.company.findMany({
      where: {
        status: { in: [CompanyStatus.ACTIVE, CompanyStatus.TRIAL, CompanyStatus.GRACE] as any[] },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!companies.length) return;

    this.logger.log(`Generating AI insights for ${companies.length} company(ies)`);
    let ok = 0;
    let fail = 0;

    for (const company of companies as any[]) {
      try {
        await this.insightsService.regenerate(company.id);
        ok++;
      } catch (err) {
        fail++;
        this.logger.error(`Insight generation failed for company ${company.id}`, err);
      }
    }

    this.logger.log(`Insights done: ${ok} ok, ${fail} failed`);
  }
}
