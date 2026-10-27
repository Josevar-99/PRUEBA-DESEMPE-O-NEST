import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiKeyGuard } from '../../common/guards/api-key.guard.js';
import { EstadoVehiculo } from '../../common/enums/estado-vehiculo.enum.js';
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

  /**
   * Devuelve un resumen, no las entidades internas: un sistema externo no necesita
   * timestamps, ids de usuario ni emails. El vehículo va una sola vez arriba.
   */
  @Get('vehiculos/:placa/historial')
  @ApiOperation({ summary: 'Resumen del vehículo y su historial de mantenimientos completados (x-api-key)' })
  async historialPorPlaca(@Param('placa') placa: string) {
    // findByPlaca responde 404 si la placa no existe
    const vehiculo = await this.vehiculosService.findByPlaca(placa);
    const historial = await this.mantenimientosService.historialVehiculo(vehiculo.id);

    return {
      vehiculo: {
        id: vehiculo.id,
        placa: vehiculo.placa,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        disponible: vehiculo.estado === EstadoVehiculo.AVAILABLE,
      },
      mantenimientos: historial.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        estado: m.estado,
        descripcion: m.descripcion,
        trabajoRealizado: m.trabajoRealizado,
        kilometraje: m.kilometraje,
        kilometrajeFinal: m.kilometrajeFinal,
        costo: m.costoFinal,
        fechaFinalizacion: m.fechaFinalizacion,
        mecanico: { id: m.mecanico.id, nombre: m.mecanico.nombre },
        taller: { id: m.taller.id, nombre: m.taller.nombre },
      })),
    };
  }
}