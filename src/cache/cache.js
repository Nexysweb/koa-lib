import Utils from '@nexys/utils';


class Cache {
  constructor(path=false) {
    this.path = path; // NOTE: path for handling nested data
  }

  getId(length) {
    return Utils.random.generateString(length);
  }

  serialize(data) {
    if (this.path) {
      return Utils.ds.get(this.path, data);
    } else return data;
  }

  deserialize(data) {
    if (this.path) {
      // TODO: nest path to get {passport: {user: data}};
      return Utils.ds.nest({[this.path]: data});
    } else return data;
  }

  // TODO: throw error if not implemented
  get() {
    throw new Error('Cache getter not implemented');
  }

  set() {
    throw new Error('Cache setter not implemented');
  }

  extend(key, value) {
    const entry = this.get(key);
    if (entry) {
      const newValue = {...entry, ...value};
      return this.set(key, newValue);
    } else return false;
  }

  destroy() {
    throw new Error('Cache destroyer not implemented');
  }
}

export default Cache;