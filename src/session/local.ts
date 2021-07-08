import * as Cache from '../cache';


class LocalStore extends Cache.Local {
  constructor(...args) {
    super(...args);
  }

  set(session:any, options:{sid?:any, maxAge?:number}={}) {
    const sid = options.sid || this.getId(32);
    if (options.maxAge) {
      return super.set(sid, session, options.maxAge/1000);
    } else { 
      return super.set(sid, session);
    }
  }
}

export default LocalStore;