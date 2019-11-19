module.exports = function (api) {
  const inTest = api.env("test");
  const inProd = api.env("production");

  const presets = [
    ['@babel/preset-env', {
      modules: 'commonjs',
      targets: {
        node: inProd ? 4 : 'current'
      },
      useBuiltIns: 'usage',
      corejs: 3
    }]
  ];

  if (inTest) {
    presets.unshift("jest");
  }

  const plugins = [
    ['dynamic-import-node', { "noInterop": true }],
    '@babel/plugin-transform-arrow-functions',
    [
      "module-resolver",
      {
        cwd: "./",
        root: [
          "./src"
        ],
        alias: {
          "#utils": "./src/utils",
          "#lib": "./src/lib",
          "#middleware": "./src/middleware",
          "#services": "./src/services",
          "#config": "./src/config"
        }
      }
    ],
    ['@babel/plugin-proposal-class-properties',
      {
        loose: true
      }
    ],
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-modules-commonjs'
    // '@babel/plugin-transform-async-to-generator',
  ];

  if (inProd) {
    plugins.push(
      ['@babel/plugin-transform-runtime', {
        corejs: 3,
        helpers: true,
        regenerator: true,
        useESModules: false
      }]
    );
  }

  return {
    presets,
    plugins
  };
};