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

    const options = {
      strategies: [local]
    };

    const strategies = Auth.configure(options, Passport);
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

    const options = {
      strategies: [local]
    };

    expect(() => { Auth.configure(options, Passport); }).toThrow(HTTP.Error);
  });

  test('local - handler', () => {
    const local = {
      type: 'local',
      handleLogin: () => {},
    };

    const options = {
      strategies: [local]
    };

    const strategies = Auth.configure(options, Passport);
    const [strategy] = strategies;
    expect(strategy.name).toEqual('local')
  });

  test('jwt - missing secret', () => {
    const jwt = {
      type: 'jwt',
      issuer: 'appName' 
    };

    const options = {
      strategies: [jwt]
    };

    expect(() => { Auth.configure(options, Passport); }).toThrow(HTTP.Error);
  });

  test('jwt', () => {
    const jwt = {
      type: 'jwt',
      issuer: 'appName',
      secretOrKey: 'asdf',
      passReqToCallback: false
    };

    const options = {
      strategies: [jwt]
    };

    const strategies = Auth.configure(options, Passport);
    const [strategy] = strategies;
    expect(strategy.name).toEqual('jwt');
    expect(strategy._verifOpts.issuer).toEqual('appName');
    expect(strategy._passReqToCallback).toBe(false);
  });

  // TODO: oauth2
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