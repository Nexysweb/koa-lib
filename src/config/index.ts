import dotenv from 'dotenv';

import EnvVar from './env-var';

import Utils from '@nexys/utils';


class Config {
  vars:any;
  constructor(config={}, local=true, opts={}) {
    this.initEnv(local, opts);
    this.setup(config);
  }

  initEnv(local:boolean, opts={}) {
    if (!local) {
      for (let [key, value] of Object.entries(process.env)) {
        process.env[key] = Utils.string.parseEnvVar(value);
      }
    } else {
      // config will read your .env file, parse the contents and assign it to process.env
      const result = dotenv.config(opts);

      if (result.error) {
        throw result.error;
      }

      console.log(result.parsed)
    }

    /* TODO
      build object automatically

      FOO.BAR.MY_TEST
    */
  }

  parseName(name, defaultValue:string = undefined) {
    let value = process.env[name];
    if (!value) { // undefined || null
      if (defaultValue) return defaultValue; // assumption: default value is already formatted
      else return null;
    }

    if (isNaN(Number(<unknown>value))) {
      if (value === 'true') {
        return true;
      } else if (value === 'false') {
        return false;
      } else {
        return value;
      }
    } else {
      return Number(value);
    }
  }

  parseEnvVar(envVar:any) {
    if (envVar.args) {
      // TODO: dependency graph
      const values = envVar.args.map(name => this.parseName(name));
      envVar.compose(...values);
    }

    const { name } = envVar;
    let defaultValue = null;

    if (envVar.defaultValue) {
      defaultValue = envVar.defaultValue;
    }

    return this.parseName(name, defaultValue);
  }

  parse(config) {
    const result = {};
    for (const key in config) {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        let value = config[key];

        if (value.isEnvVar) {
          value = this.parseEnvVar(value);
        } else if (typeof value === 'object') {
          value = this.parse(value);
        }

        result[key] = value;
      }
    }

    return result;
  }

  default() {
    const name = EnvVar.compose((product, system) => product + '_' + system, 'PRODUCT', 'SYSTEM');

    const host = EnvVar.create('URL', 'http://localhost:3021'); // ref other variable

    const port = EnvVar.create('PORT', 3021);

    const auth = {
      basic: {
        user: EnvVar.create('BASIC_USER'),
        pass: EnvVar.create('BASIC_PW')
      }
    };

    const service = {
      host: EnvVar.create('PRODUCT_HOST', 'http://localhost:3333'),
      token: EnvVar.create('APP_TOKEN')
    };

    const redis = {
      host: EnvVar.create('REDIS_HOST', '127.0.0.1'),
      port: EnvVar.create('REDIS_PORT', 6379)
    };

    const session = {
      signatureKeys: EnvVar.create('COOKIE_SIGNATURE_KEYS'), // Utils.random.generateString
      duration: EnvVar.create('SESSION_DURATION_MINUTES', 60 * 24)
    };

    const env = EnvVar.create('NODE_ENV', 'development');

    return {
      name,
      host,
      port,
      auth,
      redis,
      service,
      session,
      env
    };
  }

  // TODO: allow passing multiple configs together into setup()
  setup = (config={}) => {
    const defaultConfig = this.default();

    const merged = Utils.ds.deepMerge(defaultConfig, config);

    this.vars = this.parse(merged);
  };

  get = (key:string):any => Utils.ds.get(key, this.vars);
}

export default Config;