import * as path from 'path';

import Koa from 'koa';
import Logger from 'koa-logger';
import Helmet from 'koa-helmet';

// remove
//import Respond from 'koa-respond';

import Mount from 'koa-mount';

import * as Session from '../session';
import * as Middleware from '../middleware';
import * as Auth from '../auth';

import { HTTP } from '@nexys/lib';
import { IOptions, ISessionConfig} from '../types';//, ISession 

const getRoutesPath = (production, prefix) => {
  const filepath = `${production ? '/dist' : '/src'}/routes`;
  console.warn(`Using default path .${filepath} for routes prefix: ${prefix}`);
  return filepath;
}

// TODO: best way to make production flag available?
export const routeHandler = (prefix:string, filepath:string, filename?:string):Koa.Middleware<Koa.ParameterizedContext<any, {}>> => {
  // NOTE: filepath is relative to root directory
  const fullPath:string = path.join(process.cwd(), filepath, filename || prefix);
  return Mount(`${prefix}`, require(fullPath).default);
}

/*
function mount(prefix, middleware) {
  this.use(Mount(prefix, middleware));
}

function routes(prefix, filepath, filename) {
  // TOOD: use arguments?

  if (!filepath) {
    filepath = getRoutesPath(this.context.production, prefix);
  }

  this.use(routeHandler(prefix, filepath, filename));
}*/


const optionsDefault:IOptions = {
  agent: false, // adds `'koa-useragent`
  production: false, // to remove
  auth: {strategies:[]},
  messages:[]
}

export const init = (options:IOptions=optionsDefault) => {
  const app = new Koa();
  app.context.production = options.production;

  //Object.defineProperty(app, 'mount', { value: mount });
  app.use(Mount);
  //app.use(routeHandler(prefix))
  //Object.defineProperty(app, 'routes', { value: routes });
  // TODO: nested routes via subApp = new Koa() => subApp.routes(...)

  /*** CORE MIDDLEWARE ***/
  if (options.production) {
    app.proxy = true; // NOTE: use X-Forwarded-* fields in production
  } else {
    app.use(Logger()); // NOTE: development style logger middleware
  }

  app.use(Helmet()); // NOTE: important security headers (https://github.com/venables/koa-helmet)
  //app.use(Respond()); // NOTE: middleware that adds useful methods: send => ok, notFound, badRequest

  if (options.agent) {
    app.use(require('koa-useragent').userAgent);
  }
  /***********************/


  /*** RESPONSE & ERROR HANDLING ***/
  app.use(Middleware.Response.handler(options.messages));
  app.on('error', Middleware.Errors.logger);
  /*********************************/


  /*** SESSION ***/
  
  if (options.session) {
    // NOTE: alternative approach -> no session (send login response with set-cookie header), cookie: jwt=..
    const config:ISessionConfig = Session.configure(options.session, options.production, !!options.auth);

    if (config.signed) {
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

    const middleware = require('koa-session2')(config);
    const session = {
      config,
      middleware
    }


    
    app.use(session.middleware); 
  }
  /*****************/


  /*** AUTHENTICATION ***/
  /*if (options.auth) {
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
  }*/
  /***********************/


  /*** WEBSOCKET ***/
  //if (options.websocket) {
  //  options.websocket(app, session.middleware, session.config);
  //}
  /*****************/


  // Gzip compression: https://github.com/koajs/compress
  // Rate limiting https://github.com/koajs/ratelimit

  // NOTE: for server message templates
  // import locales from 'koa-locales';
  // locales(app, { dirs: [__dirname + '/../locales'] })

  return app;
}