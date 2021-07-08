import RedisCache from './redis';
import Redis from 'ioredis-mock';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('redis cache', () => {
  const cache = new RedisCache({
    ip: '127.0.0.1',
    port: 6379,
    ttl: 1,
    mock: new Redis()
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

  test('extend', async () => {
    await cache.set('test', data);

    const data2 = {hello: 'world'};
    await cache.extend('test', data2);

    const result = await cache.get('test');
    expect(result).toEqual(Object.assign(data, data2));
  })
});