import mount from 'koa-mount';

export const handler = (route, filepath) => {
  filepath = filepath || route;

  // todo: this will only work if the function is called from './app'.
  const fullpath = './routes/' + filepath;

  return mount(`${route}`, require(fullpath).default);
}