import Koa from 'koa';
import Respond from 'koa-respond';

import * as Response from '../middleware/response/index';
import * as Errors from '../middleware/error';


export default (middleware=[], session=false) => {
  const app = new Koa();

  app.use(Respond());
  app.use(Response.handler());

  if (session) {
    const session = require('koa-session2');
    app.use(session());
  }

  for (const m of middleware) {
    app.use(m);
  }

  app.on('error', Errors.logger);

  const server = app.listen();
  return server;
}