import compose from 'koa-compose';
import basicAuth from 'koa-basic-auth';

import * as Errors from './error';
import * as Response from './response';
import * as JWT from './jwt';
import * as Validate from './validate';
import * as Mount from './mount';
// DEPRECATED
import Init from './init';


export { Errors, Response, JWT, Validate, Mount, Init };

export const isBasicAuthenticated = (username, password) => basicAuth({name: username, pass: password});

/*
  NOTE: Returns separate middleware for responding to OPTIONS requests with an Allow header containing the allowed methods, as well as responding with
  - 405 Method Not Allowed and
  - 501 Not Implemented as appropriate.
*/
export const routes = router => compose([router.routes(), router.allowedMethods()]);