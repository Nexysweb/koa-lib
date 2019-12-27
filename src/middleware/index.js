import compose from 'koa-compose';

import * as Mount from './mount';
import Init from './init';
import * as JWT from './jwt';
import * as Validate from './validate';


export { Mount, Init, JWT, Validate };

export const isBasicAuthenticated = (name, pass) => basicAuth({name, pass});

// NOTE: Returns separate middleware for responding to OPTIONS requests with an Allow header containing the allowed methods, as well as responding with
// - 405 Method Not Allowed and
// - 501 Not Implemented as appropriate.
export const routes = router => compose([router.routes(), router.allowedMethods()]);

export const responseHandler = async (r, ctx) => {
  if (r.isError) {
    const body = typeof r.message === 'string' ? {message: r.message} : r.message;
    // todo generalize to all status, ctx.status(statusCode).response(r), see attempt below
    // todo: check if below works
    /*ctx.status = r.statusCode;
    ctx.body = body;*/

    switch (r.statusCode) {
      case 404:
        ctx.notFound(body);
        return;
      case 500:
        ctx.internalServerError(body);
        return;
      default:
        ctx.status = 400;
        ctx.body = body;
        //ctx.badRequest(body);
        return;
    }    
  }

  ctx.ok(r);
}
