import Passport from 'koa-passport';
import Router from 'koa-router';
import Joi from '@hapi/joi';

import request from 'supertest';

import createServer from '../../mocks/server';

import * as Strategy from './index';
import * as Middleware from '../../middleware';

import { HTTP } from '@nexys/lib';


// TODO: find solution
Passport.serializeUser((user, done) => done(null, user)); // standard example: store user.id
Passport.deserializeUser((user, done) => done(null, user)); // fetch session by stored user.id

const sessionData = {
  user: { id: 1, username: 'john.smith', firstName: 'John', lastName: 'Smith' },
  token: 'asdf'
};

const router = new Router();

const loginSchema = {
  username: Joi.string().required(),
  password: Joi.string().required()
}

// NOTE: route with local passport auth strategy (passport instance is set)
router.post('/login', Middleware.Validate.body(loginSchema), ctx => {
  return Passport.authenticate('local', async (err, data) => {
    await ctx.login(data);
    ctx.ok(data);
  })(ctx);
});

// NOTE: route without passport strategy => default passport session strategy has to be used
router.get('/status', Middleware.isAuthenticated(), ctx => { ctx.state.response = ctx.state.user });


let server = null;
describe('local', () => {
  afterEach(() => { server.close(); });

  // TODO: options.usernameField: 'email'
  // different strategy options
  const options = {};
  options.handleLogin = jest.fn(() => sessionData);
  // async alternative: options.handleLogin = jest.fn(async () => Promise.resolve(sessionData));
  Passport.use(Strategy.local(options));

  test('init', async () => {
    // Passport.session() https://github.com/jaredhanson/passport/blob/2327a36e7c005ccc7134ad157b2f258b57aa0912/lib/authenticator.js#L197
    const middleware = [Passport.initialize(), router.routes()];
    server = createServer(middleware, true);

    let response = await request(server).post('/login').send({ username: 'john.smith', password: '123456Aa' });
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(1);
    const cookie = response.headers['set-cookie'][0].split(' ')[0];

    response = await request(server).get('/status');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized. Please log in!' });

    // NOTE: does not initialize req.user, ctx.state.user from session on request
    response = await request(server).get('/status').set('Cookie', cookie);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized. Please log in!' });
  });

  test('session', async () => {
    // Passport.session() https://github.com/jaredhanson/passport/blob/2327a36e7c005ccc7134ad157b2f258b57aa0912/lib/authenticator.js#L197
    const middleware = [Passport.initialize(), Passport.session(), router.routes()];
    server = createServer(middleware, true);

    let response = await request(server).post('/login').send({ username: 'john.smith', password: '123456Aa' });
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(1);
    const cookie = response.headers['set-cookie'][0].split(' ')[0];

    response = await request(server).get('/status');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized. Please log in!' });

    // NOTE: should initialize req.user, ctx.state.user from session on request
    response = await request(server).get('/status').set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(sessionData);
  });
});

describe('jwt', () => {
  test('missing issuer', async () => {
    const options = { fromSession: true };
    options.handleLogin = jest.fn(async () => Promise.resolve(sessionData));

    expect(() => { Strategy.jwt(options); }).toThrow(HTTP.Error);
  });

  test('init', async () => {
    const options = { fromSession: true, issuer: 'myApp', secretOrKey: 'asdf' };
    options.handlePayload = jest.fn(() => sessionData);

    Passport.use(Strategy.jwt(options));

    router.get('/jwtStatus', Middleware.isAuthenticated('jwt'), ctx => { ctx.state.response = ctx.state.user });

    const middleware = [Passport.initialize(), Passport.session(), router.routes()];
    const server = createServer(middleware, true);

    let response = await request(server).post('/login').send({ username: 'john.smith', password: '123456Aa' });
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(1);
    const cookie = response.headers['set-cookie'][0].split(' ')[0];

    response = await request(server).get('/status');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Unauthorized. Please log in!' });

    response = await request(server).get('/jwtStatus').set('Cookie', cookie);
    expect(response.body).toEqual({ message: 'Unauthorized' });
    // TODO: working dummy token
    // expect(response.status).toBe(200);
    // expect(response.body).toEqual(sessionData);

    server.close();
  });
});

describe('oauth2', () => {
  test('redirect', async () => {
    const options = {
      name: 'sso',
      type: 'oauth2',
      prefix: 'https://example.com',
      client: {
        id: 'asdf',
        secret: 'asdf'
      },
      callbackURL: `http://localhost/redirect`,
    };
    options.handleLogin = jest.fn(() => sessionData);

    const strategy = Strategy.oAuth2(options);
    Passport.use(strategy);

    router.get('/auth', Passport.authenticate('sso'));

    const middleware = [Passport.initialize(), Passport.session(), router.routes()];
    const server = createServer(middleware);

    await request(server).get('/auth').expect(302);

    server.close();
  });
});