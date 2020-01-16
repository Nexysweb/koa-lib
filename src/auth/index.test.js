import * as Auth from './index';

import { HTTP } from '@nexys/lib';


describe('configure', () => {
  const Passport = require('koa-passport');

  test('local', () => {
    const local = {
      type: 'local',
      host: 'http://localhost:3333',
      auth: 'token',
      usernameField: 'email'
    };

    const strategies = Auth.configure({ strategies: [local] }, Passport);
    const [strategy] = strategies;
    expect(strategy.name).toEqual('local');
    expect(strategy._usernameField).toEqual('email');
    expect(strategy._passReqToCallback).toBe(true);
  });

  test('local - missing host', () => {
    const local = {
      type: 'local',
      auth: 'token',
      usernameField: 'email'
    };

    expect(() => { Auth.configure({ strategies: [local] }, Passport); }).toThrow(HTTP.Error);
  });

  test('local - handler', () => {
    const local = {
      type: 'local',
      handleLogin: () => {},
    };

    const strategies = Auth.configure({ strategies: [local] }, Passport);
    const [strategy] = strategies;
    expect(strategy.name).toEqual('local')
  });

  test('jwt - missing secret', () => {
    const jwt = {
      type: 'jwt',
      issuer: 'appName' 
    };

    expect(() => { Auth.configure({ strategies: [jwt] }, Passport); }).toThrow(HTTP.Error);
  });

  test('jwt', () => {
    const jwt = {
      type: 'jwt',
      issuer: 'appName',
      secretOrKey: 'asdf',
      passReqToCallback: false
    };

    const strategies = Auth.configure({ strategies: [jwt] }, Passport);
    const [strategy] = strategies;
    expect(strategy.name).toEqual('jwt');
    expect(strategy._verifOpts.issuer).toEqual('appName');
    expect(strategy._passReqToCallback).toBe(false);
  });

  test('oauth2', () => {
    const oauth2 = {
      type: 'oauth2',
      client: {
        id: 'test',
        secret: 'test'
      },
      prefix: 'prefix',
      callbackURL: `https://host/redirect`,
      handleLogin: () => {}
    };

    const strategies = Auth.configure({ strategies: [oauth2] }, Passport);
    const [strategy] = strategies;

    expect(strategy.name).toEqual('oauth2');
    expect(typeof strategy._verify).toBe('function');
    expect(strategy._callbackURL).toEqual('https://host/redirect');
  });

  test('combined', () => {
    let strategies = [{
      type: 'local',
      host: 'http://localhost:3333',
      auth: 'token'
    }, {
      type: 'jwt',
      issuer: 'appName',
      secretOrKey: 'asdf',
      name: 'app'
    }];

    strategies = Auth.configure({ strategies }, Passport);
    expect(strategies.length).toBe(2);
    expect(strategies[0].name).toEqual('local');
    expect(strategies[1].name).toEqual('app');
  });
});