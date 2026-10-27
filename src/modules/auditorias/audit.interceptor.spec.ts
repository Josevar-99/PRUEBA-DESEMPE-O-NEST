import { sinPassword } from './audit.interceptor.js';

describe('sinPassword', () => {
  it('quita la contraseña y conserva el resto', () => {
    expect(sinPassword({ email: 'a@b.com', password: 'secreta' })).toEqual({
      email: 'a@b.com',
    });
  });

  it('devuelve null si no hay body', () => {
    expect(sinPassword(undefined)).toBeNull();
  });
});