import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class MetricsRepository {
  constructor(
    private _accountMetrics: PrismaRepository<'accountMetricsSnapshot'>,
    private _postMetrics: PrismaRepository<'postMetricsSnapshot'>
  ) {}

  saveAccountSnapshot(data: {
    integrationId: string;
    followers: number;
    following: number;
    postsCount: number;
    impressions: number;
    engagementRate?: number;
    rawStats?: any;
  }) {
    return this._accountMetrics.model.accountMetricsSnapshot.create({
      data: {
        integrationId: data.integrationId,
        followers: data.followers,
        following: data.following,
        postsCount: data.postsCount,
        impressions: data.impressions,
        engagementRate: data.engagementRate,
        rawStats: data.rawStats,
      },
    });
  }

  getAccountHistory(integrationId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this._accountMetrics.model.accountMetricsSnapshot.findMany({
      where: {
        integrationId,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  savePostSnapshot(data: {
    postId: string;
    impressions: number;
    likes: number;
    shares: number;
    comments: number;
    clicks?: number;
    rawMetrics?: any;
  }) {
    return this._postMetrics.model.postMetricsSnapshot.create({
      data: {
        postId: data.postId,
        impressions: data.impressions,
        likes: data.likes,
        shares: data.shares,
        comments: data.comments,
        clicks: data.clicks || 0,
        rawMetrics: data.rawMetrics,
      },
    });
  }

  getPostHistory(postId: string) {
    return this._postMetrics.model.postMetricsSnapshot.findMany({
      where: { postId },
      orderBy: { recordedAt: 'asc' },
    });
  }
}

