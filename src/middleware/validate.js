import bodyParser from 'koa-body';

import { Validation } from '@nexys/lib';


export const body = (schema, options={}) => async (ctx, next) => {
  if (!ctx.request.body) {
    await bodyParser()(ctx, () => {});
  }
  
  const { body } = ctx.request;

  await Validation.validate(body, schema, options);

  await next();
};

// TODO: ctx.params validation - schema without nesting
export const params = (schema, options={}) => async (ctx, next) => {
  const { params } = ctx;
}