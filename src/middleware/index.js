import compose from 'koa-compose';
import basicAuth from 'koa-basic-auth';

import * as Errors from './error';
import * as Response from './response';
import * as Validate from './validate';
import * as Request from './request';
import * as Mount from './mount';

// DEPRECATED
import Init from './init';


export { Errors, Response, Validate, Request, Mount, Init };


/*** AUTH MIDDLEWARE ***/
export const isBasicAuthenticated = (username, password) => basicAuth({name: username, pass: password});

export const isAuthenticated = async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    await next();
  } else {
    ctx.throw(401, 'Unauthorized. Please log in!');
  }
}

export const hasPermissions = permissions => async (ctx, next) => {
  const { auth, permissions: perms } = ctx.state.user;

  const authorized = permissions.every(p => auth.includes(p) || perms.includes(p));

  if (authorized) {
    await next();
  } else {
    ctx.throw(401, `Unauthorized. Missing the necessary permissions ${permissions}`);
  }
}

export const isAuthorized = permissions => compose([isAuthenticated, hasPermissions(permissions)]);

// NOTE: assuming roles: user (default), admin; more roles: hasRole('admin')
// https://stackoverflow.com/questions/45025613/role-based-jwt-authorization
export const hasAdminRights = async (ctx, next) => {
  const { isAdmin } = ctx.state.user;

  if (isAdmin) {
    await next();
  } else {
    ctx.throw(401, 'Unauthorized. Missing the required role `admin`');
  }
}

export const isAdmin = compose([isAuthenticated, hasAdminRights]);
/**************/


/*
  NOTE: Returns separate middleware for responding to OPTIONS requests with an Allow header containing the allowed methods, as well as responding with
  - 405 Method Not Allowed and
  - 501 Not Implemented as appropriate.
*/
export const routes = router => compose([router.routes(), router.allowedMethods()]);