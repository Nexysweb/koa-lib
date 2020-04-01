import Redis from 'ioredis';

import ServiceCache from './service';


class RedisCache extends ServiceCache {
  ttl:number;
  client:Redis;

  constructor(...args) {
    const redis = args.shift(); // host, port, password
    const { prefix, path } = redis;
    super(prefix, path);

    const options = {
      ...redis,
      family: 4, // 4 (IPv4) or 6 (IPv6)
      db: 0
    };

    this.ttl = redis.ttl;
    this.client = redis.mock || new Redis(options);
  }

  serialize(data:any) {
    data = super.serialize(data);
    return JSON.stringify(data);
  }

  deserialize(data:any) {
    data = JSON.parse(data);
    return super.deserialize(data);
  }

  async get(key:any) {
    const id = this.key(key);
    const json = await this.client.get(id);
    if (!json) return false;
    return this.deserialize(json);
  }

  async set(key:string, value:any, ttl:number | undefined = undefined) {
    try {
      const id = this.key(key);
      const length = ttl || this.ttl;
      if (length && typeof length === 'number') {
        // NOTE: use EX to automatically drop expired data
        await this.client.set(id, this.serialize(value), 'EX', length);
      } else {
        await this.client.set(id, this.serialize(value));
      }
    } catch (err) {
      console.error(err.toString());
      return false;
    }

    return key;
  }

  async extend(key:string, value:any, ttl:number | undefined = undefined) {
    const entry = await this.get(key);
    if (entry) {
      const newValue = {...entry, ...value};
      await this.destroy(key);
      return await this.set(key, newValue, ttl);
    } else return false;
  }

  async destroy(key:string) {
    const id = this.key(key);
    return await this.client.del(id);
  }

  async quit() {
    // NOTE: close connection safely 
    return await this.client.quit();
  }
}

export default RedisCache;