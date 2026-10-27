import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditoriasService } from './auditorias.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

@ApiTags('auditorias')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('auditorias')
export class AuditoriasController {
  constructor(private readonly auditoriasService: AuditoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar auditorías (solo ADMIN)' })
  @ApiQuery({ name: 'entidad', required: false, example: 'mantenimientos' })
  findAll(@Query('entidad') entidad?: string) {
    return this.auditoriasService.findAll(entidad);
  }
}