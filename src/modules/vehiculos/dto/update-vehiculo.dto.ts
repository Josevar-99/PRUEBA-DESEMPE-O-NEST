import { PartialType } from '@nestjs/swagger';
import { CreateVehiculoDto } from './create-vehiculo.dto.js';

/**
 * El estado no se edita aquí: AVAILABLE e IN_MAINTENANCE los cambian los
 * mantenimientos, e INACTIVE la ruta de inactivar. Si el admin pudiera ponerlo
 * a mano, dejaría de coincidir con los mantenimientos reales.
 */
export class UpdateVehiculoDto extends PartialType(CreateVehiculoDto) {}