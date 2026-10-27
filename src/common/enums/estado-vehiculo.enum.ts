/**
 * Estados del vehículo (requisito 2.8). AVAILABLE e IN_MAINTENANCE los cambia
 * el ciclo de los mantenimientos; INACTIVE es la eliminación lógica.
 */
export enum EstadoVehiculo {
  AVAILABLE = 'AVAILABLE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  INACTIVE = 'INACTIVE',
}