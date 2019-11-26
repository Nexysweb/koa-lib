import fs from 'fs';
import url from 'url';
import httpProxy from 'http-proxy';

import pathToRegexp from 'path-match'; // 'path-to-regexp';

import bodyParser from 'koa-body';
import compose from 'koa-compose';

import { getPassportSession } from '../auth';

import Utils from '@nexys/utils';
import Lib from '@nexys/lib';
const { HTTPError } = Lib;


const pathMatcher = pathToRegexp({
  sensitive: false,
  strict: false,
  end: false
});

class Proxy {
  constructor() {
    if (arguments.length === 0) return;

    const args = [...arguments];
    let options = args.pop();
    const [route, ...middleware] = args;

    this.middleware = middleware;

    const proxy = !options.hooks;

    options = {
      resolveResponse: true,
      rewrite: path => path.replace(`/${route}`, ''),
      ...options,
      changeOrigin: true,
      logs: true,
      proxy
    };

   if (proxy) {
      this.proxy = httpProxy.createProxyServer();
      this.hasEvents = false;
    }

    return this.setupMiddleware(options);
  };

  targetUrl = target => typeof target === 'object' ? `${target.host}:${target.port}` : target;

  logger = ctx => {
    const method = ctx.method || 'GET';
    if (this.proxy) console.log(`proxy: ${method} ${ctx.prevUrl} -> ${url.resolve(ctx.target, ctx.url)}`);
    else console.log(`requesting: ${method} - ${ctx.target ? url.resolve(ctx.target, ctx.url) : ctx.url}`);
  }

  tokenHeaders = (token, headers={}) => ({...headers, 'Authorization': `Bearer ${token}`})

  setAuth = (ctx, auth, proxyOpts=false) => {
    if (auth.basic) {
      if (proxyOpts) proxyOpts.auth = `${auth.basic.user}:${auth.basic.pass}`; // ({user, pass}) => `${user}:${pass}`;
      else ctx.auth = {...auth.basic};
    }

    if (auth.token) {
      const session = getPassportSession(ctx);
      let token = null;
      // NOTE: get token
      if (typeof auth.token === 'string') {
        token = auth.token;
      } else if (session) {
        const session = getPassportSession(ctx); 
        token = session.token;
      }

      if (token != null) {
        // NOTE: remove basic authentication
        delete ctx.request.headers['authorization'];
        const headers = this.tokenHeaders(token, ctx.headers);
        if (proxyOpts) proxyOpts.headers = headers;
        ctx.request.headers = headers;
      }
    }
    
    if (auth.headers) {
      // NOTE: if authentication is set as http header
      if (proxyOpts) {
        proxyOpts.headers = {
          ...proxyOpts.headers,
          ...auth.headers
        }
      }
      ctx.request.headers = {
        ...ctx.request.headers,
        ...auth.headers
      }
    }
  }

  proxyEvents = events => {
    if (events && typeof events === 'object' && !this.hasEvents) {
      Object.entries(events).forEach(([event, handler]) => this.proxy.on(event, handler));
      this.hasEvents = true;
    }
  }

  proxyMiddleware = (ctx, options) => {
    this.proxyEvents(options.events);

    const httpProxyOpts = Utils.ds.removeProps(options, ['logs', 'rewrite', 'events', 'auth']);

    if (options.auth) {
      this.setAuth(ctx, options.auth, httpProxyOpts);
    }

    // NOTE: why can't we use a bodyparser and hooks here?
    // because bodyparser removes event listeners (cleanup fn): https://github.com/stream-utils/raw-body/blob/master/index.js

    this.logger(ctx);
    return new Promise((resolve, reject) => {
      // NOTE: resolve promise correctly after proxy.web() call 
      // solution from: https://github.com/nodejitsu/node-http-proxy/issues/951#issuecomment-179904134
      ctx.res.on('close', () => reject(new HTTPError(`HTTP response closed while proxying ${ctx.prevUrl}`)));
      ctx.res.on('finish', resolve);

      const { headers } = ctx.request;
      if (headers && headers.authorization && headers.authorization.startsWith('Basic')) {
        delete ctx.req.headers.authorization;
      }
      delete ctx.req.headers.cookie;

      ctx.req.url = ctx.url;
      this.proxy.web(ctx.req, ctx.res, httpProxyOpts, e => {
        console.log(e.toString());
        const status = {
          ECONNREFUSED: 503,
          ETIMEOUT: 504
        }[e.code];
        ctx.status = status || 500;
        resolve();
      });
    })
  }

