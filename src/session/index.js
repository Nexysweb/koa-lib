/**
 * Session store & middleware for Koa with (keys stored in cookies)
**/
import Local from './local';
import Redis from './redis';


// NOTE: taken from koa-session2 https://github.com/Secbone/koa-session2/blob/master/index.js
// tests are available here: https://github.com/Secbone/koa-session2/blob/master/test/test.js
const middleware = (opts={}) => {
  const { key='koa:sess', store } = opts;

  if (!store) {
    throw Error('Please provide a session store');
  }

  return async (ctx, next) => {
    let id = ctx.cookies.get(key, opts);
    let need_refresh = false;

    if (!id) {
      ctx.session = {};
    } else {
      ctx.session = await store.get(id, ctx);

      // reassigning session ID if current is not found
      if (ctx.session == null) {
        id = await store.getID(24);
        need_refresh = true;
      }

      // check session must be a no-null object
      if (typeof ctx.session !== 'object' || ctx.session == null) {
        ctx.session = {};
      }
    }

    const old = JSON.stringify(ctx.session);

    // add refresh function
    ctx.session.refresh = () => {need_refresh = true}

    await next();

    // remove refresh function
    if (ctx.session && 'refresh' in ctx.session) {
      delete ctx.session.refresh
    }

    const sess = JSON.stringify(ctx.session);

    // if not changed
    if (!need_refresh && old == sess) return;

    // if is an empty object
    if (sess == '{}') {
      ctx.session = null;
    }

    // need clear old session
    if (id && !ctx.session) {
      await store.destroy(id, ctx);
      ctx.cookies.set(key, null);
      return;
    }

    // set/update session
    const sid = await store.set(ctx.session, Object.assign({}, opts, {sid: id}), ctx);
    if (!id || id !== sid || need_refresh) {
      ctx.cookies.set(key, sid, opts);
      console.log(`Created cookie for session ID ${sid}`);
    }
  }
}

const configure = (session, production=false, passport=false) => {
  // TODO for other user cases: setting token as cookies
  // https://medium.com/@yuliaoletskaya/can-jwt-be-used-for-sessions-4164d124fe2
  const { key, duration=(24*60), signed, httpOnly=true, local={}, redis={} } = session;
  // key: product.name

  const nesting = passport ? 'passport.user' : undefined;
  let store = new Local({persistent: true, ...local}, nesting);
  if (production) {
    store = new Redis({host: '127.0.0.1', port: 6379, ...redis}, key, nesting);
  }

  // NOTE: koa cookie options - https://github.com/koajs/koa/blob/master/docs/api/context.md#ctxcookiessetname-value-options
  // NOTE: refresh(): if you set maxAge in options, you can call ctx.session.refresh() to refresh session to your store
  return {
    key,
    store,
    maxAge: 1000 * 60 * duration, // in ms
    httpOnly, // NOTE: prevent client-side access to cookie (document.cookie)
    signed
    // secure: inProd // NOTE: cookie only sent over https => doesn't detect https from nginx
  };
}

const store = { Local, Redis };

export {
  store,
  configure,
  middleware
};