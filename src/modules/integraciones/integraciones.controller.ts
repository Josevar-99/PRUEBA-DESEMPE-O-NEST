import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { VehiculosService } from '../vehiculos/vehiculos.service.js';
import { MantenimientosService } from '../mantenimientos/mantenimientos.service.js';

/**
 * Endpoints para sistemas externos. @Public() exime del JWT global y
 * ApiKeyGuard exige la llave en su lugar: otro sistema no tiene login.
 */
@ApiTags('integraciones')
@ApiSecurity('x-api-key')
@Public()
@UseGuards(ApiKeyGuard)
@Controller('integraciones')
export class IntegracionesController {
  constructor(
    private readonly vehiculosService: VehiculosService,
    private readonly mantenimientosService: MantenimientosService,
  ) {}

  @Get('vehiculos/:placa/historial')
  @ApiOperation({ summary: 'Historial de mantenimientos completados por placa (x-api-key)' })
  async historialPorPlaca(@Param('placa') placa: string) {
    // findByPlaca responde 404 si la placa no existe
    const vehiculo = await this.vehiculosService.findByPlaca(placa);
    return this.mantenimientosService.historialVehiculo(vehiculo.id);
  }
}