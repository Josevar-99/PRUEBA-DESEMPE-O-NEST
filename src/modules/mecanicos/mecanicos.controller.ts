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
import { MecanicosService } from './mecanicos.service.js';
import { CreateMecanicoDto } from './dto/create-mecanico.dto.js';
import { UpdateMecanicoDto } from './dto/update-mecanico.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';
import { EstadoActivo } from '../../common/enums/estado-activo.enum.js';

/** Gestión de mecánicos: todo es de ADMIN según el criterio de aceptación */
@ApiTags('mecanicos')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('mecanicos')
export class MecanicosController {
  constructor(private readonly mecanicosService: MecanicosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar mecánico vinculado a un usuario TECHNICIAN' })
  create(@Body() dto: CreateMecanicoDto) {
    return this.mecanicosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los mecánicos' })
  findAll() {
    return this.mecanicosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un mecánico' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mecanicosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar nombre, correo o especialidad' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMecanicoDto,
  ) {
    return this.mecanicosService.update(id, dto);
  }

  @Patch(':id/activar')
  @ApiOperation({ summary: 'Activar mecánico' })
  activar(@Param('id', ParseUUIDPipe) id: string) {
    return this.mecanicosService.cambiarEstado(id, EstadoActivo.ACTIVE);
  }

  @Patch(':id/inactivar')
  @ApiOperation({ summary: 'Inactivar mecánico (conserva su historial)' })
  inactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.mecanicosService.cambiarEstado(id, EstadoActivo.INACTIVE);
  }
}