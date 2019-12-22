import bodyParser from 'koa-body';
import Joi from '@hapi/joi';
import { Validation } from '@nexys/lib';

export const body = (schema, options={}) => async (ctx, next) => {
  if (!ctx.request.body) {
    await bodyParser()(ctx, () => {});
  }
  
  const { body } = ctx.request;

  const result = Validation.validate(body, schema, options);

  if (result.error) {
    const validErrors = Validation.formatErrors(result.error.details);
    ctx.badRequest(validErrors);
    return;
  } else {
    await next();
  }
};

// TODO: ctx.params validation - schema without nesting
export const params = (schema, options={}) => async (ctx, next) => {
  const { params } = ctx;
}
