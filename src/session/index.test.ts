import RedisMock from 'ioredis-mock';

import * as Session from './index';

import Local from './local';
import Redis from './redis';


describe('configure', () => {
  test('standard', () => {
    const options = {
      key: 'app_test'
    };

    const config = Session.configure(options);
    expect(config.key).toBe('app_test');
    expect(config.signed).toBe(undefined);
  });

  test('duration', () => {
    const options = {
      key: 'app_dev',
      duration: 24*60
    };

    const config = Session.configure(options);
    expect(config.key).toBe('app_dev');
    expect(config.store).toBeInstanceOf(Local);
    expect(config.store.persistent).toBe(true);
    expect(config.maxAge).toBe(86400000);
  });

  test('signed', () => {
    const options = {
      key: 'app_prod',
      duration: 2*24*60,
      signed: true,
      signatureKeys: ['asdf', 'asdf2'],
      local: {
        persistent: false
      }
    };

    const config = Session.configure(options);
    expect(config.signed).toBe(true);
    expect(config.store.persistent).toBe(undefined);
  });

  test('signed', () => {
    const options = {
      key: 'app_prod',
      duration: 2*24*60,
      signed: true,
      signatureKeys: ['asdf', 'asdf2'],
      redis: {
        mock: new RedisMock()
      }
    };

    const config = Session.configure(options, true);
    expect(config.store).toBeInstanceOf(Redis);
  });
});

// TODO: test different cookie configurations