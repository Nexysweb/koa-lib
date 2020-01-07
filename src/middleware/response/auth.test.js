import request from 'supertest';

import * as Middleware from '../index';

import createServer from '../../mocks/server';


let server = null;
describe('auth handling', () => {
  afterEach(() => { server.close(); });

  test('isUnauthenticated', async () => {
    const middleware = [];
    middleware.push(async (ctx, next) => { ctx.isAuthenticated = () => false; await next(); });
    middleware.push(Middleware.isAuthenticated());

    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(401);
    expect(response.body).toEqual({ message: 'Unauthorized. Please log in!' });
  });

  test('isAuthenticated', async () => {
    const middleware = [];
    middleware.push(async (ctx, next) => { ctx.isAuthenticated = () => true; await next(); });
    middleware.push(Middleware.isAuthenticated());
    middleware.push(ctx => ctx.ok('success'));

    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ message: 'success' });
  });
});