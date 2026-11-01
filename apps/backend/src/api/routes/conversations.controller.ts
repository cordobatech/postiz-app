import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { ConversationsService } from '@gitroom/nestjs-libraries/database/prisma/conversations/conversations.service';
import { TriggersService } from '@gitroom/nestjs-libraries/database/prisma/triggers/triggers.service';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private _conversationsService: ConversationsService,
    private _triggersService: TriggersService
  ) {}

  @Get('contacts')
  async getContacts(
    @GetOrgFromRequest() org: Organization,
    @Query('search') search?: string,
    @Query('stage') stage?: string
  ) {
    return this._conversationsService.listContacts(org.id, search, stage);
  }

  @Get('contacts/:id/messages')
  async getMessages(
    @GetOrgFromRequest() org: Organization,
    @Param('id') contactId: string
  ) {
    return this._conversationsService.getContactMessages(contactId, org.id);
  }

  @Post('messages')
  async sendMessage(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { contactId: string; channel: string; content: string }
  ) {
    return this._conversationsService.sendMessage({
      organizationId: org.id,
      contactId: body.contactId,
      channel: body.channel,
      content: body.content,
    });
  }

  @Post('inbound-webhook')
  async handleInbound(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { contactId: string; channel: string; content: string; integrationId?: string }
  ) {
    return this._triggersService.processIncomingMessage({
      organizationId: org.id,
      contactId: body.contactId,
      channel: body.channel,
      content: body.content,
      integrationId: body.integrationId,
    });
  }

  @Put('contacts/:id/stage')
  async updateStage(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: { stage: string; dealValue?: number }
  ) {
    return this._conversationsService.updateContactStage(id, org.id, body.stage, body.dealValue);
  }
}

