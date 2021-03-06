import Joi from '@hapi/joi';
import Router from 'koa-router';

import request from 'supertest';
import createServer from '../../mocks/server';

import * as Validate from './index';


let server = null;
describe('response handling', () => {
  afterEach(() => { server.close() });

  test('validate request body', async () => {
    const schema = {
      uuid: Joi.string().required(),
      params: Joi.object().optional(),
      data: Joi.any().optional()
    };

    const uuid = '6cad20a1-25cb-4bb8-ae68-87370a08c96b';

    const router = new Router();
    router.post('/request', Validate.body(schema), ctx => { ctx.ok(ctx.request.body) });
    server = createServer([router.routes()]);

    const response = await request(server).post('/request').send({ uuid });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ uuid });
  });

  test('validate request body', async () => {
    const schema = {
      uuid: Joi.string().required(),
      params: Joi.object().optional(),
      data: Joi.any().optional()
    };

    const uuid = '6cad20a1-25cb-4bb8-ae68-87370a08c96b';

    const router = new Router();
    router.post('/request', Validate.body(schema, { parser: { multipart: true }}), ctx => { ctx.ok(ctx.request.files.data) });
    server = createServer([router.routes()]);

    let response = await request(server)
      .post('/request')
      .field('uuid', uuid)
      .attach('data', __dirname + '/dummy.pdf');

    expect(response.status).toBe(200);

    const { body } = response;
    expect(body.name).toEqual('dummy.pdf');
    expect(body.type).toEqual('application/pdf');
    expect(body.size).toEqual(13264);

    response = await request(server)
    .post('/request')
    .field('uuid', uuid)
    .attach('data', __dirname + '/dummy.pdf');

    expect(response.status).toBe(200);

    response = await request(server)
    .post('/request')
    .field('uuid', uuid)
    .attach('data', __dirname + '/dummy.pdf');

    expect(response.status).toBe(200);
  });

  test('validate request params', async () => {
    const schema = {
      name: Joi.string(),
      id: Joi.number()
    };

    const router = new Router();
    router.get('/request/:name/:id', Validate.params(schema), ctx => { ctx.ok(ctx.params) });
    server = createServer([router.routes()]);

    let response = await request(server).get('/request/me/2');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: 'me', id: 2 });

    response = await request(server).get('/request/me/two');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ 'params.id': [ 'number.base' ] });
  });

  // TODO: support multipart  
});