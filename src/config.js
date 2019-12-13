// todo: upgrade with a "real" config
import { ds, string } from '@nexys/utils';
import path from 'path';

// this can be used to call any file from anywhere in the application without needing to worry about its relative location
const rootPath = path.resolve("./src");

const inProd = process.env.NODE_ENV === 'production';
if (inProd) {
  Object.entries(process.env).forEach(([key, value]) => process.env[key] = string.parseEnvVar(value));
} else {
  require('dotenv').config();
}

const product = {
  service: {
    host: process.env.PRODUCT_HOST,
    token: process.env.APP_TOKEN,
  }
};

const port = process.env.PORT || 3000;

export {
  rootPath,
  port,
  product,
  inProd
};