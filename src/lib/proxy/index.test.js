import request from 'supertest';
import { Proxy } from './index';

// create proxy middleware
const proxyMiddleware = new Proxy('/query', {
  hooks: {
    before: {
      fromCtx: (ctx, proxy) => {
        // take some environment variables from context
        // ctx.target = proxy.targetUrl(host);
        // proxy.setAuth(ctx, auth);
      }
    }
  }
});

// create koa app: const app = Koa()
// app.use(proxyMiddleware)

/*
describe("standard proxy", () => {
  test("...", async () => {
    const response = await request(app)
      .post("/query")
      .auth('test', 'test')
      .field('product', 'test_product')
      .field('name', 'test_name')

    expect(response.status).toEqual(200);
    expect(response.type).toEqual("application/json");
    expect(response.body).toEqual({status: true})
  });

  test("...", async () => {

  })
});

describe("proxy with hooks", () => {
  test("before", async () => {

  })
})
*/