// init the app and adds important plugins
import Koa from 'koa';

import Helmet from 'koa-helmet';
import respond from 'koa-respond';

const app = new Koa();

// NOTE: important security headers (https://github.com/venables/koa-helmet)
app.use(Helmet());
// NOTE: middleware that adds useful methods: send => ok, notFound, badRequest
app.use(respond());

app.use(async (ctx, next) => {
  try {
    await next();

    if (ctx.status === 404) {
      ctx.notFound('Page was not found')
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = {error: err.message};

    console.log(err)
    console.log('Error handler:', err.message)
  }
});

export default app;