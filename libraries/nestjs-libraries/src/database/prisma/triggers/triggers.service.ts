import { Injectable } from '@nestjs/common';
import { TriggersRepository } from './triggers.repository';
import { ConversationsRepository } from '@gitroom/nestjs-libraries/database/prisma/conversations/conversations.repository';

@Injectable()
export class TriggersService {
  constructor(
    private _triggersRepo: TriggersRepository,
    private _conversationsRepo: ConversationsRepository
  ) {}

  async listTriggers(organizationId: string) {
    return this._triggersRepo.getTriggers(organizationId);
  }

  async createTrigger(organizationId: string, data: any) {
    return this._triggersRepo.createTrigger(organizationId, data);
  }

  async deleteTrigger(id: string, organizationId: string) {
    return this._triggersRepo.deleteTrigger(id, organizationId);
  }

  async processIncomingMessage(data: {
    organizationId: string;
    contactId: string;
    channel: string;
    content: string;
    integrationId?: string;
  }) {
    // 1. Save incoming message
    const incomingMsg = await this._conversationsRepo.createMessage({
      contactId: data.contactId,
      organizationId: data.organizationId,
      integrationId: data.integrationId,
      direction: 'INBOUND',
      channel: data.channel,
      content: data.content,
    });

    // 2. Fetch active triggers for organization
    const triggers = await this._triggersRepo.getActiveTriggers(data.organizationId);
    const upperContent = data.content.toUpperCase();

    for (const trig of triggers) {
      const match = trig.keywords.some(kw => upperContent.includes(kw));
      if (match) {
        await this._triggersRepo.incrementExecution(trig.id);

        // Perform action
        if (trig.actionType === 'AUTO_REPLY' && trig.replyTemplate) {
          await this._conversationsRepo.createMessage({
            contactId: data.contactId,
            organizationId: data.organizationId,
            integrationId: data.integrationId,
            direction: 'OUTBOUND',
            channel: data.channel,
            content: trig.replyTemplate,
            respondedByRuleId: trig.id,
          });
        } else if (trig.actionType === 'REDIRECT_WHATSAPP' && trig.targetPhone) {
          const redirectUrl = `https://wa.me/${trig.targetPhone.replace(/[^0-9]/g, '')}`;
          await this._conversationsRepo.createMessage({
            contactId: data.contactId,
            organizationId: data.organizationId,
            integrationId: data.integrationId,
            direction: 'OUTBOUND',
            channel: data.channel,
            content: `Para atención directa, por favor contáctanos por WhatsApp aquí: ${redirectUrl}`,
            respondedByRuleId: trig.id,
          });
        }

        return { triggered: true, rule: trig.name, action: trig.actionType };
      }
    }

    return { triggered: false };
  }
}

