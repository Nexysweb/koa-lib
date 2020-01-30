import * as Session from './session';
import * as Strategy from './strategy';


export { Session, Strategy };

export const serializeIdempotent = (user, done) => done(null, user);

export const configure = (options, Passport) => {
  const { serialize, deserialize, strategies } = options;

  // NOTE: functions are idempotent because of key-value store; supports async/await functions
  Passport.serializeUser(serialize || serializeIdempotent);
  Passport.deserializeUser(deserialize || serializeIdempotent);
  // NOTE: serialization example: store user.id => fetch session via stored user.id

  return strategies.map(options => {
    switch (options.type) {
      case 'local':
        return Strategy.local(options);
      case 'jwt':
        return Strategy.jwt(options);
      case 'oauth2': {
        return Strategy.oAuth2(options);
      }
      default: {
        if (options.hasOwnProperty('_verify')) {
          return options;
        }

        console.warn('Strategy `type` not specified');
      }
    }
  });
}