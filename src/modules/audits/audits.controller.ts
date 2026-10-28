import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditsService } from './audits.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@ApiTags('audits')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('audits')
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit records (ADMIN only)' })
  @ApiQuery({ name: 'entity', required: false, example: 'maintenances' })
  findAll(@Query('entity') entity?: string) {
    return this.auditsService.findAll(entity);
  }
}