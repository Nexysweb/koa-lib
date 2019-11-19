import * as Lib from './index'

test('Proxy', () => {
  expect(typeof Lib.Proxy).toEqual('function');
});