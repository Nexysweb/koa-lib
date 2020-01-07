import Koa from 'koa';
import Router from 'koa-router';

import request from 'supertest';

import * as App from './index';


describe('route handler', () => {
  test('default', async () => {
    const app = new Koa();
    const middleware = App.routeHandler('/test', null, 'test-route');
    app.use(middleware);

    expect(app.middleware.length).toBe(1);

    const server = app.listen();
    const response = await request(server).get('/test/me');
    expect(response.text).toEqual('test');
    server.close();
  });

  test('path', () => {
    const app = new Koa();
    const middleware = App.routeHandler('/test', '/src/routes', 'test-route');
    app.use(middleware);

    expect(app.middleware.length).toBe(1);
  });
});

describe('init', () => {
  test('default', () => {
    const app = App.init({ agent: true });
    expect(app.middleware.length).toBe(5);
  });

  test('with route', async () => {
    const app = App.init();
    app.routes('/test', null, 'test-route');
    expect(app.middleware.length).toBe(5);

    const server = app.listen();
    const response = await request(server).get('/test/me');
    expect(response.text).toEqual('test');
    server.close();
  });

  test('with mount', async () => {
    const app = App.init();

    const router = new Router();
    router.get('/me', ctx => { ctx.body = 'test' });
    app.mount('/test', router.routes());

    expect(app.middleware.length).toBe(5);

    const server = app.listen();
    const response = await request(server).get('/test/me');
    expect(response.text).toEqual('test');
    server.close();
  });

  test('with session', async () => {
    const session = {
      key: 'app_test',
      local: {
        persistent: true
      }
    };

    const app = App.init({ session });
    expect(app.middleware.length).toBe(5);

    const router = new Router();
    router.post('/login', ctx => { ctx.session = { id: 1, name: 'Smith' }; ctx.body = { id: 1 }; });
    app.use(router.routes());

    const server = app.listen(); 
    const response = await request(server).post('/login').send({ username: 'john.smith', password: '123456Aa' });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    const cookie = response.headers['set-cookie'][0].split(' ')[0];
    expect(cookie.length).toEqual(42);
    server.close();
  });

  test('with passport', async () => {
    const options = {
      type: 'local',
      host: 'user',
      auth: 'token',
      usernameField: 'email'
    };

    const auth = { strategies: [options] };
    const app = App.init({ auth });
    expect(app.middleware.length).toBe(5);
  });
});