import compose from 'koa-compose';
import basicAuth from 'koa-basic-auth';
import passport from 'koa-passport';

import * as Errors from './error';
import * as Response from './response';
import * as Validate from './validate';
import * as Request from './request';


export { Errors, Response, Validate, Request };


/*** AUTH MIDDLEWARE ***/
export const isBasicAuthenticated = (username, password) => basicAuth({name: username, pass: password});

// NOTE: disabling sessions (API server) http://www.passportjs.org/docs/authenticate/#disable-sessions
export const isAuthenticated = (name, config={session: false}) => {
  // NOTE: we can add a custom callback in the place of `failureRedirect`: http://www.passportjs.org/docs/authenticate/#custom-callback

  // TODO: specify redirect if not logged in
  if (name) {
    // NOTE: authentication middleware for any strategy
    return passport.authenticate(name, config);
  } else {
    // NOTE: session authentication middleware
    return async (ctx, next) => {
      if (ctx.isAuthenticated()) {
        await next();
      } else {
        ctx.throw(401, 'Unauthorized. Please log in!');
      }
    }
  }
}
// NOTE: if you need to chain auth strategies, use koa-compose([...]), because:
//   > passport.authenticate(['app', 'user'], config);
// calls user strategy but does not add user data to state.user

// NOTE: verify function passed in place of config 
export const authenticate = (name, verify) => passport.authenticate(name, verify);

export const hasPermissions = permissions => async (ctx, next) => {
  const { auth, permissions: perms } = ctx.state.user;

  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }

  const authorized = permissions.every(p => auth.includes(p) || perms.includes(p));

  if (authorized) {
    await next();
  } else {
    ctx.throw(401, `Unauthorized. Missing the necessary permissions ${permissions}`);
  }
}

export const isAuthorized = permissions => compose([isAuthenticated(), hasPermissions(permissions)]);

// NOTE: assuming roles: user (default), admin; more roles: hasRole('admin')
// https://stackoverflow.com/questions/45025613/role-based-jwt-authorization
export const hasAdminRights = async (ctx, next) => {
  const { isAdmin } = ctx.state.user;

  if (isAdmin) {
    await next();
  } else {
    // TODO: specify redirect to app if not admin 
    ctx.throw(401, 'Unauthorized. Missing the required role `admin`');
  }
}

export const isAdmin = compose([isAuthenticated(), hasAdminRights]);
/**************/

/*
  NOTE: Returns separate middleware for responding to OPTIONS requests with an Allow header containing the allowed methods, as well as responding with
  - 405 Method Not Allowed and
  - 501 Not Implemented as appropriate.
*/
export const routes = router => compose([router.routes(), router.allowedMethods()]);