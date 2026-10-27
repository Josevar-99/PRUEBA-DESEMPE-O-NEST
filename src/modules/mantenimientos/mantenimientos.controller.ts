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
import { MantenimientosService } from './mantenimientos.service.js';
import { CreateMantenimientoDto } from './dto/create-mantenimiento.dto.js';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/decorators/current-user.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

/**
 * Las rutas fijas (activos, mis-asignados, vehiculo/..., mecanico/...) van ANTES
 * de ':id'. Nest evalúa las rutas en orden, y si ':id' estuviera primero,
 * "activos" llegaría al ParseUUIDPipe y respondería 400.
 */
@ApiTags('mantenimientos')
@ApiBearerAuth()
@Controller('mantenimientos')
export class MantenimientosController {
  constructor(private readonly mantenimientosService: MantenimientosService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear mantenimiento: nace SCHEDULED (solo ADMIN)' })
  create(@Body() dto: CreateMantenimientoDto) {
    return this.mantenimientosService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los mantenimientos' })
  findAll() {
    return this.mantenimientosService.findAll();
  }

  @Get('activos')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar mantenimientos SCHEDULED e IN_PROGRESS' })
  findActivos() {
    return this.mantenimientosService.findActivos();
  }

  @Get('mis-asignados')
  @Roles(Role.TECHNICIAN)
  @ApiOperation({ summary: 'Mantenimientos asignados al técnico autenticado' })
  findMisAsignados(@CurrentUser() user: JwtPayload) {
    return this.mantenimientosService.findMisAsignados(user.sub);
  }

  @Get('vehiculo/:vehiculoId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos de un vehículo (todos los estados)' })
  findByVehiculo(@Param('vehiculoId', ParseUUIDPipe) vehiculoId: string) {
    return this.mantenimientosService.findByVehiculo(vehiculoId);
  }

  @Get('vehiculo/:vehiculoId/historial')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Historial de un vehículo (solo COMPLETED)' })
  historialVehiculo(@Param('vehiculoId', ParseUUIDPipe) vehiculoId: string) {
    return this.mantenimientosService.historialVehiculo(vehiculoId);
  }

  @Get('mecanico/:mecanicoId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Mantenimientos asignados a un mecánico' })
  findByMecanico(@Param('mecanicoId', ParseUUIDPipe) mecanicoId: string) {
    return this.mantenimientosService.findByMecanico(mecanicoId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Detalle de un mantenimiento (el técnico solo ve los suyos)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mantenimientosService.findOne(id, user);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN, Role.TECHNICIAN)
  @ApiOperation({ summary: 'Cambiar estado (COMPLETED exige los datos de cierre)' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mantenimientosService.cambiarEstado(id, dto, user);
  }
}