/**
 * Estado compartido por talleres y mecánicos. Inactivar reemplaza al borrado
 * físico para conservar el historial de mantenimientos.
 */
export enum EstadoActivo {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}