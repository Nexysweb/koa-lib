import * as Index from './index';

const { EnvVar } = Index;

test('EnvVar.create', () => {
  expect(EnvVar.create('myname', 'defval')).toEqual({defaultValue: "defval", isEnvVar: true, name: "myname"});
});

test('EnvVar.compose', () => {
  const obj = {a: 'a', b: 'b'}
  const fn = a => a;

  expect(EnvVar.compose(fn, obj)).toEqual({args: [obj], compose: fn, isEnvVar: true});
});