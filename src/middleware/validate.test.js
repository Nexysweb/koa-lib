import Joi from '@hapi/joi';
import * as Validate from './validate';

const schema = Joi.object({
  name: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
});

//const error = {error: '[ValidationError: "name" is required]', value: {"namse": ""}}

test('validate and format errors', ()  => {
  const body = {namse: ''};  

  const v = Validate.validate(body, schema);
  expect(typeof v.error).toEqual('object');
  expect(v.error.details[0].message).toEqual('"name" is required');

  expect(Validate.formatErrors(v.error.details)).toEqual({name: ['any.required']});
});

test('validate', ()  => {
  const body = {name: 'sa'};  

  const v = Validate.validate(body, schema);
  expect(typeof v.error).toEqual('object');
  expect(v.error.details[0].message).toEqual('"name" length must be at least 3 characters long');
  expect(Validate.formatErrors(v.error.details)).toEqual({name: ['string.min']});
});

test('validate', ()  => {
  const body = {name: 'saliou'};

  const v = Validate.validate(body, schema);

  expect(typeof v.error).toEqual('undefined')
});