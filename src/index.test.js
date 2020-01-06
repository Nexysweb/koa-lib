import * as Index from './index'

test('index', () => {
  expect(typeof Index).toEqual('object');
});

test('proxy', () => {
  expect(typeof Index.Proxy).toEqual('function');
});

test('middleware', () => {
  expect(typeof Index.Middleware).toEqual('object');
});

test('cache', () => {
  expect(typeof Index.Cache).toEqual('object');
});

test('session', () => {
  expect(typeof Index.Session).toEqual('object');
});