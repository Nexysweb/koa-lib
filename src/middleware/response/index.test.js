import request from 'supertest';

import { HTTP } from '@nexys/lib';


let server = null;

describe('error handling', () => {
  afterEach(() => { server.close(); });

  test('route 404', async () => {
    server = require('./server.mock').default();

    const response = await request(server).get('/user');
    expect(response.status).toEqual(404);
    expect(response.body.message).toEqual('Not found. The requested route does not exist');
  });

  test('throw 500', async () => {
    const middleware = [() => { throw new HTTP.Error('Something went wrong', 500) }];
    server = require('./server.mock').default(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(500);
    expect(response.body.message).toEqual('500, Something went wrong');

    // TODO: how to test what error handler logged
  });

  test('throw 400', async () => {
    const errBody = { test: ['string.min'] };
    const middleware = [() => { throw new HTTP.Error(errBody, 400); }];
    server = require('./server.mock').default(middleware);


    const response = await request(server).get('/');
    expect(response.status).toEqual(400);
    expect(response.body).toEqual(errBody);
  });

  test('ctx throw 400', async () => {
    const middleware = [ctx => { ctx.throw(400, 'Name required'); }];
    server = require('./server.mock').default(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(400);
    expect(response.body).toEqual({ message: 'Name required' });
  }); 

  test('ctx throw 500', async () => {
    const middleware = [ctx => { ctx.throw(500, 'Server breakdown'); }];
    server = require('./server.mock').default(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(500);
    expect(response.body).toEqual({ message: 'Server breakdown' });
  }); 

  test('reference error', async () => {
    const middleware = [() => { ctx.body = 'test'; }];
    server = require('./server.mock').default(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(500);
    expect(response.body.message).toEqual('ctx is not defined');
  });
});

/*
  describe('auth error handling', () => {
    // TODO: test 401 (setup passport?)
  });
*/

describe('response handling', () => {
  afterEach(() => { server.close() });

  test('standard response', async () => {
    const middleware = [ctx => { ctx.body = 'test'; }]; // NOTE: sets ctx.text
    server = require('./server.mock').default(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('test');
  });

  test('state 200', async () => {
    const middleware = [ctx => { ctx.state = new HTTP.Success({ message: 'result' }); }];
    server = require('./server.mock').default(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ message: 'result' });
  });

  test('state 201', async () => {
    const middleware = [ctx => { ctx.state = new HTTP.Success({ message: 'result' }, {}, 201); }];
    server = require('./server.mock').default(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({ message: 'result' })
  });
});