/** Requisito 5.6 */
export enum EstadoMantenimiento {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Transiciones permitidas. COMPLETED y CANCELLED son finales: un trabajo
 * cerrado no se reabre, para que el historial no cambie después.
 */
export const TRANSICIONES: Record<EstadoMantenimiento, EstadoMantenimiento[]> = {
  [EstadoMantenimiento.SCHEDULED]: [
    EstadoMantenimiento.IN_PROGRESS,
    EstadoMantenimiento.CANCELLED,
  ],
  [EstadoMantenimiento.IN_PROGRESS]: [
    EstadoMantenimiento.COMPLETED,
    EstadoMantenimiento.CANCELLED,
  ],
  [EstadoMantenimiento.COMPLETED]: [],
  [EstadoMantenimiento.CANCELLED]: [],
};

/** Estados que ocupan el horario del mecánico (requisito 3.10) */
export const ESTADOS_ACTIVOS = [
  EstadoMantenimiento.SCHEDULED,
  EstadoMantenimiento.IN_PROGRESS,
];