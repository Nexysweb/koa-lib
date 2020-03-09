import LocalCache from './local';

jest.setTimeout(10000);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('local cache', () => {
  const cache = new LocalCache({ ttl: 2 });

  const data = { test: 'asdf' };

  test('set', async () => {
    cache.set('test', data);

    let result = cache.get('test');
    expect(result).toEqual(data);

    await sleep(2500);

    result = cache.get('test');
    expect(result).toBe(false);
  });

  test('set with ttl', async () => {
    cache.set('test', data, 5);

    let result = cache.get('test');
    expect(result).toEqual(data);

    await sleep(5500);

    result = cache.get('test');
    expect(result).toBe(false);
  });

  test('extend', async () => {
    cache.set('test', data, 5);

    let result = cache.get('test');
    expect(result).toEqual(data);

    const data2 = { hello: 'world'};
    cache.extend('test', data2);
    result = cache.get('test');
    expect(result).toEqual(Object.assign(data, data2));
  });

  test('del', () => {
    cache.set('test', data, 5);

    let result = cache.get('test');
    expect(result).toEqual(data);

    result = cache.destroy('test');
    expect(result).toEqual(1);

    result = cache.get('test');
    expect(result).toEqual(false);
  });
});

describe('local cache - nested', () => {
  const cache = new LocalCache({
    ttl: 2
  }, 'passport.user');

  const data = { passport: { user: { test: 'asdf' }}};
  test('set', async () => {
    cache.set('test', data, 2);
    let result = cache.get('test');
    expect(result).toEqual(data);
  });
});

describe('local cache - persistent', () => {
  const cache = new LocalCache({
    persistent: true,
    ttl: 2
  });

  const data = { test: 'asdf' };

  test('set', async () => {
    await cache.set('test', data, 2);

    await sleep(2500);

    await cache.load();
    let result = cache.get('test');
    expect(result).toEqual(data);
  });
});

describe('local cache - nested', () => {
  const cache = new LocalCache({ ttl: 2 }, 'passport.user');

  const data = { passport: { user: { test: 'asdf' }}};

  test('set', async () => {
    cache.set('test', data);

    let result = cache.get('test');
    expect(result).toEqual(data);
  });
});