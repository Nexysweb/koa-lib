import passportLocal from 'passport-local';
import passportJwt from 'passport-jwt';
import passportOAuth2 from 'passport-oauth2';

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

    handleLogin = async (username, password, ctx, _) => {
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

// const secretOrKey = "vO1_<0a=tQiMk?tU]jJn54XnGx<Q73=N@[hRwafJgmbn`j?CndP2=x=kCs^Tbd<3";
// secretOrKey, // NOTE: string or buffer containing the secret (symmetric) or PEM-encoded public key (asymmetric)
export const jwt = (options={}) => {
  let handlePayload = null;

  if (!options.handlePayload) {
    // NOTE: possible extra checks, claims, roles etc
    handlePayload = options.handleJwtPayload;
  } else {
    handlePayload = (payload, _) => {
      // NOTE: could fetch user session here using sub if necessary
      const { sub, auth, admin } = payload;
      const id = Number(sub);
      return { auth, admin, id };
    }
  }

  if (!options.issuer) {
    // TODO: app host
    throw new HTTP.Error('Please supply an issuer', 500);
  }

  if (!options.secretOrKey) {
    throw new HTTP.Error('Please supply a publicKey or secret', 500);
  }

  let jwtFromRequest = passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken();
  if (options.fromHeader) {
    // NOTE: example 'app-token'
    jwtFromRequest = passportJwt.ExtractJwt.fromHeader(options.fromHeader);
  }

  if (options.fromSession) {
    jwtFromRequest = ctx => {
      let token = null;
    
      if (ctx.state.user && ctx.state.user.token) {
        // NOTE: by default use session token for authentication
        token = ctx.state.user.token;
        ctx.state.api = false;
      } else {
        // NOTE: fallback to JWT
        token = passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken();
        ctx.state.api = true;
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
  const verify = ({ctx}, payload, done) => {
    try {
      // NOTE: session already established with local strategy?
      const user = handlePayload(payload, ctx, done); 
      done(null, user); // NOTE: sets ctx.state.user
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
  if (!options.prefix) {
    // example: `https://${w3id.issuer}/oidc/endpoint/amapp-runtime-oidcidp`;
    throw new HTTP.Error('Missing authorization & token URL prefix', 500);
  }

  if (!options.client) {
    throw new HTTP.Error('Missing client credentials `client.id`, `client.secret`', 500);
  }

  if (!options.callbackURL) {
    throw new HTTP.Error('Missing host callback url `callbackURL`', 500);
  }

  if (!options.handleLogin) {
    throw new HTTP.Error('Please define a login handler `handleLogin`', 500);
  }

  const { prefix, client, callbackURL } = options;

  // NOTE: scopes - optional (https://oauth.net/2/scope); scope: 'openid'
  const config = {
    passReqToCallback: true,
    authorizationURL: prefix + '/authorize',
    tokenURL: prefix + '/token',
    clientID: client.id,
    clientSecret: client.secret,
    callbackURL
  };

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