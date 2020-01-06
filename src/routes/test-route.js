import Router from 'koa-router';

const router = new Router()

router.get('/me', ctx => { ctx.body = 'test' });

export default router.routes();