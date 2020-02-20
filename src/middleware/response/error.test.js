import request from 'supertest';

import createServer from '../../mocks/server';

import { HTTP } from '@nexys/lib';


let server = null;

describe('error handling', () => {
  afterEach(() => { server.close(); });

  test('route 404', async () => {
    server = createServer();
    const response = await request(server).get('/user');
    expect(response.status).toEqual(404);
    expect(response.body.message).toEqual('Not found. The requested route does not exist');
  });

  test('throw 500', async () => {
    const middleware = [() => { throw new HTTP.Error('Something went wrong', 500) }];
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(500);
    expect(response.body.message).toEqual('Internal Server Error');

    // TODO: how to test what error handler logged
  });

  test('throw 400', async () => {
    const errBody = { test: ['string.min'] };
    const middleware = [() => { throw new HTTP.Error(errBody, 400); }];
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(400);
    expect(response.body).toEqual(errBody);
  });

  test('ctx throw 400', async () => {
    const middleware = [ctx => { ctx.throw(400, 'Name required'); }];
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({ message: 'Name required' });
  }); 

  test('ctx throw 500', async () => {
    const middleware = [ctx => { ctx.throw(500, 'Server breakdown'); }];
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(500);
    expect(response.body).toEqual({ message: 'Server breakdown' });
  }); 

  test('reference error', async () => {
    // eslint-disable-next-line
    const middleware = [() => { ctx.body = 'test'; }];
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(500);
    expect(response.body.message).toEqual('ctx is not defined');
  });
});
