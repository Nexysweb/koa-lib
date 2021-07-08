import RedisCache from './redis';
import Redis from 'ioredis-mock';


test('session store - redis', async () => {
  const cache = new RedisCache({
    ip: '127.0.0.1',
    port: 6379,
    mock: new Redis()
  });

  const data = { test: 'asdf' };

  const key = await cache.set(data);

  let result = await cache.get(key);
  expect(result).toEqual(data);
});