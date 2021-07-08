import ServiceCache from './service';


test('creation', () => {
  const cache = new ServiceCache('app');
  const key = cache.key('random');
  expect(key).toEqual('app:random');
});