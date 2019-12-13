import Cache from '../cache';


class RedisStore extends Cache.Redis {
  constructor(...args) {
    super(...args);
  }

  // NOTE: get multiple: this.store.mget(keys)
  async set(session, {sid=this.getId(32), maxAge}) {
    await this.store.set(sid, this.serialize(session), maxAge/1000);

    if (this.persistent) {
      this.save();
    }

    return sid;
  }
}

export default RedisStore;