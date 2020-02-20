import compose from 'koa-compose';
import basicAuth from 'koa-basic-auth';
import passport from 'koa-passport';

import * as Errors from './error';
import * as Response from './response';
import * as Validate from './validate';
import * as Request from './request';

import * as Types from '../session/types';

import { HTTP } from '@nexys/lib';


export { Errors, Response, Validate, Request };


/*** AUTH MIDDLEWARE ***/
export const isBasicAuthenticated = (username:string, password:string) => basicAuth({name: username, pass: password});

// NOTE: disabling sessions (API server) http://www.passportjs.org/docs/authenticate/#disable-sessions
export const isAuthenticated = (name:string, config:{session: boolean} = {session: false}) => {
  // NOTE: we can add a custom callback in the place of `failureRedirect`: http://www.passportjs.org/docs/authenticate/#custom-callback

  // TODO: specify redirect if not logged in, see bottom of file
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
export const authenticate = (name:string, verify) => passport.authenticate(name, verify);

export const hasPermissions = (permissions:string[]) => async (ctx, next) => {
  const userSession:Types.UserSession = ctx.state.user;

  if (!Array.isArray(permissions)) {
    permissions = [permissions];
  }

  const authorized:boolean = permissions.every(p => user.permissions.includes(p));

  if (authorized) {
    await next();
  } else {
    ctx.throw(401, `Unauthorized. Missing the necessary permissions ${permissions}`);
  }
}

export const isAuthorized = (permissions:string[]) => compose([isAuthenticated(), hasPermissions(permissions)]);

// NOTE: assuming roles: user (default), admin; more roles: hasRole('admin')
// https://stackoverflow.com/questions/45025613/role-based-jwt-authorization
export const hasAdminRights = async (ctx, next) => {
  const userSession:Types.UserSession = ctx.state.user;
  
  // todo: remove `.admin`
  if (userSession.isAdmin || userSession.admin) {
    await next();
  } else {
    // TODO: specify redirect to app if not admin, see bottom of file
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


const fallback = async (middlewares, errors, ctx, next) => {
  const [middleware, ...rest] = middlewares;
  try {
    await middleware(ctx, next);
  } catch (err) {
    // NOTE: handle if user unauthorized for auth approach
    if (err.status === 401) {
      if (rest.length > 0) {
        errors.push(err);
        await fallback(rest, errors, ctx, next);
      } else {
        throw errors.shift();
      }
    } else {
      // NOTE: pass on controller / service errors
      throw err;
    }
  }
}

export const or = (...middlewares) => async (ctx, next) => {
  if (middlewares.length < 2) {
    throw new HTTP.Error('Please provide at least two middleware functions to .or()');
  }

  await fallback(middlewares, [], ctx, next);
}

/*
  redirect upon unauthorized

  const { referer } = ctx.request.headers;
  const uri = stripApp(referer.substring(referer.indexOf("/app")));
  if (uri.length > 1) {
    const redirectUri = encodeURIComponent(uri);
    ctx.redirect(`/login?target=${redirectUri}`);
  } else ctx.unauthorized({redirect: true, uri: '/'});
*/
