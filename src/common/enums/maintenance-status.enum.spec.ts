import { MaintenanceStatus as E, TRANSITIONS } from './maintenance-status.enum.js';

describe('TRANSITIONS of maintenance', () => {
  it('allows the normal flow SCHEDULED -> IN_PROGRESS -> COMPLETED', () => {
    expect(TRANSITIONS[E.SCHEDULED]).toContain(E.IN_PROGRESS);
    expect(TRANSITIONS[E.IN_PROGRESS]).toContain(E.COMPLETED);
  });

  it('does not allow completing without having started', () => {
    expect(TRANSITIONS[E.SCHEDULED]).not.toContain(E.COMPLETED);
  });

  it('COMPLETED and CANCELLED are final statuses', () => {
    expect(TRANSITIONS[E.COMPLETED]).toHaveLength(0);
    expect(TRANSITIONS[E.CANCELLED]).toHaveLength(0);
  });
});