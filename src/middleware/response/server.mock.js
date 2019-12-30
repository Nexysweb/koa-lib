import Koa from 'koa';
import Respond from 'koa-respond';

import * as Response from './index';
import * as Errors from '../error';


export default (middleware=[]) => {
  const app = new Koa();

  app.use(Respond());
  app.use(Response.handler());

  for (const m of middleware) {
    app.use(m);
  }

  app.on('error', Errors.logger);

  const server = app.listen();
  return server;
}