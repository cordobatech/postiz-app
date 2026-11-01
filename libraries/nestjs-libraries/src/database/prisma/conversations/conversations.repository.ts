import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class ConversationsRepository {
  constructor(
    private _contact: PrismaRepository<'conversationContact'>,
    private _message: PrismaRepository<'conversationMessage'>
  ) {}

  getContacts(organizationId: string, search?: string, stage?: string) {
    const where: any = { organizationId };
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { handle: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    return this._contact.model.conversationContact.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  getContactById(id: string, organizationId: string) {
    return this._contact.model.conversationContact.findFirst({
      where: { id, organizationId },
    });
  }

  findOrCreateContact(organizationId: string, data: {
    name: string;
    handle?: string;
    phone?: string;
    email?: string;
    provider?: string;
    stage?: string;
    dealValue?: number;
    tags?: string[];
  }) {
    return this._contact.model.conversationContact.create({
      data: {
        organizationId,
        name: data.name,
        handle: data.handle,
        phone: data.phone,
        email: data.email,
        provider: data.provider || 'GENERIC',
        stage: data.stage || 'LEAD',
        dealValue: data.dealValue,
        tags: data.tags || [],
      },
    });
  }

  updateContact(id: string, organizationId: string, data: {
    stage?: string;
    dealValue?: number;
    tags?: string[];
    notes?: string;
  }) {
    return this._contact.model.conversationContact.update({
      where: { id },
      data,
    });
  }

  getMessages(contactId: string, organizationId: string) {
    return this._message.model.conversationMessage.findMany({
      where: { contactId, organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  createMessage(data: {
    contactId: string;
    organizationId: string;
    integrationId?: string;
    direction: 'INBOUND' | 'OUTBOUND';
    channel: string;
    content: string;
    rawPayload?: any;
    respondedByRuleId?: string;
  }) {
    return this._message.model.conversationMessage.create({
      data: {
        contactId: data.contactId,
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        direction: data.direction,
        channel: data.channel,
        content: data.content,
        rawPayload: data.rawPayload,
        respondedByRuleId: data.respondedByRuleId,
      },
    });
  }

  markMessagesAsRead(contactId: string, organizationId: string) {
    return this._message.model.conversationMessage.updateMany({
      where: { contactId, organizationId, isRead: false },
      data: { isRead: true },
    });
  }
}

