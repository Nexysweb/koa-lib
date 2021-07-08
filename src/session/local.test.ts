import Local from './local';


test('session store - local', async () => {
  const cache = new Local({ persistent: true });

  const data = { test: 'asdf' };

  const key = await cache.set(data);

  const result = cache.get(key);
  expect(result).toEqual(data);
});