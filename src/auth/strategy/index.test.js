import Passport from 'koa-passport';
import Router from 'koa-router';
import Joi from '@hapi/joi';

import request from 'supertest';

import createServer from '../../mocks/server';

import * as Strategy from './index';
import * as Middleware from '../../middleware';


let server = null;
describe('local', () => {
  afterEach(() => { server.close(); });

  // TODO: find solution
  Passport.serializeUser((user, done) => done(null, user)); // standard example: store user.id
  Passport.deserializeUser((user, done) => done(null, user)); // fetch session by stored user.id

  const sessionData = {
    user: { id: 1, username: 'john.smith', firstName: 'John', lastName: 'Smith' },
    token: 'asdf'
  };

  const loginSchema = {
    username: Joi.string().required(),
    password: Joi.string().required()
  };

  // TODO: options.usernameField: 'email'
  const options = {};
  options.handleLogin = jest.fn(async () => Promise.resolve(sessionData));
  Passport.use(Strategy.local(options));

  const router = new Router();

  // NOTE: route with local passport auth strategy (passport instance is set)
  router.post('/login', Middleware.Validate.body(loginSchema), ctx => {
    return Passport.authenticate('local', async (err, data) => {
      await ctx.login(data);
      ctx.ok(data);
    })(ctx);
  });

  // NOTE: route without passport strategy => default passport session strategy has to be used
  router.get('/status', Middleware.isAuthenticated, ctx => { ctx.state.response = ctx.state.user });

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

// TODO: jwt

// TODO: oauth