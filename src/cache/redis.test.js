import RedisCache from './redis';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO: mock redis client
describe('redis cache', () => {
  const cache = new RedisCache({
    ip: '127.0.0.1',
    port: 6379,
    ttl: 1 
  });

  const data = { test: 'asdf' };

  test('set', async () => {
    await cache.set('test', data);

    let result = await cache.get('test');
    expect(result).toEqual(data);

    await sleep(1500);

    result = await cache.get('test');
    expect(result).toBe(false);
  });

  test('set with ttl', async () => {
    await cache.set('test', data, 2);

    let result = await cache.get('test');
    expect(result).toEqual(data);

    await sleep(2500);

    result = await cache.get('test');
    expect(result).toBe(false);

    cache.quit();
  });
});