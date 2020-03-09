import Utils from '@nexys/utils';

abstract class Cache {
  path:string;

  constructor(path:string = undefined ) {
    this.path = path; // NOTE: path for handling nested data
  }

  getId(length:number):string {
    return Utils.random.generateString(length);
  }

  serialize(data:any):any {
    if (this.path) {
      return Utils.ds.get(this.path, data);
    } else return data;
  }

  deserialize(data:any):any {
    if (this.path) {
      return Utils.ds.nest({[this.path]: data});
    } else return data;
  }

  get(key:string):any {
    throw new Error('Cache getter not implemented');
  }

  async set(key:string, value: any, ttl:number = undefined):Promise<any>  {
    throw new Error('Cache setter not implemented');
  }

  extend(key:string, value:any) {
    const entry = this.get(key);
    if (entry) {
      const newValue = {...entry, ...value};
      return this.set(key, newValue);
    } else return false;
  }

  destroy(key:string) {
    throw new Error('Cache destroyer not implemented');
  }
}

export default Cache;