class EnvVar {
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

export default EnvVar;