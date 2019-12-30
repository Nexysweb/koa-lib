import * as Index from './index';

test('Mount', () => {
  expect(typeof Index.Mount).toEqual('object');
});

test('Init', () => {
  expect(typeof Index.Init).toEqual('object');
});

test('JWT', () => {
  expect(typeof Index.JWT).toEqual('object');
});

test('Validate', () => {
  expect(typeof Index.Validate).toEqual('object');
});

test('Response.handler', () => {
  expect(typeof Index.Response.handler).toEqual('function');
});

test('routes', () => {
  expect(typeof Index.routes).toEqual('function');
});