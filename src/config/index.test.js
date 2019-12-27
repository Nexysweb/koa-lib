import Config from './index';

import path from 'path';

import EnvVar from './envVar';


describe('local', () => {
  const opts = {
    path: path.resolve(process.cwd(), 'src/config', '.test.env')
  };

  test('default', () => {
    const config = new Config({}, true, opts);
    expect(config.get('auth.basic')).toEqual({ user: 'asdf', pass: 'test' });
    expect(config.get('session.signatureKeys')).toEqual('asdf1, asdf2');
  });

  test('custom', () => {
    const customConfig = {
      api: EnvVar.create('API_HOST', 'http://localhost:9052'),
      recipients: EnvVar.create('ADMIN_EMAIL_RECIPIENTS'),
      test: {
        prepTime: EnvVar.create('TEST_PREPARATION_MINUTES'),
        prepQuestions: EnvVar.create('TEST_PREPARATION_QUESTIONS'),
        passRate: EnvVar.create('TEST_PREPARATION_PASSRATE')
      },
      redis: {
        password: EnvVar.create('REDIS_PW')
      }
    };

    const config = new Config(customConfig, true, opts);
    expect(config.get('recipients')).toEqual('fabian@nexys.ch, johan@nexys.ch');
    expect(config.get('test.prepTime')).toEqual(120);
    expect(config.get('redis.password')).toEqual('test');
  });
});