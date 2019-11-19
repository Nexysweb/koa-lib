import * as Index from './index'

test('index', () => {
  expect(typeof Index).toEqual('object');
});

test('Lib', () => {
  expect(typeof Index.Lib).toEqual('object');
});

test('middleware', () => {
  expect(typeof Index.Middleware).toEqual('object');
});
