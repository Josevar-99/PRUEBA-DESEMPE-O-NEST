import { EstadoMantenimiento as E, TRANSICIONES } from './estado-mantenimiento.enum.js';

describe('TRANSICIONES de mantenimiento', () => {
  it('permite el flujo normal SCHEDULED -> IN_PROGRESS -> COMPLETED', () => {
    expect(TRANSICIONES[E.SCHEDULED]).toContain(E.IN_PROGRESS);
    expect(TRANSICIONES[E.IN_PROGRESS]).toContain(E.COMPLETED);
  });

  it('no permite completar sin haber iniciado', () => {
    expect(TRANSICIONES[E.SCHEDULED]).not.toContain(E.COMPLETED);
  });

  it('COMPLETED y CANCELLED son estados finales', () => {
    expect(TRANSICIONES[E.COMPLETED]).toHaveLength(0);
    expect(TRANSICIONES[E.CANCELLED]).toHaveLength(0);
  });
});