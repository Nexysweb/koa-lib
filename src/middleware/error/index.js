export const logger = (err, _) => {
  if (err) {
    console.error(new Date().toISOString() + ' - Server error: \n' + err.toString());
  }
}

/*
  NOTE: Koa 2 error handling
  - https://github.com/koajs/koa/wiki/Error-Handling 
  - https://github.com/koajs/koa/blob/master/docs/error-handling.md

  ctx.throw(400, 'name required') is equivalent to:

  const err = new Error('name required');
  err.status = 400;
  err.expose = true;
  throw err;

  err.expose = true; means the error is appropriate for client responses 
  (make sure you want to delete failure details)

  https://koajs.com/#error-handling
*/
export const handler = (ctx, err) => {
  if (err.expose || (err.status && err.status < 500)) {
    // NOTE: expose client errors

    switch (err.status) {
      case 400:
        ctx.badRequest(err.body || err.message);
        break;
      case 401:
        ctx.unauthorized(err.statusMessage || err.message);
        break;
      case 403:
        ctx.forbidden(err.statusMessage || err.message)
        break;
      case 404:
        // NOTE: in case 404 error is thrown (by HTTP.Error or ctx.throw)
        ctx.notFound(err.statusMessage || err.message);
        break;
      default:
        ctx.status = err.status;
        ctx.body = err.body || err.message;
    }
  } else {
    ctx.app.emit('error', err, ctx);
    // TODO: rm err.body fallback?
    ctx.internalServerError(err.statusMessage || err.message || err.body);
    return;
  }
}