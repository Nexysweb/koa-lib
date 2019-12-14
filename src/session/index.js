/**
 * Store for Koa Session with (keys stored in cookies)
 * 
 * koa-session2 source code:
 * - cookies https://github.com/Secbone/koa-session2/blob/master/index.js
 * - store https://github.com/Secbone/koa-session2/blob/master/libs/store.js
**/

import Local from './local';
import Redis from './redis';


export default {
  Local,
  Redis
};