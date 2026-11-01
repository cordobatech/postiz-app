import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class TriggersRepository {
  constructor(
    private _trigger: PrismaRepository<'keywordTrigger'>,
    private _message: PrismaRepository<'conversationMessage'>,
    private _contact: PrismaRepository<'conversationContact'>
  ) {}

  getTriggers(organizationId: string) {
    return this._trigger.model.keywordTrigger.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createTrigger(organizationId: string, data: {
    name: string;
    keywords: string[];
    matchType?: string;
    actionType: string;
    replyTemplate?: string;
    targetPhone?: string;
    assignTags?: string[];
    integrationId?: string;
  }) {
    return this._trigger.model.keywordTrigger.create({
      data: {
        organizationId,
        integrationId: data.integrationId,
        name: data.name,
        keywords: data.keywords.map(k => k.trim().toUpperCase()),
        matchType: data.matchType || 'CONTAINS',
        actionType: data.actionType,
        replyTemplate: data.replyTemplate,
        targetPhone: data.targetPhone,
        assignTags: data.assignTags || [],
      },
    });
  }

  updateTrigger(id: string, organizationId: string, data: any) {
    return this._trigger.model.keywordTrigger.update({
      where: { id },
      data,
    });
  }

  deleteTrigger(id: string, organizationId: string) {
    return this._trigger.model.keywordTrigger.delete({
      where: { id },
    });
  }

  incrementExecution(id: string) {
    return this._trigger.model.keywordTrigger.update({
      where: { id },
      data: { executionCount: { increment: 1 } },
    });
  }

  getActiveTriggers(organizationId: string) {
    return this._trigger.model.keywordTrigger.findMany({
      where: { organizationId, isActive: true },
    });
  }
}

