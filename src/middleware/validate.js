import bodyParser from 'koa-body';

import Joi from 'joi';

// TODO: use Lib.Validate
export const formatErrors = (errArr, prefix) => errArr.reduce((errors, err) => {
  const path = err.path.join('.');
  let prop = path;
  if (prefix) prop = `${prefix}.${prop}`;
  if (path in errors) errors[prop] = [...errors[path], err.type];
  else errors[prop] = [err.type];
  return errors;
}, {});


export const body = (schema, options={}) => async (ctx, next) => {
  if (!ctx.request.body) {
    await bodyParser()(ctx, () => {});
  }
  
  const { body } = ctx.request;

  const result = Joi.validate(body, schema, {
    abortEarly: false, // NOTE: do not stop at first error, return all errors
    allowUnknown: true,
    ...options
  });

  if (result.error) {
    const validErrors = formatErrors(result.error.details);
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
