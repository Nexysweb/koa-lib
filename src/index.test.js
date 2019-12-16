import * as Index from './index'

test('index', () => {
  expect(typeof Index).toEqual('object');
});

test('lib', () => {
  expect(typeof Index.Lib).toEqual('object');
});

test('middleware', () => {
  expect(typeof Index.Middleware).toEqual('object');
});

test('cache', () => {
  expect(typeof Index.Cache).toEqual('object');
});

test('session', () => {
  expect(typeof Index.SessionStore).toEqual('object');
});