  requestMiddleware = async (ctx, options) => {
    if (ctx.method === 'POST') {
      /*
        TODO: further body parser configuration?
        multipart: {
          formidable:{
            uploadDir: __dirname + '/public/uploads', // directory where files will be uploaded
            keepExtensions: true // keep file extension on upload
          },
          urlencoded: true
        }
      */
      const multipart = !!ctx.is('multipart');
      await bodyParser({multipart})(ctx, () => {});
      ctx.multipart = multipart;
    }

    const { body, files, headers } = ctx.request;
    ctx.payload = body;

    if (headers) {
      ctx.request.headers = Utils.ds.removeProps(headers, ['host', 'cookie', 'content-length', 'content-type', 'app-token', 'connection', 'accept-encoding']);
    }

    if (files) {
      /*
        TODO: HTTPError?
        if (!file) {
          ctx.badRequest({error: true, message: 'No file provided'});
        }
      */
      const { file } = files;
      const { name, size, type } = file;
      ctx.payload = {
        file: {
          value: fs.createReadStream(file.path),
          options: {
            filename: name,
            size,
            contentType: type
          }
        },
        name,
        ...body
      };
    }

    const { hooks, auth, resolveResponse } = options;

    if (auth) {
      this.setAuth(ctx, auth);
    }

    if (hooks.before) {
      const keys = Object.keys(hooks.before);
      
      for (const name of keys) {
        const hook = hooks.before[name];
        if (typeof hook === 'object') {
          const { route, method } = hook;
          const matcher = pathMatcher(route);
          const match = matcher(ctx.url);

          if (ctx.method === method && match) {
            if (hook.async) await hook.func(ctx, this, match);
            else hook.func(ctx, this, match);
          }
        } else {
          hook(ctx, this);
        }
      }
    }

    this.logger(ctx);
    const response = await Lib.Request.call(ctx, resolveResponse);
    // TODO: if resolveResponse: response vs body

    ctx.status = response.status;
    ctx.body = response.body;
    // if (response.headers) ctx.set(response.headers);

    if (response.error) {
      if (hooks.error) {
        hooks.error(ctx, err);
      }
    }

    if (hooks.after) {
      Object.keys(hooks.after).forEach(name => hooks.after[name](ctx, response.body, response));
    }

    const contentDisposition = response.headers && response.headers['content-disposition'];
    if (contentDisposition && contentDisposition.startsWith('attachment')) {
      ctx.set('content-disposition', contentDisposition);
      ctx.set('content-type', contentType);
    }

    const contentType = response.headers && response.headers['content-type'];
    if (contentType && contentType == 'application/octet-stream') {
      ctx.set('content-type', contentType);
    }
  }

  setupMiddleware = options => {
    const { proxy, rewrite } = options;

    const middleware = async ctx => {
      // TODO: rewrite not needed (url vs originalUrl)
      ctx.prevUrl = ctx.url;

      if (typeof rewrite === 'function') {
        ctx.url = rewrite(ctx.url, ctx);
      }

      // TODO: error if target missing?
      if (options.target) {
        ctx.target = this.targetUrl(options.target);
      }

      if (proxy) await this.proxyMiddleware(ctx, options);
      else await this.requestMiddleware(ctx, options);
    }

    return this.middleware ? compose([...this.middleware, middleware]) : middleware; // mount(route, middleware);
  }
}

export default Proxy;
export const RequestService = new Proxy();