import { withoutPassword } from './audit.interceptor.js';

describe('withoutPassword', () => {
  it('removes the password and keeps the rest', () => {
    expect(withoutPassword({ email: 'a@b.com', password: 'secret' })).toEqual({
      email: 'a@b.com',
    });
  });

  it('returns null if there is no body', () => {
    expect(withoutPassword(undefined)).toBeNull();
  });
});