import * as Session from './index';

// TODO: remove function?
describe('get', () => {
  const user = { id: 1, email: 'john.smith@gmail.com' };
  const token = 'token';

  test('standard', () => {
    expect(Session.get({})).toBe(false);
    expect(Session.get({session: { user }})).toBe(null);
    expect(Session.get({session: { user, token }})).toEqual({user, token});
  });
});
