import { Injectable } from '@nestjs/common';
import { ConversationsRepository } from './conversations.repository';

@Injectable()
export class ConversationsService {
  constructor(private _conversationsRepo: ConversationsRepository) {}

  async listContacts(organizationId: string, search?: string, stage?: string) {
    return this._conversationsRepo.getContacts(organizationId, search, stage);
  }

  async getContact(id: string, organizationId: string) {
    return this._conversationsRepo.getContactById(id, organizationId);
  }

  async createOrUpdateContact(organizationId: string, data: any) {
    return this._conversationsRepo.findOrCreateContact(organizationId, data);
  }

  async updateContactStage(id: string, organizationId: string, stage: string, dealValue?: number) {
    return this._conversationsRepo.updateContact(id, organizationId, { stage, dealValue });
  }

  async getContactMessages(contactId: string, organizationId: string) {
    await this._conversationsRepo.markMessagesAsRead(contactId, organizationId);
    return this._conversationsRepo.getMessages(contactId, organizationId);
  }

  async sendMessage(data: {
    contactId: string;
    organizationId: string;
    integrationId?: string;
    channel: string;
    content: string;
  }) {
    return this._conversationsRepo.createMessage({
      ...data,
      direction: 'OUTBOUND',
    });
  }
}

