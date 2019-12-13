import Cache from './cache';


class ServiceCache extends Cache {
  constructor(prefix=false, path=false) {
    super(path);

    this.prefix = prefix; // NOTE: prefix = service name
  }

  key(id) {
    if (this.prefix) {
      return `${this.prefix}:${id}`;
    } else return id;
  }
}

export default ServiceCache;