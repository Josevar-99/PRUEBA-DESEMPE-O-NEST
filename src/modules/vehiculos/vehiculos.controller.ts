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
import { VehiculosService } from './vehiculos.service.js';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto.js';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/enums/role.enum.js';

/**
 * Consultar es para cualquier usuario autenticado (el técnico ve el vehículo
 * de sus mantenimientos). Registrar, editar e inactivar es solo de ADMIN.
 */
@ApiTags('vehiculos')
@ApiBearerAuth()
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar vehículo (solo ADMIN)' })
  create(@Body() dto: CreateVehiculoDto) {
    return this.vehiculosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos registrados' })
  findAll() {
    return this.vehiculosService.findAll();
  }

  // Ruta separada de :id para no tener que adivinar si el valor es un id o una placa
  @Get('placa/:placa')
  @ApiOperation({ summary: 'Consultar vehículo por placa' })
  findByPlaca(@Param('placa') placa: string) {
    return this.vehiculosService.findByPlaca(placa);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar vehículo por id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiculosService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar datos del vehículo (solo ADMIN)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(id, dto);
  }

  @Patch(':id/inactivar')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inactivar vehículo: eliminación lógica (solo ADMIN)' })
  inactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiculosService.inactivar(id);
  }
}