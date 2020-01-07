import * as Index from './index';

test('Validate', () => {
  expect(typeof Index.Validate).toEqual('object');
});

test('Response.handler', () => {
  expect(typeof Index.Response.handler).toEqual('function');
});

test('routes', () => {
  expect(typeof Index.routes).toEqual('function');
});

// TODO: test hasPermissions / isAuthorized (session setup)