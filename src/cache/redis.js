import Redis from 'ioredis';

import ServiceCache from './service';


class RedisCache extends ServiceCache {
  constructor(...args) {
    const redis = args.shift(); // host, port, password
    super(...args);

    const options = {
      ...redis,
      family: 4, // 4 (IPv4) or 6 (IPv6)
      db: 0
    };
    
    this.ttl = redis.ttl;
    this.client = new Redis(options);
  }

  serialize(data) {
    data = super.serialize(data);
    return JSON.stringify(data);
  }

  deserialize(data) {
    data = JSON.parse(data);
    return super.deserialize(data);
  }

  async get(key) {
    const json = await this.client.get(this.key(key));
    if (!json) return false;
    return this.deserialize(json);
  }

  async set(key, value, ttl) {
    try {
      const id = this.key(key);
      if (ttl || this.ttl) {
        // NOTE: use EX to automatically drop expired data
        await this.client.set(id, this.serialize(value), 'EX', ttl || this.ttl);
      } else {
        await this.client.set(id, this.serialize(value));
      }
    } catch (err) {
      console.log(err.toString());
      return false;
    }

    return key;
  }

  async quit() {
    // NOTE: close connection safely 
    return await this.client.quit();
  };
}

export default RedisCache;