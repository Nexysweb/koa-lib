// TODO: call requestMiddleware
import Proxy from './index';
import JWT from '../middleware/jwt';


const proxyMiddleware = new Proxy('/crud', {
  hooks: {
    before: {
      fromCtx: (ctx, proxy) => {
        const { crud: { host, auth } } = ctx.state.user;
        ctx.target = proxy.targetUrl(host);

        proxy.setAuth(ctx, { basic: auth });
      }
    }
  }
});

test('test proxy', () => {});