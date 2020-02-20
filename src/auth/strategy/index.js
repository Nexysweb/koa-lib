import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import passportOAuth2 from 'passport-oauth2';

import * as Session from '../session';

import { User, HTTP } from '@nexys/lib';


export const local = (options={}) => {
  let handleLogin = null;

  if (!options.handleLogin) {
    const { host, auth } = options;

    if (!options.host) {
      throw new HTTP.Error('Please supply missing `host` for Log in', 500);
    }

    if (!options.auth) {
      throw new HTTP.Error('Please supply missing `app-token` for Log in', 500);
    }

    const UserService = User.init(host, auth);

    handleLogin = async (username, password, ctx) => {
      return await UserService.logIn(username, password, ctx.state);
    }
  } else {
    handleLogin = options.handleLogin;
  }

  // TODO: figure out best use of successRedirect, failureRedirect
  const config = {
    passReqToCallback: true,
    ...options
  };

  // NOTE: the purpose of the verify callback is to find the user that possesses a set of credentials.
  const verify = async ({ctx}, username, password, done) => {
    // TODO: use arguments to check if req.ctx is passed

    // TODO: understand error handling https://stackoverflow.com/questions/15711127/express-passport-node-js-error-handling
    try {
      const data = await handleLogin(username, password, ctx, done);
      return done(null, data);
    } catch (err) {
      return done(err, false);
    }
  }

  const strategy = new passportLocal.Strategy(config, verify);

  if (options.name) {
    strategy.name = options.name;
  }

  return strategy;
}

// NOTE: string or buffer containing the secret (symmetric) or PEM-encoded public key (asymmetric)
export const jwt = (options={}) => {
  let handlePayload = null;

  if (options.handlePayload) {
    // NOTE: possible extra checks, claims, roles etc
    handlePayload = options.handlePayload;
  } else {
    handlePayload = (payload) => {
      // NOTE: using payload of token issued in Nexys product service
      const { sub, auth, admin } = payload;
      const id = Number(sub);
      // NOTE: could fetch user session here using sub/id if necessary
      return { auth, admin, id };
      // done
    }
  }

  /*
    // NOTE: recommended, but not mandatory
    // Nexys user tokens have app host as issuer (issuer cannot be specified before runtime in product service)

    if (!options.issuer) {
      throw new HTTP.Error('Please supply an issuer', 500); // NOTE: app host
    }
  */

  if (!options.secretOrKey) {
    throw new HTTP.Error('Please supply a publicKey or secret', 500);
  }

  let jwtFromRequest = passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken();
  if (options.fromHeader) {
    // NOTE: example 'app-token' in product service
    jwtFromRequest = passportJwt.ExtractJwt.fromHeader(options.fromHeader);
  }

  if (options.fromSession) {
    jwtFromRequest = ctx => {
      let token = null;

      // NOTE: because ctx.state is not available
      const session = Session.get(ctx);
    
      if (session && session.token) {
        // NOTE: by default use session token for authentication
        token = session.token;
      } else {
        // NOTE: fallback to JWT
        token = passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken();
      }
    
      return token;
    }
  }

  const config = {
    passReqToCallback: true,
    ignoreExpiration: false, // NOTE: always check exp claim
    jwtFromRequest,
    // TODO: audience
    ...options
  };
  
  // NOTE: this verify callback is only called if jwt present and decoding is successful
  const verify = async ({ctx}, payload, done) => {
    // TODO: use arguments to check if req.ctx is passed

    try {
      // NOTE: session already established with local strategy?
      const data = await handlePayload(payload, ctx); 
      done(null, data); // NOTE: sets/overrides ctx.state.user
    } catch (err) {
      done(err, null);
    }
  }
  
  const strategy = new passportJwt.Strategy(config, verify);

  if (options.name) {
    strategy.name = options.name;
  }

  return strategy;
}

export const oAuth2 = (options={}) => {
  if (!options.client) {
    throw new HTTP.Error('Missing client credentials `client.id`, `client.secret`', 500);
  }

  if (!options.callbackURL) {
    throw new HTTP.Error('Missing host callback url `callbackURL`', 500);
  }

  if (!options.handleLogin) {
    throw new HTTP.Error('Please define a login handler `handleLogin`', 500);
  }

  if (!options.authorizationURL && !options.tokenURL && !options.prefix) {
    // example: `https://${w3id.issuer}/oidc/endpoint/amapp-runtime-oidcidp`;
    throw new HTTP.Error('Missing authorization & token URL prefix', 500);
  }

  const {
    authorizationURL=(options.prefix + '/authorize'),
    tokenURL=(options.prefix + '/token'),
    client,
    callbackURL,
    scope
  } = options;

  // NOTE: scopes - optional (https://oauth.net/2/scope); scope: 'openid'
  const config = {
    passReqToCallback: true,
    authorizationURL,
    tokenURL,
    clientID: client.id,
    clientSecret: client.secret,
    callbackURL
  };

  if (scope) {
    config.scope = scope;
  }

  const verify = async ({ctx}, accessToken, refreshToken, params, profile, done) => {
    try { 
      const data = await options.handleLogin(accessToken, refreshToken, params, profile, ctx, done);
      done(null, data);
    } catch (err) {
      done(err, null);
    }
  }

  const strategy = new passportOAuth2.Strategy(config, verify);

  if (options.name) {
    strategy.name = options.name;
  }

  return strategy;
}