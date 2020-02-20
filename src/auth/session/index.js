import Utils from '@nexys/utils';

import { HTTP } from '@nexys/lib';


export const get = ctx => {
  if (ctx.session) {
    if (ctx.session.token) return ctx.session;
    if (ctx.session.passport) return Utils.ds.get('passport.user', ctx.session);

    return null;
  } else return false;
}

export const reshape = ({user, token=null}) => {
  if (!user) {
    throw new HTTP.Error('Please provide user session data', 500);
  }

  if (!user) {
    console.warn('No user token in session');
  }

  // TODO: instance projection in model
  const instance = Utils.get('instance.uuid', user);
  const { uuid, id, permissions, isAdmin, profile, language, info } = user;

  return {
    user,
    token,
    id,
    uuid,
    profile,
    instance,
    permissions,
    isAdmin: !!isAdmin,
    language,
    info
  };
}

export const logIn = async (ctx, data, extend) => {
  // expect data.user, data.token

  if (extend && extend.constructor.name === 'AsyncFunction') {
    throw new HTTP.Error('Session modifier function should be asynchronous', 500);
  }

  if (!ctx.login) {
    // TODO: is there a better way
    throw new HTTP.Error('Passport is not setup', 500);
  }

  let session = reshape(data);

  if (extend) {
    session = await extend(session);
  }

  ctx.login(session);

  return Utils.removeProp(session, 'token'); // removeProps [user, token]
}