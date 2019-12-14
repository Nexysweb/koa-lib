import Cache from '../cache';


class RedisStore extends Cache.Redis {
  constructor(...args) {
    super(...args);
  }

  async set(session, {sid=this.getId(32), maxAge}) {
    try {
      // NOTE: use EX to automatically drop expired sessions
      await this.client.set(sid, this.serialize(session), 'EX', maxAge/1000);
    } catch (err) {
      console.log(err.toString());
    }
    return sid;
  }
}

export default RedisStore;