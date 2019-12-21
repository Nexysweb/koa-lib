import Utils from '@nexys/utils';


export class EnvVar {
  // TODO: constructor for two different types of envVar

  static create(name, defaultValue) {
    if (defaultValue !== undefined) {
      return {
        name,
        defaultValue,
        isEnvVar: true
      };
    }

    return {
      name,
      isEnvVar: true
    };
  }

  static compose(fn, ...args) {
    return {
      args,
      compose: fn,
      isEnvVar: true
    };
  }
};

class Config {
  constructor(config, local=true) {
    this.initEnv(local);
    this.setup(config);
  };

  initEnv(local) {
    if (local) {
      for ([key, value] of Object.entries(process.env)) {
        process.env[key] = Utils.string.parseEnvVar(value);
      }
    } else {
      // config will read your .env file, parse the contents and assign it to process.env
      const result = dotenv.config(); // config({path})

      if (result.error) {
        throw result.error;
      }

      console.log(result.parsed)
    }
  }

  parseEnvVar(envVar) {
    const { name } = envVar;
    let defaultValue = null;
    if (envVar.defaultValue) {
      defaultValue = envVar.default;
    }

    // TODO: compose

    let value = process.env[name];
    if (!value) { // undefined || null
      if (defaultValue) return defaultValue; // assumption: default value is already formatted
      else return null;
    }

    if (isNaN(value)) {
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

  parse(config) {
    const result = {};
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        let value = config[key];

        if (value.isEnvVar) {
          value = this.parseEnvVar(value);
        } else if (typeof value === 'object') {
          value = this.parse(config);
        }

        result[key] = value;
      }
    }

    return result;
  }

  // TODO: just allow passing multiple configs together into setup()
  default() {
    const name = EnvVar.compose('PRODUCT', 'SYSTEM', (product, system) => product + '_' + system);

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
      host: EnvVar.create('REDIS_HOST'),
      port: EnvVar.create('REDIS_PORT')
      // password: 'REDIS_PW'
    };

    const session = {
      signatureKeys: EnvVar.create('COOKIE_SIGNATURE_KEYS'),
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

  setup = (config={}) => {
    const defaultConfig = this.default();

    const merged = Utils.ds.deepMerge(defaultConfig, config);

    this.vars = this.parse(merged);
  };

  get = key => Utils.ds.get(key, this.vars);
}

export default Config;