import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { Organization } from '@prisma/client';
import { TriggersService } from '@gitroom/nestjs-libraries/database/prisma/triggers/triggers.service';

@Controller('triggers')
export class TriggersController {
  constructor(private _triggersService: TriggersService) {}

  @Get()
  async getTriggers(@GetOrgFromRequest() org: Organization) {
    return this._triggersService.listTriggers(org.id);
  }

  @Post()
  async createTrigger(
    @GetOrgFromRequest() org: Organization,
    @Body() body: any
  ) {
    return this._triggersService.createTrigger(org.id, body);
  }

  @Delete(':id')
  async deleteTrigger(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string
  ) {
    return this._triggersService.deleteTrigger(id, org.id);
  }
}

