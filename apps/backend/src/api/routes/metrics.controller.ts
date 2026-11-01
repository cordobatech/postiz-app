import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { MetricsService } from '@gitroom/nestjs-libraries/database/prisma/metrics/metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private _metricsService: MetricsService) {}

  @Get('account/:integrationId')
  async getAccountMetrics(
    @Param('integrationId') integrationId: string,
    @Query('days') days?: string
  ) {
    return this._metricsService.getAccountMetricsHistory(
      integrationId,
      days ? parseInt(days, 10) : 30
    );
  }

  @Post('account/snapshot')
  async createAccountSnapshot(@Body() body: any) {
    return this._metricsService.recordAccountMetrics(body);
  }

  @Get('post/:postId')
  async getPostMetrics(@Param('postId') postId: string) {
    return this._metricsService.getPostMetricsHistory(postId);
  }

  @Post('post/snapshot')
  async createPostSnapshot(@Body() body: any) {
    return this._metricsService.recordPostMetrics(body);
  }
}

