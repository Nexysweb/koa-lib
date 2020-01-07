import path from 'path';

import Koa from 'koa';
import Logger from 'koa-logger';
import Helmet from 'koa-helmet';
import Respond from 'koa-respond';

import Mount from 'koa-mount';

import * as Session from '../session';
import * as Middleware from '../middleware';
import * as Auth from '../auth';

import { HTTP } from '@nexys/lib';


export const routeHandler = (prefix, filepath, filename) => {
  // NOTE: filepath is relative to root directory

  if (filepath) {
    filepath = path.join(process.cwd(), filepath, filename || prefix);
  } else {
    console.warn(`Using default path ./src/routes for routes prefix: ${prefix}`);
    filepath = path.join(process.cwd(), '/src/routes', filename || prefix);
  }

  return Mount(`${prefix}`, require(filepath).default);
}


function mount(prefix, middleware) {
  this.use(Mount(prefix, middleware));
}

function routes(prefix, filepath, filename) {
  // TOOD: use arguments?
  this.use(routeHandler(prefix, filepath, filename));
}

export const init = (options={}) => {
  const app = new Koa();

  Object.defineProperty(app, 'mount', { value: mount });
  Object.defineProperty(app, 'routes', { value: routes });
  // TODO: nested routes via subApp = new Koa() => subApp.routes(...)

  /*** CORE MIDDLEWARE ***/
  if (options.production) {
    app.proxy = true; // NOTE: use X-Forwarded-* fields in production
  } else {
    app.use(Logger()); // NOTE: development style logger middleware
  }

  app.use(Helmet()); // NOTE: important security headers (https://github.com/venables/koa-helmet)
  app.use(Respond()); // NOTE: middleware that adds useful methods: send => ok, notFound, badRequest

  if (options.agent) {
    app.use(require('koa-useragent').userAgent);
  }
  /***********************/


  /*** RESPONSE & ERROR HANDLING ***/
  app.use(Middleware.Response.handler(options.messages));
  app.on('error', Middleware.Errors.logger);
  /*********************************/


  /*** SESSION ***/
  let session = {};
  if (options.session) {
    // NOTE: alternative approach -> no session (send login response with set-cookie header), cookie: jwt=..
    session.config = Session.configure(options.session, options.production, !!options.auth);

    if (session.config.signed) {
      const { signatureKeys } = options.session;
      if (!signatureKeys) {
        throw new HTTP.Error('Please provide keys for the cookie signature');
      }
      if (!Array.isArray(signatureKeys)) {
        throw new HTTP.Error('Please provide an array of signature keys');
      }

      // NOTE: session signatures explained
      // https://stackoverflow.com/questions/46859103/how-can-i-access-cookie-session-from-client-side
      app.keys = signatureKeys;
    }

    session.middleware = require('koa-session2')(session.config);
    app.use(session.middleware); 
  }
  /*****************/


  /*** AUTHENTICATION ***/
  if (options.auth) {
    const Passport = require('koa-passport');

    const strategies = Auth.configure(options.auth, Passport); 
    for (const strategy of strategies) {
      Passport.use(strategy.name, strategy);
    }

    app.use(Passport.initialize()); // NOTE: sets passport on request - req.passport (express) => ctx.passport (koa)
    if (session.middleware) {
      // NOTE: setup default session strategy https://github.com/jaredhanson/passport/blob/2327a36e7c005ccc7134ad157b2f258b57aa0912/lib/strategies/session.js
      app.use(Passport.session()); // NOTE: sets session on request - req.user (express) => ctx.state.user (koa) <-> (serialize/deserialize)
    }
  }
  /***********************/


  /*** WEBSOCKET ***/
  if (options.websocket) {
    options.websocket(app, session.middleware, session.config);
  }
  /*****************/


  // Gzip compression: https://github.com/koajs/compress
  // Rate limiting https://github.com/koajs/ratelimit

  // NOTE: for server message templates
  // import locales from 'koa-locales';
  // locales(app, { dirs: [__dirname + '/../locales'] })

  return app;
}