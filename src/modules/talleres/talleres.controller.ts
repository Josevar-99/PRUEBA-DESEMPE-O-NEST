import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TalleresService } from './talleres.service.js';
import { CreateTallerDto } from './dto/create-taller.dto.js';
import { UpdateTallerDto } from './dto/update-taller.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { EstadoActivo } from '../../common/enums/estado-activo.enum.js';

/**
 * Consultar es para cualquier usuario autenticado: el técnico necesita ver el
 * taller de cada mantenimiento. Crear, editar y cambiar estado es solo de ADMIN.
 */
@ApiTags('talleres')
@ApiBearerAuth()
@Controller('talleres')
export class TalleresController {
  constructor(private readonly talleresService: TalleresService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar taller (solo ADMIN)' })
  create(@Body() dto: CreateTallerDto) {
    return this.talleresService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar talleres activos' })
  findActivos() {
    return this.talleresService.findActivos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un taller (incluye inactivos)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.talleresService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar nombre o dirección (solo ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTallerDto,
  ) {
    return this.talleresService.update(id, dto);
  }

  @Patch(':id/activar')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar taller (solo ADMIN)' })
  activar(@Param('id', ParseUUIDPipe) id: string) {
    return this.talleresService.cambiarEstado(id, EstadoActivo.ACTIVE);
  }

  @Patch(':id/inactivar')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar taller: eliminación lógica (solo ADMIN)' })
  inactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.talleresService.cambiarEstado(id, EstadoActivo.INACTIVE);
  }
}