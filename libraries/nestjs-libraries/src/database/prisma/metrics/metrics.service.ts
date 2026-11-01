import { Injectable } from '@nestjs/common';
import { MetricsRepository } from './metrics.repository';

@Injectable()
export class MetricsService {
  constructor(private _metricsRepository: MetricsRepository) {}

  async recordAccountMetrics(data: {
    integrationId: string;
    followers: number;
    following: number;
    postsCount: number;
    impressions: number;
    engagementRate?: number;
    rawStats?: any;
  }) {
    return this._metricsRepository.saveAccountSnapshot(data);
  }

  async getAccountMetricsHistory(integrationId: string, days: number = 30) {
    return this._metricsRepository.getAccountHistory(integrationId, days);
  }

  async recordPostMetrics(data: {
    postId: string;
    impressions: number;
    likes: number;
    shares: number;
    comments: number;
    clicks?: number;
    rawMetrics?: any;
  }) {
    return this._metricsRepository.savePostSnapshot(data);
  }

  async getPostMetricsHistory(postId: string) {
    return this._metricsRepository.getPostHistory(postId);
  }
}

