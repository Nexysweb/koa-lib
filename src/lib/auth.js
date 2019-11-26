export const getPassportSession = ctx => {
  if (ctx.session) {
    const session = ctx.session;
    if (session.token) return session;
    if (session.passport) return session.passport && session.passport.user;

    return null;
  } else return false;
}

/*
  TODO:
  wrappers for
  - local: verifyLocal: Lib.ProductService?
  - jwt strategies
*/

export default { getPassportSession };