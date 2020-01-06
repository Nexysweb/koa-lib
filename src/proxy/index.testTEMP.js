import mount from 'koa-mount';

import nock from 'nock';
import request from 'supertest';

import createServer from '../mocks/server';

import Proxy from './index';


const standardProxy = new Proxy('/test', { target: 'https://standard.proxy' });

const addSession = async (ctx, next) => {
  ctx.session = {};
  ctx.session.token = 'TOKEN';

  await next();
}

const tokenProxy = new Proxy('/further/test', addSession, {
  target: 'http://token.proxy',
  auth: {
    token: true
  }
});

const hookProxy = new Proxy('/another/test', {
  target: 'https://hook.proxy',
  hooks: {
    before: {
      addToken: (ctx, proxy) => {
        const auth = { token: 'TOKEN' };
        proxy.setAuth(ctx, auth);

        ctx.request.query = { hello: 'world' };
      }
    },
    after: {
      manipulation: (ctx, body, _) => {
        if (body && body.hello === 'world') {
          ctx.status = 400;
          ctx.body = { message: 'test' };
        }

        // Problem: when returning 'text' text/plain server sets body to {}
        // response.headers['content-type'] = 'text/plain';
        // ctx.set('content-type', 'text/plain');
      }
    }
  }
});


const middleware = [];
middleware.push(mount('/test', standardProxy));
middleware.push(mount('/further', tokenProxy));
middleware.push(mount('/another', hookProxy));

// NOTE: test proxy together with response handler
const server = createServer(middleware, true);


afterAll(() => {
  // close the server after last test
  server.close();
});

describe('standard proxy', () => {
  test('get', async () => {
    nock('https://standard.proxy')
      .get('/me')
      .reply(200, { data: [{ test: 'me' }] });

    const response = await request(server).get('/test/me');
    expect(response.status).toEqual(200);
    expect(response.type).toEqual('application/json');
    expect(response.body).toEqual(expect.objectContaining({data: expect.any(Array)}));
  });

  test('empty list', async () => {
    nock('https://standard.proxy')
    .get('/me')
    .reply(200, []);

    const response = await request(server).get('/test/me');
    expect(response.status).toEqual(200);
    expect(response.type).toEqual('application/json');
  })

  // tbc...
});

describe('proxy with token authentication', () => {
  test('post', async () => {
    nock('http://token.proxy')
      .post('/test/me')
      .matchHeader('authorization', 'Bearer TOKEN')
      .reply(200, { status: true });

    // TODO: why is /test not being replaced?
    const response = await request(server).post('/further/test/me').send({test: 'me', hello: 'world'});

    expect(response.status).toEqual(200);
    expect(response.type).toEqual('application/json');
    expect(response.body.status).toBe(true);
  });

  // tbc...
});

describe("proxy with hooks", () => {
  test('empty list', async () => {
    nock('https://hook.proxy')
      .get('/test/again')
      .matchHeader('authorization', 'Bearer TOKEN')
      .query({hello: 'world'})
      .reply(200, undefined); 

    const response = await request(server).get('/another/test/again');
    expect(response.status).toEqual(204);
    expect(response.body).toEqual({});
  });

  test('empty list', async () => {
    nock('https://hook.proxy')
      .get('/test/again')
      .matchHeader('authorization', 'Bearer TOKEN')
      .query({hello: 'world'})
      .reply(200, []);

    const response = await request(server).get('/another/test/again');
    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  test('after hook', async () => {
    nock('https://hook.proxy')
      .get('/test/again')
      .matchHeader('authorization', 'Bearer TOKEN')
      .query({hello: 'world'})
      .reply(200, { hello: 'world' });

    const response = await request(server).get('/another/test/again');

    expect(response.status).toEqual(400);
    expect(response.type).toEqual('application/json'); // 'text/plain');
    expect(response.body).toEqual({ message: 'test' }); // 'test');
  });

  // tbc...
});