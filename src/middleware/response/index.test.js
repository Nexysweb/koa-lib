import request from 'supertest';

import createServer from '../../mocks/server';

import { HTTP } from '@nexys/lib';


let server = null;

describe('response handling', () => {
  afterEach(() => { server.close() });

  test('standard response', async () => {
    const middleware = [ctx => { ctx.body = 'test'; }]; // NOTE: sets ctx.text
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('test');
  });

  test('simple response', async () => {
    const middleware = [ctx => { ctx.state.response = 'test'; }]; // NOTE: sets ctx.text
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({message: 'test'});
  });

  test('state 200', async () => {
    const middleware = [ctx => { ctx.state.response = new HTTP.Success({ message: 'result' }); }];
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ message: 'result' });
  });

  test('state 201', async () => {
    const middleware = [ctx => { ctx.state.response = new HTTP.Success({ message: 'result' }, {}, 201); }];
    server = createServer(middleware);

    const response = await request(server).get('/');
    expect(response.status).toEqual(201);
    expect(response.body).toEqual({ message: 'result' })
  });
});