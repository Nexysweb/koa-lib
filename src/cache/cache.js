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
  async get() {
    throw new Error('Cache getter not implemented');
  }

  async set() {
    throw new Error('Cache setter not implemented');
  }

  async destroy() {
    throw new Error('Cache destroyer not implemented');
  }
}

export default Cache;