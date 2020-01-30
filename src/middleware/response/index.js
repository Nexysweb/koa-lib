import { HTTP } from '@nexys/lib';
import Utils from '@nexys/utils';

import * as Errors from '../error';


export const handler = (messages={}) => async (ctx, next) => {
  try {
    await next();

    // NOTE: in downstream middleware: ctx.state.response = await someFunction()
    if (ctx.state.response) {
      const { response } = ctx.state;

      if (response instanceof HTTP.Success) {
        const { status, body, headers } = ctx.state.response;
        ctx.send(status, body);

        if (headers) {
          ctx.set(headers);
        }
      } else if (response instanceof HTTP.Response) {
        // HTTP.Response => status = 300 => ctx.redirect
        const { status, body, headers } = ctx.state.response;
        ctx.send(status, body);

        if (headers) {
          ctx.set(headers);
        }
      } else {
        ctx.ok(response);
      }
    } else {
      switch (ctx.status) {
        case 401: {
          ctx.unauthorized(messages.unauthorized || 'Unauthorized');
          break;
        }
        case 404: {
          ctx.notFound(messages.notFound || 'Not found. The requested route does not exist');
          break;
        }
        case 302: // redirect
          break;
        default: 
          if (Utils.ds.isEmpty(ctx.body)) {
            ctx.noContent(); // TODO: ctx.body should be null but isn't
          }
      }
    }
  } catch (err) {
    Errors.handler(ctx, err);
  }
}