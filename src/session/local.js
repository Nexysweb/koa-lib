import Cache from '../cache';


class LocalStore extends Cache.Local {
  constructor(...args) {
    super(...args);
  }

  set(session, {sid=this.getId(32), maxAge}) {
    this.cache.set(sid, this.serialize(session), maxAge/1000);

    if (this.persistent) {
      this.save();
    }

    return sid;
  }
}

export default LocalStore;