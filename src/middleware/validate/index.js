import bodyParser from 'koa-body';

import { Validation } from '@nexys/lib';


export const body = (schema, options={}) => async (ctx, next) => {
  if (!ctx.request.body) {
    await bodyParser(options.parser || {})(ctx, () => {});
  }
  
  const { body } = ctx.request;

  if (options.hasOwnProperty('parser')) {
    delete options.parser;
  }

  await Validation.validate(body, schema, options);

  await next();
};

export const params = (schema, options={}) => async (ctx, next) => {
  const { params } = ctx;

  // TODO: type coercion util
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const param = params[key];
      if (!isNaN(param)) {
        params[key] = Number(param);
      }
    }
  }

  await Validation.validate(params, schema, { presence: 'required', format: { prefix: 'params' }, ...options});

  await next();
}