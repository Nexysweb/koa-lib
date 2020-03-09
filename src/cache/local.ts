import { promises as fs } from 'fs';
import path from 'path';

import NodeCache from 'node-cache';

import Cache from './cache';

const fileExists = (path:string):Promise<boolean> => fs.stat(path).then(_ => true).catch(err => {
  if (err.code === "ENOENT") return false;
  throw err;
});

class LocalCache extends Cache {
  cache:NodeCache;
  persistent:boolean;
  file:string;

  constructor(...args) {
    // TODO: handle args.length
    const local = args.shift();

    super(...args);

    const { persistent, file='cache', ttl=0, checkperiod=600 } = local;

    this.cache = new NodeCache({
      stdTTL: ttl, // ttl in seconds, 0: unlimited
      checkperiod // delete check interval in seconds, 0: no check
    });

    if (persistent) {
      // `!!`: casting to boolean
      this.persistent = !!persistent;
      this.file = file;

      // NOTE: constructor not async - https://gist.github.com/goloroden/c976971e5f42c859f64be3ad7fc6f4ed
      this.load();
    }
  }

  async load(dir:string=process.cwd()) {
    const filePath = path.join(dir, `${this.file}.json`);
    const exists:boolean = await fileExists(filePath);
    if (exists) {
      const json = await fs.readFile(filePath, 'utf8');
      if (json) {
        const data = JSON.parse(json);
        for (const [key, val] of Object.entries(data)) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            this.cache.set(key, val);
          }
        }
      }
    }
  }

  async save(dir:string=process.cwd()) {
    const keys = this.cache.keys();
    const data = this.cache.mget(keys);

    const json = JSON.stringify(data);
    const fpath = path.join(dir, `${this.file}.json`);
    await fs.writeFile(fpath, json);

    console.log(`Cache saved to file at ${fpath}`);
  }

  get(key:string) {
    if (this.cache.has(key)) {
      const data = this.cache.get(key);
      if (!data) return false;
      else return this.deserialize(data);
    } else return false;
  }

  async set(key:string, value:any, ttl:number = undefined):Promise<any> {
    let result = false;
    const data = this.serialize(value);
    if (ttl) {
      result = this.cache.set(key, data, ttl);
    } else {
      result = this.cache.set(key, data);
    }
    
    if (this.persistent) {
      await this.save();
    }

    if (result) return key;
    else return false;
  }

  destroy(key:string) {
    // NOTE: supports single key or array of keys
    return this.cache.del(key);
  }
}

export default LocalCache;
