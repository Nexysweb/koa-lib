import mount from 'koa-mount';
import { rootPath } from '../config';

export const handler = (route, filepath) => {
  filepath = filepath || route;

  const fullpath = rootPath + '/routes/' + filepath

  return mount(`${route}`, require(fullpath).default);
}